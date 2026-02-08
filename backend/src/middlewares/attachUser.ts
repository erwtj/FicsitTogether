import type {Request, Response, NextFunction} from "express";
import {createUser, getUserByAuth0Id, type User} from "../repository/userRepository.js";
import config from "../config/config.js";

declare module "express-serve-static-core" {
    interface Request {
        user: User;
    }
}

export function attachUser(req: Request, res: Response, next: NextFunction) {
    try {
        const auth0_id = req.auth?.payload.sub; // From checkJwt middleware
        
        if (!auth0_id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Try to find existing user
        let user = getUserByAuth0Id(auth0_id);

        // Auto-register if user doesn't exist
        if (!user) {
            const userId = crypto.randomUUID();
            const username = req.auth?.payload[config.auth0Audience + '/username'] as string || `user_${userId.slice(0, 8)}`;

            createUser(userId, username, auth0_id);
            user = getUserByAuth0Id(auth0_id);
        }

        req.user = user!;
        next();
    } catch (error) {
        console.error('User attachment error:', error);
        res.status(500).json({ error: 'Failed to attach user' });
    }
}