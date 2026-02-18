import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import config from '../config/config.js';

const client = jwksClient({
    jwksUri: `https://${config.auth0Domain}/.well-known/jwks.json`,
    cache: true,
    rateLimit: true
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
    client.getSigningKey(header.kid, (err, key) => {
        if (err) {
            callback(err);
            return;
        }
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
    });
}

export interface DecodedToken {
    sub: string;
    [key: string]: any;
}

export function verifyWsToken(token: string): Promise<DecodedToken> {
    return new Promise((resolve, reject) => {
        jwt.verify(
            token,
            getKey,
            {
                audience: config.auth0Audience,
                issuer: `https://${config.auth0Domain}/`,
                algorithms: ['RS256']
            },
            (err, decoded) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(decoded as DecodedToken);
                }
            }
        );
    });
}