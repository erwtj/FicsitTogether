import {FolderPlus} from "react-bootstrap-icons";
import {Card} from "react-bootstrap";
import {useState} from "react";
import "./explorerComponents.css"


export const DirectoryAddFolderCard = ({onSubmit}: {onSubmit: (value: string) => void}) => {
    const [folderName, setFolderName] = useState("");

    const handleCreate = () => {
        if (folderName.trim()) {
            onSubmit(folderName);
            setFolderName("");
        }
    };

    return (
        <Card
            className={"clickable-card py-2 px-3 d-flex align-items-center justify-content-center"}
            style={{
                width: "18rem",
                minHeight: "4rem",
                position: "relative",
                border: "1px dashed var(--bs-border-color)"
            }}
            key={"DirectoryAddFolderCard.id"}
        >
            <div className={"d-flex flex-row gap-3 align-items-center justify-content-center w-100"}>
                <FolderPlus
                    size={26}
                    style={{cursor: "pointer"}}
                    onClick={handleCreate}
                    className={folderName.length === 0 ? "text-muted" : ""}
                />

                <div className={"d-flex flex-column align-items-start justify-content-center"}>
                    <h5 className={"text-truncate mb-0"} style={{width: "10rem"}}>
                        <input
                            type="text"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                            placeholder="New folder name"
                            className={"border-0 border-bottom mb-0"}
                            style={{
                                outline: "none",
                                width: "10rem",
                                background: "transparent",
                                borderColor: "var(--bs-border-color)"
                            }}
                        />
                    </h5>
                </div>
                <div>
                    <div style={{width: 20, height: 20}}>
                        {/* Hidden placeholder for alignment */}
                    </div>
                </div>

            </div>
        </Card>
    );

}