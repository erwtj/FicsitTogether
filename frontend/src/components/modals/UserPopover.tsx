import { Popover, OverlayTrigger } from "react-bootstrap";
import React from "react";
import type { Auth0ContextType } from "../../auth/auth0.tsx";
import Button from 'react-bootstrap/Button';

export type UserPopoverProps = {
    auth0Context: Auth0ContextType
    children: React.ReactElement // The trigger element (user icon)
}

const UserPopover: React.FC<UserPopoverProps> = ({ auth0Context, children }) => {
    const { user } = auth0Context;
    const [username, setUsername] = React.useState<string>(user!.name!);

    React.useEffect(() => {
        if (auth0Context.getAccessTokenSilently) {
            auth0Context.getAccessTokenSilently()
            .then(token => {
                const decoded = token.split('.').length === 3 && JSON.parse(atob(token.split('.')[1]));
                const username = decoded[import.meta.env.VITE_AUTH0_AUDIENCE + '/username'] as string || user!.name!;
                setUsername(username);
            })
            .catch(err => console.error('Error getting access token:', err));
        }
    }, [auth0Context]);


    const popover = (
        <Popover id="user-popover">
            <Popover.Body className="text-center">
                <img
                    src={user!.picture}
                    alt={user!.name}
                    className="rounded-circle"
                    style={{ width: '80px', height: '80px' }}
                />

                <hr/>
                <p className="text-muted mb-1 fs-7">@{username}</p>
                <h6 className="mb-3">{user!.email}</h6>
                <hr/>

                <Button variant="danger" className="w-100" size="sm" onClick={auth0Context.logout}>
                    Log out
                </Button>
            </Popover.Body>
        </Popover>
    );

    return (
        <OverlayTrigger
            trigger="click"
            placement="bottom-end"
            overlay={popover}
            rootClose // Closes when clicking outside
        >
            {children}
        </OverlayTrigger>
    );
};

export default UserPopover;