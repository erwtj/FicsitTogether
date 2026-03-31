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
import {canEditProject} from "../middlewares/directoryAccess.js";
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
const MESSAGE_SYNC_STEP_1 = 2; // Client sends state vector
const MESSAGE_SYNC_STEP_2 = 3; // Server sends missing updates


async function saveDocument(projectId: string, context: ProjectContext) {
    // Abort any in-flight save — the new snapshot is always more up to date
    context.saveAbortController?.abort();
    const abortController = new AbortController();
    context.saveAbortController = abortController;

    if (!context.doc.getMap('nodes') || !context.doc.getMap('edges') || !context.doc.getMap('metadata')) {
        console.warn(`Project ${projectId} is missing required Yjs maps, skipping save.`);
        return;
    }

    // Snapshot Yjs state synchronously before any await
    const nodesJson = context.doc.getMap('nodes').toJSON();
    const edgesJson = context.doc.getMap('edges').toJSON();
    const metadataJson = context.doc.getMap('metadata').toJSON();

    const name = (metadataJson['name'] as string | undefined)?.slice(0, MAX_NAME_LENGTH) || '';
    const description = (metadataJson['description'] as string | undefined)?.slice(0, MAX_DESCRIPTION_LENGTH) || '';
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

            if (!await canEditProject(user, projectId)) {
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
            if (error instanceof Error && error.name === 'TokenExpiredError') {
                // console.warn('WebSocket authentication error: token expired');
            } else {
                console.error('WebSocket authentication error:', error);
            }
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
        }
    });

    wss.on('connection', async (ws: AuthenticatedWebSocket) => {
        let context: ProjectContext | null = null;
        let isReady = false; // Flag to track if context is initialized
        const pendingMessages: Buffer[] = []; // Queue messages received before context is ready
        
        const processMessage = (data: Buffer) => {
            if (!context) return; // Safety check, should never happen when isReady is true
            
            const message = new Uint8Array(data);
            const messageType = message[0];
            const content = message.slice(1);

            if (messageType === MESSAGE_SYNC_STEP_1) {
                // Client sent their state vector - bidirectional sync
                const clientStateVector = content;

                // Send client the updates they're missing from server
                const updateForClient = Y.encodeStateAsUpdate(context.doc, clientStateVector);
                const syncStep2Message = new Uint8Array([MESSAGE_SYNC_STEP_2, ...updateForClient]);
                ws.send(syncStep2Message);

                // Request updates from client that server is missing
                const serverStateVector = Y.encodeStateVector(context.doc);
                const syncRequestMessage = new Uint8Array([MESSAGE_SYNC_STEP_1, ...serverStateVector]);
                ws.send(syncRequestMessage);

            } else if (messageType === MESSAGE_SYNC) {
                Y.applyUpdate(context.doc, content);

                context.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(data);
                    }
                });

                if (context.saveTimeout) clearTimeout(context.saveTimeout);
                context.saveTimeout = setTimeout(() => {
                    saveDocument(ws.projectId, context!);
                }, 2000);

            } else if (messageType === MESSAGE_AWARENESS) {
                applyAwarenessUpdate(context.awareness, content, ws.clientId);

                context.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(data);
                    }
                });
            }
        };
        
        // Set up message handler immediately to capture any messages that arrive
        // while we're waiting for createContext to complete
        ws.on('message', (data) => {
            if (!(data instanceof Buffer || data instanceof ArrayBuffer)) {
                return;
            }

            // If context isn't ready yet, queue the message for later processing
            if (!isReady) {
                pendingMessages.push(Buffer.from(data as ArrayBuffer));
                return;
            }

            processMessage(data as Buffer);
        });

        // Initialize context
        try {
            context = await createContext(ws.projectId);
            ws.clientId = context.nextClientId++;
            context.clients.add(ws);

            // Send awareness state to new client
            const awarenessUpdate = encodeAwarenessUpdate(
                context.awareness,
                Array.from(context.awareness.getStates().keys())
            );
            const awarenessMessage = new Uint8Array([MESSAGE_AWARENESS, ...awarenessUpdate]);
            ws.send(awarenessMessage);
            
            // Mark as ready and process any queued messages
            isReady = true;
            for (const msg of pendingMessages) {
                processMessage(msg);
            }
            pendingMessages.length = 0; // Clear the queue
        } catch (e) {
            console.error('Failed to create context for project:', ws.projectId, e);
            ws.close(1008, 'Connection failed.');
            return;
        }

        // Cloudflare has a 100-second idle timeout, so ping every 30s to stay alive
        let isAlive = true;
        ws.on('pong', () => {
            isAlive = true;
        });

        const interval = setInterval(() => {
            if (!isAlive) {
                console.log(`WebSocket client ${ws.clientId} failed to respond to ping, terminating`);
                ws.terminate();
                return;
            }
            
            if (ws.readyState === ws.OPEN) {
                isAlive = false;
                ws.ping();
            }
        }, 30000);

        ws.on('close', async () => {
            clearInterval(interval);
            
            // If context was never initialized, nothing to clean up
            if (!isReady) return;

            context.clients.delete(ws);
            removeAwarenessStates(context.awareness, [ws.clientId], null);

            if (context.clients.size === 0) {
                // Cancel any pending debounced save and do a final save now
                if (context.saveTimeout) clearTimeout(context.saveTimeout);
                // Remove from map immediately so no new clients create a stale context,
                // but await the save before fully tearing down so it completes cleanly
                projectContextMap.delete(ws.projectId);
                await saveDocument(ws.projectId, context);
            }
        });
    });

    return wss;
}