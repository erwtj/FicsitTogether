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

export type ItemSpawnerNodeData = {
    itemClassName: string;
    outputAmount: number;
}

export type RecipeNodeData = {
    recipeClassName: string;
    summerSloops: number;
    percentages: number[];
}

export type PowerNodeData = {
    recipeClassName: string;
}

export type outputNodeData = {
    itemClassName: string;
    convertToTickets: boolean;
}

export type NodeDTO = {
    id: string;
    type: string;
    position: {
        x: number;
        y: number;
    };
    data: ItemSpawnerNodeData | RecipeNodeData | outputNodeData | PowerNodeData; // TODO: Maybe there is a better way?
    selectedBy: string[]; // TODO: Idk if we want to do it this way?
}

export type EdgeDTO = {
    id: string;

    sourceNodeId: string;
    sourceHandleId: string;
    targetNodeId: string;
    targetHandleId: string;

    data: {
        throughput: number;
        startHandleType: 'source' | 'target'; // Determines from which handle the node is driven
        movablePoints?: {
            id: string;
            x: number;
            y: number;
        }
    }
}

export type ChartDataDTO = {
    nodes: NodeDTO[];
    edges: EdgeDTO[];
}

export type DirectoryTreeDTO = {
    id: string;
    name: string;
}

export type DirectoryTreeResultDTO = {
    tree: DirectoryTreeDTO[];
    depthLimitReached: boolean;
}

// Contains directory info, including contents of directory
export type DirectoryContentDTO = {
    id: string,
    name: string,
    owner: string, 
    parentDirectoryId: string, 
    subDirectories: DirectoryDTO[],
    projects: ProjectDTO[],
    directoryTree: DirectoryTreeResultDTO,
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