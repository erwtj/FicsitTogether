import type {Request, Response, NextFunction} from "express";
import type {FullUserInfoDTO} from "dtolib";
import {countTotalProjectsForUser} from "../repository/projectRepository.js";
import {countTotalDirectoriesForUser} from "../repository/directoryRepository.js";

export async function getMe(req: Request, res: Response, next: NextFunction) {
    const [totalDirectoryCount, totalProjectCount] = await Promise.all([
        countTotalDirectoriesForUser(req.user.id),
        countTotalProjectsForUser(req.user.id)
    ]);

    res.status(200).send({
        id: req.user.id,
        username: req.user.username,
        root_directory: req.user.root_directory,
        created_at: req.user.created_at,
        total_project_count: totalProjectCount,
        total_directory_count: totalDirectoryCount
    } as FullUserInfoDTO);
}