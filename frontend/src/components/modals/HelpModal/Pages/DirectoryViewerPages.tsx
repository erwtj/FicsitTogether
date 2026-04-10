import {MAX_DIRECTORIES_PER_DIRECTORY, MAX_DIRECTORIES_PER_USER, MAX_DIRECTORY_DEPTH,
    MAX_PROJECTS_PER_DIRECTORY, MAX_PROJECTS_PER_USER } from "dtolib";
import { useState } from "react";
import {Globe, X } from "react-bootstrap-icons";
import "../../ShareModal.tsx.css";
import "../../../../routes/overview.$dir.tsx.css"
import { Card } from "react-bootstrap";
import { getItem } from "ficlib";

export function DirectoriesPageContent() {
    return (
        <div>
            <h1>Directories</h1>
            <p>
                In the explorer, you can view and manage your directories. 
                You can create new directories, share them with other users, and organize your projects.
                The usual way to organize your projects is to create a directory on your home page (/home) for each of your worlds/saves, and then add subdirectories for different categories.
                We don't make the rules though, you can organize your projects any way you want lol.
            </p>
            
            <h3>Directory actions</h3>
            <p>
                Directories can be created, shared, marked public, renamed and deleted. To create a new directory, type the directory name and click the create button in the explorer. 
                To share, mark public, rename or delete a directory, click on the three dots next to the directory name to open the directory actions menu and select the desired action.
                You can also rename the current directory by clicking the pencil icon next to the directory name at the top of the page.
            </p>
            
            <h3>Limits</h3>
            <p>
                Each user can create up to {MAX_DIRECTORIES_PER_USER} directories per account with a maximum of {MAX_DIRECTORIES_PER_DIRECTORY} directories per directory.
                They can be nested {MAX_DIRECTORY_DEPTH} layers deep, but you never have to go that far. 
            </p>
            
            <p>
                These limits apply for the entire account, so if you share a directory with another user, the directories in that directory will count towards your limits. 
                Even if the other person made them.
            </p>
        </div>
    );
}

export function ProjectsPageContent() {
    return (
        <div>
            <h1>Projects</h1>
            <p>
                Projects represent your factories. To keep things organized and fast, you'd create new projects for each different factory. 
                So you'd have a project for steel production, aluminum, rocket fuel, etc. 
            </p> 
            <p>
                Something to note is that you can not create projects on the home page (/home).
                They have to be created inside directories.
            </p>
            
            <h3>Project actions</h3>
            <p>
                Projects can be created, marked public, downloaded, uploaded and deleted. To create a new project, type the project name and click the create button in the explorer while you are inside a directory.
                For all other actions, click on the three dots next to the project name to open the project actions menu and select the desired action.
            </p>
            <p className="border-start border-3 ps-2 pb-1 text-muted">
                Although projects can be marked public, they can not be shared, that feature is only for directories. If you want to share a project, you have to put it in a shared directory.
            </p>
            
            <h3>Limits</h3>
            <p>
                Just like directories, there are limits to how many projects you can create. Each directory can contain up to {MAX_PROJECTS_PER_DIRECTORY} projects, and each user can have up to {MAX_PROJECTS_PER_USER} projects in total.
            </p>
        </div>
    );
}

export function SharingPageContent() {
    const [clickCounter, setClickCounter] = useState(0);
    
    const handleUnshareClick = () => {
        if (clickCounter > 150)
            window.location.href="https://cookieclicker.com/";
        setClickCounter(prev => prev + 1);
    }
    
    return (
        <div>
            <h1>Sharing</h1>
            <p>
                In the Sharing menu (selected from directory dropdown), you can manage who has access to your directories.
                You add people by their username, and they will instantly be able to see the shared directory on their home page.
            </p>
            
            <h3>Permissions</h3>
            <p>
                Currently, there is only one level of permissions, which is read/write access.
                This means that anyone you share a directory with can view, edit and delete the projects in that directory, as well as create new projects and directories inside it.
                The only thing they can not do is share the directory with other people, only the owner can do that.
            </p>
            
            <p>
                If you only want to share a directory with someone without giving them edit access, you can mark the directory as public and share the link with them.
            </p>
            
            <h3>Removing shares</h3>
            <p>
                You can view the list of people you shared a directory with in the Sharing menu. To remove a share, click on the "X" button next to the person's username. This will immediately remove their access to the shared directory, and it will no longer be visible on their home page.
            </p>
            <div className="d-inline-flex border px-2 py-1 fs-6 rounded-3 bg-body-tertiary">
                <span>@some person</span>
                <button className="border-0 bg-transparent p-0 ms-2 rounded-1 unshare-button" onClick={handleUnshareClick}>
                    <X size={20} className="align-text-bottom"/>
                </button>
            </div>
            <span className="ms-3 text-muted">{
                clickCounter > 100 ?
                    "This isn't cookie clicker, you know that right?" :
                clickCounter > 50 ?
                    "It's just kinda sad at this point" :
                clickCounter > 20 ?
                    "Seriously stop" :
                clickCounter > 10 ?
                    "Stop it" :
                clickCounter > 5 ?
                    "Wow you really don't want to share with this person huh" :
                clickCounter > 1 ? 
                    "Yes you unshared them, don't click again":
                clickCounter > 0 ?
                    "You unshared them!" :
                    "Try clicking the X to unshare this person"
            }</span>
            
            <h3 className="mt-3">Leaving a share</h3>
            <p>
                If someone shared a directory with you, you can leave the share by clicking on the three dots next to the shared directory in your home page and selecting "Leave share".
            </p>
        </div>
    );
}

export function PublicSharingPageContent() {
    return (
        <div>
            <h1>Public Sharing</h1>
            <p>
                The Public Sharing tab allows you to share your projects with the public. 
                You can generate shareable links, to showcase your work to literally anyone, even people without an account.
            </p>
            
            <p>
                Anyone with the link can view and download the project, but they can not edit it.
            </p>
            
            <h3>How to mark public</h3>
            <p>
                Both directories and projects can be marked public. Any project or directory contained inside a public directory is also public, even if it is not marked public itself.
            </p>
            <p>
                To mark a directory or project as public, click on the three dots next to its name and select "Publicize".
                This will open a dialog where you can toggle whether the item is public or not, and if it is public, you can copy the shareable link to your clipboard.
            </p>
            
            <p>
                Projects and directories marked public will have a <Globe className="default-purple" style={{marginBottom: ".1rem"}}/> next to their name in the explorer.
            </p>
        </div>
    );
}

const item = getItem("Desc_ModularFrameHeavy_C")!;

export function OverviewPageContent() {
    return (
        <div>
            <h1>Overview Page</h1>
            <div className="d-flex flex-row gap-3 mt-3">
                <div className="d-none d-xxl-block">
                    <Card className="itemCardOverview">
                        <Card.Img variant="top" src={`/media/${item.icon}_256.webp`} className="itemCardImage mb-1" draggable={false} />
                        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '3rem' }}>
                            <Card.Title className="text-center m-0">
                                <h3 className="cardTitle m-0">{item.displayName}</h3>
                            </Card.Title>
                        </div>
                        <Card.Body className="text-center pt-0 pe-1 ps-1 flex-grow-1 d-flex flex-column justify-content-end">
                            Input : 10 <br/>
                            Output : 25 <br/>
                            <span className={"text-success"}>
                                Netto : 15
                            </span>
                        </Card.Body>
                    </Card>
                </div>
                
                <div>
                    <p>
                        The Overview Page provides a summary of all factories/projects in a directory recursively (so even projects in sub-directories are counted).
                        It counts the total resources used and produced as per the input and output nodes.
                    </p>


                    <p>
                        This allows you to output a certain item in one factory, and then consume it in multiple other factory.
                        It shows you the net production/consumption of each item, so you can see how many items you can still use in other projects without running into shortages.
                    </p>

                    <p>
                        To access the overview page, click on the text "Go to overview" on the top right of the directory page.
                    </p>
                </div>
            </div>
        </div>
    );
}