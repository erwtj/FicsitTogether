import { useState } from 'react';
import { Card, Dropdown } from 'react-bootstrap';
import { FileEarmark, Globe, ThreeDotsVertical } from 'react-bootstrap-icons';
import {Link} from "@tanstack/react-router";
import "./ExplorerComponents.css";

export type ProjectInfo = {
    id: string;
    name: string;
    description: string;
    public: boolean;
}

export type ProjectProps = {
    to: "edit" | "view/projects";
    project: ProjectInfo;
    changePublic?: (project: ProjectInfo) => void;
    deleteProject?: (project: ProjectInfo) => void;
    downloadProject?: (project: ProjectInfo) => void;
}

export const ProjectCard = ({to, project, changePublic, deleteProject, downloadProject}: ProjectProps) => {
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <Card
            onMouseLeave={() => setShowDropdown(false)}
            className={"clickable-card p-3 d-flex d-flex flex-column"}
            style={{width: "18rem", minHeight: "5rem", position: "relative"}}
            key={project.id}
        >
            <Link to={`/${to}/$project`} params={{ project: project.id }} className={"stretched-link"}></Link>
            <Card.Title className={"d-flex align-items-center justify-content-between user-select-none"}>
                {(project.public && changePublic) && <>
                    <FileEarmark size={28} className={"me-2"}/>
                    <Globe size={18} className={`public-globe position-absolute bottom-0 end-0 default-purple`} style={{
                        borderRadius: "50%",
                        left: "1.75rem",
                        top: "2rem",
                        padding: "2px",
                        zIndex: 1,
                    }}/>
                </>}
                {project.name.length === 0 ?
                    <h5 className={"text-truncate mb-0 text-muted fst-italic"} style={{width: "10rem", height: "1.7rem"}} key="name">No name</h5> :
                    <h5 className={"text-truncate mb-0"} style={{width: "14rem", height: "1.7rem"}} key="name">{project.name}</h5>
                }
                {(deleteProject || downloadProject) && <Dropdown className={"ms-auto"} style={{zIndex: showDropdown ? 3 : 2}} show={showDropdown}>
                    <Dropdown.Toggle variant={"primary"}
                                     className="dropdown-toggle p-0 no-arrow align-top"
                                     id={"dropdown-basic"} onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <ThreeDotsVertical size={20} className={"text-secondary"} role={"button"} data-bs-toggle={"dropdown"} aria-expanded={false} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu className={"p-0 z-2"} popperConfig={{ strategy: 'fixed' }} renderOnMount>
                        {downloadProject && <Dropdown.Item href={"#"} className={"dropdown-option download-option user-select-none"}
                                       onClick={() => downloadProject(project)}>
                            Download
                        </Dropdown.Item>}
                        {changePublic && <Dropdown.Item href={"#"} className={"dropdown-option public-option user-select-none"}
                                       onClick={() => changePublic(project)}>
                            Publicize
                        </Dropdown.Item>}
                        {deleteProject && <Dropdown.Item href={"#"} className={"dropdown-option delete-option user-select-none"}
                                       onClick={() => deleteProject(project)}>
                            Delete
                        </Dropdown.Item>}
                    </Dropdown.Menu>
                </Dropdown>}
            </Card.Title>
            <Card.Text className={"project-description text-muted user-select-none mw-100 text-wrap"}>
                {project.description.length === 0 ?
                    <span className={"text-truncate mb-0 text-muted fst-italic"} style={{width: "10rem"}} key="description">No description</span> :
                    <span className={"d-inline-block mb-0"} style={{width: "16rem", whiteSpace: "pre-wrap"}} key="description">{project.description}</span>
                }
            </Card.Text>
        </Card>
    );
}