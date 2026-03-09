import multer from "multer";
import { AppError } from "../lib/errors.js";

const ALLOWED_EXTENSIONS = /\.(csv|xlsx|xls|xlsm)$/i;

/**
 * Multer middleware for admin CSV / Excel file imports.
 * Files are kept in memory (no disk writes).
 * Max file size: 10 MB. Only .csv, .xlsx, .xls, .xlsm accepted.
 */
export const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (ALLOWED_EXTENSIONS.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          "BAD_REQUEST",
          "Only CSV and Excel files (.csv, .xlsx, .xls, .xlsm) are accepted",
        ),
      );
    }
  },
});
