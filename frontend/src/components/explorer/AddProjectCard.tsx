import { useState } from "react";
import { Card } from "react-bootstrap";
import { FileEarmarkPlus } from "react-bootstrap-icons";

export const AddProjectCard = ({onSubmit}: {onSubmit: (value: string) => void}) => {
    const [projectName, setProjectName] = useState("");

    const handleCreate = () => {
        if (projectName.trim()) {
            onSubmit(projectName);
            setProjectName("");
        }
    };

    return (
        <Card
            className={"clickable-card py-2 px-3 d-flex justify-content-center"}
            style={{width: "18rem", minHeight: "4rem", position: "relative", border: "1px dashed var(--bs-border-color)"}}
            key={"addProjectCard.id"}
        >
            <div className={"d-flex flex-row gap-3 align-items-start justify-content-center w-100"}>
                <FileEarmarkPlus
                    size={26}
                    style={{cursor: "pointer"}}
                    onClick={handleCreate}
                    className={projectName.length === 0 ? "text-muted" : ""}
                />

                <div className={"d-flex flex-column align-items-start justify-content-center user-select-none"}>
                    <h5 className={"text-truncate mb-0"} style={{width: "12rem"}}>
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                            placeholder="New project name"
                            className={"border-0 border-bottom mb-0"}
                            style={{
                                outline: "none",
                                width: "11rem",
                                background: "transparent",
                                borderColor: "var(--bs-border-color)"
                            }}
                        />
                    </h5>
                </div>
            </div>

        </Card>
    )

}