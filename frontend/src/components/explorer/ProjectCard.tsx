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
        className={"clickable-card py-2 px-3 d-flex justify-content-center"}
        style={{width: "18rem", minHeight: "4rem", position: "relative", zIndex: showDropdown ? 2000 : 1}}
        key={project.id}
        >
            <Card.Title className={"d-flex align-items-center justify-content-between user-select-none"}>
                {project.name}
                <Dropdown className={"z-2"} show={showDropdown}>
                    <Dropdown.Toggle variant={"primary"}
                                     className={"border-0 p-0 bg-transparent no-arrow"}
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
            <Card.Text className={"project-description text-muted user-select-none"}>
                {project.description}
            </Card.Text>
        </Card>
    )
}