import {Nav, Navbar } from "react-bootstrap";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { InfoCircle } from "react-bootstrap-icons";

function PublicNavHeader() {
    const [expanded, setExpanded] = useState(false);

    return (
        <Navbar
            bg="dark"
            className="border-bottom p-2 top-screen-navbar overflow-y-hidden no-drag"
            variant="dark"
            expand="lg"
            expanded={expanded}
            onToggle={setExpanded}
        >
            <div className="container-fluid">
                <Navbar.Brand>
                    <img src={"/media/Ficsit_inc.webp"} style={{ width: "45px" }} className="ms-3" alt="" />
                </Navbar.Brand>

                <div className="d-flex align-items-center">
                    <Nav className="mh-100 me-3 d-lg-none d-flex flex-row align-items-center" style={{ aspectRatio: 1 }}>
                        <Nav.Item>
                            <Link to="/login" className="btn btn-primary d-flex align-items-center">
                                Login
                            </Link>
                        </Nav.Item>
                    </Nav>

                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                </div>

                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto text-nowrap">
                        <Nav.Item>
                            <Link
                                to="/about"
                                className="nav-link d-flex align-items-center"
                                onClick={() => setExpanded(false)}
                            >
                                <InfoCircle className="me-2" size={16} />About
                            </Link>
                        </Nav.Item>
                    </Nav>

                    <Nav className="ms-auto mh-100 me-2 d-none d-lg-flex align-items-center" style={{ aspectRatio: 1 }}>
                        <Nav.Item>
                            <Link to="/login" className="btn btn-primary d-flex align-items-center">
                                Login
                            </Link>
                        </Nav.Item>
                    </Nav>
                </Navbar.Collapse>
            </div>
        </Navbar>
    );
}

export default PublicNavHeader;