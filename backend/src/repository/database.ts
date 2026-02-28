import pg from 'pg';
import config from '../config/config.js';

const { Pool } = pg;

export const pool = new Pool({ connectionString: config.databaseUrl });

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
            name             TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS projects
        (
            id               TEXT NOT NULL CONSTRAINT projects_pk PRIMARY KEY,
            parent_directory TEXT NOT NULL CONSTRAINT projects_directories_id_fk
                REFERENCES directories ON DELETE CASCADE,
            name             TEXT NOT NULL,
            description      TEXT NOT NULL,
            chart            TEXT NOT NULL
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
}
