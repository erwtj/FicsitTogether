import {Nav, Navbar} from "react-bootstrap";
import {Link} from "@tanstack/react-router";
import {useAuth0Context} from "../auth/useAuth0Context.ts";
import UserPopover from "./popovers/UserPopover.tsx";

function NavHeader() {
    const auth0Context = useAuth0Context();
    const {user}  = auth0Context;

    return (
        <>
            <Navbar bg="dark" className={"border-bottom p-2"} variant="dark" style={{height: "60px"}}>
                <Navbar.Brand>
                    <Link to={"/home"} className={"nav-link ms-2"}>Home</Link>
                </Navbar.Brand>
                <Nav className="mr-auto text-nowrap" style={{marginTop: "2px"}}>
                    <Nav.Item><Link to="/login" params={{ dir: 'root' }} className={"nav-link"}>Projects</Link></Nav.Item>
                    <Nav.Item className={"nav-link"}>Recipe Calculator</Nav.Item>
                    <Nav.Item className={"nav-link"}>RSP Factor Table</Nav.Item>
                </Nav>
                <Nav className="ms-auto mh-100 me-2" style={{aspectRatio: 1}}>
                    <UserPopover auth0Context={auth0Context}>
                        <img
                            src={user!.picture}
                            alt={user!.name}
                            className="rounded-circle"
                            role="button"
                        />
                    </UserPopover>
                </Nav>
            </Navbar>
        </>
    )
}


export default NavHeader;
