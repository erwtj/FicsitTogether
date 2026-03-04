import type {Auth0ContextType} from "../auth/auth0.tsx";
import api from "../api/axiosInstance.ts";
import {type DirectoryDTO, type FullUserInfoDTO, type SharedDirectoryDTO, type DirectoryContentDTO, type MinimalUserInfoDTO, type ProjectDTO, type ChartDataDTO} from "dtolib"


// API calls
export async function fetchRoot(auth: Auth0ContextType): Promise<DirectoryContentDTO> {
    const token = await auth.getAccessTokenSilently();

    const response = await api.get("directories/root", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return response?.data as DirectoryContentDTO
}
export async function fetchDirectoryContent(auth: Auth0ContextType, dirID: string): Promise<DirectoryContentDTO> {
    const token = await auth.getAccessTokenSilently();

    const response = await api.get(`directories/${dirID}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    
    return response?.data as DirectoryContentDTO;
}
export async function fetchSharedDirectories(auth: Auth0ContextType): Promise<SharedDirectoryDTO[]> {
    const token = await auth.getAccessTokenSilently();

    const response = await api.get("directories/shared", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response?.data as SharedDirectoryDTO[]
}

export async function fetchAllProjectsInDirectory(auth: Auth0ContextType, dirID: string): Promise<ChartDataDTO[]> {
    const token = await auth.getAccessTokenSilently();

    const response = await api.get(`directories/${dirID}/charts`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response?.data as ChartDataDTO[]
}

// Directory management
export async function createDirectory(auth: Auth0ContextType, parentID: string, name: string): Promise<DirectoryDTO> {
    const token = await auth.getAccessTokenSilently();

    const response = await api.post(`directories/`, {
        name: name,
        directoryId: parentID
    }, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return response?.data as DirectoryDTO;
}
export async function deleteDirectory(auth: Auth0ContextType, dirID: string): Promise<boolean> {
    const token = await auth.getAccessTokenSilently();

    const response = await api.delete(`directories/${dirID}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return response?.status === 200;
}
export async function fetchSharedWith(auth: Auth0ContextType, dirID: string): Promise<MinimalUserInfoDTO[]> {
    const token = await auth.getAccessTokenSilently();

    const response = await api.get(`directories/${dirID}/share`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response?.data as MinimalUserInfoDTO[]
}

// Project management
export async function createProject(auth: Auth0ContextType, parentFolderID: string, name: string): Promise<ProjectDTO> {
    const token = await auth.getAccessTokenSilently();

    const response = await api.post(`projects/`, {
        name: name,
        description: 'A new project',
        directoryId: parentFolderID,
    }, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return response?.data as ProjectDTO;
}
export async function deleteProject(auth: Auth0ContextType, projID: string): Promise<boolean> {
    const token = await auth.getAccessTokenSilently();

    const response = await api.delete(`projects/${projID}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return response?.status === 200;
}


// Sharing and unsharing
export async function shareDirectory(auth: Auth0ContextType, dirID: string, username: string): Promise<boolean> {
    const token = await auth.getAccessTokenSilently();

    try {
        await api.post(`directories/${dirID}/share`, {
            user: username
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return true;
    } catch (err) {
        return Promise.reject(err);
    }
}

export async function unshareDirectory(auth: Auth0ContextType, dirID: string, userId: string): Promise<boolean> {
    const token = await auth.getAccessTokenSilently();

    const response = await api.delete(`directories/${dirID}/share`, {
        data: {
            userId: userId
        },
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return response?.status === 200;
}
export async function leaveDirectory(auth: Auth0ContextType, dirID: string): Promise<boolean> {
    const token = await auth.getAccessTokenSilently();

    const response = await api.get(`directories/${dirID}/leave`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return response?.status === 200;
}



export async function fetchUser(auth: Auth0ContextType): Promise<FullUserInfoDTO> {
    const token = await auth.getAccessTokenSilently();

    const response = await api.get(`users/me`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return response?.data as FullUserInfoDTO;
}