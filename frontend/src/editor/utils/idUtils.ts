export function generateNodeId() {
    return `node-${crypto.randomUUID().replace('-', '')}`;
}

// Handle id convention: `node-<nodeId>-(input|output)-handle-<index>`
export function getItemIndexFromHandleId(handleId: string) {
    return parseInt(handleId?.split("-")[4] ?? "-1", 10);
}