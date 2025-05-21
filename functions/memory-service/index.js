"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const express_1 = __importDefault(require("express"));
const catalystSDK = __importStar(require("zcatalyst-sdk-node"));
const utils_1 = require("./utils");
const app = (0, express_1.default)();
app.use(express_1.default.json());
/**
 * Get a conversation session by ID
 */
function getSession(catalystApp, sessionId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const table = (0, utils_1.getConversationsTable)(catalystApp);
            const query = `SELECT * FROM Conversations WHERE sessionId = '${sessionId}'`;
            const result = yield table.query(query);
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
        }
        catch (error) {
            console.error('Error getting session:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to get session: ${errorMessage}`);
        }
    });
}
/**
 * Save a session to the database
 */
function saveSession(catalystApp, session) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const table = (0, utils_1.getConversationsTable)(catalystApp);
            const query = `SELECT * FROM Conversations WHERE sessionId = '${session.sessionId}'`;
            const result = yield table.query(query);
            session.updatedAt = new Date().toISOString();
            if (result.rows.length === 0) {
                // Insert new session
                yield table.insertRow({
                    sessionId: session.sessionId,
                    userId: session.userId,
                    messages: JSON.stringify(session.messages),
                    context: JSON.stringify(session.context),
                    createdAt: session.createdAt,
                    updatedAt: session.updatedAt
                });
            }
            else {
                // Update existing session
                const rowId = result.rows[0].Conversations_ID;
                yield table.updateRow({
                    Conversations_ID: rowId,
                    sessionId: session.sessionId,
                    userId: session.userId,
                    messages: JSON.stringify(session.messages),
                    context: JSON.stringify(session.context),
                    createdAt: session.createdAt,
                    updatedAt: session.updatedAt
                });
            }
        }
        catch (error) {
            console.error('Error saving session:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to save session: ${errorMessage}`);
        }
    });
}
// Create or retrieve a session
app.post('/session', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId, userId = 'anonymous' } = req.body;
        const catalystApp = catalystSDK.initialize(req);
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID is required'
            });
        }
        // Check if session exists
        let session = yield getSession(catalystApp, sessionId);
        if (!session) {
            // Create new session
            session = (0, utils_1.createNewSession)(sessionId, userId);
            yield saveSession(catalystApp, session);
        }
        res.json({
            success: true,
            data: session
        });
    }
    catch (error) {
        console.error('Error handling session request:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
}));
// Get a session
app.get('/session/:sessionId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId } = req.params;
        const { messageLimit } = req.query;
        const catalystApp = catalystSDK.initialize(req);
        // Get session
        const session = yield getSession(catalystApp, sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }
        // Limit messages if requested
        if (messageLimit && messageLimit > 0 && session.messages.length > messageLimit) {
            session.messages = session.messages.slice(-messageLimit);
        }
        res.json({
            success: true,
            data: session
        });
    }
    catch (error) {
        console.error('Error getting session:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
}));
// Store a message in a session
app.post('/message', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId, userId = 'anonymous', message, context } = req.body;
        const catalystApp = catalystSDK.initialize(req);
        if (!sessionId || !message) {
            return res.status(400).json({
                success: false,
                error: 'Session ID and message are required'
            });
        }
        // Get or create session
        let session = yield getSession(catalystApp, sessionId);
        if (!session) {
            session = (0, utils_1.createNewSession)(sessionId, userId);
        }
        // Add message
        const formattedMessage = (0, utils_1.formatMessage)(message);
        session.messages.push(formattedMessage);
        // Update context if provided
        if (context) {
            session.context = (0, utils_1.mergeContext)(session.context, context);
        }
        // Save session
        yield saveSession(catalystApp, session);
        res.json({
            success: true,
            data: {
                message: formattedMessage,
                sessionId
            }
        });
    }
    catch (error) {
        console.error('Error storing message:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
}));
// Update session context
app.patch('/context/:sessionId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId } = req.params;
        const { context } = req.body;
        const catalystApp = catalystSDK.initialize(req);
        if (!context) {
            return res.status(400).json({
                success: false,
                error: 'Context is required'
            });
        }
        // Get session
        const session = yield getSession(catalystApp, sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }
        // Update context
        session.context = (0, utils_1.mergeContext)(session.context, context);
        // Save session
        yield saveSession(catalystApp, session);
        res.json({
            success: true,
            data: {
                context: session.context,
                sessionId
            }
        });
    }
    catch (error) {
        console.error('Error updating context:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
}));
// Delete a session
app.delete('/session/:sessionId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sessionId } = req.params;
        const catalystApp = catalystSDK.initialize(req);
        // Check if session exists
        const table = (0, utils_1.getConversationsTable)(catalystApp);
        const query = `SELECT * FROM Conversations WHERE sessionId = '${sessionId}'`;
        const result = yield table.query(query);
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }
        // Delete session
        const rowId = result.rows[0].Conversations_ID;
        yield table.deleteRow(rowId);
        res.json({
            success: true,
            data: {
                sessionId,
                deleted: true
            }
        });
    }
    catch (error) {
        console.error('Error deleting session:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
}));
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Memory service is running' });
});
module.exports = app;
