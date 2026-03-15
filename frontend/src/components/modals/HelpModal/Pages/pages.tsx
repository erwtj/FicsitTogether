import type {PageInfo} from "../HelpModal.tsx";
import {EdgesPageContent, NodesPageContent, SloopingPageContent, SidePanelPageContent} from "./ProjectEditorPages.tsx";

export const directoryViewerPages: PageInfo = {
    id: "dirViewer",
    title: "Directory Viewer",
    subPages: [
        {
            id: "Folders",
            title: "Folders",
            content: (<div>General1</div>)
        },
        {
            id: "Projects",
            title: "Projects",
            content: (<div>General2</div>)
        },
        {
            id: "Sharing",
            title: "Sharing",
            content: (<div>General3</div>)
        },
        {
            id: "Public Sharing",
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

export const projectEditorPages: PageInfo = {
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