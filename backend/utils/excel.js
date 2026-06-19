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

    // Clean up uploaded file after parsing (non-blocking)
    fs.promises.unlink(filePath).catch(() => { /* ignore */ });

    return data;
}

/**
 * Robustly parses user input for academic background to match database ENUM.
 * Handles typos, full forms, abbreviations, and spacing.
 * @param {string} input - raw string from Excel
 * @returns {string|null} - strict ENUM value or null
 */
export function parseAcademicBackground(input) {
    if (!input) return null;
    const str = String(input).toLowerCase().trim();
    if (!str) return null;

    // ICS Matcher
    if (/^i\.?c\.?s\.?$/i.test(str) || str.includes('computer science') || /^cs$/i.test(str)) {
        return 'ics';
    }
    
    // Pre-Med Matcher
    if (str.includes('med') || str.includes('bio')) {
        return 'pre-med';
    }

    // Pre-Engineering Matcher
    if (str.includes('eng') || str.includes('math')) {
        return 'pre-engineering';
    }

    return 'other';
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

/**
 * Create a secure multer upload instance for Excel imports.
 * Validates file extension (.xlsx, .xls, .csv) and limits file size to 5MB.
 * @param {import('multer')} multer - The multer module
 * @returns {import('multer').Multer}
 */
export function createExcelUpload(multer) {
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    return multer({
        dest: getUploadDir(),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
        fileFilter: (req, file, cb) => {
            const ext = path.extname(file.originalname).toLowerCase();
            if (allowedExtensions.includes(ext)) {
                cb(null, true);
            } else {
                cb(new Error(`File type ${ext} not allowed. Allowed: ${allowedExtensions.join(', ')}`), false);
            }
        }
    });
}
