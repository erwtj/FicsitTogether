import { useRef, useState } from "react";
import { Card } from "react-bootstrap";
import { FileEarmarkPlus, Upload } from "react-bootstrap-icons";
import "./ExplorerComponents.css";
import { MAX_NAME_LENGTH } from "dtolib";

export const AddProjectCard = ({onSubmit, onUpload}: {onSubmit: (value: string) => void, onUpload: (file: File) => void}) => {
    const [projectName, setProjectName] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const trimmed = projectName.trim();
        if (trimmed !== "") {
            onSubmit(trimmed);
            setProjectName("");
        }
    }

    const handleUpload = () => {
        fileInputRef.current?.click();
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onUpload(file);
            e.target.value = ""; // Reset so the same file can be uploaded again
        }
    }

    return (
        <Card
            className={"py-2 px-3 d-flex flex-row align-items-center justify-content-center position-relative border-1"}
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
                        className={projectName.length === 0 ? "text-body-tertiary" : ""}
                    />
                </button>

                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value.trimStart())}
                    placeholder={"Project name"}
                    className={"border-0 border-bottom mb-0 fs-5"}
                    maxLength={MAX_NAME_LENGTH}
                    style={{
                        outline: "none",
                        width: "11rem",
                        background: "transparent",
                    }}
                />
            </form>

            <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.ficsittogether"
                className="d-none"
                onChange={handleFileChange}
                disabled={projectName.length !== 0}
            />
            <Upload size={26} role="button" className="mt-1 text-muted upload-button" onClick={handleUpload}/>
        </Card>
    )
}