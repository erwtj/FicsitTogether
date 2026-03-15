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


/**
 * Returns how many levels deep a directory is below the owner's root directory.
 * Root directory itself returns 0.
 */
export async function getDirectoryDepth(directoryId: string): Promise<number> {
    const res = await pool.query<{ depth: number }>(`
        WITH RECURSIVE ancestry(id, parent_directory, depth) AS (
            SELECT id, parent_directory, 0
            FROM directories
            WHERE id = $1
            UNION ALL
            SELECT d.id, d.parent_directory, a.depth + 1
            FROM directories d
                INNER JOIN ancestry a ON d.id = a.parent_directory
            WHERE d.id != d.parent_directory -- stop at root (root's parent is itself)
        )
        SELECT MAX(depth) AS depth FROM ancestry
    `, [directoryId]);
    return res.rows[0]?.depth ?? 0;
}

export async function countDirectories(parentDirectoryId: string): Promise<number> {
    const res = await pool.query<{ count: string }>(
        'SELECT COUNT(*) AS count FROM directories WHERE parent_directory = $1 AND id != $1',
        [parentDirectoryId]
    );
    return parseInt(res.rows[0]?.count ?? '0', 10);
}

export async function countTotalDirectoriesForUser(userId: string): Promise<number> {
    const res = await pool.query<{ count: string }>(`
        SELECT COUNT(*) AS count
        FROM directories
        WHERE owner = $1
          AND id != parent_directory
    `, [userId]);
    return parseInt(res.rows[0]?.count ?? '0', 10);
}

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

export async function getDirectoryTree(directoryId: string, userId: string): Promise<DirectoryMinimalInfo[]> {
    const res = await pool.query<DirectoryTreeRow>(`
        WITH RECURSIVE parent_dirs(id, parent_directory, owner, name, depth) AS (
            SELECT id, parent_directory, owner, name, 0
            FROM directories
            WHERE id = $1

            UNION ALL

            SELECT d.id, d.parent_directory, d.owner, d.name, pd.depth + 1
            FROM directories d
                     INNER JOIN parent_dirs pd ON d.id = pd.parent_directory
            WHERE d.id != d.parent_directory
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
                    WHERE d.id != d.parent_directory
                )
                SELECT 1
                FROM check_access ca
                LEFT JOIN share_directories sd ON sd.directory = ca.id AND sd."user" = $2
                WHERE ca.owner = $3 OR sd."user" IS NOT NULL
            )
        )
        SELECT id, name, depth
        FROM accessible_parents
        WHERE id != parent_directory
        ORDER BY depth DESC
    `, [directoryId, userId, userId]);

    return res.rows.map(({ id, name }) => ({ id, name }));
}

export async function getPublicDirectoryTree(directoryId: string): Promise<DirectoryMinimalInfo[]> {
    const res = await pool.query<DirectoryTreeRow>(`
        WITH RECURSIVE parent_dirs(id, parent_directory, name, depth, public) AS (
            SELECT id, parent_directory, name, 0, public
            FROM directories
            WHERE id = $1

            UNION ALL

            SELECT d.id, d.parent_directory, d.name, pd.depth + 1, d.public
            FROM directories d
                INNER JOIN parent_dirs pd ON d.id = pd.parent_directory
            WHERE d.id != d.parent_directory
        ),
        max_public_depth AS (
            SELECT MAX(depth) AS depth
            FROM parent_dirs
            WHERE public = true
        )
        SELECT pd.id, pd.name, pd.depth
        FROM parent_dirs pd
            CROSS JOIN max_public_depth mpd
        WHERE pd.id != pd.parent_directory
          AND mpd.depth IS NOT NULL
          AND pd.depth <= mpd.depth
        ORDER BY pd.depth DESC
    `, [directoryId]);

    return res.rows.map(({ id, name }) => ({ id, name }));
}

export async function updateDirectoryPublic(directoryId: string, isPublic: boolean) {
    await pool.query(
        'UPDATE directories SET public = $1 WHERE id = $2',
        [isPublic, directoryId]
    );
}
