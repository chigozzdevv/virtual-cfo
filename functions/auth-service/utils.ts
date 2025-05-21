import axios from 'axios';
import { ZohoAuthConfig, TokenRequest } from './types';

/**
 * Get configuration from environment variables
 */
export function getZohoAuthConfig(): ZohoAuthConfig {
  const config: ZohoAuthConfig = {
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
export function generateAuthUrl(config: ZohoAuthConfig): string {
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
export async function exchangeCodeForTokens(code: string, config: ZohoAuthConfig): Promise<any> {
  const payload: TokenRequest = {
    grant_type: 'authorization_code',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: config.redirectUri
  };

  try {
    const response = await axios.post(config.tokenUrl, new URLSearchParams(payload as any).toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return { 
      ...response.data,
      created_at: Date.now()
    };
  } catch (error: unknown) {
    console.error('Error exchanging code for tokens:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Failed to exchange code: ${error.response.data.error || 'Unknown error'}`);
    }
    throw error;
  }
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken(refreshToken: string, config: ZohoAuthConfig): Promise<any> {
  const payload: TokenRequest = {
    grant_type: 'refresh_token',
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken
  };

  try {
    const response = await axios.post(config.tokenUrl, new URLSearchParams(payload as any).toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    return {
      ...response.data,
      created_at: Date.now(),
      refresh_token: refreshToken // Zoho doesn't return refresh token on refresh, so we keep the old one
    };
  } catch (error: unknown) {
    console.error('Error refreshing token:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Failed to refresh token: ${error.response.data.error || 'Unknown error'}`);
    }
    throw error;
  }
}

/**
 * Check if a token is expired or about to expire
 */
export function isTokenExpired(tokens: { expires_in: number, created_at: number }, bufferSeconds: number = 300): boolean {
  const expiryTime = tokens.created_at + (tokens.expires_in * 1000);
  const currentTime = Date.now();
  const bufferTime = bufferSeconds * 1000;
  
  return currentTime + bufferTime >= expiryTime;
}