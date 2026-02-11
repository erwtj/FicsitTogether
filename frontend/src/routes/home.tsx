import { createFileRoute, redirect } from '@tanstack/react-router'
import {DirectoryCard, type DirectoryInfo} from "../components/explorer/DirectoryCard.tsx";
import { Folder, People } from "react-bootstrap-icons";
import {DirectoryAddFolderCard} from "../components/explorer/DirectoryAddFolderCard.tsx";
import {useState, useEffect} from "react";
import {useAuth0Context} from "../auth/useAuth0Context.ts";
import type {Auth0ContextType} from "../auth/auth0.tsx";
import api from "../api/axiosInstance.ts";
import {type Directory, type directoryDTO, type SharedDirectoryDTO} from "ficlib"

export const Route = createFileRoute('/home')({
    beforeLoad: ({context}) => {
        if (!context.auth?.isAuthenticated) {
            throw redirect({to: '/login', replace: true});
        }
    },
    component: HomePage,
    staticData: {
        title: "Ficsit Together | Home",
        showNav: true,
    }
})

async function fetchRoot(auth: Auth0ContextType): Promise<Directory[]> {
    const token = await auth.getAccessTokenSilently();
    console.log(token)

    const response = await api.get("directories/root", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const DTO: directoryDTO = response?.data as directoryDTO;
    return DTO.subDirectories
}

async function fetchSharedDirectories(auth: Auth0ContextType): Promise<SharedDirectoryDTO[]> {
    const token = await auth.getAccessTokenSilently();

    const response = await api.get("directories/share", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
    return response?.data as SharedDirectoryDTO[]
}

function HomePage() {
    const auth = useAuth0Context()
    const [ownedDirectories, setOwnedDirectories] = useState<DirectoryInfo[]>([]);
    const [sharedDirectories, setSharedDirectories] = useState<DirectoryInfo[]>([]);

    useEffect(() => {
        const ownedDir = fetchRoot(auth).then(dirs => dirs.map(dir => ({
            id: dir.id,
            name: dir.name,
            isShared: false,
        } as DirectoryInfo)));

        const sharedDir = fetchSharedDirectories(auth).then(dirs => dirs.map(dir => ({
            id: dir.id,
            name: dir.name,
            isShared: true,
            sharedBy: dir.ownerUsername
        } as DirectoryInfo)));

        Promise.all([ownedDir, sharedDir]).then(([owned, shared]) => {
            setOwnedDirectories(owned);
            setSharedDirectories(shared);
        });

    }, [auth]);


    return (
        <div className="d-flex flex-row h-100">
            <div className="w-50 p-3 border-end">
                {/* Owned directories */}
                <h4 className="d-flex align-items-center gap-2">
                    <Folder /> My Directories
                </h4>
                <div className="d-flex flex-wrap gap-3">
                    {ownedDirectories.map(dirInfo => (
                        <DirectoryCard key={dirInfo.id} directoryInfo={dirInfo} deleteDirectory={() => 0} shareDirectory={() => 0}  />
                    ))}
                    <DirectoryAddFolderCard onSubmit={(s) => console.log(s)}/>
                </div>
            </div>

            <div className="w-50 p-3">
                {/* Shared directories */}
                <h4 className="d-flex align-items-center gap-2">
                    <People /> Shared With Me
                </h4>
                <div className="d-flex flex-wrap gap-3">
                    {sharedDirectories.map(dirInfo => (
                        <DirectoryCard key={dirInfo.id} directoryInfo={dirInfo} deleteDirectory={() => 0} shareDirectory={() => 0}  />
                    ))}
                </div>
            </div>
        </div>
    );
}




