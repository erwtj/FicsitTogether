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
import type {NodeDTO, EdgeDTO} from "dtolib";


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
}

const projectContextMap = new Map<string, ProjectContext>(); // projectId -> ProjectContext

const MESSAGE_SYNC = 0;      // Yjs document sync
const MESSAGE_AWARENESS = 1;  // Awareness updates


// TODO: Rewrite
function saveDocument (projectId: string, ydoc: Y.Doc) {
    const nodes = Array.from(ydoc.getMap('nodes').values());
    const edges = Array.from(ydoc.getMap('edges').values());
    const metadata = Array.from(ydoc.getMap('metadata').entries());

    const name = metadata.find(([key, value]) => key === 'name')?.[1] as string || '';
    const description = metadata.find(([key, value]) => key === 'description')?.[1] as string || '';

    const jsonData = {
        nodes, edges
    };

    try {
        projectRepository.updateProjectChart(projectId, jsonData);
        projectRepository.updateProject(projectId, name, description);
    } catch (error) {
        console.error(`Error saving project: ${error}`);
    }
}

function loadDocument (projectId: string): Y.Doc {
    const chart = projectRepository.getProjectChart(projectId);
    const project = projectRepository.getProject(projectId);
    
    const ydoc = new Y.Doc({guid: projectId});
    
    const nodeMap = ydoc.getMap<NodeDTO>('nodes'); // node.id -> node
    const edgeMap = ydoc.getMap<EdgeDTO>('edges'); // edge.id -> edge
    const metadataMap = ydoc.getMap<string>('metadata'); // name | description -> value
    
    const nodes = chart?.nodes || [];
    nodes.forEach((node) => {
        nodeMap.set(node.id, node);
    })
    const edges = chart?.edges || [];
    edges.forEach((edge) => {
        edgeMap.set(edge.id, edge);
    })
    
    metadataMap.set('name', project?.name || '');
    metadataMap.set('description', project?.description || '');
    
    return ydoc;
}

function createContext(projectId: string) {
    if (projectContextMap.has(projectId)) {
        return projectContextMap.get(projectId)!;
    } 
    
    const doc = loadDocument(projectId);
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
    const wss = new WebSocketServer({
        noServer: true // Force manual upgrade so we can authenticate user
    });

    // Upgrade is the initial connection setup (upgrades from http to ws)
    server.on('upgrade', async (request, socket, head) => {
        try {
            const projectId = request?.url?.slice(1);
            if (!projectId) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }
            
            // Extract token from Sec-WebSocket-Protocol header
            const protocols = request.headers['sec-websocket-protocol'];
            let token: string | null = null;

            if (protocols) {
                // Format: "token, <jwt_token>" or just "<jwt_token>"
                const protocolList = protocols.split(',').map(p => p.trim());

                // Look for a protocol that starts with our token prefix
                const tokenProtocol = protocolList.find(p =>
                    p.startsWith('bearer.') || p.length > 100
                );

                if (tokenProtocol) {
                    token = tokenProtocol.startsWith('bearer.')
                        ? tokenProtocol.substring(7)
                        : tokenProtocol;
                }
            }

            // Fallback to Authorization header
            if (!token) {
                token = request.headers.authorization?.replace('Bearer ', '') || null;
            }

            if (!token) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }

            // Verify the token
            const decoded = await verifyWsToken(token);

            const auth0id = decoded.sub;
            const user = userRepository.getUserByAuth0Id(auth0id);

            if (!user) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }
            
            if (!hasProjectAccess(user, projectId)) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }
            
            // Handle the WebSocket upgrade with proper protocol
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

    wss.on('connection', (ws: AuthenticatedWebSocket) => {
        let context: ProjectContext;
        try {
            context = createContext(ws.projectId);
            ws.clientId = context.nextClientId++;
            context?.clients.add(ws);

            // Send initial document state
            const stateVector = Y.encodeStateAsUpdate(context.doc);
            const syncMessage = new Uint8Array([MESSAGE_SYNC, ...stateVector]);
            ws.send(syncMessage);

            // Send current awareness states (who else is online)
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
                return; // Skip non-binary messages (e.g. JSON)
            }

            const message = new Uint8Array(data as ArrayBuffer);
            const messageType = message[0];
            const content = message.slice(1);

            if (messageType === MESSAGE_SYNC) {
                // Yjs document update
                Y.applyUpdate(context.doc, content);

                // Broadcast to other clients
                context.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(data);
                    }
                });

                // Debounced save
                if (context.saveTimeout) clearTimeout(context.saveTimeout);
                context.saveTimeout = setTimeout(() => {
                    saveDocument(ws.projectId, context.doc);
                }, 2000);

            } else if (messageType === MESSAGE_AWARENESS) {
                // Awareness update (cursor, selection, presence)
                applyAwarenessUpdate(context.awareness, content, ws.clientId);

                // Broadcast to other clients
                context.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(data);
                    }
                });
            }
        });
        
        ws.on('close', () => {
            context.clients.delete(ws);

            // Tell other client's this one left
            removeAwarenessStates(context.awareness, [ws.clientId], null);

            // Cleanup if no more clients
            if (context.clients.size === 0) {
                saveDocument(ws.projectId, context.doc);
                projectContextMap.delete(ws.projectId);
            }
        });
    });

    return wss;
}