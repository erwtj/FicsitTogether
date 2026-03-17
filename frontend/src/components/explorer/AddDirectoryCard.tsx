import {FolderPlus} from "react-bootstrap-icons";
import {Card} from "react-bootstrap";
import {useState} from "react";
import "./ExplorerComponents.css"
import { MAX_DIRECTORIES_PER_USER, MAX_NAME_LENGTH } from "dtolib";


export const AddDirectoryCard = ({directoryCount, onSubmit}: {directoryCount: number, onSubmit: (value: string) => void}) => {
    const [directoryName, setDirectoryName] = useState("");

    const maxDirectoriesReached = directoryCount >= MAX_DIRECTORIES_PER_USER;

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        const trimmed = directoryName.trim();
        if (trimmed !== "") {
            onSubmit(trimmed);
            setDirectoryName("");
        }
    }

    return (
        <Card
            className={"py-3 px-3 d-flex flex-column justify-content-center position-relative border-1"}
            style={{
                width: "18rem",
                minHeight: "4rem",
                border: "dashed var(--bs-border-color)"
            }}
            key={"AddDirectoryCard.id"}
        >
            <form className={"d-flex flex-row align-items-center gap-2 w-100"} onSubmit={handleSubmit}>
                <button className="d-inline bg-transparent border-0 p-0 m-0" type="submit" disabled={directoryName.length === 0 || maxDirectoriesReached}>
                    <FolderPlus
                        size={26}
                        className={directoryName.length === 0 ? "text-body-tertiary" : ""}
                    />
                </button>

                <input
                    type="text"
                    value={directoryName}
                    onChange={(e) => setDirectoryName(e.target.value.trimStart())}
                    placeholder="Directory name"
                    className={"border-0 border-bottom mb-0 fs-5"}
                    maxLength={MAX_NAME_LENGTH}
                    disabled={maxDirectoriesReached}
                    style={{
                        outline: "none",
                        width: "11rem",
                        background: "transparent",
                        borderColor: "var(--bs-border-color)"
                    }}
                />

                <small className="text-muted text-nowrap ms-auto mt-1" style={{ fontSize: "0.7rem" }}>
                    {directoryCount} / {MAX_DIRECTORIES_PER_USER}
                </small>
            </form>
        </Card>
    );
}