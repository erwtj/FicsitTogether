import {createFileRoute, Link, notFound} from '@tanstack/react-router'
import {redirect} from "@tanstack/react-router";
import {useAuth0Context} from "../auth/useAuth0Context.ts";
import {useEffect, useState} from "react";
import {
    createDirectory,
    createProject,
    deleteDirectory, deleteProject, downloadProject, uploadProject,
    fetchDirectoryContent,
    fetchUser,
} from "../api/apiCalls.ts";
import {MAX_DIRECTORIES_PER_DIRECTORY, MAX_DIRECTORY_DEPTH,
    MAX_PROJECTS_PER_DIRECTORY, type DirectoryDTO, type ProjectDTO} from "dtolib";
import {Folder} from 'react-bootstrap-icons';
import {DirectoryCard, type DirectoryInfo} from "../components/explorer/DirectoryCard.tsx";
import {AddDirectoryCard} from "../components/explorer/AddDirectoryCard.tsx";
import ShareModal from "../components/modals/ShareModal.tsx";
import ConfirmationModal from "../components/modals/ConfirmationModal.tsx";
import {ProjectCard, type ProjectInfo} from "../components/explorer/ProjectCard.tsx";
import {AddProjectCard} from "../components/explorer/AddProjectCard.tsx";
import DirectoryTree from "../components/explorer/DirectoryTree.tsx";
import BuyMeCoffeeWidget from "../components/BuyMeCoffeeButton.tsx";
import { Toast } from "react-bootstrap";

export const Route = createFileRoute('/directories/$dir')({
    component: DirectoryPage,
    staticData: {
        showNav: true,
        title: "Ficsit Together | Directories",
        requireAuth: true
    },
    loader: async ({context, params: {dir}}) => {
        const { auth } = context;
        if (!auth) throw redirect({ to: '/login', replace: true })

        const [user, directory] = await Promise.all([
            fetchUser(auth),
            fetchDirectoryContent(auth, dir).catch(err => {
                if (err.response?.status === 403 || err.response?.status === 404) {
                    throw notFound()
                }
                throw err
            }),
        ])

        if (directory.id === directory.parentDirectoryId) {
            throw redirect({ to: '/home', replace: true })
        }

        return { user, directory }
    },
    staleTime: 0
})

function DirectoryPage() {
    const { dir: dirId } = Route.useParams();
    return (
        <DirectoryPageContent key={dirId}/> // Force remount when directory changes to reset state
    );
}

function DirectoryPageContent() {
    const auth = useAuth0Context()
    const { dir: dirId } = Route.useParams();
    
    const { user, directory } = Route.useLoaderData();
    const [totalProjectCount, setTotalProjectCount] = useState(user.total_project_count);
    const [totalDirectoryCount, setTotalDirectoryCount] = useState(user.total_directory_count);

    const [subDirectories, setSubDirectories] = useState<DirectoryDTO[]>(directory.subDirectories);
    const [projects, setProjects] = useState<ProjectDTO[]>(directory.projects);

    useEffect(() => {
        setSubDirectories(directory.subDirectories);
        setProjects(directory.projects);
    }, [directory]);

    useEffect(() => {
        setTotalProjectCount(user.total_project_count);
        setTotalDirectoryCount(user.total_directory_count);
    }, [user]);

    const [selectedDirectory, setSelectedDirectory] = useState<DirectoryInfo | null>(null);
    const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    const [apiError, setApiError] = useState<string | null>(null);

    const refetchProjectCount = () => {
        fetchUser(auth)
            .then(updatedUser => {
                setTotalProjectCount(updatedUser.total_project_count);
            })
            .catch(err => {
                console.error('Error fetching user data:', err);
            });
    }

    // Create Directory and Project flow
    const handleCreateDirectory = (name: string) => {
        createDirectory(auth, dirId, name)
            .then(newDir => {
                setTotalDirectoryCount(d => d + 1);
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
        createProject(auth, dirId, name)
            .then(newProject => {
                setTotalProjectCount(d => d + 1);
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
        uploadProject(auth, dirId, file)
            .then(newProject => {
                setTotalProjectCount(d => d + 1);
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
        const response = await downloadProject(auth, projectInfo.id)
        const url = URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectInfo.name}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    const handleDeleteConfirm = (shouldDelete: boolean) => {
        setShowDeleteModal(false);
        if (shouldDelete && selectedDirectory) {
            deleteDirectory(auth, selectedDirectory.id)
                .then(success => {
                    if (success) {
                        setTotalDirectoryCount(d => d - 1);
                        refetchProjectCount();
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
        else if (shouldDelete && selectedProject) {
            deleteProject(auth, selectedProject.id)
                .then(success => {
                    if (success) {
                        setTotalProjectCount(d => d - 1);
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

    return (
        <>
            <BuyMeCoffeeWidget />
            <DirectoryTree dirTree={directory.directoryTree} to="directories"/>
            <div className="mt-4 align-items-center px-4" style={{display: 'grid', gridTemplateColumns: '1fr auto 1fr'}}>
                <div/>
                <div className="d-flex flex-row flex-nowrap gap-3 align-items-center justify-content-center">
                    <Folder size={32}/>
                    <h3 className="mb-0 no-drag">{directory.name}</h3>
                </div>
                <div className="d-flex justify-content-end align-items-center">
                    <Link to={"/overview/$dir"} params={{ dir: directory.id }} className="text-body-secondary clickable-link">
                        <span className="ms-2">Go to overview</span>
                    </Link>
                </div>
            </div>
            <div key={"explorer"} className="d-flex flex-column p-5 gap-3 mx-lg-5 pt-4">
                <div key={"directory-list"} className={"d-flex flex-wrap gap-3 justify-content-center"}
                     style={{width: "100%"}}>

                    {subDirectories.map((directory) => {
                        return (
                            <DirectoryCard
                                to="directories"
                                directoryInfo={
                                    {
                                        id: directory.id,
                                        name: directory.name,
                                        isShared: false,
                                    }
                                }
                                key={directory.id}
                                deleteDirectory={handleDeleteDirectory}
                                shareDirectory={directory.owner === user.id ? handleShareDirectory : undefined}
                            />
                        )
                    })}
                    {directory.directoryTree.length <= MAX_DIRECTORY_DEPTH && 
                        subDirectories.length < MAX_DIRECTORIES_PER_DIRECTORY &&
                        <AddDirectoryCard directoryCount={totalDirectoryCount} onSubmit={handleCreateDirectory}/>}
                </div>
                <div key={"project-list"} className={"d-flex flex-wrap gap-3 mt-3 justify-content-center"}
                     style={{width: "100%"}}>

                    {projects.map((project) => {
                        return (
                            <ProjectCard project={project} deleteProject={handleDeleteProject} downloadProject={handleDownloadProject} key={project.id}/>
                        )
                    })}
                    {projects.length < MAX_PROJECTS_PER_DIRECTORY &&
                        <AddProjectCard projectCount={totalProjectCount} onSubmit={handleCreateProject} onUpload={handleUploadProject}/>}
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
        </>
    );
}

