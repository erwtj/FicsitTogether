import type {Request, Response, NextFunction} from "express";
import * as directoryRepository from "../repository/directoryRepository.js";
import * as projectRepository from "../repository/projectRepository.js";
import type {AppError} from "../middlewares/errorHandler.js";
import type {Directory} from "../repository/directoryRepository.js";
import {getUserById, getUserByUsername} from "../repository/userRepository.js";

export function getDirectory(req: Request, res: Response, next: NextFunction) {
    try {
        const directoryId = req.params.directoryId as string;
        const directory = directoryRepository.getDirectory(directoryId);

        if (!directory) { // Should be impossible due to checkProjectAccess middleware
            const error: AppError = new Error('Directory not found');
            error.status = 404;
            return next(error);
        }
        
        const subDirectories = directoryRepository.getDirectories(directoryId);
        const projects = projectRepository.getProjectsInDirectory(directoryId); // I know this is technically wrong, and you shouldn't access two different repositories in one controller, but fuck that stupid rule

        res.status(200).send({
            ...directory, 
            subDirectories: subDirectories,
            projects: projects,
        });
    } catch (error) {
        next(error);
    }
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
        } as Directory)
    } catch (error) {
        next(error);
    }
}

export function deleteDirectory(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.directoryId as string;

        const directory = directoryRepository.getDirectory(id);
        if (!directory) {
            const error: AppError = new Error('Directory not found');
            error.status = 400;
            return next(error);
        }
        
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
        const directoryId = req.body.directoryId as string; // body.directoryId is in this case the parent directory in which to create the directory
        const username = req.body.user as string;

        if (!directoryId || !username) {
            const error: AppError = new Error('Missing parameters.');
            error.status = 400;
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

// TODO: Repeated code segment
export function unshareDirectory(req: Request, res: Response, next: NextFunction) {
    try {
        const directoryId = req.body.directoryId as string; // body.directoryId is in this case the parent directory in which to create the directory
        const username = req.body.user as string;

        if (!directoryId || !username) {
            const error: AppError = new Error('Missing parameters.');
            error.status = 400;
            return next(error);
        }

        const user = getUserByUsername(username);
        if (!user) {
            const error: AppError = new Error('User does not exist.');
            error.status = 404;
            return next(error);
        }

        directoryRepository.unshareDirectory(user.id, directoryId);
        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}