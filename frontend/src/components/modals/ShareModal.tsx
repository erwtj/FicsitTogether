import { Modal } from 'react-bootstrap';
import {useAuth0Context} from "../../auth/useAuth0Context.ts";
import {useState, useEffect} from "react";
import {fetchSharedWith, shareDirectory, unshareDirectory} from "../../api/apiCalls.ts";
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';
import {isAxiosError} from 'axios';
import "./ShareModal.tsx.css"
import { X } from "react-bootstrap-icons";


type RemoveUserCardProps = {
    userId: string;
    username: string;
    onRemove: (userId: string) => void;
}

function RemoveUserCard({userId, username, onRemove}: RemoveUserCardProps) {
    return (
        <div className="d-inline-flex border px-2 py-1 fs-6 rounded-3 bg-body-tertiary">
            <span>@{username}</span>
            <button className="border-0 bg-transparent p-0 ms-2 rounded-1 unshare-button" onClick={() => onRemove(userId)}>
                <X size={20} className="align-text-bottom"/>
            </button>
        </div>
    );
}

type ShareModalProps = {
    show: boolean;
    directoryId: string;
    directoryName: string;
    onClose: () => void;
}

function ShareModal({ show, directoryId, directoryName, onClose}: ShareModalProps) {
    const auth = useAuth0Context();
    const [sharedWith, setSharedWith] = useState<{id: string, username: string}[]>([]);
    const [username, setUsername] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");

    useEffect(() => {
        if (directoryId.length === 0) return;
        fetchSharedWith(auth, directoryId).then(users => setSharedWith(users));
    }, [auth, directoryId])

    const shareWithUser = (username: string) => {
        shareDirectory(auth, directoryId, username).then(success => {
            if (!success) return;
            fetchSharedWith(auth, directoryId).then(users => setSharedWith(users));
        }).catch(err => {
            if (isAxiosError(err)) {
                if (err.status === 404) {
                    setErrorMessage("User not found.");
                } else if (err.status === 400) {
                    setErrorMessage(err.response?.data.message || "Could not share with user.");
                } else {
                    console.error(err.message);
                }
            } 
        }).finally(() => {
            setUsername("");
        });
    }
    const removeShareWithUser = (userId: string) => {
        unshareDirectory(auth, directoryId, userId).then(success => {
            if (!success) return;
            fetchSharedWith(auth, directoryId).then(users => setSharedWith(users));
        })
    }

    const onSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        shareWithUser(username);
    }
    
    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>)=> {
        const cleanUsername = e.target.value.toLowerCase().replace(/ /g,'')
        setUsername(cleanUsername);
        
        if (cleanUsername.length > 0) 
            setErrorMessage("");
    }

    return (
        <Modal show={show} onHide={() => {setErrorMessage(""); setUsername(""); onClose();}} centered>
            <Modal.Header className="flex-column gap-2">
                <Modal.Title className="w-100">
                    Sharing "<span style={{maxWidth: "75%"}} className="text-truncate d-inline-block align-bottom">{directoryName}</span>"
                </Modal.Title>
                <div className="d-flex w-100">
                    <Form className="d-flex align-items-center me-2 w-100" onSubmit={onSubmit}>
                        <InputGroup>
                            <InputGroup.Text id="basic-addon1">@</InputGroup.Text>
                            <Form.Control
                                placeholder={errorMessage ? errorMessage : 'Username'}
                                aria-label="Username"
                                aria-describedby="basic-addon1"
                                value={username.trim()}
                                onChange={onChange}
                                className={errorMessage !== "" ? "error" : ""}
                            />
                            <Button disabled={username===""} type="submit" variant="primary">
                                Share
                            </Button>
                        </InputGroup>
                    </Form>
                </div>
            </Modal.Header>
            <Modal.Body className="overflow-y-auto" style={{maxHeight: "40vh"}}>
                <h5>Shared With:</h5>
                {sharedWith.length === 0 && <p>This directory is not shared with anyone.</p>}
                {sharedWith.length > 0 &&
                    <div className="d-flex flex-wrap gap-1">
                        {sharedWith.map(user => (
                            <RemoveUserCard userId={user.id} username={user.username} onRemove={removeShareWithUser} key={user.id} />
                        ))}
                    </div>
                }
            </Modal.Body>
        </Modal>
    );
}

export default ShareModal;