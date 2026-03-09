import {Folder, ThreeDotsVertical, } from "react-bootstrap-icons";
import {Dropdown} from "react-bootstrap";
import {useState} from "react";
import {Card} from "react-bootstrap";
import "./ExplorerComponents.css"
import {Link} from "@tanstack/react-router";

export type DirectoryInfo = {
    id: string;
    name: string;
    isShared: boolean;
    sharedBy?: string;
}


export type DirectoryCardProps = {
    directoryInfo: DirectoryInfo
    deleteDirectory?: (directory: DirectoryInfo) => void; // Callback for deleting the directory
    shareDirectory?: (directory: DirectoryInfo) => void; // Callback for sharing the directory
    leaveDirectory?: (directory: DirectoryInfo) => void; // Optional callback for leaving the directory
}

export const DirectoryCard = ({directoryInfo, deleteDirectory, shareDirectory, leaveDirectory}: DirectoryCardProps) => {
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <Card
            onMouseLeave={() => setShowDropdown(false)}
            className={"clickable-card py-2 px-3 d-flex align-items-center justify-content-center"}
            style={{width: "18rem", minHeight: "4rem", position: "relative"}}
            key={directoryInfo.id}
        >
            <Link to={"/directories/$dir"} params={{ dir: directoryInfo.id }} className={"stretched-link"}></Link>
            <div className={"d-flex flex-row align-items-center justify-content-center w-100"}>
                {/* We can not replace me-2 with gap-2, since this will cause the directory icon to shrink */}
                <Folder size={26} className={"me-2"}/>

                <div className={"d-flex flex-column align-items-start justify-content-center"}>
                    {directoryInfo.name.length === 0 ?
                        <h5 className={"text-truncate mb-0 text-muted fst-italic"} style={{width: "10rem", height: "1.7rem"}} key="title">No name</h5> :
                        <h5 className={"text-truncate mb-0"} style={{width: "12rem", height: "1.7rem"}} key="title">{directoryInfo.name}</h5>
                    }

                    {directoryInfo.isShared && directoryInfo.sharedBy && (
                        <small className={"text-muted"}>Shared by: {directoryInfo.sharedBy}</small>
                    )}
                </div>
                <Dropdown className={"ms-auto"} style={{zIndex: showDropdown ? 3 : 2}} show={showDropdown}>
                    <Dropdown.Toggle variant={"primary"}
                                     className="dropdown-toggle p-0 no-arrow align-top"
                                     id={"dropdown-basic"} onClick={() => setShowDropdown(!showDropdown)}
                    >
                        <ThreeDotsVertical size={20} className={"text-secondary"} role={"button"} data-bs-toggle={"dropdown"} aria-expanded={false} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu className={"p-0 z-2"} popperConfig={{ strategy: 'fixed' }} renderOnMount>
                        {deleteDirectory && !directoryInfo.isShared && (
                            <Dropdown.Item href={"#"} className={"dropdown-option delete-option user-select-none"}
                                           onClick={() => deleteDirectory(directoryInfo)}>Delete</Dropdown.Item>
                        )}
                        {shareDirectory && !directoryInfo.isShared && (
                            <Dropdown.Item href={"#"} className={"dropdown-option share-option user-select-none"}
                                           onClick={() => shareDirectory(directoryInfo)}>Share</Dropdown.Item>
                        )}
                        {leaveDirectory && directoryInfo.isShared && (
                            <Dropdown.Item href={"#"} className={"dropdown-option delete-option user-select-none"}
                                           onClick={() => leaveDirectory(directoryInfo)}>Leave</Dropdown.Item>
                        )}
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </Card>
    );

}