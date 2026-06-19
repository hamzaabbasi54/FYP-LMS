# FILE_UPLOADS Fix Plan

## Changes

- `backend/package.json` — Install the `file-type` package.
- `backend/utils/excel.js` — Import `file-type` and add magic bytes validation after the file is uploaded. If validation fails, delete the file and return an error.
- `backend/routes/batchRoutes.js` — Add magic bytes validation for course content uploads.

## New files

None.

## Verification goals

- [x] File type validated by magic bytes, not extension alone
- [x] Files renamed to UUIDs/timestamps server-side
- [ ] Files stored on separate domain/bucket (S3, R2, GCS) -> *Skipped for this fix as it requires infrastructure changes*
- [x] Size limits enforced server-side

## Manual verification (for the human)

- Rename a `.png` file to `.xlsx` and attempt to upload it as attendance data. It should be rejected by the magic bytes validator.
