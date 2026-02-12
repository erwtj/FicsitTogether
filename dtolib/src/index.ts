// Project information
export type ProjectDTO = {
    id: string;
    directoryId: string;
    name: string;
    description: string;
}

// Chart
export type ChartDTO = {
    chart: string;
}

export type DirectoryTreeDTO = {
    id: string;
    name: string;
}


// Contains directory info, including contents of directory
export type DirectoryContentDTO = {
    id: string,
    name: string,
    owner: string, 
    parentDirectoryId: string, 
    subDirectories: DirectoryDTO[],
    projects: ProjectDTO[],
    directoryTree: DirectoryTreeDTO[],
}

// Singular directory info
export type DirectoryDTO = {
    id: string,
    name: string,
    owner: string,
    parentDirectoryId: string
}

// Info for a directory that was shared with you (includes info about the owner)
export type SharedDirectoryDTO = {
    id: string;
    name: string;
    parentDirectoryId: string;
    ownerUsername: string;
    ownerId: string;
}

// Safe to give to other users without leaking data 
export type MinimalUserInfoDTO = {
    id: string;
    username: string;
}

// Contains all user info except Auth0 id
export type FullUserInfoDTO = {
    id: string;
    username: string;
    root_directory: string;
    created_at: string;
}