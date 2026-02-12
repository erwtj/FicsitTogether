import { createFileRoute, redirect } from '@tanstack/react-router'
import {DirectoryCard, type DirectoryInfo} from "../components/explorer/DirectoryCard.tsx";
import { Folder, People } from "react-bootstrap-icons";
import {DirectoryAddFolderCard} from "../components/explorer/DirectoryAddFolderCard.tsx";
import {useState, useEffect} from "react";
import {useAuth0Context} from "../auth/useAuth0Context.ts";
import {
    fetchRoot,
    fetchSharedDirectories,
    createDirectory,
    deleteDirectory,
    leaveDirectory
} from "../api/apiCalls.ts";
import ConfirmationModal from "../components/modals/ConfirmationModal.tsx";
import ShareModal from "../components/modals/ShareModal.tsx";
import "./home.tsx.css";

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


// TODO - handle empty folder names
function HomePage() {
    const auth = useAuth0Context()
    const [rootId, setRootId] = useState<string>("");
    const [ownedDirectories, setOwnedDirectories] = useState<DirectoryInfo[]>([]);
    const [sharedDirectories, setSharedDirectories] = useState<DirectoryInfo[]>([]);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    
    const [selectedDirectory, setSelectedDirectory] = useState<DirectoryInfo | null>(null);

    // Fetch both owned and shared directories on component mount
    useEffect(() => {
        const ownedDir = fetchRoot(auth).then(DTO => {
            setRootId(DTO.id);
            return DTO.subDirectories.map(dir => ({
                id: dir.id,
                name: dir.name,
                isShared: false,
            } as DirectoryInfo));
        });

        const sharedDir = fetchSharedDirectories(auth).then(dirs => dirs.map(dir => ({
            id: dir.id,
            name: dir.name,
            isShared: true,
            sharedBy: dir.ownerUsername
        } as DirectoryInfo)));

        ownedDir.then(owned => setOwnedDirectories(owned))
        sharedDir.then(shared => setSharedDirectories(shared))
    }, [auth]);
    const handleCreateDirectory = (name: string) => {
        createDirectory(auth, rootId, name)
        .then(newDir => {
            setOwnedDirectories(prev => [...prev, {
                id: newDir.id,
                name: newDir.name,
                isShared: false,
            }]);
        }
        )
        .catch(err => console.error('Error creating directory:', err));
    };

    // Delete directory flow
    const handleDeleteDirectory = (directory: DirectoryInfo) => {
        setSelectedDirectory(directory);
        setShowDeleteModal(true);
    }
    const handleDeleteConfirm = (shouldDelete: boolean) => {
        setShowDeleteModal(false);
        if (shouldDelete && selectedDirectory) {
            deleteDirectory(auth, selectedDirectory.id)
            .then(success => {
                if (success) {
                    setOwnedDirectories(prev => prev.filter(dir => dir.id !== selectedDirectory.id));
                } else {
                    console.error('Failed to delete directory');
                }
            })
            .catch(err => console.error('Error deleting directory:', err));
        }
        setSelectedDirectory(null);
    }

    // Leave directory flow
    const handleLeaveDirectory = (directory: DirectoryInfo) => {
        setSelectedDirectory(directory);
        setShowLeaveModal(true);
    }
    const handleLeaveConfirm = (shouldLeave: boolean) => {
        setShowLeaveModal(false);
        if (shouldLeave && selectedDirectory) {
            leaveDirectory(auth, selectedDirectory.id)
            .then(success => {
                if (success) {
                    setSharedDirectories(prev => prev.filter(dir => dir.id !== selectedDirectory.id));
                } else {
                    console.error('Failed to leave directory');
                }
            })
            .catch(err => console.error('Error leaving directory:', err));
        }
        setSelectedDirectory(null);
    }

    // Share directory flow
    const handleShareDirectory = (directory: DirectoryInfo) => {
        setSelectedDirectory(directory);
        setShowShareModal(true);
    }

    return (
        <div className="container h-100 mw-100">
            <div className="row gap-4 gap-lg-0 h-100">
                <div className="col-12 col-lg-6 p-4" id="split-view-left">
                    {/* Owned directories */}
                    <h4 className="d-flex align-items-center gap-2 justify-content-center mb-3">
                        <Folder/> My Directories
                    </h4>
                    <div className="d-flex flex-wrap gap-3 justify-content-center">
                        {ownedDirectories.map(dirInfo => (
                            <DirectoryCard
                                key={dirInfo.id}
                                directoryInfo={dirInfo}
                                deleteDirectory={(dir) => handleDeleteDirectory(dir)}
                                shareDirectory={(dir) => handleShareDirectory(dir)}
                            />
                        ))}
                        <DirectoryAddFolderCard onSubmit={(s) => handleCreateDirectory(s)}/>
                    </div>
                </div>

                <div className="col-12 col-lg-6 p-4" id="split-view-right">
                    {/* Shared directories */}
                    <h4 className="d-flex align-items-center gap-2 justify-content-center mb-3">
                        <People/> Shared With Me
                    </h4>
                    <div className="d-flex flex-wrap gap-3 justify-content-center">
                        {sharedDirectories.length > 0 ?
                            sharedDirectories.map(dirInfo => (
                                <DirectoryCard key={dirInfo.id} directoryInfo={dirInfo}
                                               leaveDirectory={(dir) => handleLeaveDirectory(dir)}/>
                            ))
                            :
                            <p className="text-muted fs-5">No one shared a directory with you :(</p>
                        }
                    </div>
                </div>
            </div>

            <ConfirmationModal
                show={showDeleteModal}
                title={`Delete '${selectedDirectory?.name}'?`}
                message={"Are you sure you want to delete this folder?"}
                onConfirm={() => handleDeleteConfirm(true)}
                onCancel={() => handleDeleteConfirm(false)}
            />
            <ConfirmationModal
                show={showLeaveModal}
                title={`Leave '${selectedDirectory?.name}' `}
                message={"Are you sure you want to leave this folder?"}
                onConfirm={() => handleLeaveConfirm(true)}
                onCancel={() => handleLeaveConfirm(false)}
            />
            <ShareModal
                show={showShareModal}
                directoryId={selectedDirectory?.id || ""}
                directoryName={selectedDirectory?.name || ""}
                onClose={() => setShowShareModal(false)}
            />
        </div>
    );
}




