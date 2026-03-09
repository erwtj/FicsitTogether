import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { verifyWsToken, type DecodedToken } from '../middlewares/wsAuth.js';
import * as projectRepository from "../repository/projectRepository.js";
import * as userRepository from "../repository/userRepository.js";
import type {User} from "../repository/userRepository.js";
import * as Y from "yjs";
import { Awareness } from 'y-protocols/awareness';
import {
    encodeAwarenessUpdate,
    applyAwarenessUpdate,
    removeAwarenessStates
} from 'y-protocols/awareness';
import {hasProjectAccess} from "../middlewares/directoryAccess.js";
import {type NodeDTO, type EdgeDTO, MAX_NAME_LENGTH, MAX_DESCRIPTION_LENGTH} from "dtolib";
import {sanitizeChart} from "../utils/chartValidator.js";

// Data for an authenticated user connected via websocket
interface AuthenticatedWebSocket extends WebSocket {
    user: User;
    userToken?: DecodedToken;
    clientId: number; // Unique ID for this connection, the same user can be connected multiple times so refer to this id instead of user.id
    projectId: string;
}

// Context for a websocket connection, every existing project pool has a context describing connected clients and document data
interface ProjectContext {
    clients: Set<AuthenticatedWebSocket>; // Client's connected to document
    doc: Y.Doc; // YDoc document data for this project (nodes, edges, metadata [name, description])
    awareness: Awareness; // Contains online user info, selections, cursor position
    saveTimeout?: NodeJS.Timeout;
    nextClientId: number;
    saveAbortController?: AbortController | undefined; // Abort the current in-flight save so a newer one can take over
}

const projectContextMap = new Map<string, ProjectContext>(); // projectId -> ProjectContext

const MESSAGE_SYNC = 0;      // Yjs document sync
const MESSAGE_AWARENESS = 1;  // Awareness updates


async function saveDocument(projectId: string, context: ProjectContext) {
    // Abort any in-flight save — the new snapshot is always more up to date
    context.saveAbortController?.abort();
    const abortController = new AbortController();
    context.saveAbortController = abortController;

    // Snapshot Yjs state synchronously before any await
    const nodesJson = context.doc.getMap('nodes').toJSON();
    const edgesJson = context.doc.getMap('edges').toJSON();
    const metadataJson = context.doc.getMap('metadata').toJSON();

    const name = (metadataJson['name'] as string).slice(0, MAX_NAME_LENGTH) || '';
    const description = (metadataJson['description'] as string).slice(0, MAX_DESCRIPTION_LENGTH) || '';
    const jsonData = sanitizeChart({ nodes: Object.values(nodesJson), edges: Object.values(edgesJson) });

    try {
        await Promise.all([
            projectRepository.updateProjectChart(projectId, jsonData),
            projectRepository.updateProject(projectId, name, description),
        ]);

        if (abortController.signal.aborted) return; // A newer save already took over
        context.saveAbortController = undefined;
    } catch (error) {
        if (!abortController.signal.aborted) {
            console.error(`Error saving project ${projectId}:`, error);
        }
        // If aborted, silently discard, the newer save will persist the correct data
    }
}

async function loadDocument(projectId: string): Promise<Y.Doc> {
    const [chart, project] = await Promise.all([
        projectRepository.getProjectChart(projectId),
        projectRepository.getProject(projectId),
    ]);

    const ydoc = new Y.Doc({guid: projectId});

    const nodeMap = ydoc.getMap<NodeDTO>('nodes');
    const edgeMap = ydoc.getMap<EdgeDTO>('edges');
    const metadataMap = ydoc.getMap<string>('metadata');

    const nodes = chart?.nodes || [];
    nodes.forEach((node) => nodeMap.set(node.id, node));
    const edges = chart?.edges || [];
    edges.forEach((edge) => edgeMap.set(edge.id, edge));

    metadataMap.set('name', project?.name || '');
    metadataMap.set('description', project?.description || '');
    metadataMap.set('directoryId', project?.directoryId || '');

    return ydoc;
}

async function createContext(projectId: string) {
    if (projectContextMap.has(projectId)) {
        return projectContextMap.get(projectId)!;
    }

    const doc = await loadDocument(projectId);
    const context = {
        clients: new Set<AuthenticatedWebSocket>(),
        doc: doc,
        awareness: new Awareness(doc),
        nextClientId: 1,
    } as ProjectContext;

    projectContextMap.set(projectId, context);
    return context;
}

export function setupWebSocketServer(server: Server) {
    const wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', async (request, socket, head) => {
        try {
            const projectId = request?.url?.slice(1);
            if (!projectId) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }

            const protocols = request.headers['sec-websocket-protocol'];
            let token: string | null = null;

            if (protocols) {
                const protocolList = protocols.split(',').map(p => p.trim());
                const tokenProtocol = protocolList.find(p =>
                    p.startsWith('bearer.') || p.length > 100
                );
                if (tokenProtocol) {
                    token = tokenProtocol.startsWith('bearer.')
                        ? tokenProtocol.substring(7)
                        : tokenProtocol;
                }
            }

            if (!token) {
                token = request.headers.authorization?.replace('Bearer ', '') || null;
            }

            if (!token) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }

            const decoded = await verifyWsToken(token);
            const auth0id = decoded.sub;
            const user = await userRepository.getUserByAuth0Id(auth0id);

            if (!user) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }

            if (!await hasProjectAccess(user, projectId)) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }

            wss.handleUpgrade(request, socket, head, (ws) => {
                const authWs = ws as AuthenticatedWebSocket;
                authWs.user = user;
                authWs.projectId = projectId;
                wss.emit('connection', authWs, request);
            });
        } catch (error) {
            console.error('WebSocket authentication error:', error);
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
        }
    });

    wss.on('connection', async (ws: AuthenticatedWebSocket) => {
        let context: ProjectContext;
        try {
            context = await createContext(ws.projectId);
            ws.clientId = context.nextClientId++;
            context?.clients.add(ws);

            const stateVector = Y.encodeStateAsUpdate(context.doc);
            const syncMessage = new Uint8Array([MESSAGE_SYNC, ...stateVector]);
            ws.send(syncMessage);

            const awarenessUpdate = encodeAwarenessUpdate(
                context.awareness,
                Array.from(context.awareness.getStates().keys())
            );
            const awarenessMessage = new Uint8Array([MESSAGE_AWARENESS, ...awarenessUpdate]);
            ws.send(awarenessMessage);
        } catch (e) {
            ws.close(1008, 'Connection failed.');
            return;
        }

        ws.on('message', (data) => {
            if (!(data instanceof Buffer || data instanceof ArrayBuffer)) {
                return;
            }

            const message = new Uint8Array(data as ArrayBuffer);
            const messageType = message[0];
            const content = message.slice(1);

            if (messageType === MESSAGE_SYNC) {
                Y.applyUpdate(context.doc, content);

                context.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(data);
                    }
                });

                if (context.saveTimeout) clearTimeout(context.saveTimeout);
                context.saveTimeout = setTimeout(() => {
                    saveDocument(ws.projectId, context);
                }, 2000);

            } else if (messageType === MESSAGE_AWARENESS) {
                applyAwarenessUpdate(context.awareness, content, ws.clientId);

                context.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(data);
                    }
                });
            }
        });

        ws.on('close', () => {
            context.clients.delete(ws);
            removeAwarenessStates(context.awareness, [ws.clientId], null);

            if (context.clients.size === 0) {
                // Cancel any pending debounced save, we're saving right now
                if (context.saveTimeout) clearTimeout(context.saveTimeout);
                saveDocument(ws.projectId, context);
                projectContextMap.delete(ws.projectId);
            }
        });
    });

    return wss;
}