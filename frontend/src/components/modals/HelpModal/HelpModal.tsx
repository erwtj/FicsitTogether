import {Modal, Tab, Row, Col, Nav, Collapse} from "react-bootstrap";
import "./HelpModal.tsx.css"
import { useState } from "react";
import React from "react";
import {CaretDown, CaretRight } from "react-bootstrap-icons";
import {contents} from "./Pages/pages.tsx";

export type HelpModalProps = {
    show: boolean;
    openPage: string | null | undefined;
    onModalClose: () => void;
}

export type PageInfo = {
    id: string;
    title: string;
    subPages?: PageInfo[];
    content?: React.ReactNode;
}

export function HelpModal({ show, openPage, onModalClose }: HelpModalProps) {
    const allPages = contents.flatMap(page => page.subPages ?? [page]);
    const defaultKey = openPage ?? allPages[0]?.id;
    const [activeKey, setActiveKey] = useState<string>(defaultKey);

    // Track which top-level section is open
    const [openSections, setOpenSections] = useState<Set<string>>(
        new Set(
            contents
                .filter(section => (section.subPages ?? [section]).some(p => p.id === defaultKey))
                .map(s => s.id)
        )
    );

    const toggleSection = (id: string) => {
        setOpenSections(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    return (
        <Modal show={show} onHide={onModalClose} scrollable size={'xl'} className="HelpModal" >
            <Modal.Header closeButton>
                <Modal.Title>Help Page</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Tab.Container
                    defaultActiveKey={defaultKey}
                    onSelect={(key) => key && setActiveKey(key)}
                >
                    <Row className="h-100 g-2 g-lg-0">
                        <Col xs={12} lg="auto" className="help-sidebar mt-0 pt-0">
                            <Nav className="flex-column">
                                {contents.map(section => {
                                    const isOpen = openSections.has(section.id);
                                    const pages = section.subPages ?? [section];

                                    return (
                                        <React.Fragment key={section.id}>
                                            <div
                                                className="help-side-bar-top-level"
                                                onClick={() => toggleSection(section.id)}
                                            >
                                                <span className="h5 mb-0">{section.title}</span>
                                                {isOpen ? <CaretDown/> : <CaretRight/>}
                                            </div>

                                            <Collapse in={isOpen} className={"mt-0 pt-0"}>
                                                <div>
                                                    {pages.map(page => (
                                                        <Nav.Item key={page.id} className={`help-side-bar-sub-level ${activeKey === page.id ? "selected" : ""}`}>
                                                            <Nav.Link
                                                                eventKey={page.id}
                                                            >
                                                                <span className="h6">{page.title}</span>
                                                            </Nav.Link>
                                                        </Nav.Item>
                                                    ))}
                                                </div>
                                            </Collapse>
                                        </React.Fragment>
                                    )
                                })}
                            </Nav>
                        </Col>
                        <Col xs={12} lg className="help-content mt-2 mt-lg-0 ps-lg-3 pb-2">
                            <Tab.Content>
                                {allPages.map(page => (
                                    <Tab.Pane key={page.id} eventKey={page.id}>
                                        {page.content}
                                    </Tab.Pane>
                                ))}
                            </Tab.Content>
                        </Col>
                    </Row>
                </Tab.Container>
            </Modal.Body>
        </Modal>
    )
}