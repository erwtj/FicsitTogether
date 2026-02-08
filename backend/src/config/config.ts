import dotenv from 'dotenv'
import * as process from "node:process";

dotenv.config();

interface Config {
    apiPort: number;
    wsPort: number;
    corsOrigin: string;
    https: boolean;
    auth0Audience: string;
    auth0Domain: string;
    auth0ClientId: string;
}

const config: Config = {
    apiPort: Number(process.env.API_PORT) || 3000,
    wsPort: Number(process.env.WS_PORT) || 3001,
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
    https: (process.env.HTTPS === 'true') || false,
    auth0Audience: process.env.AUTH0_AUDIENCE || "AUTH0-AUDIENCE",
    auth0Domain: process.env.AUTH0_DOMAIN || "AUTH0-DOMAIN",
    auth0ClientId: process.env.AUTH0_CLIENT_ID || "AUTH0-CLIENT-ID",
};

export default config;