import {pool} from "./database.js";

export type User = {
    id: string;
    username: string;
    auth0_id: string;
    created_at: string;
    root_directory: string;
}

export async function createUser(id: string, username: string, auth0_id: string, root_directory: string) {
    await pool.query(
        'INSERT INTO users (id, username, auth0_id, root_directory) VALUES ($1, $2, $3, $4)',
        [id, username, auth0_id, root_directory]
    );
}

export async function getUserByUsername(username: string) {
    const res = await pool.query<User>(
        'SELECT id, username, auth0_id, root_directory, created_at FROM users WHERE username = $1',
        [username]
    );
    return res.rows[0] ?? undefined;
}

export async function getUserById(id: string) {
    const res = await pool.query<User>(
        'SELECT id, username, auth0_id, root_directory, created_at FROM users WHERE id = $1',
        [id]
    );
    return res.rows[0] ?? undefined;
}

export async function getUserByAuth0Id(id: string) {
    const res = await pool.query<User>(
        'SELECT id, username, auth0_id, root_directory, created_at FROM users WHERE auth0_id = $1',
        [id]
    );
    return res.rows[0] ?? undefined;
}