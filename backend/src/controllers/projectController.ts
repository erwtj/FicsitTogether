import type {Request, Response, NextFunction} from "express";
import * as repository from "../repository/projectRepository.js";
import type {AppError} from "../middlewares/errorHandler.js";
import type {Project} from "../repository/projectRepository.js";

const emptyChart = {nodes: [], edges: [], viewport: {x: 0, y: 0, zoom: 1}};
const emptyJson = JSON.stringify(emptyChart); 

export function createProject(req: Request, res: Response, next: NextFunction): void {
    try {
        const directoryId = req.body.directoryId as string;
        const name = req.body.name as string || "";
        const description = req.body.description as string || "";
        
        if (!directoryId || !name || !description) {
            res.status(400).send("Missing parameters!");
        }
        
        const uuid = crypto.randomUUID();
        repository.createProject(uuid, directoryId, name, description, emptyJson);
        
        res.status(201).send({
            id: uuid,
            name: name, 
            description: description,
            directoryId: directoryId,
        } as Project)
    } catch (error) {
        next(error);
    } 
}

export function getProject(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.projectId as string; // won't even route if no id is included
        const project = repository.getProject(id);

        if (!project) { // Should be impossible due to checkProjectAccess middleware
            const error: AppError = new Error('Project not found');
            error.status = 404;
            return next(error);
        }

        res.status(200).send(project);
    } catch (error) {
        next(error);
    }
}

export function deleteProject(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.projectId as string; // won't even route if no id is included
        
        repository.deleteProject(id);

        res.sendStatus(200);
    } catch (error) {
        next(error);
    }
}

export function getChart(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.projectId as string; // won't even route if no id is included
        const project = repository.getProjectChart(id);

        if (!project) { // Should be impossible due to checkProjectAccess middleware
            const error: AppError = new Error('Project chart not found');
            error.status = 404;
            return next(error);
        }

        res.status(200).send(project);
    } catch (error) {
        next(error);
    }
}