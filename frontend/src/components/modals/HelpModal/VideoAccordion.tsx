import { useRef } from "react";
import {Accordion} from "react-bootstrap";

export type VideoAccordionProps = {
    source: string;
    title: string;
}

export function VideoAccordion({source, title}: VideoAccordionProps) {
    const itemRef = useRef<HTMLDivElement | null>(null);

    return (
        <Accordion>
            <Accordion.Item ref={itemRef} eventKey={source} className="w-75">
                <Accordion.Header
                    onClick={() => {
                        // Wait for collapse animation, then scroll video block into view
                        setTimeout(() => {
                            itemRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                        }, 250);
                    }}
                >
                    {title}
                </Accordion.Header>
                <Accordion.Body>
                    <video width="100%" loop autoPlay muted controls controlsList="nodownload noplaybackrate noremoteplayback">
                        <source src={source} type="video/webm"/>
                        Your browser does not support the video tag.
                    </video>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>

    )
}