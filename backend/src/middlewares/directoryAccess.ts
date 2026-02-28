import type { Request, Response, NextFunction } from 'express';
import {pool} from "../repository/database.js";
import type {User} from "../repository/userRepository.js";
import {getProject} from "../repository/projectRepository.js";

export async function hasDirectoryAccess(user: User, directoryId: string): Promise<boolean> {
    // Check if this is the user's root directory
    if (user.root_directory === directoryId) {
        return true;
    }

    // TODO: Check if this recursive call works properly
    // Recursively check parent directories
    const res = await pool.query<{ result: number }>(`
        WITH RECURSIVE parent_dirs(id, parent_directory, owner, name) AS (
            SELECT id, parent_directory, owner, name
            FROM directories
            WHERE id = $1

            UNION ALL

            SELECT d.id, d.parent_directory, d.owner, d.name
            FROM directories d
            INNER JOIN parent_dirs pd ON d.id = pd.parent_directory
        )
        SELECT 1 as result
        FROM parent_dirs pd
        LEFT JOIN share_directories sd ON sd.directory = pd.id AND sd."user" = $2
        WHERE pd.owner = $3 OR sd."user" IS NOT NULL
        LIMIT 1
    `, [directoryId, user.id, user.id]);

    return res.rowCount! > 0;
}

export async function hasProjectAccess(user: User, projectId: string): Promise<boolean> {
    const project = await getProject(projectId);

    if (!project) {
        return false;
    }

    return hasDirectoryAccess(user, project.directoryId);
}

export async function checkDirectoryAccess(req: Request, res: Response, next: NextFunction) {
    const directoryId = req.params.directoryId || req.body.directoryId || req.query.directoryId;

    if (!directoryId) {
        return res.status(400).json({ error: 'Bad Request: No directory ID provided' });
    }

    if (!await hasDirectoryAccess(req.user, directoryId as string)) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this directory' });
    }

    next();
}

export async function checkProjectAccess(req: Request, res: Response, next: NextFunction) {
    const projectId = req.params.projectId || req.body.projectId || req.query.projectId;

    if (!projectId) {
        return res.status(400).json({ error: 'Bad Request: No project ID provided' });
    }

    if (!await hasProjectAccess(req.user, projectId as string)) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this project' });
    }

    next();
}