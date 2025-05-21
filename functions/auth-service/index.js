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
// In your file
const express_1 = __importDefault(require("express"));
const catalyst = require('zcatalyst-sdk-node');
const zohoAuth_1 = require("./services/zohoAuth");
const utils_1 = require("./utils");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Handle OAuth callback
app.get('/callback', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, state } = req.query;
        const catalystApp = catalyst.initialize(req);
        if (!code || typeof code !== 'string') {
            return res.status(400).send('Authorization code is missing');
        }
        // Extract user identifier from state or use default
        const userIdentifier = typeof state === 'string' ? state : 'default';
        const authService = new zohoAuth_1.ZohoAuthService(catalystApp);
        yield authService.storeTokensFromCode(code, userIdentifier);
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
    }
    catch (error) {
        console.error('Error handling callback:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).send(`Authentication failed: ${errorMessage}`);
    }
}));
// Initiate OAuth flow
app.get('/authorize', (req, res) => {
    try {
        const { state } = req.query;
        const config = (0, utils_1.getZohoAuthConfig)();
        const authUrl = (0, utils_1.generateAuthUrl)(config);
        // Add state parameter if provided
        const finalUrl = state ? `${authUrl}&state=${state}` : authUrl;
        // Redirect to Zoho's authorization page
        res.redirect(finalUrl);
    }
    catch (error) {
        console.error('Error initiating authorization:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
});
// Check authentication status
app.get('/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user } = req.query;
        const userIdentifier = typeof user === 'string' ? user : 'default';
        const catalystApp = catalyst.initialize(req);
        const authService = new zohoAuth_1.ZohoAuthService(catalystApp);
        const tokens = yield authService.getTokens(userIdentifier);
        if (!tokens) {
            // Not authenticated, provide auth URL
            const config = (0, utils_1.getZohoAuthConfig)();
            const authUrl = (0, utils_1.generateAuthUrl)(config);
            const response = {
                authenticated: false,
                auth_url: `${authUrl}&state=${userIdentifier}`
            };
            return res.json(response);
        }
        // Check if token is expired
        const currentTime = Date.now();
        const expiryTime = tokens.created_at + (tokens.expires_in * 1000);
        const remaining = Math.floor((expiryTime - currentTime) / 1000);
        const response = {
            authenticated: true,
            expires_in: Math.max(0, remaining)
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error checking status:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: errorMessage });
    }
}));
// Get tokens for a specific user
app.get('/tokens', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user } = req.query;
        const userIdentifier = typeof user === 'string' ? user : 'default';
        const catalystApp = catalyst.initialize(req);
        const authService = new zohoAuth_1.ZohoAuthService(catalystApp);
        const tokens = yield authService.getValidTokens(userIdentifier);
        if (!tokens) {
            return res.json({
                success: false,
                error: 'No tokens found for this user'
            });
        }
        res.json({
            success: true,
            data: tokens
        });
    }
    catch (error) {
        console.error('Error getting tokens:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
}));
// Revoke tokens
app.post('/revoke', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user } = req.body;
        const userIdentifier = user || 'default';
        const catalystApp = catalyst.initialize(req);
        const authService = new zohoAuth_1.ZohoAuthService(catalystApp);
        const result = yield authService.revokeTokens(userIdentifier);
        res.json({ success: result });
    }
    catch (error) {
        console.error('Error revoking tokens:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ success: false, error: errorMessage });
    }
}));
module.exports = app;
