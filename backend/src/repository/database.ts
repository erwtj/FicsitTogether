import pg from 'pg';
import config from '../config/config.js';

const { Pool } = pg;

export const pool = new Pool({ connectionString: config.databaseUrl });

// TODO: add created at to projects and directories, and order by it when listing contents
export async function initDatabase() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users
        (
            id             TEXT        NOT NULL CONSTRAINT users_pk PRIMARY KEY,
            username       TEXT        NOT NULL CONSTRAINT users_pk_2 UNIQUE,
            auth0_id       TEXT        NOT NULL CONSTRAINT users_pk_3 UNIQUE,
            root_directory TEXT        NOT NULL,
            created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS directories
        (
            id               TEXT NOT NULL CONSTRAINT directories_pk PRIMARY KEY,
            parent_directory TEXT NOT NULL CONSTRAINT directories_directories_id_fk
                REFERENCES directories ON DELETE CASCADE,
            owner            TEXT NOT NULL CONSTRAINT directories_users_id_fk
                REFERENCES users ON DELETE CASCADE,
            name             TEXT NOT NULL,
            public           BOOLEAN NOT NULL DEFAULT FALSE
        );

        CREATE TABLE IF NOT EXISTS projects
        (
            id               TEXT NOT NULL CONSTRAINT projects_pk PRIMARY KEY,
            parent_directory TEXT NOT NULL CONSTRAINT projects_directories_id_fk
                REFERENCES directories ON DELETE CASCADE,
            name             TEXT NOT NULL,
            description      TEXT NOT NULL,
            chart            jsonb NOT NULL,
            public           BOOLEAN NOT NULL DEFAULT FALSE
        );

        CREATE TABLE IF NOT EXISTS share_directories
        (
            "user"    TEXT NOT NULL CONSTRAINT share_directories_users_id_fk
                REFERENCES users ON DELETE CASCADE,
            directory TEXT NOT NULL CONSTRAINT share_directories_directories_id_fk
                REFERENCES directories ON DELETE CASCADE,
            CONSTRAINT share_directories_pk PRIMARY KEY ("user", directory)
        );
    `);
    
    // Add public field migration
    await pool.query(`
        ALTER TABLE directories
        ADD COLUMN IF NOT EXISTS public BOOLEAN NOT NULL DEFAULT FALSE;
        
        ALTER TABLE projects
        ADD COLUMN IF NOT EXISTS public BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    // Add performance indices
    await pool.query(`
        -- Speed up all queries that filter/join on directories.parent_directory
        -- (getDirectories, countDirectories, recursive CTEs traversing the tree)
        CREATE INDEX IF NOT EXISTS idx_directories_parent_directory
            ON directories (parent_directory);

        -- Speed up queries that filter/join on directories.owner
        -- (canEditDirectory, getDirectoryTree access checks, getUserStorageUsed)
        CREATE INDEX IF NOT EXISTS idx_directories_owner
            ON directories (owner);

        -- Speed up queries that filter/join on projects.parent_directory
        -- (getProjectsInDirectory, countProjectsInDirectory, recursive project CTEs, getUserStorageUsed)
        CREATE INDEX IF NOT EXISTS idx_projects_parent_directory
            ON projects (parent_directory);

        -- The composite PK (user, directory) on share_directories covers lookups by user,
        -- but NOT lookups by directory alone (existsShare, getSharedWith, getDirectoryTree access checks).
        CREATE INDEX IF NOT EXISTS idx_share_directories_directory
            ON share_directories (directory);
    `);
}
