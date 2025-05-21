"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConversationsTable = getConversationsTable;
exports.createNewSession = createNewSession;
exports.formatMessage = formatMessage;
exports.mergeContext = mergeContext;
/**
 * Get the Conversations table from Catalyst Data Store
 */
function getConversationsTable(catalystApp) {
    const datastore = catalystApp.datastore();
    return datastore.table('Conversations');
}
/**
 * Create a new conversation session
 */
function createNewSession(sessionId, userId = 'anonymous') {
    const now = new Date().toISOString();
    return {
        sessionId,
        userId,
        messages: [],
        context: {},
        createdAt: now,
        updatedAt: now
    };
}
/**
 * Format a message to add timestamp
 */
function formatMessage(message) {
    return Object.assign(Object.assign({}, message), { timestamp: new Date().toISOString() });
}
/**
 * Merge new context with existing context
 */
function mergeContext(existingContext, newContext) {
    // Deep merge for objects like entities and preferences
    const merged = Object.assign({}, existingContext);
    if (newContext.entities) {
        merged.entities = Object.assign(Object.assign({}, (merged.entities || {})), newContext.entities);
    }
    if (newContext.preferences) {
        merged.preferences = Object.assign(Object.assign({}, (merged.preferences || {})), newContext.preferences);
    }
    // Overwrite other fields
    if (newContext.lastFunction !== undefined) {
        merged.lastFunction = newContext.lastFunction;
    }
    if (newContext.lastArguments !== undefined) {
        merged.lastArguments = newContext.lastArguments;
    }
    if (newContext.lastResult !== undefined) {
        merged.lastResult = newContext.lastResult;
    }
    return merged;
}
