import { createFileRoute, redirect } from '@tanstack/react-router'
import {DirectoryCard, type DirectoryInfo} from "../components/explorer/DirectoryCard.tsx";
import { Folder, People } from "react-bootstrap-icons";
import {AddDirectoryCard} from "../components/explorer/AddDirectoryCard.tsx";
import {useEffect, useState} from "react";
import {useAuth0Context} from "../auth/useAuth0Context.ts";
import {
    fetchRoot,
    fetchSharedDirectories,
    createDirectory,
    deleteDirectory,
    leaveDirectory, updateDirectoryPublic, fetchTotalCountsRoot
} from "../api/apiCalls.ts";
import ConfirmationModal from "../components/modals/ConfirmationModal.tsx";
import ShareModal from "../components/modals/ShareModal.tsx";
import "./home.tsx.css";
import BuyMeCoffeeWidget from "../components/BuyMeCoffeeButton.tsx";
import { Toast } from "react-bootstrap";
import { MAX_DIRECTORIES_PER_DIRECTORY } from "dtolib";
import PublicModal from "../components/modals/PublicModal.tsx";

export const Route = createFileRoute('/home')({
    component: HomePage,
    staticData: {
        title: "Ficsit Together | Home",
        showNav: true,
        requireAuth: true
    },
    loader: async ({context}) => {
        const {auth} = context;
        if (!auth) {
            throw redirect({to: '/login', replace: true});
        }

        const [root, sharedRaw, totalCounts] = await Promise.all([
            fetchRoot(auth),
            fetchSharedDirectories(auth),
            fetchTotalCountsRoot(auth)
        ])
        
        const owned = root.subDirectories.map(dir => ({
            id: dir.id,
            name: dir.name,
            public: dir.public,
            isShared: false,
        } as DirectoryInfo));

        const shared = sharedRaw.map(dir => ({
            id: dir.id,
            name: dir.name,
            isShared: true,
            public: dir.public,
            sharedBy: dir.ownerUsername
        } as DirectoryInfo));

        return { root, owned, shared, totalCounts };
    }, staleTime: 0
})

function HomePage() {
    const auth = useAuth0Context()

    const { root, owned, shared, totalCounts } = Route.useLoaderData();
    const [ownedDirectories, setOwnedDirectories] = useState<DirectoryInfo[]>(owned);
    const [sharedDirectories, setSharedDirectories] = useState<DirectoryInfo[]>(shared);

    useEffect(() => {
        setOwnedDirectories(owned);
        setSharedDirectories(shared);
    }, [owned, shared]);

    const [totalDirectoryCount, setTotalDirectoryCount] = useState(totalCounts.totalDirectories);
    useEffect(() => {
        setTotalDirectoryCount(totalCounts.totalDirectories);
    }, [totalCounts]);

    const refetchCounts = () => {
        fetchTotalCountsRoot(auth)
            .then(updatedCounts => {
                setTotalDirectoryCount(updatedCounts.totalDirectories);
            })
            .catch(err => {
                console.error('Error fetching user data:', err);
            });
    }

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showPublicModal, setShowPublicModal] = useState(false);
    
    const [selectedDirectory, setSelectedDirectory] = useState<DirectoryInfo | null>(null);
    
    const [apiError, setApiError] = useState<string | null>(null);

    const handleCreateDirectory = (name: string) => {
        createDirectory(auth, root.id, name)
        .then(newDir => {
            setTotalDirectoryCount(d => d + 1);
            setOwnedDirectories(prev => [...prev, {
                id: newDir.id,
                name: newDir.name,
                public: newDir.public,
                isShared: false,
            }]);
        }
        )
        .catch(err => {
            if (err.response?.status === 400) {
                setApiError(err.response.data?.message || 'Cannot create this directory. Please try again.');
            } else {
                setApiError('An error occurred while creating the directory. Please try again.');
            }
        });
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
                    refetchCounts();
                    setOwnedDirectories(prev => prev.filter(dir => dir.id !== selectedDirectory.id));
                } else {
                    console.error('Failed to delete directory');
                }
            })
            .catch(err => {
                if (err.response?.status === 400) {
                    setApiError(err.response.data?.message || 'Cannot delete this directory. Please try again.');
                } else {
                    setApiError('An error occurred while deleting the directory. Please try again.');
                }
                console.error('Error deleting directory:', err)
            });
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
            .catch(err => {
                if (err.response?.status === 400) {
                    setApiError(err.response.data?.message || 'Cannot leave this directory. Please try again.');
                } else {
                    setApiError('An error occurred while leaving the directory. Please try again.');
                }
                console.error('Error leaving directory:', err)
            });
        }
        setSelectedDirectory(null);
    }

    // Share directory flow
    const handleShareDirectory = (directory: DirectoryInfo) => {
        setSelectedDirectory(directory);
        setShowShareModal(true);
    }
    
    const [updatePublicDirectoryType, setUpdatePublicDirectoryType] = useState<'owned' | 'shared'>('owned');
    const handlePublicUpdate = (isPublic: boolean) => {
        if (selectedDirectory) {
            updateDirectoryPublic(auth, selectedDirectory.id, isPublic)
            .then(() => {
                selectedDirectory.public = isPublic;
                if (updatePublicDirectoryType === 'owned') 
                    setOwnedDirectories(prev => prev.map(dir => dir.id === selectedDirectory.id ? { ...dir, public: isPublic } : dir));
                else
                    setSharedDirectories(prev => prev.map(dir => dir.id === selectedDirectory.id ? { ...dir, public: isPublic } : dir));
            })
            .catch(err => {
                setApiError('An error occurred while updating the directory. Please try again.');
                console.error('Error updating directory:', err)
            });
        }
    }

    const handlePublicClose = () => {
        setShowPublicModal(false);
        setSelectedDirectory(null);
    }
    
    const handleChangePublic = (directory: DirectoryInfo, type: 'owned'|'shared') => {
        setSelectedDirectory(directory);
        setShowPublicModal(true);
        setUpdatePublicDirectoryType(type);
    }

    return (
        <div className="container flex-grow-1 mw-100">
            <BuyMeCoffeeWidget />
            <div className="row gap-4 gap-lg-0 flex-grow-1 h-100">
                <div className="col-12 col-lg-6 p-4" id="split-view-left">
                    {/* Owned directories */}
                    <h4 className="d-flex align-items-center gap-2 justify-content-center mb-3">
                        <Folder/> My Directories
                    </h4>
                    <div className="d-flex flex-wrap gap-3 justify-content-center">
                        {ownedDirectories.map(dirInfo => (
                            <DirectoryCard to="directories"
                                key={dirInfo.id}
                                directoryInfo={dirInfo}
                                deleteDirectory={handleDeleteDirectory}
                                shareDirectory={handleShareDirectory}
                                changePublic={(dir) => handleChangePublic(dir, 'owned')}
                            />
                        ))}
                        {ownedDirectories.length < MAX_DIRECTORIES_PER_DIRECTORY &&
                            <AddDirectoryCard directoryCount={totalDirectoryCount} onSubmit={(s) => handleCreateDirectory(s)}/>
                        }
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
                                <DirectoryCard to="directories" key={dirInfo.id} directoryInfo={dirInfo}
                                               changePublic={(dir) => handleChangePublic(dir, 'shared')}
                                               leaveDirectory={(dir) => handleLeaveDirectory(dir)}/>
                            ))
                            :
                            <p className="text-muted fs-5">No one shared a directory with you :(</p>
                        }
                    </div>
                </div>
            </div>

            <Toast show={apiError !== null} onClose={() => setApiError(null)} className="position-fixed top-0 end-0 m-3" delay={5000} autohide>
                <Toast.Header>
                    <strong className="me-auto text-danger">An error occurred</strong>
                </Toast.Header>
                <Toast.Body>{apiError}</Toast.Body>
            </Toast>

            <ConfirmationModal
                show={showDeleteModal}
                title={`Delete "${selectedDirectory?.name}"?`}
                message={"Are you sure you want to delete this folder?"}
                onConfirm={() => handleDeleteConfirm(true)}
                onCancel={() => handleDeleteConfirm(false)}
            />
            <ConfirmationModal
                show={showLeaveModal}
                title={`Leave "${selectedDirectory?.name}" `}
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
            <PublicModal
                show={showPublicModal}
                itemName={selectedDirectory?.name || ""}
                itemId={selectedDirectory?.id || ""}
                type={"directory"}
                isPublic={selectedDirectory?.public ?? false}
                onClose={handlePublicClose}
                updateStatus={handlePublicUpdate}
            />
        </div>
    );
}




