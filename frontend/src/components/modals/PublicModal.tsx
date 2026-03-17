import { Button, Form, InputGroup, Modal } from "react-bootstrap";
import { useEffect, useRef, useState } from "react";
import { ClipboardCheck, Clipboard, Link45deg } from "react-bootstrap-icons";

type PublicModalProps = {
    show: boolean;
    itemName: string;
    itemId: string;
    type: "project" | "directory";
    isPublic: boolean;
    onClose: () => void;
    updateStatus: (isPublic: boolean, type: "project" | "directory", id: string) => void;
}

function ShareModal({ show, itemName, itemId, type, isPublic, onClose, updateStatus}: PublicModalProps) {
    const [copied, setCopied] = useState(false);
    const [localIsPublic, setLocalIsPublic] = useState(isPublic);
    const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const itemLabel = type === "project" ? "project" : "directory";

    const onModalEnter = () => {
        setLocalIsPublic(isPublic);
        setCopied(false);
    };

    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    const url = `${window.location.origin}/${type === "project" ? "view/projects" : "view/directories"}/${itemId}`;
    
    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const onToggle = () => {
        const nextIsPublic = !localIsPublic;
        setLocalIsPublic(nextIsPublic);

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(() => {
            updateStatus(nextIsPublic, type, itemId);
            debounceTimeoutRef.current = null;
        }, 250);
    }

    return (
        <Modal show={show} onHide={onClose} onEnter={onModalEnter} centered>
            <Modal.Header className="flex-column align-items-start gap-1">
                <Modal.Title className="w-100">
                    Share this {itemLabel}
                </Modal.Title>
                <p className="mb-0 text-body-secondary">
                    Manage access for "<span style={{ maxWidth: "70%" }} className="text-truncate d-inline-block align-bottom">{itemName}</span>"
                </p>
                <button className="btn btn-close position-absolute end-0 top-0 m-3" onClick={onClose}/>
            </Modal.Header>
            <Modal.Body className="overflow-y-auto" style={{ maxHeight: "40vh" }}>
                <Form className="mb-3">
                    <div className="d-flex align-items-center justify-content-between border rounded px-3 py-2 bg-body-tertiary">
                        <div>
                            <div className="fw-semibold">{localIsPublic ? "Public link enabled" : "Public link disabled"}</div>
                            <div className="small text-body-secondary">
                                {localIsPublic ? "Anyone with the link can view this item." : "Only shared collaborators can access this item."}
                            </div>
                        </div>
                        <Form.Check
                            id="public-share-toggle"
                            type="switch"
                            label={localIsPublic ? "Public" : "Private"}
                            checked={localIsPublic}
                            onChange={onToggle}
                            className="ms-3"
                        />
                    </div>
                </Form>

                <Form.Label className="small text-body-secondary mb-1">Shareable link</Form.Label>
                <InputGroup>
                    <InputGroup.Text>
                        <Link45deg />
                    </InputGroup.Text>
                    <Form.Control
                        type="text"
                        value={url}
                        readOnly
                        disabled={!localIsPublic}
                        className={localIsPublic ? "" : "text-body-tertiary bg-body-tertiary"}
                        style={{ fontFamily: "monospace", fontSize: "0.875rem" }}
                    />
                    <Button
                        variant={copied ? "success" : "outline-secondary"}
                        onClick={handleCopy}
                        disabled={!localIsPublic}
                    >
                        {copied ? (<><ClipboardCheck className="me-1" /> Copied!</>) 
                                : (<><Clipboard className="me-1" /> Copy</>)}
                    </Button>
                </InputGroup>
                <p className="small text-body-secondary mt-2 mb-0">
                    {localIsPublic ? "This link is active and ready to share." : "Turn on public access to enable copying this link."}
                </p>
            </Modal.Body>
        </Modal>
    );
}

export default ShareModal;