import { useState } from "react";
import { Card } from "react-bootstrap";
import { FileEarmarkPlus } from "react-bootstrap-icons";

export const AddProjectCard = ({onSubmit}: {onSubmit: (value: string) => void}) => {
    const [projectName, setProjectName] = useState("");

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        const trimmed = projectName.trim();
        if (trimmed !== "") {
            onSubmit(trimmed);
            setProjectName("");
        }
    }

    return (
        <Card
            className={"py-2 px-3 d-flex align-items-center justify-content-center position-relative border-1"}
            style={{
                width: "18rem",
                minHeight: "4rem",
                border: "dashed var(--bs-border-color)"
            }}
            key={"addProjectCard.id"}
        >
            <form className={"d-flex flex-row gap-2 w-100"} onSubmit={handleSubmit}>
                <button className="d-inline bg-transparent border-0 p-0 m-0" type="submit" disabled={projectName.length === 0}>
                    <FileEarmarkPlus
                        size={26}
                        className={projectName.length === 0 ? "text-muted" : ""}
                    />
                </button>

                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value.trimStart())}
                    placeholder="Project name"
                    className={"border-0 border-bottom mb-0 fs-5"}
                    maxLength={35}
                    style={{
                        outline: "none",
                        width: "12rem",
                        background: "transparent",
                        borderColor: "var(--bs-border-color)"
                    }}
                />
            </form>
        </Card>
    )
}