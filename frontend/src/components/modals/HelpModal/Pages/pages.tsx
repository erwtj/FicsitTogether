import type {PageInfo} from "../HelpModal.tsx";
import {EdgesPageContent, NodesPageContent, SloopingPageContent, SidePanelPageContent} from "./ProjectEditorPages.tsx";

const directoryViewerPages: PageInfo = {
    id: "dirViewer",
    title: "Directory Viewer",
    subPages: [
        {
            id: "folders",
            title: "Folders",
            content: (<div>General1</div>)
        },
        {
            id: "projects",
            title: "Projects",
            content: (<div>General2</div>)
        },
        {
            id: "sharing",
            title: "Sharing",
            content: (<div>General3</div>)
        },
        {
            id: "publicSharing",
            title: "Public Sharing",
            content: (<div>General3</div>)
        },
        {
            id: "overviewPage",
            title: "Overview Page",
            content: (<div>General3</div>)
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
            title: "Account Management",
            content: (<div>General1</div>)
        },
        {
            id: "settings",
            title: "Settings",
            content: (<div>General2</div>)
        },
        {
            id: "troubleshooting",
            title: "Troubleshooting",
            content: (<div>General3</div>)
        }
    ]
}


export const contents: PageInfo[] = [
    generalPages,
    directoryViewerPages,
    projectEditorPages,
];