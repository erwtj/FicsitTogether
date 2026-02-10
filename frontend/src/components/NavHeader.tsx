import {Nav, Navbar} from "react-bootstrap";
import {Link} from "@tanstack/react-router";
import {useAuth0Context} from "../auth/useAuth0Context.ts";
import {useState} from "react";
import UserModal from "./modals/UserModal.tsx";

function NavHeader() {
    const auth0Context = useAuth0Context();
    const {user}  = auth0Context;

    const [showUserModal, setShowUserModal] = useState(false);

    return (
        <>
            <Navbar bg="dark" className={"border-bottom p-2"} variant="dark">
                <Navbar.Brand>
                    <Link to={"/home"} className={"nav-link ms-2"}>Home</Link>
                </Navbar.Brand>
                <Nav className="mr-auto" style={{marginTop: "2px"}}>
                    <Nav.Item><Link to="/login" params={{ dir: 'root' }} className={"nav-link"}>Projects</Link></Nav.Item>
                    <Nav.Item className={"nav-link"}>Recipe Calculator</Nav.Item>
                    <Nav.Item className={"nav-link"}>RSP Factor Table</Nav.Item>
                </Nav>
                <Nav className="ms-auto">
                    <div className="d-flex align-items-center">
                        <img
                            src={user!.picture}
                            alt={user!.name}
                            className="rounded-circle"
                            style={{ width: '30px', height: '30px', marginRight: '10px', cursor: 'pointer' }}
                            onClick={() => setShowUserModal(true)}
                        />
                    </div>
                </Nav>
            </Navbar>
            <UserModal show={showUserModal} auth0Context={auth0Context} onClose={() => setShowUserModal(false)} />
        </>
    )
}


export default NavHeader;
