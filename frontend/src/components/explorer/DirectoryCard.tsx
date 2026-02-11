import {Folder, ThreeDotsVertical, } from "react-bootstrap-icons";
import {Dropdown} from "react-bootstrap";
import {useState} from "react";
import {Card} from "react-bootstrap";
import "./explorerComponents.css"

export type DirectoryInfo = {
    id: string;
    name: string;
    isShared: boolean;
    sharedBy?: string;
}


export type DirectoryCardProps = {
    directoryInfo: DirectoryInfo
    deleteDirectory: (directory: DirectoryInfo) => void;
    shareDirectory: (directory: DirectoryInfo) => void;
}

export const DirectoryCard = ({directoryInfo, deleteDirectory, shareDirectory}: DirectoryCardProps) => {
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <Card
            onMouseLeave={() => setShowDropdown(false)}
            className={"clickable-card py-2 px-3 d-flex align-items-center justify-content-center"}
            style={{width: "18rem", minHeight: "4rem", position: "relative", zIndex: showDropdown ? 2000 : 1}}
            key={directoryInfo.id}
        >
            <div className={"d-flex flex-row gap-3 align-items-center justify-content-center w-100"}>
                <Folder size={26} className={""}/>

                <div className={"d-flex flex-column align-items-start justify-content-center"}>
                    <h5 className={"text-truncate mb-0"} style={{width: "10rem"}}>
                        {directoryInfo.name}
                    </h5>
                    {directoryInfo.isShared && directoryInfo.sharedBy && (
                        <small className={"text-muted"}>Shared by: {directoryInfo.sharedBy}</small>
                    )}
                </div>
                <Dropdown className={"z-2"} show={showDropdown}>
                    <Dropdown.Toggle variant={"primary"}
                                     className={"border-0 p-0 bg-transparent no-arrow"}
                                     id={"dropdown-basic"} onClick={() => setShowDropdown(!showDropdown)}>
                        <ThreeDotsVertical size={20} className={"text-secondary ms-auto"} role={"button"} data-bs-toggle={"dropdown"} aria-expanded={false} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu className={"position-fixed z-2"}>
                        <Dropdown.Item href={"#"} className={"delete-option"}
                                       onClick={() => deleteDirectory(directoryInfo)}>Delete</Dropdown.Item>
                        <Dropdown.Item href={"#"} className={"share-option"}
                                       onClick={() => shareDirectory(directoryInfo)}>Share</Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </Card>
    );

}