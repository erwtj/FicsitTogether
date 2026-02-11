import type {Request, Response, NextFunction} from "express";
import * as repository from "../repository/projectRepository.js";
import type {AppError} from "../middlewares/errorHandler.js";
import type {ProjectDTO, ChartDTO} from "dtolib";

const emptyChart = {nodes: [], edges: [], viewport: {x: 0, y: 0, zoom: 1}};
const emptyJson = JSON.stringify(emptyChart); 

// TODO: Allow marking project's as public via url, that way you can share files with other people without them being able to edit and without needing their username
// TODO: Add project importing / exporting

export function createProject(req: Request, res: Response, next: NextFunction): void {
    try {
        const directoryId = req.body.directoryId as string;
        const name = req.body.name as string;
        const description = req.body.description as string;
        
        if (!directoryId || !name || !description) {
            const error: AppError = new Error('Missing parameters.');
            error.status = 400;
            return next(error);
        }
        
        if (directoryId === req.user.root_directory) {
            const error: AppError = new Error('Not allowed to make projects in root directory!');
            error.status = 400;
            return next(error);
        }
        
        const uuid = crypto.randomUUID();
        repository.createProject(uuid, directoryId, name, description, emptyJson);
        
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

export function getProject(req: Request, res: Response, next: NextFunction) {
    try {
        const id = req.params.projectId as string; // won't even route if no id is included
        const project = repository.getProject(id);

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
        const chart = repository.getProjectChart(id);

        if (!chart) { // Should be impossible due to checkProjectAccess middleware
            const error: AppError = new Error('Unauthorized');
            error.status = 401;
            return next(error);
        }

        res.status(200).send(chart as ChartDTO);
    } catch (error) {
        next(error);
    }
}