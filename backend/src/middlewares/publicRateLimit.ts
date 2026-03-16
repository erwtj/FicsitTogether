import rateLimit from 'express-rate-limit';
import config from '../config/config.js';

export const publicRateLimit = rateLimit({
    windowMs: config.publicRateLimitWindowMs,
    limit: config.publicRateLimitMaxRequests,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: {
        message: 'Too many requests. Please try again shortly.',
    },
});

