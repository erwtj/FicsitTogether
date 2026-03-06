import multer from 'multer';
import type {AppError} from "./errorHandler.js";
import type {Request} from "express";

const MAX_FILE_SIZE_MB = 10;

const upload = multer({
    storage: multer.memoryStorage(), // Keep file in memory as Buffer, no disk I/O needed
    limits: {
        fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
        files: 1,
    },
    fileFilter: (_req: Request, file, cb) => {
        if (file.mimetype !== 'application/json') {
            const error: AppError = new Error('Only JSON files are allowed.');
            error.status = 415;
            return cb(error);
        }
        cb(null, true);
    },
});

export const uploadSingleJson = upload.single('file');

