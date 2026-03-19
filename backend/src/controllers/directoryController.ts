import type {Request, Response, NextFunction} from "express";
import * as directoryRepository from "../repository/directoryRepository.js";
import * as projectRepository from "../repository/projectRepository.js";
import type {AppError} from "../middlewares/errorHandler.js";
import {getUserByUsername} from "../repository/userRepository.js";
import type {DirectoryDTO, DirectoryContentDTO, SharedDirectoryDTO, MinimalUserInfoDTO, TotalCountsDTO} from "dtolib";
import {
    MAX_DIRECTORIES_PER_DIRECTORY,
    MAX_DIRECTORIES_PER_USER,
    MAX_DIRECTORY_DEPTH,
    MAX_PROJECTS_PER_DIRECTORY,
    MAX_PROJECTS_PER_USER,
} from "dtolib";
import {sanitizeChart} from "../utils/chartValidator.js";

export async function getDirectory(req: Request, res: Response, next: NextFunction) {
    try {
        // Validated by Zod middleware
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
        } as DirectoryContentDTO);
    } catch (error) {
        next(error);
    }
}

export async function getRootDirectory(req: Request, res: Response, next: NextFunction) {
    req.params.directoryId = req.user.root_directory;
    await getDirectory(req, res, next);
}

export async function createDirectory(req: Request, res: Response, next: NextFunction) {
    try {
        // Validated by Zod middleware
        const parentDirectoryId = req.body.directoryId as string;
        const name = req.body.name as string;

        const [parentDepth, siblingCount, totalDirectoriesForUser, parentDirectory] = await Promise.all([
            directoryRepository.getDirectoryDepth(parentDirectoryId),
            directoryRepository.countDirectories(parentDirectoryId),
            directoryRepository.countTotalDirectoriesForDirectoryOwner(parentDirectoryId),
            directoryRepository.getDirectory(parentDirectoryId),
        ]);

        if (parentDepth >= MAX_DIRECTORY_DEPTH) {
            const error: AppError = new Error(`Maximum directory depth of ${MAX_DIRECTORY_DEPTH} reached.`);
            error.status = 400;
            return next(error);
        }

        if (siblingCount >= MAX_DIRECTORIES_PER_DIRECTORY) {
            const error: AppError = new Error(`Maximum of ${MAX_DIRECTORIES_PER_DIRECTORY} directories per directory reached.`);
            error.status = 400;
            return next(error);
        }

        if (totalDirectoriesForUser >= MAX_DIRECTORIES_PER_USER) {
            const error: AppError = new Error(`Maximum of ${MAX_DIRECTORIES_PER_USER} total directories per user reached.`);
            error.status = 400;
            return next(error);
        }

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
        // Validated by Zod middleware
        const directoryId = req.params.directoryId as string;
        const username = req.body.user as string;

        if (directoryId === req.user.root_directory) {
            const error: AppError = new Error('Not allowed to share root directory.');
            error.status = 400;
            return next(error);
        }

        if (username === req.user.username) {
            const error: AppError = new Error('Not allowed to share with yourself.');
            error.status = 400;
            return next(error);
        }

        const user = await getUserByUsername(username);

        if (!user) {
            const error: AppError = new Error('User does not exist.');
            error.status = 404;
            return next(error);
        }

        const alreadyShared = await directoryRepository.existsShare(directoryId, user.id);
        if (alreadyShared) {
            const error: AppError = new Error('Directory is already shared with this user.');
            error.status = 400;
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
        // Validated by Zod middleware
        const directoryId = req.params.directoryId as string;
        const userId = req.body.userId as string;

        // Middleware already checked that we are the owner

        await directoryRepository.unshareDirectory(userId, directoryId);
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}

export async function leaveDirectory(req: Request, res: Response, next: NextFunction) {
    try {
        // Validated by Zod middleware
        const directoryId = req.params.directoryId as string;
        const userId = req.user.id;

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
        // Validated by Zod middleware (params and parsed JSON body)
        const directoryId = req.params.directoryId as string;
        const name = req.body.name as string;
        const description = req.body.description as string;
        const chart = sanitizeChart(req.body.chart);
        const file = (req as Request & { file?: Express.Multer.File }).file;

        if (directoryId === req.user.root_directory) {
            const error: AppError = new Error('Not allowed to upload projects to root directory.');
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
        
        const [projectCount, totalProjectsForUser] = await Promise.all([
            projectRepository.countProjectsInDirectory(directoryId),
            projectRepository.countTotalProjectsForDirectoryOwner(directoryId),
        ]);

        if (projectCount >= MAX_PROJECTS_PER_DIRECTORY) {
            const error: AppError = new Error(`Maximum of ${MAX_PROJECTS_PER_DIRECTORY} projects per directory reached.`);
            error.status = 400;
            return next(error);
        }

        if (totalProjectsForUser >= MAX_PROJECTS_PER_USER) {
            const error: AppError = new Error(`Maximum of ${MAX_PROJECTS_PER_USER} total projects per user reached.`);
            error.status = 400;
            return next(error);
        }

        const projectId = crypto.randomUUID();
        await projectRepository.createProject(projectId, directoryId, name, description, chart);

        res.status(201).send({ id: projectId, name, description, directoryId });
    } catch (error) {
        next(error);
    }
}

export async function updateDirectoryPublic(req: Request, res: Response, next: NextFunction) {
    try {
        // Validated by Zod middleware
        const id = req.params.directoryId as string;
        const isPublic = req.body.isPublic as boolean;
        
        // Stops root directory from being shared
        // But what if I am not the owner of the directory, and it is a root?? 
        // Well that wouldn't work because it couldn't have been shared with you in the first place, so it is fine
        // So we can assume that if we pass the can edit check, and it is the root directory, then we are the owner of the directory
        if (id === req.user.root_directory) {
            const error: AppError = new Error('Not allowed to change visibility of root directory.');
            error.status = 400;
            return next(error);
        }

        await directoryRepository.updateDirectoryPublic(id, isPublic);

        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}

export async function countTotalsForDirectoryOwner (req: Request, res: Response, next: NextFunction) {
    try {
        // Validated by Zod middleware
        const directoryId = req.params.directoryId as string;

        const totalDirectories = await directoryRepository.countTotalDirectoriesForDirectoryOwner(directoryId)
        const totalProjects = await projectRepository.countTotalProjectsForDirectoryOwner(directoryId)

        res.status(200).send({ totalDirectories, totalProjects } as TotalCountsDTO);
    } catch (error) {
        next(error);
    }
}

export async function countTotalsForRootOwner (req: Request, res: Response, next: NextFunction) {
    try {
        const rootDirectoryId = req.user.root_directory;
        
        const totalDirectories = await directoryRepository.countTotalDirectoriesForDirectoryOwner(rootDirectoryId);
        const totalProjects = await projectRepository.countTotalProjectsForDirectoryOwner(rootDirectoryId);
        
        res.status(200).send({ totalDirectories, totalProjects } as TotalCountsDTO);
    } catch (error) {
        next(error);
    }
}