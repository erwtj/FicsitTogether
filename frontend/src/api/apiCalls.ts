import type {Auth0ContextType} from "../auth/auth0.tsx";
import api from "../api/axiosInstance.ts";
import type {SharedDirectoryDTO, DirectoryContentDTO, DirectoryDTO, MinimalUserInfoDTO} from "dtolib"

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
export async function fetchSharedDirectories(auth: Auth0ContextType): Promise<SharedDirectoryDTO[]> {
    const token = await auth.getAccessTokenSilently();

    const response = await api.get("directories/shared", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response?.data as SharedDirectoryDTO[]
}
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

export async function shareDirectory(auth: Auth0ContextType, dirID: string, username: string): Promise<boolean> {
    const token = await auth.getAccessTokenSilently();

    const response = await api.post(`directories/${dirID}/share`, {
        user: username
    }, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return response?.status === 200;
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