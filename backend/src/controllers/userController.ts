import type {Request, Response, NextFunction} from "express";
import type {FullUserInfoDTO} from "dtolib";
import {deleteUser} from "../repository/userRepository.js";
import { ManagementClient } from 'auth0';
import config from "../config/config.js";

export const managementClient = new ManagementClient({
    domain: config.auth0Domain,
    clientId: config.auth0MgmtClientId,
    clientSecret: config.auth0MgmtClientSecret,
});

export async function getMe(req: Request, res: Response, next: NextFunction) {
    res.status(200).send({
        id: req.user.id,
        username: req.user.username,
        root_directory: req.user.root_directory,
        created_at: req.user.created_at,
    } as FullUserInfoDTO);
}

export async function deleteMe(req: Request, res: Response, next: NextFunction) {
    const auth0id = req.user.auth0_id;
    try {
        await deleteUser(req.user.id);
        await managementClient.users.delete(auth0id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}