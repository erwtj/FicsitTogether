import {useEffect, useState } from "react";
import {
    createDirectory,
    createProject,
    deleteDirectory, deleteProject,
    downloadProject, fetchUser, updateDirectoryPublic, updateProjectPublic,
    uploadProject
} from "../../api/apiCalls.ts";
import type {Auth0ContextType} from "../../auth/auth0.tsx";
import {DirectoryCard, type DirectoryInfo} from "./DirectoryCard.tsx";
import {ProjectCard, type ProjectInfo} from "./ProjectCard.tsx";
import BuyMeCoffeeWidget from "../BuyMeCoffeeButton.tsx";
import DirectoryTree from "./DirectoryTree.tsx";
import { Folder, Globe } from "react-bootstrap-icons";
import { Link } from "@tanstack/react-router";
import {AddDirectoryCard} from "./AddDirectoryCard.tsx";
import { MAX_DIRECTORIES_PER_DIRECTORY, MAX_DIRECTORY_DEPTH, MAX_PROJECTS_PER_DIRECTORY, type DirectoryContentDTO,
    type DirectoryDTO, type FullUserInfoDTO,
    type ProjectDTO} from "dtolib";
import {AddProjectCard} from "./AddProjectCard.tsx";
import { Toast } from "react-bootstrap";
import ConfirmationModal from "../modals/ConfirmationModal.tsx";
import ShareModal from "../modals/ShareModal.tsx";
import PublicModal from "../modals/PublicModal.tsx";

type DirectoryExplorerProps = {
    isPublic: boolean;
    auth?: Auth0ContextType;
    
    user?: FullUserInfoDTO;
    
    directory: DirectoryContentDTO;
}

export const DirectoryExplorer = ({ isPublic, user, auth, directory }: DirectoryExplorerProps) => {
    const [totalProjectCount, setTotalProjectCount] = useState(user?.total_project_count);
    const [totalDirectoryCount, setTotalDirectoryCount] = useState(user?.total_directory_count);

    const [subDirectories, setSubDirectories] = useState<DirectoryDTO[]>(directory.subDirectories);
    const [projects, setProjects] = useState<ProjectDTO[]>(directory.projects);
    
    const [selectedDirectory, setSelectedDirectory] = useState<DirectoryInfo | null>(null);
    const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showPublicModal, setShowPublicModal] = useState(false);

    const [apiError, setApiError] = useState<string | null>(null);
    
    useEffect(() => {
        setSubDirectories(directory.subDirectories);
        setProjects(directory.projects);
    }, [directory]);

    useEffect(() => {
        setTotalProjectCount(user?.total_project_count);
        setTotalDirectoryCount(user?.total_directory_count);
    }, [user]);
    
    const refetchCounts = () => {
        if (!auth) return;
        
        fetchUser(auth)
        .then(updatedUser => {
            setTotalProjectCount(updatedUser.total_project_count);
            setTotalDirectoryCount(updatedUser.total_directory_count);
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

    return (
        <>
            <BuyMeCoffeeWidget />
            <DirectoryTree dirTree={directory.directoryTree} to={isPublic ? "view/directories" : "directories"}/>
            <div className="mt-4 align-items-center px-4" style={{display: 'grid', gridTemplateColumns: '1fr auto 1fr'}}>
                <span/>
                <div className="position-relative d-flex flex-row flex-nowrap gap-3 align-items-center justify-content-center">
                    <Folder size={32}/>
                    {!isPublic && directory.public && <Globe size={20} className={`public-globe position-absolute default-purple`} style={{
                        borderRadius: "50%",
                        left: "1.2rem",
                        top: "1rem",
                        padding: "2px",
                        zIndex: 1,
                    }}/>}
                    <h3 className="mb-0 no-drag">{directory.name}</h3>
                </div>
                {!isPublic && <div className="d-flex justify-content-end align-items-center">
                    <Link to={"/overview/$dir"} params={{ dir: directory.id }} className="text-body-secondary clickable-link">
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
        </>
    );
}