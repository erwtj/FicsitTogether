export function generateNodeId() {
    return `node-${Date.now()}`;
}

// Handle id convention: `node-<nodeId>-(input|output)-handle-<index>`
export function getItemIndexFromHandleId(handleId: string) {
    return parseInt(handleId?.split("-")[4] ?? "-1", 10);
}