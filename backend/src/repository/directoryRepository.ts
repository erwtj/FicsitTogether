import {db} from "./database.js";

export type Directory = {
    id: string;
    parentDirectoryId: string;
    owner: string;
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
