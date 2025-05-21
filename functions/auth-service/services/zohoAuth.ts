import * as catalyst from 'zcatalyst-sdk-node';
import { OAuthTokens, TokenRecord } from '../types';
import { exchangeCodeForTokens, refreshAccessToken, isTokenExpired, getZohoAuthConfig } from '../utils';

export class ZohoAuthService {
  private table: any;
  private config: any;
  
  constructor(catalystApp: catalyst.App) {
    const datastore = catalystApp.datastore();
    this.table = datastore.table('OAuthTokens');
    this.config = getZohoAuthConfig();
  }
  
  /**
   * Exchange authorization code for tokens and store them
   */
  async storeTokensFromCode(code: string, userIdentifier: string): Promise<OAuthTokens> {
    try {
      const tokens = await exchangeCodeForTokens(code, this.config);
      await this.storeTokens(userIdentifier, tokens);
      return tokens;
    } catch (error: unknown) {
      console.error('Error storing tokens from code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to store tokens: ${errorMessage}`);
    }
  }
  
  /**
   * Store tokens in Catalyst Data Store
   */
  async storeTokens(userIdentifier: string, tokens: OAuthTokens): Promise<void> {
    try {
      // Get all rows and filter for the user
      const allRows = await this.table.getAllRows();
      const existingRow = allRows.find((row: any) => row.userIdentifier === userIdentifier);
      
      if (existingRow) {
        // Update existing record
        await this.table.updateRow({
          ROWID: existingRow.ROWID, // Use ROWID for updating
          userIdentifier,
          tokens: JSON.stringify(tokens)
        });
      } else {
        // Insert new record
        await this.table.insertRow({
          userIdentifier,
          tokens: JSON.stringify(tokens)
        });
      }
    } catch (error: unknown) {
      console.error('Error storing tokens:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to store tokens: ${errorMessage}`);
    }
  }
  
  /**
   * Get tokens for a specific user
   */
  async getTokens(userIdentifier: string): Promise<OAuthTokens | null> {
    try {
      // Get all rows and filter
      const allRows = await this.table.getAllRows();
      const userRow = allRows.find((row: any) => row.userIdentifier === userIdentifier);
      
      if (!userRow) {
        return null;
      }
      
      return JSON.parse(userRow.tokens);
    } catch (error: unknown) {
      console.error('Error getting tokens:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get tokens: ${errorMessage}`);
    }
  }
  
  /**
   * Get valid tokens, refreshing if necessary
   */
  async getValidTokens(userIdentifier: string): Promise<OAuthTokens | null> {
    try {
      const tokens = await this.getTokens(userIdentifier);
      
      if (!tokens) {
        return null;
      }
      
      // Check if tokens are expired
      if (isTokenExpired(tokens)) {
        // Refresh tokens
        const refreshedTokens = await refreshAccessToken(tokens.refresh_token, this.config);
        await this.storeTokens(userIdentifier, refreshedTokens);
        return refreshedTokens;
      }
      
      return tokens;
    } catch (error: unknown) {
      console.error('Error getting valid tokens:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get valid tokens: ${errorMessage}`);
    }
  }
  
  /**
   * Revoke tokens for a user
   */
  async revokeTokens(userIdentifier: string): Promise<boolean> {
    try {
      // Get all rows and filter
      const allRows = await this.table.getAllRows();
      const userRow = allRows.find((row: any) => row.userIdentifier === userIdentifier);
      
      if (!userRow) {
        return false;
      }
      
      await this.table.deleteRow(userRow.ROWID);
      return true;
    } catch (error: unknown) {
      console.error('Error revoking tokens:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to revoke tokens: ${errorMessage}`);
    }
  }
}