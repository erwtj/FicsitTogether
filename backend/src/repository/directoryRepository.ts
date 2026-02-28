import {pool} from "./database.js";

export type Directory = {
    id: string;
    parentDirectoryId: string;
    owner: string;
    name: string;
}

export type DirectoryMinimalInfo = {
    id: string;
    name: string;
}

type SharedDirectory = {
    id: string;
    name: string;
    parentDirectoryId: string;
    ownerUsername: string;
    ownerId: string;
}

type MinimalUserInfo = {
    id: string;
    username: string;
}

type DirectoryTreeRow = {
    id: string;
    name: string;
    depth: number;
}

const MAX_TREE_DEPTH = 12;

export async function createDirectory(id: string, parentDirectoryId: string, owner: string, name: string) {
    await pool.query(
        'INSERT INTO directories (id, parent_directory, owner, name) VALUES ($1, $2, $3, $4)',
        [id, parentDirectoryId, owner, name]
    );
}

export async function getDirectory(id: string) {
    const res = await pool.query<Directory>(
        'SELECT id, name, owner, parent_directory as "parentDirectoryId" FROM directories WHERE id = $1',
        [id]
    );
    return res.rows[0] ?? undefined;
}

export async function getAllDirectories() {
    const res = await pool.query<Directory>(
        'SELECT id, name, owner, parent_directory as "parentDirectoryId" FROM directories'
    );
    return res.rows;
}

export async function getDirectories(parentDirectoryId: string) {
    const res = await pool.query<Directory>(
        'SELECT id, name, owner, parent_directory as "parentDirectoryId" FROM directories WHERE parent_directory = $1 AND id != $1',
        [parentDirectoryId]
    );
    return res.rows;
}

export async function deleteDirectory(id: string) {
    await pool.query('DELETE FROM directories WHERE id = $1', [id]);
}

export async function getDirectoriesRecursive(directoryId: string) {
    const res = await pool.query<Directory>(`
        WITH RECURSIVE subdirs(id, parent_directory, owner, name) AS (
            SELECT id, parent_directory, owner, name FROM directories WHERE id = $1
            UNION ALL
            SELECT d.id, d.parent_directory, d.owner, d.name
            FROM directories d INNER JOIN subdirs sd ON d.parent_directory = sd.id
        )
        SELECT id, parent_directory as "parentDirectoryId", owner, name FROM subdirs
    `, [directoryId]);
    return res.rows;
}

export async function shareDirectory(user: string, directory: string) {
    await pool.query(
        'INSERT INTO share_directories ("user", directory) VALUES ($1, $2)',
        [user, directory]
    );
}

export async function unshareDirectory(user: string, directory: string) {
    await pool.query(
        'DELETE FROM share_directories WHERE "user" = $1 AND directory = $2',
        [user, directory]
    );
}

export async function getSharedDirectories(userId: string) {
    const res = await pool.query<SharedDirectory>(`
        SELECT
            d.id,
            d.name,
            d.parent_directory as "parentDirectoryId",
            u.username as "ownerUsername",
            u.id as "ownerId"
        FROM share_directories sd
                 JOIN directories d ON sd.directory = d.id
                 JOIN users u ON d.owner = u.id
        WHERE sd.user = $1
        ORDER BY d.name
    `, [userId]);
    return res.rows;
}

export async function getSharedWith(directoryId: string) {
    const res = await pool.query<MinimalUserInfo>(`
        SELECT u.id, u.username
        FROM share_directories sd
                 JOIN users u ON sd."user" = u.id
                 JOIN directories d ON sd.directory = d.id
        WHERE sd.directory = $1
          AND sd."user" != d.owner
    `, [directoryId]);
    return res.rows;
}

export async function existsShare(directoryId: string, userId: string) {
    const res = await pool.query(
        'SELECT 1 FROM share_directories sd WHERE sd.directory = $1 AND sd."user" = $2',
        [directoryId, userId]
    );
    return res.rowCount! > 0;
}

export async function getDirectoryTree(directoryId: string, userId: string): Promise<{ tree: DirectoryMinimalInfo[], depthLimitReached: boolean }> {
    const res = await pool.query<DirectoryTreeRow>(`
        WITH RECURSIVE parent_dirs(id, parent_directory, owner, name, depth) AS (
            SELECT id, parent_directory, owner, name, 0
            FROM directories
            WHERE id = $1

            UNION ALL

            SELECT d.id, d.parent_directory, d.owner, d.name, pd.depth + 1
            FROM directories d
                     INNER JOIN parent_dirs pd ON d.id = pd.parent_directory
            WHERE pd.depth < $2
        ),
        accessible_parents AS (
            SELECT DISTINCT pd.id, pd.parent_directory, pd.owner, pd.name, pd.depth
            FROM parent_dirs pd
            WHERE EXISTS (
                WITH RECURSIVE check_access(id, parent_directory, owner) AS (
                    SELECT id, parent_directory, owner
                    FROM directories
                    WHERE id = pd.id

                    UNION ALL

                    SELECT d.id, d.parent_directory, d.owner
                    FROM directories d
                             INNER JOIN check_access ca ON d.id = ca.parent_directory
                )
                SELECT 1
                FROM check_access ca
                LEFT JOIN share_directories sd ON sd.directory = ca.id AND sd."user" = $3
                WHERE ca.owner = $4 OR sd."user" IS NOT NULL
            )
        )
        SELECT id, name, depth
        FROM accessible_parents
        WHERE id != parent_directory
        ORDER BY depth DESC
    `, [directoryId, MAX_TREE_DEPTH, userId, userId]);

    const depthLimitReached = res.rows.some(r => r.depth >= MAX_TREE_DEPTH);
    const tree = res.rows.map(({ id, name }) => ({ id, name }));
    return { tree, depthLimitReached };
}
