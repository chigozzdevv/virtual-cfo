// OAuth related types
export interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  api_domain: string;
  token_type: string;
  expires_in: number;
  created_at: number;
}

export interface TokenRecord {
  userIdentifier: string;
  tokens: OAuthTokens;
}

export interface TokenRequest {
  grant_type: string;
  client_id: string;
  client_secret: string;
  refresh_token?: string;
  code?: string;
  redirect_uri?: string;
}

// API responses
export interface TokenResponse {
  success: boolean;
  data?: OAuthTokens;
  error?: string;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  expires_in?: number;
  auth_url?: string;
}

// Environmental configuration
export interface ZohoAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  authBaseUrl: string;
  tokenUrl: string;
  accountsUrl: string;
}