import {createFileRoute, notFound} from '@tanstack/react-router'
import {redirect} from "@tanstack/react-router";
import {useAuth0Context} from "../auth/useAuth0Context.ts";
import {useState} from "react";
import {
    createDirectory,
    createProject,
    deleteDirectory, deleteProject,
    fetchDirectoryContent,
    fetchUser,
} from "../api/apiCalls.ts";
import {type DirectoryDTO, type ProjectDTO} from "dtolib";
import {Folder} from 'react-bootstrap-icons';
import {DirectoryCard, type DirectoryInfo} from "../components/explorer/DirectoryCard.tsx";
import {AddDirectoryCard} from "../components/explorer/AddDirectoryCard.tsx";
import ShareModal from "../components/modals/ShareModal.tsx";
import ConfirmationModal from "../components/modals/ConfirmationModal.tsx";
import {ProjectCard, type ProjectInfo} from "../components/explorer/ProjectCard.tsx";
import {AddProjectCard} from "../components/explorer/AddProjectCard.tsx";
import DirectoryTree from "../components/explorer/DirectoryTree.tsx";
import BuyMeCoffeeWidget from "../components/BuyMeCoffeeButton.tsx";

export const Route = createFileRoute('/directories/$dir')({
    component: DirectoryPage,
    beforeLoad: ({context}) => {
        if (!context.auth?.isAuthenticated) {
            throw redirect({to: '/login', replace: true});
        }
    },
    staticData: {
        showNav: true,
        title: "Ficsit Together | Directories"
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
    }
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

    const [subDirectories, setSubDirectories] = useState<DirectoryDTO[]>(directory.subDirectories);
    const [projects, setProjects] = useState<ProjectDTO[]>(directory.projects);

    const [selectedDirectory, setSelectedDirectory] = useState<DirectoryInfo | null>(null);
    const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    // Create Directory and Project flow
    const handleCreateDirectory = (name: string) => {
        createDirectory(auth, dirId, name)
            .then(newDir => {
                    setSubDirectories(prev => [...prev, newDir]);
                }
            )
            .catch(err => console.error('Error creating directory:', err));
    };
    const handleCreateProject = (name: string) => {
        createProject(auth, dirId, name)
            .then(newProject => {
                    setProjects(prev => [...prev, newProject]);
                }
            )
            .catch(err => console.error('Error creating project:', err));
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
    const handleDeleteConfirm = (shouldDelete: boolean) => {
        setShowDeleteModal(false);
        if (shouldDelete && selectedDirectory) {
            deleteDirectory(auth, selectedDirectory.id)
                .then(success => {
                    if (success) {
                        setSubDirectories(prev => prev.filter(dir => dir.id !== selectedDirectory.id));
                    } else {
                        console.error('Failed to delete directory');
                    }
                })
                .catch(err => console.error('Error deleting directory:', err));
        }
        else if (shouldDelete && selectedProject) {
            deleteProject(auth, selectedProject.id)
                .then(success => {
                    if (success) {
                        setProjects(prev => prev.filter(proj => proj.id !== selectedProject.id));
                    } else {
                        console.error('Failed to delete project');
                    }
                })
                .catch(err => console.error('Error deleting project:', err));
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
            <DirectoryTree dirTree={directory.directoryTree.tree} depthLimitReached={directory.directoryTree.depthLimitReached}/>
            <div className="d-flex flex-nowrap gap-3 justify-content-center mt-4 align-items-center">
                <Folder size={32}/>
                <h3 className="mb-0 no-drag">{directory.name}</h3>
            </div>
            <div key={"explorer"} className="d-flex flex-column p-5 gap-3 mx-lg-5 pt-4">
                <div key={"directory-list"} className={"d-flex flex-wrap gap-3 justify-content-center"}
                     style={{width: "100%"}}>

                    {subDirectories.map((directory) => {
                        return (
                            <DirectoryCard
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
                    <AddDirectoryCard onSubmit={handleCreateDirectory}/>
                </div>
                <div key={"project-list"} className={"d-flex flex-row flex-wrap gap-3 mt-3 justify-content-center"}
                     style={{width: "100%"}}>

                    {projects.map((project) => {
                        return (
                            <ProjectCard project={project} deleteProject={handleDeleteProject} key={project.id}/>
                        )
                    })}
                    <AddProjectCard onSubmit={handleCreateProject}/>
                </div>
            </div>
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

