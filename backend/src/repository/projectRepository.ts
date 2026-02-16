import {db} from "./database.js";
import {type ChartDataDTO} from "dtolib";

export type Project = {
    id: string;
    directoryId: string;
    name: string;
    description: string;
}

export type Chart = {
    chart: string;
}

// project will refer to the project metadata (id, parent_directory, name, description), although chart is a part of the project table it has its own functions
// this is just to speed up queries, why query the big chart json when we don't use it

// Exception for create, which inits with an empty chart
const createProjectQuery = db.prepare('INSERT INTO projects (id, parent_directory, name, description, chart) VALUES (?, ?, ?, ?, ?)');
export function createProject(id: string, directoryId: string, name: string, description: string, chart: string) {
    const json = JSON.stringify(chart);
    createProjectQuery.run(id, directoryId, name, description, json);
}

const updateProjectQuery = db.prepare('UPDATE projects SET name = ?, description = ? WHERE id = ?');
export function updateProject(id: string, name: string, description: string) {
    updateProjectQuery.run(name, description, id);
}

const getProjectQuery= db.prepare<string, Project>('SELECT id, parent_directory as directoryId, name, description FROM projects WHERE id = ?');
export function getProject(id: string) {
    return getProjectQuery.get(id);
}

const getProjectChartQuery = db.prepare<string, Chart>('SELECT chart FROM projects WHERE id = ?');
export function getProjectChart(id: string) {
    const row = getProjectChartQuery.get(id);
    return row ? JSON.parse(row.chart) as ChartDataDTO : undefined;
}

const updateProjectChartQuery = db.prepare<[string, string]>('UPDATE projects SET chart = ? WHERE id = ?');
export function updateProjectChart(id: string, chart: any) {
    const json = JSON.stringify(chart);
    updateProjectChartQuery.run(json, id);
}

const getAllProjectsQuery = db.prepare<[], Project>('SELECT id, parent_directory as directoryId, name, description FROM projects');
export function getAllProjects() {
    return getAllProjectsQuery.all();
}

const getProjectsInDirectoryQuery = db.prepare<string, Project>('SELECT id, parent_directory as directoryId, name, description FROM projects WHERE parent_directory = ?');
export function getProjectsInDirectory(directoryId: string) {
    return getProjectsInDirectoryQuery.all(directoryId);
}

const getProjectsRecursiveQuery = db.prepare<string, Project>(`
    WITH RECURSIVE subdirs(id) AS (
        SELECT id FROM directories WHERE id = ?
    
        UNION
    
        SELECT d.id FROM directories d INNER JOIN subdirs sd ON d.parent_directory = sd.id
    )
    SELECT id, parent_directory as directoryId, name, description FROM projects WHERE projects.parent_directory IN subdirs;
`);
export function getProjectsRecursive(directoryId: string) {
    return getProjectsRecursiveQuery.all(directoryId);
}

const deleteProjectQuery = db.prepare<string>('DELETE FROM projects WHERE id = ?');
export function deleteProject(id: string) {
    deleteProjectQuery.run(id);
}


