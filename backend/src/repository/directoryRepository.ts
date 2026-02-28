import {db} from "./database.js";

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

const createDirectoryQuery = db.prepare('INSERT INTO directories (id, parent_directory, owner, name) VALUES (?, ?, ?, ?)');
export function createDirectory(id: string, parentDirectoryId: string, owner: string, name: string) {
    createDirectoryQuery.run(id, parentDirectoryId, owner, name);
}

const getDirectoryQuery = db.prepare<string, Directory>('SELECT id, name, owner, parent_directory as parentDirectoryId FROM directories WHERE id = ?');
export function getDirectory(id: string) {
    return getDirectoryQuery.get(id);
}

const getAllDirectoriesQuery = db.prepare<[], Directory>('SELECT id, name, owner, parent_directory as parentDirectoryId FROM directories');
export function getAllDirectories() {
    return getAllDirectoriesQuery.all();
}

const getDirectoriesQuery = db.prepare<[string, string], Directory>('SELECT id, name, owner, parent_directory as parentDirectoryId FROM directories WHERE parent_directory = ? AND id != ?');
export function getDirectories(parentDirectoryId: string) {
    return getDirectoriesQuery.all(parentDirectoryId, parentDirectoryId);
}

const deleteDirectoryQuery = db.prepare('DELETE FROM directories WHERE id = ?');
export function deleteDirectory(id: string) {
    deleteDirectoryQuery.run(id);
}

const getDirectoriesRecursiveQuery = db.prepare<string, Directory>(`
    WITH RECURSIVE subdirs(id, parent_directory, owner, name) AS (
        SELECT id, parent_directory, owner, name FROM directories WHERE id = ?
    
        UNION
    
        SELECT d.id, d.parent_directory, d.owner, d.name FROM directories d INNER JOIN subdirs sd ON d.parent_directory = sd.id
    )
    SELECT id, parent_directory, owner, name as parentDirectoryId FROM subdirs;
`);
export function getDirectoriesRecursive(directoryId: string) {
    return getDirectoriesRecursiveQuery.all(directoryId);
}

const shareDirectoryQuery = db.prepare<[string, string]>(`
    INSERT INTO share_directories (user, directory) VALUES (?, ?)
`)
export function shareDirectory(user: string, directory: string, ) {
    shareDirectoryQuery.run(user, directory);
}

const unshareDirectoryQuery = db.prepare<[string, string]>(`
    DELETE FROM share_directories WHERE user = ? AND directory = ?;
`);
export function unshareDirectory(user: string, directory: string) {
    unshareDirectoryQuery.run(user, directory);
}

type SharedDirectory = {
    id: string;
    name: string;
    parentDirectoryId: string;
    ownerUsername: string;
    ownerId: string;
}

const getSharedDirectoriesQuery = db.prepare<[string], SharedDirectory>(`
    SELECT
        d.id,
        d.name,
        d.parent_directory as parentDirectoryId,
        u.username as ownerUsername,
        u.id as ownerId
    FROM share_directories sd
             JOIN directories d ON sd.directory = d.id
             JOIN users u ON d.owner = u.id
    WHERE sd.user = ?
    ORDER BY d.name;
`);
export function getSharedDirectories(userId: string) {
    return getSharedDirectoriesQuery.all(userId);
}

type MinimalUserInfo = {
    id: string;
    username: string;
}
const getSharedWithQuery = db.prepare<[string], MinimalUserInfo>(`
    SELECT u.id, u.username
    FROM share_directories sd
             JOIN users u ON sd.user = u.id
             JOIN directories d ON sd.directory = d.id
    WHERE sd.directory = ?
      AND sd.user != d.owner; 
`);
export function getSharedWith(directoryId: string) {
    return getSharedWithQuery.all(directoryId);
}

const existsShareQuery = db.prepare<[string, string], Number>(`
    SELECT 1
    FROM share_directories sd
    WHERE sd.directory = ? AND sd.user == ?; 
`);
export function existsShare(directoryId: string, userId: string) {
    return existsShareQuery.get(directoryId, userId) !== undefined;
}

type DirectoryTreeRow = {
    id: string;
    name: string;
    depth: number;
}

const MAX_TREE_DEPTH = 12;

// TODO make the query more efficient
const getDirectoryTreeQuery = db.prepare<[string, number, string, string], DirectoryTreeRow>(`
    WITH RECURSIVE parent_dirs(id, parent_directory, owner, name, depth) AS (
        SELECT id, parent_directory, owner, name, 0
        FROM directories
        WHERE id = ?

        UNION

        SELECT d.id, d.parent_directory, d.owner, d.name, pd.depth + 1
        FROM directories d
                 INNER JOIN parent_dirs pd ON d.id = pd.parent_directory
        WHERE pd.depth < ?
    ),
                   accessible_parents AS (
                    
                       SELECT DISTINCT pd.id, pd.parent_directory, pd.owner, pd.name, pd.depth
                       FROM parent_dirs pd
                       WHERE EXISTS (
                           WITH RECURSIVE check_access(id, parent_directory, owner) AS (
                           SELECT id, parent_directory, owner
                           FROM directories
                           WHERE id = pd.id

                           UNION

                           SELECT d.id, d.parent_directory, d.owner
                           FROM directories d
                                    INNER JOIN check_access ca ON d.id = ca.parent_directory
                       )
                                 SELECT 1
                                 FROM check_access ca
                                 LEFT JOIN share_directories sd ON sd.directory = ca.id AND sd.user = ?
                                 WHERE ca.owner = ? OR sd.user IS NOT NULL
                                 )
                   )
    SELECT id, parent_directory, owner, name, depth
    FROM accessible_parents WHERE id != parent_directory
`);
export function getDirectoryTree(directoryId: string, userId: string): { tree: DirectoryMinimalInfo[], depthLimitReached: boolean } {
    const rows = getDirectoryTreeQuery.all(directoryId, MAX_TREE_DEPTH, userId, userId);
    const depthLimitReached = rows.some(r => r.depth >= MAX_TREE_DEPTH);
    const tree = rows.map(({ id, name }) => ({ id, name })).reverse();
    return { tree, depthLimitReached };
}

