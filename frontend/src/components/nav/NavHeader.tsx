import { useState } from "react";
import { Nav, Navbar } from "react-bootstrap";
import { Link } from "@tanstack/react-router";
import { useAuth0Context } from "../../auth/useAuth0Context.ts";
import UserPopover from "../popovers/UserPopover.tsx";
import { Calculator, Table, House, InfoCircle } from "react-bootstrap-icons";

function NavHeader() {
    const auth0Context = useAuth0Context();
    const { user } = auth0Context;
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
                    <Nav className="mh-100 me-3 d-lg-none" style={{ aspectRatio: 1 }}>
                        <UserPopover auth0Context={auth0Context}>
                            <img
                                src={user!.picture}
                                alt={user!.name}
                                className="rounded-circle"
                                role="button"
                                style={{ height: "40px", width: "40px" }}
                            />
                        </UserPopover>
                    </Nav>

                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                </div>

                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto text-nowrap">
                        <Nav.Item>
                            <Link
                                to="/home"
                                params={{ dir: 'root' }}
                                className="nav-link d-flex align-items-center"
                                onClick={() => setExpanded(false)}
                            >
                                <House className="me-2" size={16} />Home
                            </Link>
                        </Nav.Item>
                        <Nav.Item className="nav-link d-flex align-items-center disabled">
                            <Calculator className="me-2" size={16} />Recipe Calculator
                        </Nav.Item>
                        <Nav.Item className="nav-link d-flex align-items-center disabled" >
                            <Table className="me-2" size={16} />RSP Factor Table
                        </Nav.Item>
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

                    <Nav className="ms-auto mh-100 me-2 d-none d-lg-flex" style={{ aspectRatio: 1 }}>
                        <UserPopover auth0Context={auth0Context}>
                            <img
                                src={user!.picture}
                                alt={user!.name}
                                className="rounded-circle"
                                role="button"
                                style={{ height: "45px", width: "45px" }}
                            />
                        </UserPopover>
                    </Nav>
                </Navbar.Collapse>
            </div>
        </Navbar>
    );
}

export default NavHeader;