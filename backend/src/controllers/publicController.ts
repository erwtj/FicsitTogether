import type {Request, Response, NextFunction} from "express";
import * as projectRepository from "../repository/projectRepository.js";
import * as directoryRepository from "../repository/directoryRepository.js";
import type {AppError} from "../middlewares/errorHandler.js";
import type {DirectoryContentDTO, PublicProjectDTO } from "dtolib";

export async function getPublicProject(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.projectId as string;
        const [project, chart] = await Promise.all([
            projectRepository.getProject(id),
            projectRepository.getProjectChart(id),
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

        const [directory, subDirectories, projects, directoryTree] = await Promise.all([
            directoryRepository.getDirectory(directoryId),
            directoryRepository.getDirectories(directoryId),
            projectRepository.getProjectsInDirectory(directoryId),
            directoryRepository.getPublicDirectoryTree(directoryId),
        ]);

        res.status(200).send({
            ...directory,
            owner: "",
            subDirectories: subDirectories.map(dir => ({ ...dir, owner: "" })),
            projects,
            directoryTree,
        } as DirectoryContentDTO);
    } catch (error) {
        next(error);
    }
}