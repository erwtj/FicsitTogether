import { useState } from 'react';
import { Card, Dropdown } from 'react-bootstrap';
import { ThreeDotsVertical } from 'react-bootstrap-icons';


export type ProjectInfo = {
    id: string;
    name: string;
    description: string;
}

export type ProjectProps = {
    project: ProjectInfo;
    deleteProject: (project: ProjectInfo) => void;
}


export const ProjectCard = ({project, deleteProject}: ProjectProps) => {
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <Card
        onMouseLeave={() => setShowDropdown(false)}
        className={"clickable-card p-3 d-flex d-flex flex-column"}
        style={{width: "18rem", minHeight: "4rem", position: "relative"}}
        key={project.id}
        >
                <Card.Title className={"d-flex align-items-center justify-content-between user-select-none"}>
                    {project.name.length === 0 ?
                        <h5 className={"text-truncate mb-0 text-muted fst-italic"} style={{width: "10rem"}} key="name">No name</h5> :
                        <h5 className={"text-truncate mb-0"} style={{width: "14rem"}} key="name">{project.name}</h5>
                    }
                    <Dropdown className={"z-2 ms-auto"} show={showDropdown}>
                        <Dropdown.Toggle variant={"primary"}
                                         className="border-0 p-0 bg-transparent no-arrow align-top"
                                         id={"dropdown-basic"} onClick={() => setShowDropdown(!showDropdown)}
                        >
                            <ThreeDotsVertical size={20} className={"text-secondary ms-auto"} role={"button"} data-bs-toggle={"dropdown"} aria-expanded={false} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className={"position-fixed z-2"} >
                            <Dropdown.Item href={"#"} className={"delete-option user-select-none"}
                                           onClick={() => deleteProject(project)}>Delete
                            </Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Card.Title>
                <Card.Text className={"project-description text-muted user-select-none mw-100 text-wrap"}>
                    {project.description.length === 0 ?
                        <span className={"text-truncate mb-0 text-muted fst-italic"} style={{width: "10rem"}} key="description">No description</span> :
                        <span className={"d-inline mb-0"} style={{width: "16rem"}} key="description">{project.description}</span>
                    }
                </Card.Text>
        </Card>
    )
}