import multer from 'multer';
import type {AppError} from "./errorHandler.js";
import type {Request, Response, NextFunction} from "express";
import { MAX_PROJECT_SIZE_BYTES } from "dtolib";

const upload = multer({
    storage: multer.memoryStorage(), // Keep file in memory as Buffer, no disk I/O needed
    limits: {
        fileSize: MAX_PROJECT_SIZE_BYTES,
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

export const uploadSingleJson = (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                const appError: AppError = new Error(`File exceeds the maximum allowed size of ${MAX_PROJECT_SIZE_BYTES / (1024 * 1024)} MB.`);
                appError.status = 400;
                return next(appError);
            }
            const appError: AppError = new Error(err.message);
            appError.status = 400;
            return next(appError);
        }
        next(err);
    });
};
