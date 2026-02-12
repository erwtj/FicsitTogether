import {Nav, Navbar} from "react-bootstrap";
import {Link} from "@tanstack/react-router";
import {useAuth0Context} from "../auth/useAuth0Context.ts";
import UserPopover from "./modals/UserPopover.tsx";
import { Calculator, Table, House } from "react-bootstrap-icons";

function NavHeader() {
    const auth0Context = useAuth0Context();
    const {user}  = auth0Context;

    return (
        <>
            <Navbar bg="dark" className={"border-bottom p-2"} variant="dark" style={{height: "60px"}}>
                <Navbar.Brand>
                    <img src={"media/Ficsit_inc.webp"} style={{width: "45px"}} className={"ms-3"} alt={""}/>
                </Navbar.Brand>
                <Nav className="mr-auto text-nowrap" style={{marginTop: "2px"}}>
                    <Nav.Item>
                        <Link to="/login" params={{ dir: 'root' }} className={"nav-link d-flex align-items-center"}>
                            <House className="me-2" size={16} />Home
                        </Link>
                    </Nav.Item>
                    <Nav.Item className={"nav-link d-flex align-items-center"}>
                        <Calculator className="me-2" size={16} />Recipe Calculator
                    </Nav.Item>
                    <Nav.Item className={"nav-link d-flex align-items-center"}>
                        <Table className="me-2" size={16} />RSP Factor Table
                    </Nav.Item>
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
