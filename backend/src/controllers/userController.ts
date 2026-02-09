import type {Request, Response, NextFunction} from "express";

export function getMe(req: Request, res: Response, next: NextFunction) {
    res.status(200).send({
        id: req.user.id,
        username: req.user.username,
        root_directory: req.user.root_directory,
        created_at: req.user.created_at,
    });
}