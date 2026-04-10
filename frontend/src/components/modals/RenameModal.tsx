import { Modal, Button, Form } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import { MAX_NAME_LENGTH } from 'dtolib';

type RenameModalProps = {
    show: boolean;
    currentName: string;
    onConfirm: (newName: string) => void;
    onCancel: () => void;
}

function RenameModal({ show, currentName, onConfirm, onCancel }: RenameModalProps) {
    const [name, setName] = useState(currentName);

    useEffect(() => {
        if (show) {
            setName(currentName);
        }
    }, [show, currentName]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (trimmed.length > 0) {
            onConfirm(trimmed);
        }
    };

    return (
        <Modal show={show} onHide={onCancel} centered>
            <Modal.Header closeButton>
                <Modal.Title>Rename Directory</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group>
                        <Form.Label>New name</Form.Label>
                        <Form.Control
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value.trimStart())}
                            maxLength={MAX_NAME_LENGTH}
                            autoFocus
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={name.trim().length === 0}>
                    Rename
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default RenameModal;
