import {db} from "./database.js";

export type User = {
    id: string;
    username: string;
    auth0_id: string;
    created_at: string;
    root_directory: string;
}

const createUserQuery = db.prepare<[string, string, string, string]>('INSERT INTO users (id, username, auth0_id, root_directory) VALUES (?, ?, ?, ?)');
export function createUser(id: string, username: string, auth0_id: string, root_directory: string) {
    createUserQuery.run(id, username, auth0_id, root_directory);
}

const getUserByNameQuery = db.prepare<[string], User>('SELECT id, username, auth0_id, root_directory, created_at FROM users WHERE username = ?;');
const getUserByIdQuery = db.prepare<[string], User>('SELECT id, username, auth0_id, root_directory, created_at FROM users WHERE id = ?;');
const getUserByAuth0IdQuery = db.prepare<[string], User>('SELECT id, username, auth0_id, root_directory, created_at FROM users WHERE auth0_id = ?;');

export function getUserByUsername(username: string) {
    return getUserByNameQuery.get(username);
}

export function getUserById(id: string) {
    return getUserByIdQuery.get(id);
}

export function getUserByAuth0Id(id: string) {
    return getUserByAuth0IdQuery.get(id);
}