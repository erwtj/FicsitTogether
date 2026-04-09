import {useEffect, useState } from "react";
import {
    createDirectory,
    createProject,
    deleteDirectory, deleteProject,
    downloadProject, fetchTotalCounts, updateDirectoryPublic, updateProjectPublic,
    uploadProject, renameDirectory
} from "../../api/apiCalls.ts";
import type {Auth0ContextType} from "../../auth/auth0.tsx";
import {DirectoryCard, type DirectoryInfo} from "./DirectoryCard.tsx";
import {ProjectCard, type ProjectInfo} from "./ProjectCard.tsx";
import BuyMeCoffeeWidget from "../BuyMeCoffeeButton.tsx";
import DirectoryTree from "./DirectoryTree.tsx";
import {Arrow90degUp, Folder, Globe, PencilFill } from "react-bootstrap-icons";
import { Link } from "@tanstack/react-router";
import {AddDirectoryCard} from "./AddDirectoryCard.tsx";
import { MAX_DIRECTORIES_PER_DIRECTORY, MAX_DIRECTORY_DEPTH, MAX_PROJECTS_PER_DIRECTORY, type DirectoryContentDTO,
    type DirectoryDTO, type FullUserInfoDTO,
    type ProjectDTO,
    type TotalCountsDTO} from "dtolib";
import {AddProjectCard} from "./AddProjectCard.tsx";
import { Toast } from "react-bootstrap";
import ConfirmationModal from "../modals/ConfirmationModal.tsx";
import ShareModal from "../modals/ShareModal.tsx";
import PublicModal from "../modals/PublicModal.tsx";
import RenameModal from "../modals/RenameModal.tsx";

type DirectoryExplorerProps = {
    isPublic: boolean;
    auth?: Auth0ContextType;
    
    user?: FullUserInfoDTO;
    totalCounts?: TotalCountsDTO;
    
    directory: DirectoryContentDTO;
}

export const DirectoryExplorer = ({ isPublic, user, totalCounts, auth, directory }: DirectoryExplorerProps) => {
    const [totalProjectCount, setTotalProjectCount] = useState(totalCounts?.totalProjects);
    const [totalDirectoryCount, setTotalDirectoryCount] = useState(totalCounts?.totalDirectories);

    const [subDirectories, setSubDirectories] = useState<DirectoryDTO[]>(directory.subDirectories);
    const [projects, setProjects] = useState<ProjectDTO[]>(directory.projects);
    const [currentDirectoryName, setCurrentDirectoryName] = useState(directory.name);
    
    const [selectedDirectory, setSelectedDirectory] = useState<DirectoryInfo | null>(null);
    const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showPublicModal, setShowPublicModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [renamingCurrentDirectory, setRenamingCurrentDirectory] = useState(false);

    const [apiError, setApiError] = useState<string | null>(null);
    
    useEffect(() => {
        setSubDirectories(directory.subDirectories);
        setProjects(directory.projects);
        setCurrentDirectoryName(directory.name);
    }, [directory]);

    useEffect(() => {
        setTotalProjectCount(totalCounts?.totalProjects);
        setTotalDirectoryCount(totalCounts?.totalDirectories);
    }, [totalCounts]);
    
    const refetchCounts = () => {
        if (!auth) return;
        
        fetchTotalCounts(auth, directory.id)
        .then(updatedCounts => {
            setTotalProjectCount(updatedCounts.totalProjects);
            setTotalDirectoryCount(updatedCounts.totalDirectories);
        })
        .catch(err => {
            console.error('Error fetching user data:', err);
        });
    }
    
    // Create Directory and Project flow
    const handleCreateDirectory = (name: string) => {
        if (!auth) return; 
        createDirectory(auth, directory.id, name)
        .then(newDir => {
            if (!isPublic) setTotalDirectoryCount(d => d! + 1);
            setSubDirectories(prev => [...prev, newDir]);
        })
        .catch(err => {
            if (err.response?.status === 400) {
                setApiError(err.response.data?.message || 'Invalid input. Please check your directory name and try again.');
            } else {
                setApiError('An error occurred while creating the directory. Please try again.');
            }
            console.error('Error creating directory:', err)
        });
    };
    const handleCreateProject = (name: string) => {
        if (!auth) return; 
        createProject(auth, directory.id, name)
        .then(newProject => {
            if (!isPublic) setTotalProjectCount(d => d! + 1);
            setProjects(prev => [...prev, newProject]);
        })
        .catch(err => {
            if (err.response?.status === 400) {
                setApiError(err.response.data?.message || 'Invalid input. Please check your project name and try again.');
            } else {
                setApiError('An error occurred while creating the project. Please try again.');
            }
            console.error('Error creating project:', err)
        });
    }
    const handleUploadProject = (file: File) => {
        if (!auth) return;
        uploadProject(auth, directory.id, file)
        .then(newProject => {
            if (!isPublic) setTotalProjectCount(d => d! + 1);
            setProjects(prev => [...prev, newProject]);
        })
        .catch((err) => {
            if (err.response?.status === 400) {
                setApiError(err.response.data?.message || 'Invalid file format. Please upload a valid project JSON file.');
            } else {
                setApiError('An error occurred while uploading the project. Please try again.');
            }
            console.error('Error uploading project:', err)
        });
    }

    // Delete Directory and Project flow
    const handleDeleteDirectory = (directory: DirectoryInfo) => {
        setSelectedProject(null)
        setSelectedDirectory(directory);
        setShowDeleteModal(true);
    }
    const handleDeleteProject = (projectInfo: ProjectInfo) => {
        setSelectedDirectory(null)
        setSelectedProject(projectInfo);
        setShowDeleteModal(true);
    }
    const handleDownloadProject = async (projectInfo: ProjectInfo) => {
        if (!auth) return;
        downloadProject(auth, projectInfo.id).catch((err) => {
            if (err.response?.status === 400) {
                setApiError(err.response.data?.message || 'Cannot download this project. Please try again.');
            } else {
                setApiError('An error occurred while downloading the project. Please try again.');
            }
            console.error('Error downloading project:', err)
        }).then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${projectInfo.name}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
    const handleDeleteConfirm = (shouldDelete: boolean) => {
        setShowDeleteModal(false);
        if (shouldDelete && selectedDirectory && auth) {
            deleteDirectory(auth, selectedDirectory.id)
            .then(success => {
                if (success) {
                    if (!isPublic) refetchCounts();
                    setSubDirectories(prev => prev.filter(dir => dir.id !== selectedDirectory.id));
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
        else if (shouldDelete && selectedProject && auth) {
            deleteProject(auth, selectedProject.id)
            .then(success => {
                if (success) {
                    if(!isPublic) setTotalProjectCount(d => d! - 1);
                    setProjects(prev => prev.filter(proj => proj.id !== selectedProject.id));
                } else {
                    console.error('Failed to delete project');
                }
            })
            .catch(err => {
                if (err.response?.status === 400) {
                    setApiError(err.response.data?.message || 'Cannot delete this project. Please try again.');
                } else {
                    setApiError('An error occurred while deleting the project. Please try again.');
                }
                console.error('Error deleting project:', err)
            });
        }
        setSelectedDirectory(null);
        setSelectedProject(null);
    }

    const handleShareDirectory = (directory: DirectoryInfo) => {
        setSelectedDirectory(directory);
        setShowShareModal(true);
    }

    const handlePublicClose = () => {
        setShowPublicModal(false);
        setSelectedDirectory(null);
        setSelectedProject(null);
    }
    
    const handlePublicUpdate = (isPublic: boolean) => {
        if (!auth) return; 
        if (selectedDirectory) {
            updateDirectoryPublic(auth, selectedDirectory.id, isPublic)
            .then(() => {
                selectedDirectory.public = isPublic;
                setSubDirectories(prev => prev.map(dir => dir.id === selectedDirectory.id ? { ...dir, public: isPublic } : dir));
            })
            .catch(err => {
                setApiError('An error occurred while updating the directory. Please try again.');
                console.error('Error updating directory:', err)
            });
        } else if (selectedProject) {
            updateProjectPublic(auth, selectedProject.id, isPublic)
            .then(() => {
                selectedProject.public = isPublic;
                setProjects(prev => prev.map(proj => proj.id === selectedProject.id ? { ...proj, public: isPublic } : proj));
            })
            .catch(err => {
                setApiError('An error occurred while updating the project. Please try again.');
                console.error('Error updating project:', err)
            });
        }
    }
    const handleChangeDirectoryPublic = (directory: DirectoryInfo) => {
        setSelectedDirectory(directory);
        setSelectedProject(null);
        setShowPublicModal(true);
    }

    const handleChangeProjectPublic = (project: ProjectInfo) => {
        setSelectedProject(project);
        setSelectedDirectory(null);
        setShowPublicModal(true);
    }

    const handleRenameDirectory = (directory: DirectoryInfo) => {
        setSelectedDirectory(directory);
        setRenamingCurrentDirectory(false);
        setShowRenameModal(true);
    }

    const handleRenameCurrentDirectory = () => {
        setSelectedDirectory(null);
        setRenamingCurrentDirectory(true);
        setShowRenameModal(true);
    }

    const handleRenameConfirm = (newName: string) => {
        if (!auth) return;
        const dirId = renamingCurrentDirectory ? directory.id : selectedDirectory?.id;
        if (!dirId) return;

        setShowRenameModal(false);
        renameDirectory(auth, dirId, newName)
        .then(() => {
            if (renamingCurrentDirectory) {
                setCurrentDirectoryName(newName);
            } else if (selectedDirectory) {
                setSubDirectories(prev => prev.map(dir => dir.id === selectedDirectory.id ? { ...dir, name: newName } : dir));
            }
        })
        .catch(err => {
            if (err.response?.status === 400) {
                setApiError(err.response.data?.message || 'Invalid name. Please try again.');
            } else {
                setApiError('An error occurred while renaming the directory. Please try again.');
            }
            console.error('Error renaming directory:', err);
        })
        .finally(() => {
            setSelectedDirectory(null);
            setRenamingCurrentDirectory(false);
        });
    }

    const handleRenameCancel = () => {
        setShowRenameModal(false);
        setSelectedDirectory(null);
        setRenamingCurrentDirectory(false);
    }

    return (
        <>
            <BuyMeCoffeeWidget />
            <DirectoryTree dirTree={directory.directoryTree.map((item, index, arr) => index === arr.length - 1 ? { ...item, name: currentDirectoryName } : item)} to={isPublic ? "view/directories" : "directories"}/>
            <div className="mt-4 align-items-center px-2 px-md-4" style={{display: 'grid', gridTemplateColumns: '1fr auto 1fr'}}>
                <div className="d-flex justify-content-start">
                    <Link 
                        to={directory.id === directory.directoryTree[0].id ? '/home' : '/directories/$dir'} 
                        params={{dir: directory.parentDirectoryId}} 
                        className="d-sm-none text-muted"
                    >
                        <Arrow90degUp size={20}/>
                    </Link>
                </div>
                <div className="position-relative d-flex flex-row flex-nowrap gap-2 mx-4 gap-md-3 align-items-center justify-content-center" style={{ minWidth: 0 }}>
                    <Folder size={32} className="flex-shrink-0"/>
                    {!isPublic && directory.public && <Globe size={20} className={`public-globe position-absolute default-purple flex-shrink-0`} style={{
                        borderRadius: "50%",
                        left: "1.2rem",
                        top: "1rem",
                        padding: "2px",
                        zIndex: 1,
                    }}/>}
                    <h3 className="mb-0 no-drag text-truncate" style={{ maxWidth: "100%", minWidth: 0 }} title={currentDirectoryName}>{currentDirectoryName}</h3>
                    {!isPublic && user?.id === directory.owner && directory.parentDirectoryId !== directory.id && (
                        <button
                            className="bg-transparent border-0 p-0 text-body-secondary flex-shrink-0"
                            onClick={handleRenameCurrentDirectory}
                            title="Rename directory"
                        >
                            <PencilFill size={14}/>
                        </button>
                    )}
                </div>
                {!isPublic && <div className="d-none d-sm-flex justify-content-end align-items-center">
                    <Link to={"/overview/$dir"} params={{ dir: directory.id }} className="text-nowrap text-body-secondary clickable-link">
                        <span className="ms-2">Go to overview</span>
                    </Link>
                </div>}
            </div>
            <div key={"explorer"} className="d-flex flex-column p-5 gap-3 mx-lg-5 pt-4">
                <div key={"directory-list"} className={"d-flex flex-wrap gap-3 justify-content-center"}
                     style={{width: "100%"}}>

                    {subDirectories.map((directory) => {
                        return (
                            <DirectoryCard
                                to={isPublic ? "view/directories" : "directories"}
                                directoryInfo={{...directory, isShared: false}}
                                key={directory.id}
                                changePublic={!isPublic ? handleChangeDirectoryPublic : undefined}
                                deleteDirectory={!isPublic ? handleDeleteDirectory : undefined}
                                shareDirectory={(!isPublic && user && directory.owner === user.id) ? handleShareDirectory : undefined}
                                renameDirectory={(!isPublic && user && directory.owner === user.id) ? handleRenameDirectory : undefined}
                            />
                        )
                    })}
                    {!isPublic && directory.directoryTree.length <= MAX_DIRECTORY_DEPTH &&
                        subDirectories.length < MAX_DIRECTORIES_PER_DIRECTORY &&
                        <AddDirectoryCard directoryCount={totalDirectoryCount!} onSubmit={handleCreateDirectory}/>}
                </div>
                <div key={"project-list"} className={"d-flex flex-wrap gap-3 mt-3 justify-content-center"}
                     style={{width: "100%"}}>

                    {projects.map((project) => {
                        return (
                            <ProjectCard to={isPublic ? "view/projects" : "edit"} project={project}
                                         changePublic={!isPublic ? handleChangeProjectPublic : undefined}
                                         deleteProject={!isPublic ? handleDeleteProject : undefined} 
                                         downloadProject={!isPublic ? handleDownloadProject: undefined} key={project.id}/>
                        )
                    })}
                    {!isPublic && projects.length < MAX_PROJECTS_PER_DIRECTORY &&
                        <AddProjectCard projectCount={totalProjectCount!} onSubmit={handleCreateProject} onUpload={handleUploadProject}/>}
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
                title={`Delete "${selectedDirectory ? selectedDirectory.name : selectedProject?.name}"?`}
                message={`Are you sure you want to delete this ${selectedDirectory ? "folder" : "project"}?`}
                onConfirm={() => handleDeleteConfirm(true)}
                onCancel={() => handleDeleteConfirm(false)}
            />
            <ShareModal
                show={showShareModal}
                directoryId={selectedDirectory?.id || ""}
                directoryName={selectedDirectory?.name || ""}
                onClose={() => setShowShareModal(false)}
            />
            <PublicModal 
                show={showPublicModal} 
                itemName={selectedDirectory?.name ?? selectedProject?.name ?? ""}
                itemId={selectedDirectory?.id ?? selectedProject?.id ?? ""}
                type={selectedDirectory ? "directory" : "project"}
                isPublic={selectedDirectory?.public ?? selectedProject?.public ?? false}
                onClose={handlePublicClose} 
                updateStatus={handlePublicUpdate}
            />
            <RenameModal
                show={showRenameModal}
                currentName={renamingCurrentDirectory ? currentDirectoryName : (selectedDirectory?.name ?? "")}
                onConfirm={handleRenameConfirm}
                onCancel={handleRenameCancel}
            />
        </>
    );
}