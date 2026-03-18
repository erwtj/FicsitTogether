import multer from 'multer';
import type {AppError} from "./errorHandler.js";
import type {Request, Response, NextFunction} from "express";
import { MAX_PROJECT_SIZE_BYTES } from "dtolib";
import { uploadProjectBodySchema } from '../validation/schemas.js';

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
    upload.single('file')(req, res, async (err) => {
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
        
        if (err) {
            return next(err);
        }

        // Parse and validate the uploaded JSON file
        const file = (req as Request & { file?: Express.Multer.File }).file;
        
        if (!file) {
            const appError: AppError = new Error('No file uploaded.');
            appError.status = 400;
            return next(appError);
        }

        try {
            const projectData = JSON.parse(file.buffer.toString('utf-8'));
            // Validate the parsed JSON against the schema
            const validated = await uploadProjectBodySchema.parseAsync(projectData);
            // Attach the validated data to req.body for the controller
            req.body = validated;
            next();
        } catch (parseError) {
            if (parseError instanceof SyntaxError) {
                const appError: AppError = new Error('Invalid JSON file.');
                appError.status = 400;
                return next(appError);
            }
            // Zod validation errors are handled by the error handler
            next(parseError);
        }
    });
};
