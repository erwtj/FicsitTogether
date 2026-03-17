import type {Request, Response, NextFunction} from "express";
import {createUser, getUserByAuth0Id, type User} from "../repository/userRepository.js";
import config from "../config/config.js";
import {createDirectory} from "../repository/directoryRepository.js";

declare module "express-serve-static-core" {
    interface Request {
        user: User;
    }
}

const userCache = new Map<string, { user: User; expiresAt: number }>();
const CACHE_TTL_MS = 60_000; // 1 minute

export async function attachUser(req: Request, res: Response, next: NextFunction) {
    try {
        const auth0_id = req.auth?.payload.sub;

        if (!auth0_id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const cached = userCache.get(auth0_id);
        if (cached && cached.expiresAt > Date.now()) {
            req.user = cached.user;
            return next();
        }

        let user = await getUserByAuth0Id(auth0_id);

        if (!user) {
            const userId = crypto.randomUUID();
            const namespace = config.auth0Audience + (config.auth0Audience.endsWith('/') ? 'username' : '/username');
            const username = req.auth?.payload[namespace] as string || `user_${userId.slice(0, 8)}`;
            const rootDirectoryId = crypto.randomUUID();

            try {
                await createUser(userId, username, auth0_id, rootDirectoryId);
                await createDirectory(rootDirectoryId, rootDirectoryId, userId, "root");
            } catch (e: any) {
                // Another concurrent request already created the user (23505 = unique constraint violation)
                if (e.code !== '23505') throw e;
            }

            user = await getUserByAuth0Id(auth0_id);
        }

        userCache.set(auth0_id, { user: user!, expiresAt: Date.now() + CACHE_TTL_MS });
        req.user = user!;
        next();
    } catch (error) {
        console.error('User attachment error:', error);
        res.status(500).json({ error: 'Failed to attach user' });
    }
}