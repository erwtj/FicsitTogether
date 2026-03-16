import dotenv from 'dotenv'
import * as process from "node:process";

dotenv.config();

interface Config {
    apiPort: number;
    corsOrigin: string;
    https: boolean;
    auth0Audience: string;
    auth0Domain: string;
    auth0ClientId: string;
    environment: string;
    databaseUrl: string;
    trustProxy: boolean | number | string;
    publicRateLimitWindowMs: number;
    publicRateLimitMaxRequests: number;
}

const parseTrustProxy = (): boolean | number | string => {
    const rawValue = process.env.TRUST_PROXY;

    if (!rawValue) {
        return false;
    }

    if (rawValue === 'true') {
        return true;
    }

    if (rawValue === 'false') {
        return false;
    }

    const asNumber = Number(rawValue);
    if (!Number.isNaN(asNumber) && Number.isInteger(asNumber)) {
        return asNumber;
    }

    return rawValue;
};

const config: Config = {
    apiPort: Number(process.env.API_PORT) || 3000,
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
    https: (process.env.HTTPS === 'true') || false,
    auth0Audience: process.env.AUTH0_AUDIENCE || "AUTH0-AUDIENCE",
    auth0Domain: process.env.AUTH0_DOMAIN || "AUTH0-DOMAIN",
    auth0ClientId: process.env.AUTH0_CLIENT_ID || "AUTH0-CLIENT-ID",
    environment: process.env.NODE_ENV || 'development',
    databaseUrl: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/ficsittogether",
    trustProxy: parseTrustProxy(),
    publicRateLimitWindowMs: Number(process.env.PUBLIC_RATE_LIMIT_WINDOW_MS) || 60_000,
    publicRateLimitMaxRequests: Number(process.env.PUBLIC_RATE_LIMIT_MAX_REQUESTS) || 100,
};

export default config;