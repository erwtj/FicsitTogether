import type {Request, Response, NextFunction} from "express";
import {createUser, getUserByAuth0Id, type User} from "../repository/userRepository.js";
import config from "../config/config.js";
import {db} from "../repository/database.js";
import {createDirectory} from "../repository/directoryRepository.js";

declare module "express-serve-static-core" {
    interface Request {
        user: User;
    }
}

export function attachUser(req: Request, res: Response, next: NextFunction) {
    try {
        const auth0_id = req.auth?.payload.sub; // From checkJwt middleware

        if (!auth0_id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Try to find existing user
        let user = getUserByAuth0Id(auth0_id);

        // Auto-register if user doesn't exist
        if (!user) {
            // get user info
            const userId = crypto.randomUUID();
            const username = req.auth?.payload[config.auth0Audience + '/username'] as string || `user_${userId.slice(0, 8)}`;
            const rootDirectoryId = crypto.randomUUID();
            
            // TODO: Turn this into a transaction so we can rollback in case of an error
            // create user data
            createUser(userId, username, auth0_id, rootDirectoryId);
            // create root directory for user
            createDirectory(rootDirectoryId, rootDirectoryId, userId, "root");
            
            user = getUserByAuth0Id(auth0_id);
        }

        req.user = user!;
        next();
    } catch (error) {
        console.error('User attachment error:', error);
        res.status(500).json({ error: 'Failed to attach user' });
    }
}