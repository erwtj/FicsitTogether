import type { Request, Response, NextFunction } from 'express';
import {pool} from "../repository/database.js";
import type {User} from "../repository/userRepository.js";
import {getProject} from "../repository/projectRepository.js";

/**
 * Returns true if the directory itself OR any ancestor directory is marked public.
 */
export async function isPublicDirectory(directoryId: string): Promise<boolean> {
    const res = await pool.query<{ result: number }>(`
        WITH RECURSIVE ancestry(id, parent_directory, public) AS (
            SELECT id, parent_directory, public
            FROM directories
            WHERE id = $1

            UNION ALL

            SELECT d.id, d.parent_directory, d.public
            FROM directories d
            INNER JOIN ancestry a ON d.id = a.parent_directory
            WHERE d.id != d.parent_directory
        )
        SELECT 1 AS result
        FROM ancestry
        WHERE public = TRUE
        LIMIT 1
    `, [directoryId]);

    return res.rowCount! > 0;
}

/**
 * Returns true if the project's parent directory (or any of its ancestors) is marked public,
 * or if the project's own row is marked public.
 */
export async function isPublicProject(projectId: string): Promise<boolean> {
    // Check if project is public 
    const projectRes = await pool.query<{ public: boolean }>(
        'SELECT public FROM projects WHERE id = $1',
        [projectId]
    );

    if (projectRes.rowCount === 0) {
        return false; // Project not found, treat as not public
    }

    if (projectRes.rows[0]!.public) {
        return true; // Project itself is public
    }
    
    const res = await pool.query<{ result: number }>(`
        WITH RECURSIVE ancestry(id, parent_directory, public) AS (
            SELECT d.id, d.parent_directory, d.public
            FROM projects p
            JOIN directories d ON d.id = p.parent_directory
            WHERE p.id = $1

            UNION ALL

            SELECT d.id, d.parent_directory, d.public
            FROM directories d
            INNER JOIN ancestry a ON d.id = a.parent_directory
            WHERE d.id != d.parent_directory
        )
        SELECT 1 AS result
        FROM ancestry
        WHERE public = TRUE
        LIMIT 1
    `, [projectId]);

    return res.rowCount! > 0;
}

export async function canEditDirectory(user: User, directoryId: string): Promise<boolean> {
    // Check if this is the user's root directory
    if (user.root_directory === directoryId) {
        return true;
    }

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
            WHERE d.id != d.parent_directory
        )
        SELECT 1 as result
        FROM parent_dirs pd
        LEFT JOIN share_directories sd ON sd.directory = pd.id AND sd."user" = $2
        WHERE pd.owner = $3 OR sd."user" IS NOT NULL
        LIMIT 1
    `, [directoryId, user.id, user.id]);

    return res.rowCount! > 0;
}

export async function canEditProject(user: User, projectId: string): Promise<boolean> {
    const project = await getProject(projectId);

    if (!project) {
        return false;
    }

    return canEditDirectory(user, project.directoryId);
}

export async function requireCanEditDirectory(req: Request, res: Response, next: NextFunction) {
    const directoryId = req.params.directoryId || req.body.directoryId || req.query.directoryId;

    if (!directoryId) {
        return res.status(400).json({ error: 'Bad Request: No directory ID provided' });
    }

    if (!await canEditDirectory(req.user, directoryId as string)) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this directory' });
    }

    next();
}

export async function requireCanEditProject(req: Request, res: Response, next: NextFunction) {
    const projectId = req.params.projectId || req.body.projectId || req.query.projectId;

    if (!projectId) {
        return res.status(400).json({ error: 'Bad Request: No project ID provided' });
    }

    if (!await canEditProject(req.user, projectId as string)) {
        return res.status(403).json({ error: 'Forbidden: You do not have access to this project' });
    }

    next();
}

export async function requireCanViewProject(req: Request, res: Response, next: NextFunction) {
    const projectId = req.params.projectId || req.body.projectId || req.query.projectId;

    if (!projectId) {
        return res.status(400).json({ error: 'Bad Request: No project ID provided' });
    }

    if (await isPublicProject(projectId as string)) {
        return next();
    }

    return res.status(403).json({ error: 'Forbidden: This project is not publicly accessible' });
}

