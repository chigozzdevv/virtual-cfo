import express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as catalystSDK from 'zcatalyst-sdk-node';
import { 
  ApiResponse, ConversationSession, GetSessionRequest, 
  StoreMessageRequest, UpdateContextRequest 
} from './types';
import { createNewSession, formatMessage, getConversationsTable, mergeContext } from './utils';

const app = express();

app.use((req, res, next) => {
  // Allow requests from any origin
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use(express.json());

/**
 * Get a conversation session by ID
 */
async function getSession(catalystApp: catalystSDK.CatalystApp, sessionId: string): Promise<ConversationSession | null> {
  try {
    const table = getConversationsTable(catalystApp);
    const query = `SELECT * FROM Conversations WHERE sessionId = '${sessionId}'`;
    const result = await table.query(query);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    
    return {
      sessionId: row.sessionId,
      userId: row.userId,
      messages: JSON.parse(row.messages || '[]'),
      context: JSON.parse(row.context || '{}'),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  } catch (error: unknown) {
    console.error('Error getting session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to get session: ${errorMessage}`);
  }
}

/**
 * Save a session to the database
 */
async function saveSession(catalystApp: catalystSDK.CatalystApp, session: ConversationSession): Promise<void> {
  try {
    const table = getConversationsTable(catalystApp);
    const query = `SELECT * FROM Conversations WHERE sessionId = '${session.sessionId}'`;
    const result = await table.query(query);
    
    session.updatedAt = new Date().toISOString();
    
    if (result.rows.length === 0) {
      // Insert new session
      await table.insertRow({
        sessionId: session.sessionId,
        userId: session.userId,
        messages: JSON.stringify(session.messages),
        context: JSON.stringify(session.context),
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      });
    } else {
      // Update existing session
      const rowId = result.rows[0].Conversations_ID;
      await table.updateRow({
        Conversations_ID: rowId,
        sessionId: session.sessionId,
        userId: session.userId,
        messages: JSON.stringify(session.messages),
        context: JSON.stringify(session.context),
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      });
    }
  } catch (error: unknown) {
    console.error('Error saving session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to save session: ${errorMessage}`);
  }
}

// Create or retrieve a session
app.post('/session', async (req: Request, res: Response) => {
  try {
    const { sessionId, userId = 'anonymous' } = req.body;
    const catalystApp = catalystSDK.initialize(req);
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      } as ApiResponse<any>);
    }
    
    // Check if session exists
    let session = await getSession(catalystApp, sessionId);
    
    if (!session) {
      // Create new session
      session = createNewSession(sessionId, userId);
      await saveSession(catalystApp, session);
    }
    
    res.json({
      success: true,
      data: session
    } as ApiResponse<ConversationSession>);
  } catch (error: unknown) {
    console.error('Error handling session request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    } as ApiResponse<any>);
  }
});

// Get a session
app.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { messageLimit } = req.query as unknown as GetSessionRequest;
    const catalystApp = catalystSDK.initialize(req);
    
    // Get session
    const session = await getSession(catalystApp, sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      } as ApiResponse<any>);
    }
    
    // Limit messages if requested
    if (messageLimit && messageLimit > 0 && session.messages.length > messageLimit) {
      session.messages = session.messages.slice(-messageLimit);
    }
    
    res.json({
      success: true,
      data: session
    } as ApiResponse<ConversationSession>);
  } catch (error: unknown) {
    console.error('Error getting session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    } as ApiResponse<any>);
  }
});

// Store a message in a session
app.post('/message', async (req: Request, res: Response) => {
  try {
    const { sessionId, userId = 'anonymous', message, context } = req.body as StoreMessageRequest;
    const catalystApp = catalystSDK.initialize(req);
    
    if (!sessionId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and message are required'
      } as ApiResponse<any>);
    }
    
    // Get or create session
    let session = await getSession(catalystApp, sessionId);
    
    if (!session) {
      session = createNewSession(sessionId, userId);
    }
    
    // Add message
    const formattedMessage = formatMessage(message);
    session.messages.push(formattedMessage);
    
    // Update context if provided
    if (context) {
      session.context = mergeContext(session.context, context);
    }
    
    // Save session
    await saveSession(catalystApp, session);
    
    res.json({
      success: true,
      data: {
        message: formattedMessage,
        sessionId
      }
    });
  } catch (error: unknown) {
    console.error('Error storing message:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    } as ApiResponse<any>);
  }
});

// Update session context
app.patch('/context/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { context } = req.body as UpdateContextRequest;
    const catalystApp = catalystSDK.initialize(req);
    
    if (!context) {
      return res.status(400).json({
        success: false,
        error: 'Context is required'
      } as ApiResponse<any>);
    }
    
    // Get session
    const session = await getSession(catalystApp, sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      } as ApiResponse<any>);
    }
    
    // Update context
    session.context = mergeContext(session.context, context);
    
    // Save session
    await saveSession(catalystApp, session);
    
    res.json({
      success: true,
      data: {
        context: session.context,
        sessionId
      }
    });
  } catch (error: unknown) {
    console.error('Error updating context:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    } as ApiResponse<any>);
  }
});

// Delete a session
app.delete('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const catalystApp = catalystSDK.initialize(req);
    
    // Check if session exists
    const table = getConversationsTable(catalystApp);
    const query = `SELECT * FROM Conversations WHERE sessionId = '${sessionId}'`;
    const result = await table.query(query);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      } as ApiResponse<any>);
    }
    
    // Delete session
    const rowId = result.rows[0].Conversations_ID;
    await table.deleteRow(rowId);
    
    res.json({
      success: true,
      data: {
        sessionId,
        deleted: true
      }
    });
  } catch (error: unknown) {
    console.error('Error deleting session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      success: false,
      error: errorMessage
    } as ApiResponse<any>);
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Memory service is running' });
});

export = app;