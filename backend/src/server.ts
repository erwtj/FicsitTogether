import app from './app.js';
import config from './config/config.js';
import * as fs from "node:fs";
import * as https from "node:https";
import * as http from "node:http";
import {setupWebSocketServer} from "./sockets/projectSocket.js";
import {initDatabase} from "./repository/database.js";

async function start() {
    await initDatabase();

    if (config.https) {
        const options = {
            key: fs.readFileSync('cert.key'),
            cert: fs.readFileSync('cert.pem'),
        }

        const server = https.createServer(options, app);
        setupWebSocketServer(server);

        server.listen(config.apiPort, () => {
            console.log(`Server is running on https://localhost:${config.apiPort}`);
        });
    } else {
        const server = http.createServer(app);
        setupWebSocketServer(server);

        server.listen(config.apiPort, () => {
            console.log(`Server is running on http://localhost:${config.apiPort}`);
        });
    }
}

start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
