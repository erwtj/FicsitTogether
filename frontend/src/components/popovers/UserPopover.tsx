import { Popover, OverlayTrigger } from "react-bootstrap";
import React, { useEffect, useState } from "react";
import type { Auth0ContextType } from "../../auth/auth0.tsx";
import Button from 'react-bootstrap/Button';
import {ClientSettingsModal} from "../modals/ClientSettingsModal.tsx";
import "./UserPopover.tsx.css";
import { BoxArrowUpRight } from "react-bootstrap-icons";

export type UserPopoverProps = {
    auth0Context: Auth0ContextType
    children: React.ReactElement // The trigger element (user icon)
}

const UserPopover: React.FC<UserPopoverProps> = ({ auth0Context, children }) => {
    const { user } = auth0Context;
    const [username, setUsername] = useState<string>(user!.name!);

    const [showSettings, setShowSettings] = useState(false);
    const [showPopover, setShowPopover] = useState(false);

    useEffect(() => {
        if (auth0Context.getAccessTokenSilently) {
            auth0Context.getAccessTokenSilently()
            .then(token => {
                const decoded = token.split('.').length === 3 && JSON.parse(atob(token.split('.')[1]));
                const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
                const namespace = audience + (audience.endsWith('/') ? 'username' : '/username');
                const username = decoded[namespace] as string || user!.name!;
                setUsername(username);
            })
            .catch(err => console.error('Error getting access token:', err));
        }
    }, [auth0Context, user]);


    const popover = (
        <Popover id="user-popover" style={{maxWidth: 'none'}}>
            {/* Why not use a header? Because footer doesn't exist so we already have to manage <hr/> */}
            <Popover.Body className="text-center">
                <a href="https://gravatar.com/profile" target="_blank" rel="noopener noreferrer" className="link-image">
                    <img
                        src={user!.picture}
                        alt={user!.name}
                        className="rounded-circle"
                        style={{ width: '80px', height: '80px' }}
                    />
                    <BoxArrowUpRight className="link-image-hover"/>
                </a>

                <hr style={{marginLeft: '-1rem', marginRight: '-1rem'}}/>

                <p className="text-muted mb-1 fs-6">@{username}</p>
                <h6 className="mb-3">{user!.email}</h6>

                <hr style={{marginLeft: '-1rem', marginRight: '-1rem'}}/>

                <Button variant="secondary" className="w-100 mb-2 bg-body-tertiary" size="sm" onClick={() => {setShowSettings(true); setShowPopover(false);}}>
                    Settings
                </Button>
                <Button variant="danger" className="w-100" size="sm" onClick={auth0Context.logout}>
                    Log out
                </Button>
            </Popover.Body>
        </Popover>
    );

    return (
        <>
            <OverlayTrigger
                trigger="click"
                placement="bottom-end"
                overlay={popover}
                show={showPopover}
                onToggle={(isOpen) => setShowPopover(isOpen)}
                rootClose
            >
                {children}
            </OverlayTrigger>

            <ClientSettingsModal show={showSettings} handleClose={() => setShowSettings(false)}/>
        </>
    );
};

export default UserPopover;