import {pool} from "./database.js";
import {type ChartDataDTO} from "dtolib";

export type Project = {
    id: string;
    directoryId: string;
    name: string;
    description: string;
}

export type Chart = {
    chart: ChartDataDTO;
}

// project will refer to the project metadata (id, parent_directory, name, description), although chart is a part of the project table it has its own functions
// this is just to speed up queries, why query the big chart json when we don't use it

// Exception for create, which inits with an empty chart
export async function createProject(id: string, directoryId: string, name: string, description: string, chart: ChartDataDTO) {
    await pool.query(
        'INSERT INTO projects (id, parent_directory, name, description, chart) VALUES ($1, $2, $3, $4, $5)',
        [id, directoryId, name, description, chart]
    );
}

export async function updateProject(id: string, name: string, description: string) {
    await pool.query(
        'UPDATE projects SET name = $1, description = $2 WHERE id = $3',
        [name, description, id]
    );
}

export async function getProject(id: string) {
    const res = await pool.query<Project>(
        'SELECT id, parent_directory as "directoryId", name, description FROM projects WHERE id = $1',
        [id]
    );
    return res.rows[0] ?? undefined;
}

export async function getProjectChart(id: string) {
    const res = await pool.query<Chart>(
        'SELECT chart FROM projects WHERE id = $1',
        [id]
    );
    return res.rows[0]?.chart ?? undefined;
}

export async function updateProjectChart(id: string, chart: ChartDataDTO) {
    await pool.query(
        'UPDATE projects SET chart = $1 WHERE id = $2',
        [chart, id]
    );
}

export async function getAllProjects() {
    const res = await pool.query<Project>(
        'SELECT id, parent_directory as "directoryId", name, description FROM projects'
    );
    return res.rows;
}

export async function getProjectsInDirectory(directoryId: string) {
    const res = await pool.query<Project>(
        'SELECT id, parent_directory as "directoryId", name, description FROM projects WHERE parent_directory = $1',
        [directoryId]
    );
    return res.rows;
}

export async function getProjectsRecursive(directoryId: string) {
    const res = await pool.query<Project>(`
        WITH RECURSIVE subdirs(id) AS (
            SELECT id FROM directories WHERE id = $1
            UNION ALL
            SELECT d.id FROM directories d INNER JOIN subdirs sd ON d.parent_directory = sd.id
        )
        SELECT p.id, p.parent_directory as "directoryId", p.name, p.description
        FROM projects p
        WHERE p.parent_directory IN (SELECT id FROM subdirs)
    `, [directoryId]);
    return res.rows;
}

export async function getChartsRecursive(directoryId: string): Promise<ChartDataDTO[]> {
    const res = await pool.query<Chart>(`
        WITH RECURSIVE subdirs(id) AS (
            SELECT id FROM directories WHERE id = $1
            UNION ALL
            SELECT d.id FROM directories d INNER JOIN subdirs sd ON d.parent_directory = sd.id
        )
        SELECT p.chart
        FROM projects p
        WHERE p.parent_directory IN (SELECT id FROM subdirs)
    `, [directoryId]);
    return res.rows.map(row => row.chart);
}

export async function deleteProject(id: string) {
    await pool.query('DELETE FROM projects WHERE id = $1', [id]);
}
