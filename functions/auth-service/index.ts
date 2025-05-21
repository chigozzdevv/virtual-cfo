// In your file
import express from 'express';
import { Request, Response } from 'express';
const catalyst = require('zcatalyst-sdk-node');
import { ZohoAuthService } from './services/zohoAuth';
import { AuthStatusResponse, TokenResponse } from './types';
import { generateAuthUrl, getZohoAuthConfig } from './utils';

const app = express();

app.use(express.json());

// Handle OAuth callback
app.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query;
    const catalystApp = catalyst.initialize(req);
    
    if (!code || typeof code !== 'string') {
      return res.status(400).send('Authorization code is missing');
    }
    
    // Extract user identifier from state or use default
    const userIdentifier = typeof state === 'string' ? state : 'default';
    
    const authService = new ZohoAuthService(catalystApp);
    await authService.storeTokensFromCode(code, userIdentifier);
    
    // Send HTML that communicates with the opener window
    res.send(`
      <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding-top: 50px; }
            h2 { color: #4CAF50; }
            .loader { 
              border: 5px solid #f3f3f3; 
              border-top: 5px solid #3498db; 
              border-radius: 50%;
              width: 40px; 
              height: 40px; 
              animation: spin 2s linear infinite;
              margin: 20px auto;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <h2>Authentication Successful!</h2>
          <p>You can close this window now.</p>
          <div class="loader"></div>
          <script>
            // Store auth success flag in localStorage that can be accessed by parent window
            localStorage.setItem('auth_success_${userIdentifier}', 'true');
            localStorage.setItem('auth_success_timestamp', Date.now().toString());
            
            // Try to notify opener
            if (window.opener && !window.opener.closed) {
              try {
                window.opener.postMessage({
                  type: 'AUTH_SUCCESS',
                  userId: '${userIdentifier}',
                  timestamp: Date.now()
                }, '*');
                
                // Close after a short delay
                setTimeout(() => window.close(), 2000);
              } catch(e) {
                console.error('Could not communicate with opener window:', e);
              }
            }
          </script>
        </body>
      </html>
    `);
  } catch (error: unknown) {
    console.error('Error handling callback:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).send(`Authentication failed: ${errorMessage}`);
  }
});
// Initiate OAuth flow
app.get('/authorize', (req: Request, res: Response) => {
  try {
    const { state } = req.query;
    const config = getZohoAuthConfig();
    const authUrl = generateAuthUrl(config);
    
    // Add state parameter if provided
    const finalUrl = state ? `${authUrl}&state=${state}` : authUrl;
    
    // Redirect to Zoho's authorization page
    res.redirect(finalUrl);
  } catch (error: unknown) {
    console.error('Error initiating authorization:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Check authentication status
app.get('/status', async (req: Request, res: Response) => {
  try {
    const { user } = req.query;
    const userIdentifier = typeof user === 'string' ? user : 'default';
    const catalystApp = catalyst.initialize(req);
    
    const authService = new ZohoAuthService(catalystApp);
    const tokens = await authService.getTokens(userIdentifier);
    
    if (!tokens) {
      // Not authenticated, provide auth URL
      const config = getZohoAuthConfig();
      const authUrl = generateAuthUrl(config);
      
      const response: AuthStatusResponse = {
        authenticated: false,
        auth_url: `${authUrl}&state=${userIdentifier}`
      };
      
      return res.json(response);
    }
    
    // Check if token is expired
    const currentTime = Date.now();
    const expiryTime = tokens.created_at + (tokens.expires_in * 1000);
    const remaining = Math.floor((expiryTime - currentTime) / 1000);
    
    const response: AuthStatusResponse = {
      authenticated: true,
      expires_in: Math.max(0, remaining)
    };
    
    res.json(response);
  } catch (error: unknown) {
    console.error('Error checking status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Get tokens for a specific user
app.get('/tokens', async (req: Request, res: Response) => {
  try {
    const { user } = req.query;
    const userIdentifier = typeof user === 'string' ? user : 'default';
    const catalystApp = catalyst.initialize(req);
    
    const authService = new ZohoAuthService(catalystApp);
    const tokens = await authService.getValidTokens(userIdentifier);
    
    if (!tokens) {
      return res.json({
        success: false,
        error: 'No tokens found for this user'
      } as TokenResponse);
    }
    
    res.json({
      success: true,
      data: tokens
    } as TokenResponse);
  } catch (error: unknown) {
    console.error('Error getting tokens:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    } as TokenResponse);
  }
});

// Revoke tokens
app.post('/revoke', async (req: Request, res: Response) => {
  try {
    const { user } = req.body;
    const userIdentifier = user || 'default';
    const catalystApp = catalyst.initialize(req);
    
    const authService = new ZohoAuthService(catalystApp);
    const result = await authService.revokeTokens(userIdentifier);
    
    res.json({ success: result });
  } catch (error: unknown) {
    console.error('Error revoking tokens:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

export = app;