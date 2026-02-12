import {createFileRoute, Link, useNavigate} from '@tanstack/react-router'
import {redirect} from "@tanstack/react-router";
import {useAuth0Context} from "../auth/useAuth0Context.ts";
import {useEffect, useState, Fragment} from "react";
import {
    createDirectory,
    createProject,
    deleteDirectory, deleteProject,
    fetchDirectoryContent,
    fetchUser,
} from "../api/apiCalls.ts";
import {type DirectoryDTO, type ProjectDTO, type DirectoryTreeDTO} from "dtolib";
import {Spinner, Navbar, Nav} from "react-bootstrap";
import {ChevronRight, House, Folder} from 'react-bootstrap-icons';
import {DirectoryCard, type DirectoryInfo} from "../components/explorer/DirectoryCard.tsx";
import {DirectoryAddFolderCard} from "../components/explorer/DirectoryAddFolderCard.tsx";
import ShareModal from "../components/modals/ShareModal.tsx";
import ConformationModal from "../components/modals/ConformationModal.tsx";
import {ProjectCard, type ProjectInfo} from "../components/explorer/ProjectCard.tsx";
import {AddProjectCard} from "../components/explorer/AddProjectCard.tsx";

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
    }
})

function DirectoryPage() {
    const auth = useAuth0Context()
    const { dir: dirId } = Route.useParams();
    const navigate = useNavigate();

    const [directoryName, setDirectoryName] = useState<string>("");
    const [subDirectories, setSubDirectories] = useState<DirectoryDTO[]>([]);
    const [userID, setUserID] = useState<string>("");
    const [projects, setProjects] = useState<ProjectDTO[]>([]);
    const [dirTree, setDirTree] = useState<DirectoryTreeDTO[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const [selectedDirectory, setSelectedDirectory] = useState<DirectoryInfo | null>(null);
    const [selectedProject, setSelectedProject] = useState<ProjectInfo | null>(null);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    // Fetch directory content and user data on component mount and when dirId or userID changes
    useEffect(() => {
        const userData = fetchUser(auth).then(DTO => {
            setUserID(DTO.id);
        });
        userData.catch(error => {
            console.error("Error fetching user data:", error);
        });

        const directoryData = fetchDirectoryContent(auth, dirId).then(DTO => {

            if (DTO.id === DTO.parentDirectoryId) {
                navigate({to: "/home", replace: true});
                return;
            }

            setDirectoryName(DTO.name);
            setSubDirectories(DTO.subDirectories);
            setProjects(DTO.projects);
            setDirTree(DTO.directoryTree) //TODO - replace with actual directory tree from API (must be implemented in backend first)
            setIsLoading(false)
        });
        directoryData.catch(error => {
            console.error("Error fetching directory content:", error);
        });

    }, [auth, dirId, userID]);

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

    if (isLoading) {
        return (
            <div
                className="d-flex flex-column align-items-center justify-content-center"
                style={{
                    position: "fixed",
                    inset: 0
                }}
            >
                <Spinner animation="border" style={{ width: "4rem", height: "4rem" }} />
                <small className="text-muted mt-3">Loading Directory...</small>
            </div>
        );
    }

    return (
        <>
            <Navbar bg="dark" className="border-bottom p-2" variant="dark" style={{ height: "40px" }}>
                <Nav className="d-flex align-items-center ms-3">
                    <Nav.Item>
                        <Link to="/login" params={{ dir: 'root' }} className={"nav-link d-flex align-items-center"}>
                            <House className="me-0" size={16} />
                        </Link>
                    </Nav.Item>
                    <ChevronRight size={16} className="text-muted"/>
                    {dirTree.map((dir, index) => (
                        <Fragment key={dir.id}>
                            <Nav.Item className={"nav-link d-flex align-items-center"}>
                                <Link to={"/directories/$dir"} params={{ dir: dir.id }}
                                      className={`nav-link d-flex align-items-center ps-0 pe-0 ${index === dirTree.length - 1 ? "active" : ""}`}
                                >
                                    {dir.name}
                                </Link>
                            </Nav.Item>
                            {index < dirTree.length - 1 && <ChevronRight size={16} className="text-muted"/>}
                        </Fragment>
                    ))}
                </Nav>
            </Navbar>
            <div className="d-flex flex-row gap-3 ps-5 pt-5 mx-lg-5 align-items-center">
                <Folder size={32}/>
                <h3 className="mb-0">{directoryName}</h3>
            </div>
            <div key={"explorer"} className="d-flex flex-column p-5 gap-3 mx-lg-5 pt-4">
                <div key={"directory-list"} className={"d-flex flex-row flex-wrap gap-2 justify-content"}
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
                                deleteDirectory={(dir) => handleDeleteDirectory(dir)}
                                shareDirectory={directory.owner === userID ? (dir) => handleShareDirectory(dir) : undefined}
                            />
                        )
                    })}
                    <DirectoryAddFolderCard onSubmit={(s) => handleCreateDirectory(s)}/>
                </div>
                <div key={"project-list"} className={"d-flex flex-row flex-wrap gap-2 pt-3 justify-content"}
                     style={{width: "100%"}}>

                    {projects.map((project) => {
                        return (
                            <ProjectCard project={project} deleteProject={(project) => handleDeleteProject(project)} key={project.id}/>
                        )
                    })}
                    <AddProjectCard onSubmit={(name) => handleCreateProject(name)}/>
                </div>
            </div>
            <ConformationModal
                show={showDeleteModal}
                title={`Delete '${selectedDirectory ? selectedDirectory.name : selectedProject?.name}'?`}
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

