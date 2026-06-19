// ============================================
// File: backend/middleware/validateMagicBytes.js
// Middleware to validate uploaded file magic bytes
// ============================================

import fs from 'fs';
import { fileTypeFromFile } from 'file-type';

export const validateMagicBytes = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        const filePath = req.file.path;
        const type = await fileTypeFromFile(filePath);
        
        const ext = req.file.originalname.split('.').pop().toLowerCase();

        // If file-type couldn't determine the type, it might be a text file (csv, txt)
        // We will allow csv and txt if they have the correct extension, as they don't have magic bytes
        if (!type) {
            if (['csv', 'txt'].includes(ext)) {
                return next();
            } else {
                fs.promises.unlink(filePath).catch(() => {});
                return res.status(400).json({ success: false, message: 'Invalid file type (no magic bytes detected).' });
            }
        }

        // Mapping of allowed extensions to expected mime types / extensions from file-type
        const allowedTypes = {
            'pdf': ['pdf'],
            'png': ['png'],
            'jpg': ['jpg', 'jpeg'],
            'jpeg': ['jpg', 'jpeg'],
            'gif': ['gif'],
            'zip': ['zip'],
            'xlsx': ['xlsx', 'zip'], // xlsx is often detected as zip
            'xls': ['cfb'], // Older excel files use Compound File Binary format
            'doc': ['cfb'],
            'docx': ['docx', 'zip'],
            'ppt': ['cfb'],
            'pptx': ['pptx', 'zip']
        };

        if (allowedTypes[ext] && allowedTypes[ext].includes(type.ext)) {
            return next();
        }

        // Validation failed
        fs.promises.unlink(filePath).catch(() => {});
        return res.status(400).json({ success: false, message: `Invalid file type. Extension ${ext} does not match actual content ${type.ext}.` });
    } catch (error) {
        console.error('Magic bytes validation error:', error);
        if (req.file && req.file.path) {
            fs.promises.unlink(req.file.path).catch(() => {});
        }
        return res.status(500).json({ success: false, message: 'Error validating file type.' });
    }
};
