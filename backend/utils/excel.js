// ============================================
// File: backend/utils/excel.js
// Excel Import/Export Helper
// ============================================

import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

/**
 * Parse uploaded Excel file into array of objects
 * @param {string} filePath - path to uploaded .xlsx file
 * @returns {Array<Object>} rows as JS objects
 */
export function parseExcel(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    // Clean up uploaded file after parsing
    try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }

    return data;
}

/**
 * Generate Excel buffer from array of objects
 * @param {Array<Object>} data - rows to export
 * @param {string} sheetName - name of the sheet
 * @returns {Buffer} xlsx file buffer
 */
export function generateExcel(data, sheetName = 'Sheet1') {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(data);

    // Auto-width columns
    const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length))
    }));
    sheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

/**
 * Configure multer upload for Excel files
 */
export function getUploadDir() {
    const uploadDir = path.resolve('uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
}
