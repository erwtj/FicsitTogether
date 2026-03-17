import type {Request, Response, NextFunction} from "express";
import * as repository from "../repository/projectRepository.js";
import type {AppError} from "../middlewares/errorHandler.js";
import type {ProjectDTO} from "dtolib";
import {MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH, MAX_PROJECTS_PER_DIRECTORY, MAX_PROJECTS_PER_USER} from "dtolib";

const emptyChart = {nodes: [], edges: []};

export async function createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const directoryId = req.body.directoryId as string;
        const name = req.body.name as string;
        const description = req.body.description as string;
        
        if (!directoryId || !name || !description) {
            const error: AppError = new Error('Missing parameters.');
            error.status = 400;
            return next(error);
        }

        if (name.length > MAX_NAME_LENGTH) {
            const error: AppError = new Error(`Directory name exceeds max length (${MAX_NAME_LENGTH}).`);
            error.status = 400;
            return next(error);
        }
        
        if (description.length > MAX_DESCRIPTION_LENGTH) {
            const error: AppError = new Error(`Directory description exceeds max length (${MAX_DESCRIPTION_LENGTH}).`);
            error.status = 400;
            return next(error);
        }
        
        if (directoryId === req.user.root_directory) {
            const error: AppError = new Error('Not allowed to make projects in root directory!');
            error.status = 400;
            return next(error);
        }

        const [projectCount, totalProjectCount] = await Promise.all([
            repository.countProjectsInDirectory(directoryId),
            repository.countTotalProjectsForDirectoryOwner(directoryId)
        ]);

        if (projectCount >= MAX_PROJECTS_PER_DIRECTORY) {
            const error: AppError = new Error(`Maximum of ${MAX_PROJECTS_PER_DIRECTORY} projects per directory reached.`);
            error.status = 400;
            return next(error);
        }

        if (totalProjectCount >= MAX_PROJECTS_PER_USER) {
            const error: AppError = new Error(`Maximum of ${MAX_PROJECTS_PER_USER} total projects per user reached.`);
            error.status = 400;
            return next(error);
        }

        const uuid = crypto.randomUUID();
        await repository.createProject(uuid, directoryId, name, description, emptyChart);
        
        res.status(201).send({
            id: uuid,
            name: name, 
            description: description,
            directoryId: directoryId,
        } as ProjectDTO)
    } catch (error) {
        next(error);
    } 
}

export async function getProject(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.projectId as string; // won't even route if no id is included
        const project = await repository.getProject(id);

        if (!project) { // Should be impossible due to checkProjectAccess middleware
            const error: AppError = new Error('Unauthorized');
            error.status = 401;
            return next(error);
        }

        res.status(200).send(project as ProjectDTO);
    } catch (error) {
        next(error);
    }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.projectId as string; // won't even route if no id is included
        
        await repository.deleteProject(id);

        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}

export async function downloadProject(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.projectId as string; // won't even route if no id is included
        const project = await repository.getProject(id);
        const chart = await repository.getProjectChart(id);

        if (!project || !chart) { // This could happen due to a race condition
            const error: AppError = new Error('Unauthorized');
            error.status = 401;
            return next(error);
        }

        const plainName = `${project.name}.json`;
        const encodedName = encodeURIComponent(plainName);
        res.setHeader('Content-Disposition', `attachment; filename="${plainName}"; filename*=UTF-8''${encodedName}`);
        res.setHeader('Content-Type', 'application/json');

        res.status(200).json({
            name: project.name,
            description: project.description,
            chart: chart,
        });
    } catch (error) {
        next(error);
    }
}

export async function updateProjectPublic(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.projectId as string; // won't even route if no id is included
        const isPublic = req.body.isPublic as boolean;
        
        await repository.updateProjectPublic(id, isPublic);

        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}