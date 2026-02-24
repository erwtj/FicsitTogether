import { type Request, type Response, type NextFunction } from 'express';
import config from "../config/config.js";

export interface AppError extends Error {
    status?: number;
}

export const errorHandler = (
    err: AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(err);

    let message;

    if (config.environment === 'development') {
        message = err.message || 'Internal Server Error';
    } else { // Non-explicit messages are obfuscated on non-development environment, this stops database related error messages from leaking to the client
        message = err.status ? err.message || 'Internal Server Error' : 'Internal Server Error';
    }

    res.status(err.status || 500).json({
        message: message,
    });
};