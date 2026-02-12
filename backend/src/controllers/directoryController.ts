import type {Request, Response, NextFunction} from "express";
import * as directoryRepository from "../repository/directoryRepository.js";
import * as projectRepository from "../repository/projectRepository.js";
import type {AppError} from "../middlewares/errorHandler.js";
import {getUserByUsername} from "../repository/userRepository.js";
import type {DirectoryDTO, DirectoryContentDTO, SharedDirectoryDTO, MinimalUserInfoDTO} from "dtolib";

export function getDirectory(req: Request, res: Response, next: NextFunction) {
    try {
        const directoryId = req.params.directoryId as string;
        const directory = directoryRepository.getDirectory(directoryId)!;
        
        const subDirectories = directoryRepository.getDirectories(directoryId);
        const projects = projectRepository.getProjectsInDirectory(directoryId); // I know this is technically wrong, and you shouldn't access two different repositories in one controller, but fuck that stupid rule

        res.status(200).send({
            ...directory, 
            subDirectories: subDirectories,
            projects: projects,
        } as DirectoryContentDTO);
    } catch (error) {
        next(error);
    }
}

export function getRootDirectory(req: Request, res: Response, next: NextFunction) {
    req.params.directoryId = req.user.root_directory;
    getDirectory(req, res, next);
}

export function createDirectory(req: Request, res: Response, next: NextFunction) {
    try {
        const parentDirectoryId = req.body.directoryId as string; // body.directoryId is in this case the parent directory in which to create the directory
        const name = req.body.name as string;

        if (!parentDirectoryId || !name) {
            const error: AppError = new Error('Missing parameters.');
            error.status = 400;
            return next(error);
        }
        
        // The owner of the parent directory is also the owner of this directory, just because you make a directory in a shared directory doesn't make you the owner
        const parentDirectory = directoryRepository.getDirectory(parentDirectoryId)!;
        const owner = parentDirectory.owner;
        // TODO: Now that I think about it, that means any directories owner can be figured out by checking to which root it leads, and which account is associated with that root
        // In other words, I don't think we have to set the owner per directory, you only need to know who own's the root
        
        const uuid = crypto.randomUUID();
        directoryRepository.createDirectory(uuid, parentDirectoryId, owner, name);

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

export function deleteDirectory(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.directoryId as string;

        const directory = directoryRepository.getDirectory(id)!;
        
        if (directory.parentDirectoryId === id) { // Someone's root directory 
            const error: AppError = new Error('Can not delete root directory');
            error.status = 400;
            return next(error);
        }
        
        directoryRepository.deleteDirectory(id);

        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}

export function shareDirectory(req: Request, res: Response, next: NextFunction) {
    try {
        const directoryId = req.params.directoryId as string; // body.directoryId is in this case the parent directory in which to create the directory
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

        if (username === req.user.username){
            const error: AppError = new Error('Not allowed to share with yourself!');
            error.status = 400;
            return next(error);
        }
        
        const directory = directoryRepository.getDirectory(directoryId)!;
        
        if (directory.owner !== req.user.id) { // Only allowed to share if you are the owner, not if it was shared with you
            const error: AppError = new Error('Unauthorized');
            error.status = 401;
            return next(error);
        }

        const user = getUserByUsername(username);
        if (!user) {
            const error: AppError = new Error('User does not exist.');
            error.status = 404;
            return next(error);
        }
        
        directoryRepository.shareDirectory(user.id, directoryId);
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}

export function unshareDirectory(req: Request, res: Response, next: NextFunction) {
    try {
        const directoryId = req.params.directoryId as string; // body.directoryId is in this case the parent directory in which to create the directory
        const userId = req.body.userId as string;

        if (!directoryId || !userId) {
            const error: AppError = new Error('Missing parameters.');
            error.status = 400;
            return next(error);
        }
        
        const directory = directoryRepository.getDirectory(directoryId)!;

        // Only allowed to unshare others if you are the owner, or if you are trying to unshare yourself
        if (!(directory.owner === req.user.id || userId === req.user.id)) {
            const error: AppError = new Error('Unauthorized');
            error.status = 401;
            return next(error);
        }

        directoryRepository.unshareDirectory(userId, directoryId);
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}

export function leaveDirectory(req: Request, res: Response, next: NextFunction) {
    try {
        const directoryId = req.params.directoryId as string; // body.directoryId is in this case the parent directory in which to create the directory
        const userId = req.user.id;


        if (!directoryId || !userId) {
            const error: AppError = new Error('Missing parameters.');
            error.status = 400;
            return next(error);
        }

        directoryRepository.unshareDirectory(userId, directoryId);
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}





// Check with who the directory is shared with
export function getDirectorySharedWith(req: Request, res: Response, next: NextFunction) {
    try {
        const directoryId = req.params.directoryId as string;

        const directory = directoryRepository.getDirectory(directoryId)!;

        // Only allowed to view share status if you are the directory owner
        if (directory.owner !== req.user.id) {
            const error: AppError = new Error('Unauthorized');
            error.status = 401;
            return next(error);
        }

        const sharedUsers = directoryRepository.getSharedWith(directoryId);
        res.status(200).send(sharedUsers as MinimalUserInfoDTO[]);
    } catch (error) {
        next(error);
    }
}

export function getSharedDirectories(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user.id;
        const sharedDirectories = directoryRepository.getSharedDirectories(userId);
        
        res.status(200).send(sharedDirectories as SharedDirectoryDTO[]);
    } catch (error) {
        next(error);
    }
}