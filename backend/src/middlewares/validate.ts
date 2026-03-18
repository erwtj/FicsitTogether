import type { Request, Response, NextFunction } from 'express';
import type { AnyZodObject } from 'zod';
import { ZodError } from 'zod';

// Thanks Claude, love you baby girl!
/**
 * Middleware factory that validates request data against Zod schemas
 * 
 * @param schema - Object containing optional params, body, and query schemas
 * @returns Express middleware function
 */
export const validate = (schema: {
    params?: AnyZodObject;
    body?: AnyZodObject;
    query?: AnyZodObject;
}) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Validate params if schema provided
            if (schema.params) {
                req.params = await schema.params.parseAsync(req.params);
            }

            // Validate body if schema provided
            if (schema.body) {
                req.body = await schema.body.parseAsync(req.body);
            }

            // Validate query if schema provided
            if (schema.query) {
                req.query = await schema.query.parseAsync(req.query);
            }

            next();
        } catch (error) {
            if (error instanceof ZodError) {
                // Format Zod validation errors into a user-friendly response
                const errors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));

                return res.status(400).json({
                    error: 'Validation failed',
                    details: errors
                });
            }

            // Handle unexpected errors
            next(error);
        }
    };
};
