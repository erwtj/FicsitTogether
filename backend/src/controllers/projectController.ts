import type {Request, Response} from "express";

export function helloWorld(req: Request, res: Response) {
    res.json({
        message: 'Hello, authenticated user!',
        auth0Id: req.user.auth0_id
    });
}