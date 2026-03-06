import type {Request, Response, NextFunction} from "express";
import * as directoryRepository from "../repository/directoryRepository.js";
import * as projectRepository from "../repository/projectRepository.js";
import type {AppError} from "../middlewares/errorHandler.js";
import {getUserByUsername} from "../repository/userRepository.js";
import type {DirectoryDTO, DirectoryContentDTO, SharedDirectoryDTO, MinimalUserInfoDTO} from "dtolib";
import {sanitizeChart} from "../utils/chartValidator.js";

export async function getDirectory(req: Request, res: Response, next: NextFunction) {
    try {
        const directoryId = req.params.directoryId as string;
        const [directory, subDirectories, projects, directoryTree] = await Promise.all([
            directoryRepository.getDirectory(directoryId),
            directoryRepository.getDirectories(directoryId),
            projectRepository.getProjectsInDirectory(directoryId),
            directoryRepository.getDirectoryTree(directoryId, req.user.id),
        ]);

        res.status(200).send({
            ...directory,
            subDirectories,
            projects,
            directoryTree,
        } as unknown as DirectoryContentDTO);
    } catch (error) {
        next(error);
    }
}

export function getRootDirectory(req: Request, res: Response, next: NextFunction) {
    req.params.directoryId = req.user.root_directory;
    getDirectory(req, res, next);
}

export async function createDirectory(req: Request, res: Response, next: NextFunction) {
    try {
        const parentDirectoryId = req.body.directoryId as string;
        const name = req.body.name as string;

        if (!parentDirectoryId || !name) {
            const error: AppError = new Error('Missing parameters.');
            error.status = 400;
            return next(error);
        }

        if (name.length > 20) {
            const error: AppError = new Error('Directory name exceeds max length (20).');
            error.status = 400;
            return next(error);
        }

        // The owner of the parent directory is also the owner of this directory
        const parentDirectory = await directoryRepository.getDirectory(parentDirectoryId);
        const owner = parentDirectory!.owner;

        const uuid = crypto.randomUUID();
        await directoryRepository.createDirectory(uuid, parentDirectoryId, owner, name);

        res.status(201).send({
            id: uuid,
            name: name,
            owner: owner,
            parentDirectoryId: parentDirectoryId,
        } as DirectoryDTO)
    } catch (error) {
        next(error);
    }
}

export async function deleteDirectory(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.directoryId as string;

        const directory = await directoryRepository.getDirectory(id);

        if (directory!.parentDirectoryId === id) { // Someone's root directory
            const error: AppError = new Error('Can not delete root directory');
            error.status = 400;
            return next(error);
        }

        await directoryRepository.deleteDirectory(id);

        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}

export async function shareDirectory(req: Request, res: Response, next: NextFunction) {
    try {
        const directoryId = req.params.directoryId as string;
        const username = req.body.user as string;

        if (!directoryId || !username) {
            const error: AppError = new Error('Missing parameters.');
            error.status = 400;
            return next(error);
        }

        if (directoryId === req.user.root_directory) {
            const error: AppError = new Error('Not allowed to share root directory!');
            error.status = 400;
            return next(error);
        }

        if (username === req.user.username) {
            const error: AppError = new Error('Not allowed to share with yourself!');
            error.status = 400;
            return next(error);
        }

        const [directory, user] = await Promise.all([
            directoryRepository.getDirectory(directoryId),
            getUserByUsername(username),
        ]);

        if (directory!.owner !== req.user.id) {
            const error: AppError = new Error('Unauthorized');
            error.status = 401;
            return next(error);
        }

        if (!user) {
            const error: AppError = new Error('User does not exist.');
            error.status = 404;
            return next(error);
        }

        await directoryRepository.shareDirectory(user.id, directoryId);
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}

export async function unshareDirectory(req: Request, res: Response, next: NextFunction) {
    try {
        const directoryId = req.params.directoryId as string;
        const userId = req.body.userId as string;

        if (!directoryId || !userId) {
            const error: AppError = new Error('Missing parameters.');
            error.status = 400;
            return next(error);
        }

        const directory = await directoryRepository.getDirectory(directoryId);

        if (!(directory!.owner === req.user.id || userId === req.user.id)) {
            const error: AppError = new Error('Unauthorized');
            error.status = 401;
            return next(error);
        }

        await directoryRepository.unshareDirectory(userId, directoryId);
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}

export async function leaveDirectory(req: Request, res: Response, next: NextFunction) {
    try {
        const directoryId = req.params.directoryId as string;
        const userId = req.user.id;

        if (!directoryId || !userId) {
            const error: AppError = new Error('Missing parameters.');
            error.status = 400;
            return next(error);
        }

        await directoryRepository.unshareDirectory(userId, directoryId);
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}

export async function getDirectorySharedWith(req: Request, res: Response, next: NextFunction) {
    try {
        const directoryId = req.params.directoryId as string;

        const directory = await directoryRepository.getDirectory(directoryId);

        if (directory!.owner !== req.user.id) {
            const error: AppError = new Error('Unauthorized');
            error.status = 401;
            return next(error);
        }

        const sharedUsers = await directoryRepository.getSharedWith(directoryId);
        res.status(200).send(sharedUsers as MinimalUserInfoDTO[]);
    } catch (error) {
        next(error);
    }
}

export async function getChartsInDirectory(req: Request, res: Response, next: NextFunction) {
    try {
        const directoryId = req.params.directoryId as string;
        const charts = await projectRepository.getChartsRecursive(directoryId);
        res.status(200).send(charts);
    } catch (error) {
        next(error);
    }
}

export async function getSharedDirectories(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user.id;
        const sharedDirectories = await directoryRepository.getSharedDirectories(userId);

        res.status(200).send(sharedDirectories as SharedDirectoryDTO[]);
    } catch (error) {
        next(error);
    }
}

export async function uploadProject(req: Request, res: Response, next: NextFunction) {
    try {
        const directoryId = req.params.directoryId as string;
        const file = (req as Request & { file?: Express.Multer.File }).file;

        if (directoryId === req.user.root_directory) {
            const error: AppError = new Error('Not allowed to upload projects to root directory!');
            error.status = 400;
            return next(error);
        }

        if (!file) {
            const error: AppError = new Error('No file uploaded.');
            error.status = 400;
            return next(error);
        }

        if (file.mimetype !== 'application/json') {
            const error: AppError = new Error('Invalid file type. Only JSON files are allowed.');
            error.status = 400;
            return next(error);
        }

        let projectData: { name?: unknown; description?: unknown; chart?: unknown };
        try {
            projectData = JSON.parse(file.buffer.toString('utf-8'));
        } catch {
            const error: AppError = new Error('Invalid JSON file.');
            error.status = 400;
            return next(error);
        }

        if (typeof projectData.name !== 'string' || !projectData.name ||
            typeof projectData.description !== 'string' || !projectData.chart) {
            const error: AppError = new Error('Invalid project data. Missing required fields.');
            error.status = 400;
            return next(error);
        }

        const name = projectData.name.slice(0, 35);
        const description = projectData.description.slice(0, 255);
        const chart = sanitizeChart(projectData.chart);

        const projectId = crypto.randomUUID();
        await projectRepository.createProject(projectId, directoryId, name, description, chart);

        res.status(201).send({ id: projectId, name, description, directoryId });
    } catch (error) {
        next(error);
    }
}