import { auth } from 'express-oauth2-jwt-bearer';
import config from '../config/config.js';

export const checkJwt = auth({
    audience: config.auth0Audience,
    issuerBaseURL: `https://${config.auth0Domain}/`,
    tokenSigningAlg: 'RS256'
});
