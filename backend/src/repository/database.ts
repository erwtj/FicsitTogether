import Database from 'better-sqlite3';

export const db: Database.Database = new Database('db.sqlite');

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// root_directory on user is not foreign key, this way we do not need to disable foreign keys before inserting user
db.exec(`
    create table if not exists users
    (
        id         text not null
            constraint users_pk
                primary key,
        username   text not null
            constraint users_pk_2
                unique,
        auth0_id   text not null
            constraint users_pk_3
                unique,
        root_directory text not null,
        created_at DATETIME default CURRENT_TIMESTAMP
    );
    
    create table if not exists directories
    (
        id               text not null
            constraint directories_pk
                primary key,
        parent_directory text not null
            constraint directories_directories_id_fk
                references directories
                on delete cascade,
        owner            text not null
            constraint directories_users_id_fk
                references users
                on delete cascade,
        name             text not null
    );
    
    create table if not exists projects
    (
        id               text not null
            constraint projects_pk
                primary key,
        parent_directory text not null
            constraint projects_directories_id_fk
                references directories
                on delete cascade,
        name             text not null,
        description      text not null,
        chart            text not null
    );
    
    create unique index if not exists projects_id_uindex
        on projects (id);
    
    create table if not exists share_directories
    (
        user      text not null
            constraint share_directories_users_id_fk
                references users
                on delete cascade,
        directory text not null
            constraint share_directories_directories_id_fk
                references directories
                on delete cascade,
        constraint share_directories_pk
            primary key (user, directory)
    );
`);
