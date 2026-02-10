import {Modal} from "react-bootstrap";
import React from "react";
import type {Auth0ContextType} from "../../auth/auth0.tsx";
import Button from 'react-bootstrap/Button';

export type UserModalProps = {
    auth0Context: Auth0ContextType
    show: boolean
    onClose: () => void
}

const UserModal: React.FC<UserModalProps> = ({auth0Context, show, onClose}) => {
    const { user } = auth0Context
    const [token, setToken] = React.useState<string>(user!.name!)

    React.useEffect(() => {
        if (auth0Context.getAccessTokenSilently) {
            auth0Context.getAccessTokenSilently()
                .then(token => {
                    const decoded = token.split('.').length === 3 && JSON.parse(atob(token.split('.')[1]))
                    setToken(decoded)
                })
                .catch(err => console.error('Error getting access token:', err))
        }
    }, [auth0Context])
    const userName = token[import.meta.env.VITE_AUTH0_AUDIENCE + '/username'] as string || 'unkown user'

    console.log(token)
    return (
        <Modal show={show} onHide={onClose} centered>
            <Modal.Header closeButton className="user-select-none">
                <Modal.Title>User Information</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center">
                <img src={user!.picture} alt={user!.name} className="rounded-circle mb-3" style={{ width: '100px', height: '100px' }} />
                <h6 className="user-select-all text-muted">@{userName}</h6>
                <p className="user-select-all text-muted">{user!.email}</p>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="danger" onClick={auth0Context.logout}>Log out</Button>
            </Modal.Footer>
        </Modal>
    )
}

export default UserModal;

