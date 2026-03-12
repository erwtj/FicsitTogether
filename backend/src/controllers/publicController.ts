import type {Request, Response, NextFunction} from "express";
import * as repository from "../repository/projectRepository.js";
import type {AppError} from "../middlewares/errorHandler.js";
import type { PublicProjectDTO } from "dtolib";

export async function getPublicProject(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.projectId as string;
        const [project, chart] = await Promise.all([
            repository.getProject(id),
            repository.getProjectChart(id),
        ]);

        if (!project || !chart) {
            const error: AppError = new Error('Project not found.');
            error.status = 404;
            return next(error);
        }

        res.status(200).json({
            id: project.id,
            name: project.name,
            description: project.description,
            directoryId: project.directoryId,
            chart,
        } as PublicProjectDTO);
    } catch (error) {
        next(error);
    }
}

export async function getPublicDirectory(req: Request, res: Response, next: NextFunction) {
    try {
        const directoryId = req.params.directoryId as string;
        
    } catch (error) {
        next(error);
    }
}