import { useAuth0Context } from "../../auth/useAuth0Context.ts";
import { useState, useEffect, useRef } from "react";
import * as Y from "yjs";
import { ReactFlow, Background, BackgroundVariant, Controls, MiniMap } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./ChartEditor.css";
import { useYjsSync } from "./useYjsSync";
import { useNodeEdgeHandlers } from "./useNodeEdgeHandlers";

interface ChartEditorProps {
    projectId: string;
}

function ChartEditorInner({ projectId }: ChartEditorProps) {
    const auth = useAuth0Context();
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        auth?.getAccessTokenSilently()?.then(setToken).catch(console.error);
    }, [auth]);

    const ydocRef = useRef<Y.Doc | null>(null);

    const { nodes, setNodes, edges, setEdges, onNodesChangeInternal, onEdgesChangeInternal, onConnect } =
        useNodeEdgeHandlers(ydocRef);

    useYjsSync({ projectId, token, setNodes, setEdges, ydocRef });

    const onDoubleClick = (event: React.MouseEvent) => {
        const doc = ydocRef.current;
        if (!doc) return;

        const bounds = event.currentTarget.getBoundingClientRect();
        const position = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
        const newNode = {
            id: `node-${Date.now()}`,
            type: "default" as const,
            position,
            data: { label: "New Node" },
        };
        doc.getMap("nodes").set(newNode.id, newNode);
    };

    return (
        <div style={{ width: "100%", height: "100vh" }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChangeInternal}
                onEdgesChange={onEdgesChangeInternal}
                onConnect={onConnect}
                onDoubleClickCapture={onDoubleClick}
                fitView
            >
                <Background variant={BackgroundVariant.Cross} className="bg" color="#413D46" gap={40} />
                <Controls />
                <MiniMap />
            </ReactFlow>
        </div>
    );
}

export default function ChartEditor(props: ChartEditorProps) {
    return <ChartEditorInner {...props} />;
}