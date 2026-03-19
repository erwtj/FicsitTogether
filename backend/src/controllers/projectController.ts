import type {Request, Response, NextFunction} from "express";
import * as repository from "../repository/projectRepository.js";
import type {AppError} from "../middlewares/errorHandler.js";
import type {ProjectDTO} from "dtolib";
import {MAX_PROJECTS_PER_DIRECTORY, MAX_PROJECTS_PER_USER} from "dtolib";

const emptyChart = {nodes: [], edges: []};

export async function createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        // Validated by Zod middleware
        const directoryId = req.body.directoryId as string;
        const name = req.body.name as string;
        const description = req.body.description as string;
        
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
        // Validated by Zod middleware
        const id = req.params.projectId as string;
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
        // Validated by Zod middleware
        const id = req.params.projectId as string;
        
        await repository.deleteProject(id);

        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}

export async function downloadProject(req: Request, res: Response, next: NextFunction) {
    try {
        // Validated by Zod middleware
        const id = req.params.projectId as string;
        const project = await repository.getProject(id);
        const chart = await repository.getProjectChart(id);

        if (!project || !chart) { // This could happen due to a race condition
            const error: AppError = new Error('Unauthorized');
            error.status = 401;
            return next(error);
        }

        const plainName = `${project.name}.json`;
        const encodedName = encodeURIComponent(plainName);
        // ASCII-safe fallback: replace non-ASCII characters with underscore
        const asciiFallback = plainName.replace(/[^\x20-\x7E]/g, '_');
        res.setHeader('Content-Disposition', `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodedName}`);
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
        // Validated by Zod middleware
        const id = req.params.projectId as string;
        const isPublic = req.body.isPublic as boolean;
        
        await repository.updateProjectPublic(id, isPublic);

        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}