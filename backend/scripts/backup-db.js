import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import mysqlRaw from 'mysql2';

dotenv.config();

const dbName = process.env.DB_NAME || 'fyp_lms';
const dbUser = process.env.DB_USER || 'root';
const dbPass = process.env.DB_PASS || '';
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = process.env.DB_PORT || '3306';
const backupDir = process.env.DB_BACKUP_DIR || path.resolve('backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `${dbName}-${timestamp}.sql`);

fs.mkdirSync(backupDir, { recursive: true });

const dumpWithMysqlDump = () => new Promise((resolve, reject) => {
    const args = [
        `--host=${dbHost}`,
        `--port=${dbPort}`,
        `--user=${dbUser}`,
        '--single-transaction',
        '--routines',
        '--triggers',
        dbName
    ];

    const output = fs.createWriteStream(backupPath);
    const child = spawn('mysqldump', args, {
        env: {
            ...process.env,
            MYSQL_PWD: dbPass
        },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    child.stdout.pipe(output);

    let errorOutput = '';
    child.stderr.on('data', chunk => {
        errorOutput += chunk.toString();
    });

    child.on('error', error => {
        output.close();
        reject(error);
    });

    child.on('close', code => {
        output.close();
        if (code !== 0) {
            if (fs.existsSync(backupPath)) fs.rmSync(backupPath, { force: true });
            reject(new Error(errorOutput.trim() || `mysqldump exited with code ${code}`));
            return;
        }
        resolve();
    });
});

const dumpWithNode = async () => {
    const connection = await mysql.createConnection({
        host: dbHost,
        user: dbUser,
        password: dbPass,
        database: dbName,
        port: dbPort,
        multipleStatements: true
    });

    const output = fs.createWriteStream(backupPath);
    output.write(`-- Campus Flow backup\n-- Database: ${dbName}\n-- Created: ${new Date().toISOString()}\n\n`);
    output.write('SET FOREIGN_KEY_CHECKS=0;\n\n');

    const [tables] = await connection.query('SHOW FULL TABLES WHERE Table_type = "BASE TABLE"');
    const tableKey = `Tables_in_${dbName}`;

    for (const tableRow of tables) {
        const table = tableRow[tableKey];
        const tableId = mysqlRaw.escapeId(table);
        const [[createRow]] = await connection.query(`SHOW CREATE TABLE ${tableId}`);
        const createSql = createRow['Create Table'];

        output.write(`DROP TABLE IF EXISTS ${tableId};\n`);
        output.write(`${createSql};\n\n`);

        const [rows] = await connection.query(`SELECT * FROM ${tableId}`);
        if (rows.length > 0) {
            const columns = Object.keys(rows[0]).map(mysqlRaw.escapeId).join(', ');
            const batchSize = 200;

            for (let index = 0; index < rows.length; index += batchSize) {
                const batch = rows.slice(index, index + batchSize);
                const values = batch.map(row => `(${Object.values(row).map(value => mysqlRaw.escape(value)).join(', ')})`).join(',\n');
                output.write(`INSERT INTO ${tableId} (${columns}) VALUES\n${values};\n`);
            }
            output.write('\n');
        }
    }

    output.write('SET FOREIGN_KEY_CHECKS=1;\n');
    output.close();
    await connection.end();
};

try {
    await dumpWithMysqlDump();
    console.log(`Database backup created: ${backupPath}`);
} catch (error) {
    if (error.code === 'ENOENT') {
        console.warn('mysqldump was not found. Using built-in Node backup fallback.');
        try {
            await dumpWithNode();
            console.log(`Database backup created: ${backupPath}`);
        } catch (fallbackError) {
            if (fs.existsSync(backupPath)) fs.rmSync(backupPath, { force: true });
            console.error(`Database backup failed: ${fallbackError.message || fallbackError.code || 'Unknown error'}`);
            if (fallbackError.stack) console.error(fallbackError.stack);
            process.exit(1);
        }
    } else {
        if (fs.existsSync(backupPath)) fs.rmSync(backupPath, { force: true });
        console.error(`Database backup failed: ${error.message}`);
        process.exit(1);
    }
}
