import type {PageInfo} from "../HelpModal.tsx";
import {EdgesPageContent, NodesPageContent, SloopingPageContent, SidePanelPageContent} from "./ProjectEditorPages.tsx";
import {AccountPageContent, SettingsPageContent, TroubleshootingPageContent} from "./GeneralPages.tsx";
import {
    DirectoriesPageContent, OverviewPageContent,
    ProjectsPageContent,
    PublicSharingPageContent,
    SharingPageContent
} from "./DirectoryViewerPages.tsx";
import { QuestionCircle } from "react-bootstrap-icons";

const welcomePage: PageInfo = {
    id: "welcome",
    title: "Welcome!",
    content: (
        <div>
            <h1>Welcome pioneer!</h1>
            <p>
                This is probably your first time using Ficsit Together. We recommend you at least skim through some of the content in this popup.
                Use the sidebar to navigate through different sections of the help documentation.
            </p>
            <p>You can open this popup whenever you see a <QuestionCircle style={{marginBottom: ".1rem"}}/> by clicking on it, or by pressing 'h' on your keyboard anywhere (yes, anywhere).</p>
        </div>
    )
}

const directoryViewerPages: PageInfo = {
    id: "dirViewer",
    title: "Directory Viewer",
    subPages: [
        {
            id: "directories",
            title: "Directories",
            content: <DirectoriesPageContent/>
        },
        {
            id: "projects",
            title: "Projects",
            content: <ProjectsPageContent/>
        },
        {
            id: "sharing",
            title: "Sharing",
            content: <SharingPageContent/>
        },
        {
            id: "publicSharing",
            title: "Public Sharing",
            content: <PublicSharingPageContent/>
        },
        {
            id: "overviewPage",
            title: "Overview Page",
            content: <OverviewPageContent/>
        }
    ]
}

const projectEditorPages: PageInfo = {
    id: "projectEditor",
    title: "Project Editor",
    subPages: [
        {
            id: "nodes",
            title: "Nodes",
            content: <NodesPageContent/>
        },
        {
            id: "edges",
            title: "Edges",
            content: <EdgesPageContent/>
        },
        {
            id: "somersloop",
            title: "Somersloops",
            content: <SloopingPageContent/>
        },
        {
            id: "sidePanel",
            title: "Side Panel",
            content: <SidePanelPageContent/>
        }
    ]
}

const generalPages: PageInfo = {
    id: "general",
    title: "General",
    subPages: [
        {
            id: "account",
            title: "Your Account",
            content: <AccountPageContent/>
        },
        {
            id: "settings",
            title: "Client Settings",
            content: <SettingsPageContent/>
        },
        {
            id: "troubleshooting",
            title: "Troubleshooting",
            content: <TroubleshootingPageContent/>
        }
    ]
}


export const contents: PageInfo[] = [
    welcomePage,
    generalPages,
    directoryViewerPages,
    projectEditorPages,
];