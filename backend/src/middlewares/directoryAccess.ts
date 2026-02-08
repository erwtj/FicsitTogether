import type { Request, Response, NextFunction } from 'express';
import {db} from "../repository/database.js";
import type {User} from "../repository/userRepository.js";
import {getProject, type Project} from "../repository/projectRepository.js";

function hasDirectoryAccess(user: User, directoryId: string): boolean {
    // Check if this is the user's root directory
    if (user.root_directory === directoryId) {
        return true;
    }

    // TODO: Check if this recursive call works properly
    // Recursively check parent directories
    const accessStmt = db.prepare<[string, string, string], number>(`
        WITH RECURSIVE parent_dirs(id, parent_directory, owner, name) AS (
          SELECT id, parent_directory, owner, name 
          FROM directories 
          WHERE id = ?
          
          UNION
          
          SELECT d.id, d.parent_directory, d.owner, d.name 
          FROM directories d 
          INNER JOIN parent_dirs pd ON d.id = pd.parent_directory
        )
        SELECT 1
        FROM parent_dirs pd
        LEFT JOIN share_directories sd ON sd.directory = pd.id AND sd.user = ?
        WHERE pd.owner = ? OR sd.user IS NOT NULL
        LIMIT 1
    `);
    const result = accessStmt.get(directoryId, user.id, user.id)
    
    return result !== undefined;
}

function hasProjectAccess(user: User, projectId: string): boolean {
    const project = getProject(projectId);

    if (!project) {
        return false;
    }

    return hasDirectoryAccess(user, project!.directoryId);
}

export function checkDirectoryAccess(req: Request, res: Response, next: NextFunction) {
    const directoryId = req.params.directoryId || req.body.directoryId || req.query.directoryId;

    if (!directoryId) {
        return res.status(400).json({ error: 'Bad Request: No directory ID provided' });
    }

    if (!hasDirectoryAccess(req.user, directoryId as string)) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this directory' });
    }

    next();
}

export function checkProjectAccess(req: Request, res: Response, next: NextFunction) {
    const projectId = req.params.projectId || req.body.projectId || req.query.projectId;

    if (!projectId) {
        return res.status(400).json({ error: 'Bad Request: No project ID provided' });
    }

    if (!hasProjectAccess(req.user, projectId as string)) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this project' });
    }

    next();
}