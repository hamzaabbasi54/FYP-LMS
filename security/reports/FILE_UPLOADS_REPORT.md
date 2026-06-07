# FILE_UPLOADS Security Report

## Status: MEDIUM

## Findings

### Upload Endpoints
The application handles file uploads in multiple routes (e.g., `batchRoutes.js` for course content, `excel.js` for importing students/grades/attendance).

### Configuration
1. **Size Limits:** Enforced server-side. `excel.js` enforces a 5MB limit. `batchRoutes.js` enforces a 10MB limit.
2. **File Naming:** Files are correctly renamed server-side using a timestamp + random suffix (`uniqueSuffix`) before saving to disk.
3. **Storage:** Stored locally in the `uploads/` directory, which is served statically via `express.static`. They are not stored on a separate domain (like S3/R2).

### Validation Flaw
- **File Type Validation:** Validation is performed exclusively via file extension matching (`path.extname(file.originalname)`).
- **Magic Bytes:** The application does *not* inspect the file's magic bytes (file signature) to ensure the contents actually match the extension.

## What's at risk

An attacker could bypass the upload filter by renaming a malicious executable or script (e.g., `malware.exe`, `script.html`) to have an allowed extension (e.g., `malware.pdf`). 

Because the server runs Node.js/Express (not PHP/Apache), uploading a web shell (`shell.php.pdf`) will not lead to Remote Code Execution (RCE) on the server. Furthermore, because `helmet()` sets `X-Content-Type-Options: nosniff`, a browser will not execute an HTML file disguised as a PDF.

However, the server is still acting as a host for potentially malicious files that could be distributed to users who download the "course content".

## What's already secure

- Files are renamed randomly, preventing path traversal attacks via `filename`.
- File size limits are strictly enforced by Multer.
- `helmet` prevents MIME-sniffing XSS attacks.

## Recommendations

1. **MEDIUM:** Use a library like `file-type` or `mmmagic` to validate the magic bytes of the uploaded file before saving it permanently.
2. **LOW:** Consider moving file storage to a dedicated cloud storage bucket (S3, GCS) for isolation.
