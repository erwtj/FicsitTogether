export type userDTO = {
    id: number;
    username: string;
    root_directory: string;
    created_at: string;
}

export type SharedDirectoryDTO = {
    id: string;
    name: string;
    parentDirectoryId: string;
    ownerUsername: string;
    ownerId: string;
}

export type Directory = {
    id: string;
    parentDirectoryId: string;
    owner: string;
    name: string;
}

export type Project = {
    id: string;
    directoryId: string;
    name: string;
    description: string;
}

export type directoryDTO = {
    Directory: Directory;
    subDirectories: Directory[];
    projects: Project[];
}

