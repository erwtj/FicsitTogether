import { Modal } from 'react-bootstrap';
import {useAuth0Context} from "../../auth/useAuth0Context.ts";
import {useState, useEffect} from "react";
import {fetchSharedWith, shareDirectory, unshareDirectory} from "../../api/apiCalls.ts";
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import Button from 'react-bootstrap/Button';

type ShareModalProps = {
    show: boolean;
    directoryId: string;
    directoryName: string;
    onClose: () => void;
}

function ShareModal({ show, directoryId, directoryName, onClose}: ShareModalProps) {
    const auth = useAuth0Context();
    const [sharedWith, setSharedWith] = useState<{id: string, username: string}[]>([]);
    const [usernameToShare, setUsernameToShare] = useState<string>("");

    useEffect(() => {
        if (directoryId.length === 0) return;
        fetchSharedWith(auth, directoryId).then(users => setSharedWith(users));
    }, [auth, directoryId])

    const shareWithUser = (username: string) => {
        shareDirectory(auth, directoryId, username).then(success => {
            if (!success) return;
            fetchSharedWith(auth, directoryId).then(users => setSharedWith(users));
        })
    }
    const removeShareWithUser = (userId: string) => {
        unshareDirectory(auth, directoryId, userId).then(success => {
            if (!success) return;
            fetchSharedWith(auth, directoryId).then(users => setSharedWith(users));
        })
    }

    return (
        <Modal show={show} onHide={onClose} centered size={'lg'}>
            <Modal.Header>
                <Modal.Title className="justify-content-between d-flex w-100">
                    <>Sharing {directoryName}</>
                    <div className="d-flex">
                        <Form className="d-flex align-items-center me-2">
                            <InputGroup>
                                <InputGroup.Text id="basic-addon1">@</InputGroup.Text>
                                <Form.Control
                                    placeholder="Username"
                                    aria-label="Username"
                                    aria-describedby="basic-addon1"
                                    value={usernameToShare}
                                    onChange={(e) => setUsernameToShare(e.target.value.toLowerCase())}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            shareWithUser(usernameToShare);
                                            setUsernameToShare("");
                                        }
                                    }}
                                />
                            </InputGroup>
                        </Form>
                        <Button
                            variant="primary"
                            onClick={() => {
                                shareWithUser(usernameToShare);
                                setUsernameToShare("");
                            }}
                        >
                            Share
                        </Button>
                    </div>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <h5>Shared With:</h5>
                {sharedWith.length === 0 && <p>This directory is not shared with anyone.</p>}
                {sharedWith.length > 0 &&
                    <ul>
                        {sharedWith.map(user => (
                            <li key={user.id}>@{user.username} <button onClick={() => removeShareWithUser(user.id)}> X </button> </li>
                        ))}
                    </ul>
                }
            </Modal.Body>
        </Modal>
    );
}

export default ShareModal;

