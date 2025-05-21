"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getZohoAuthConfig = getZohoAuthConfig;
exports.generateAuthUrl = generateAuthUrl;
exports.exchangeCodeForTokens = exchangeCodeForTokens;
exports.refreshAccessToken = refreshAccessToken;
exports.isTokenExpired = isTokenExpired;
const axios_1 = __importDefault(require("axios"));
/**
 * Get configuration from environment variables
 */
function getZohoAuthConfig() {
    const config = {
        clientId: process.env.ZOHO_CLIENT_ID || '',
        clientSecret: process.env.ZOHO_CLIENT_SECRET || '',
        redirectUri: process.env.ZOHO_REDIRECT_URI || '',
        scope: 'ZohoBooks.fullaccess.all',
        authBaseUrl: 'https://accounts.zoho.com/oauth/v2/auth',
        tokenUrl: 'https://accounts.zoho.com/oauth/v2/token',
        accountsUrl: 'https://accounts.zoho.com'
    };
    if (!config.clientId || !config.clientSecret || !config.redirectUri) {
        throw new Error('Zoho OAuth configuration is incomplete');
    }
    return config;
}
/**
 * Generate a Zoho OAuth URL
 */
function generateAuthUrl(config) {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: config.clientId,
        scope: config.scope,
        redirect_uri: config.redirectUri,
        access_type: 'offline',
        prompt: 'consent'
    });
    return `${config.authBaseUrl}?${params.toString()}`;
}
/**
 * Exchange the authorization code for tokens
 */
function exchangeCodeForTokens(code, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const payload = {
            grant_type: 'authorization_code',
            client_id: config.clientId,
            client_secret: config.clientSecret,
            code,
            redirect_uri: config.redirectUri
        };
        try {
            const response = yield axios_1.default.post(config.tokenUrl, new URLSearchParams(payload).toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            return Object.assign(Object.assign({}, response.data), { created_at: Date.now() });
        }
        catch (error) {
            console.error('Error exchanging code for tokens:', error);
            if (axios_1.default.isAxiosError(error) && error.response) {
                throw new Error(`Failed to exchange code: ${error.response.data.error || 'Unknown error'}`);
            }
            throw error;
        }
    });
}
/**
 * Refresh the access token using the refresh token
 */
function refreshAccessToken(refreshToken, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const payload = {
            grant_type: 'refresh_token',
            client_id: config.clientId,
            client_secret: config.clientSecret,
            refresh_token: refreshToken
        };
        try {
            const response = yield axios_1.default.post(config.tokenUrl, new URLSearchParams(payload).toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            return Object.assign(Object.assign({}, response.data), { created_at: Date.now(), refresh_token: refreshToken // Zoho doesn't return refresh token on refresh, so we keep the old one
             });
        }
        catch (error) {
            console.error('Error refreshing token:', error);
            if (axios_1.default.isAxiosError(error) && error.response) {
                throw new Error(`Failed to refresh token: ${error.response.data.error || 'Unknown error'}`);
            }
            throw error;
        }
    });
}
/**
 * Check if a token is expired or about to expire
 */
function isTokenExpired(tokens, bufferSeconds = 300) {
    const expiryTime = tokens.created_at + (tokens.expires_in * 1000);
    const currentTime = Date.now();
    const bufferTime = bufferSeconds * 1000;
    return currentTime + bufferTime >= expiryTime;
}
