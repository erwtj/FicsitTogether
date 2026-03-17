export * from './constraints.js';

// Project information
export type ProjectDTO = {
    id: string;
    directoryId: string;
    name: string;
    description: string;
    public: boolean;
}

// Full project info returned from a public/shared view (includes the chart)
export type PublicProjectDTO = {
    id: string;
    directoryId: string;
    name: string;
    description: string;
    chart: ChartDataDTO;
}

// Chart
export type ChartDTO = {
    chart: string;
}

export type SloopData = {
    sloopAmount: number;
    overclockPercentage: number;
}

export type RecipeNodeData = {
    recipeClassName: string;
    sloopData?: SloopData[];
};

export type ItemSpawnerNodeData = {
    itemClassName: string;
    outputAmount: number; // Items (or mL for fluids) per minute this node provides
};

export type EndNodeData = {
    itemClassName: string;
    sinkOutput: boolean;
};

export type PowerNodeData = {
    recipeClassName: string;
};

export type NodeDTO = {
    id: string;
    type: 'item-spawner-node' | 'recipe-node' | 'end-node' | 'power-node';

    position: {
        x: number;
        y: number;
    };
    data: ItemSpawnerNodeData | RecipeNodeData | EndNodeData | PowerNodeData;

    width: number;
    height: number;
}

export type EdgeDTO = {
    id: string;
    type: string;

    source: string;
    target: string;
    sourceHandle: string;
    targetHandle: string;

    data: {
        throughput: number;
        movablePoints?: {
            id: string;
            x: number;
            y: number;
        }[]
    }

    selected: boolean;
}

export type ChartDataDTO = {
    nodes: NodeDTO[];
    edges: EdgeDTO[];
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
    public: boolean,
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
    parentDirectoryId: string,
    public: boolean,
}

// Info for a directory that was shared with you (includes info about the owner)
export type SharedDirectoryDTO = {
    id: string;
    name: string;
    parentDirectoryId: string;
    public: boolean;
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

export type TotalCountsDTO = {
    totalProjects: number;
    totalDirectories: number;
}