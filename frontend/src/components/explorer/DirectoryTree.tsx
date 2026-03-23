import {Link} from "@tanstack/react-router";
import {Navbar, Nav} from "react-bootstrap";
import {ChevronRight, House} from 'react-bootstrap-icons';
import type {DirectoryTreeDTO} from "dtolib";

function DirectoryTree({dirTree, to}: {dirTree: DirectoryTreeDTO[], to: 'directories' | 'view/directories'}) {
    return (
        <Navbar bg="dark" className="border-bottom top-screen-navbar d-none d-sm-flex" variant="dark" style={{ height: "40px", width: "100vw", overflowX: "auto", overflowY: "hidden" }} >
            <Nav className="d-flex align-items-center ms-3 flex-nowrap" style={{ minWidth: "fit-content" }}>
                <Nav.Item className="flex-shrink-0">
                    <Link to="/login" params={{ dir: 'root' }} className={"nav-link d-flex align-items-center clickable-link"}>
                        <House className="me-0" size={16} />
                    </Link>
                </Nav.Item>
                <ChevronRight size={16} className="text-muted me-1 flex-shrink-0"/>
                {dirTree.map((dir, index) => (
                    <Nav.Item key={dir.id} className="d-flex flex-row flex-nowrap text-nowrap align-items-center flex-shrink-0">
                        <Link to={`/${to}/$dir`} params={{ dir: dir.id }}
                              className={`nav-link ps-0 pe-0 clickable-link ${index === dirTree.length - 1 ? "active" : ""}`}
                              style={{ 
                                  maxWidth: "200px", 
                                  overflow: "hidden", 
                                  textOverflow: "ellipsis", 
                                  whiteSpace: "nowrap" 
                              }}
                              title={dir.name}
                        >
                            {dir.name}
                        </Link>
                        {index < dirTree.length - 1 && <ChevronRight size={16} className="text-muted mx-1 flex-shrink-0"/>}
                    </Nav.Item>
                ))}
            </Nav>
        </Navbar>
    );
}

export default DirectoryTree;