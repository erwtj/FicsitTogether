import {Link} from "@tanstack/react-router";
import {Navbar, Nav} from "react-bootstrap";
import {ChevronRight, House, ThreeDots} from 'react-bootstrap-icons';
import type {DirectoryTreeDTO} from "dtolib";

function DirectoryTree({dirTree, depthLimitReached}: {dirTree: DirectoryTreeDTO[], depthLimitReached?: boolean}) {
    return (
        <Navbar bg="dark" className="border-bottom overflow-hidden top-screen-navbar d-none d-sm-flex" variant="dark" style={{ height: "40px", width: "100vw" }} >
            <Nav className="d-flex align-items-center ms-3">
                <Nav.Item>
                    <Link to="/login" params={{ dir: 'root' }} className={"nav-link d-flex align-items-center clickable-link"}>
                        <House className="me-0" size={16} />
                    </Link>
                </Nav.Item>
                <ChevronRight size={16} className="text-muted me-1"/>
                {depthLimitReached && (
                    <>
                        <Nav.Item className="d-flex align-items-center">
                            <ThreeDots size={16} className="text-muted" title="Depth limit reached" />
                        </Nav.Item>
                        <ChevronRight size={16} className="text-muted me-1"/>
                    </>
                )}
            </Nav>
            <Nav>
                {dirTree.map((dir, index) => (
                    <Nav.Item key={dir.id} className="d-flex flex-row flex-nowrap text-nowrap align-items-center">
                        <Link to={"/directories/$dir"} params={{ dir: dir.id }}
                              className={`nav-link ps-0 pe-0 clickable-link ${index === dirTree.length - 1 ? "active" : ""}`}
                        >
                            {dir.name}
                        </Link>
                        {index < dirTree.length - 1 && <ChevronRight size={16} className="text-muted mx-1"/>}
                    </Nav.Item>
                ))}
            </Nav>
        </Navbar>
    );
}

export default DirectoryTree;