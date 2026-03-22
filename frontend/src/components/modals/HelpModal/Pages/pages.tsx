import type {PageInfo} from "../HelpModal.tsx";
import {EdgesPageContent, NodesPageContent, SloopingPageContent, SidePanelPageContent} from "./ProjectEditorPages.tsx";
import {AccountPageContent, SettingsPageContent, TroubleshootingPageContent} from "./GeneralPages.tsx";
import {
    DirectoriesPageContent, OverviewPageContent,
    ProjectsPageContent,
    PublicSharingPageContent,
    SharingPageContent
} from "./DirectoryViewerPages.tsx";

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
    generalPages,
    directoryViewerPages,
    projectEditorPages,
];