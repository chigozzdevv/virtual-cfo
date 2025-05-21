import * as catalystSDK from 'zcatalyst-sdk-node';
import { ConversationSession, Message, SessionContext } from './types';

/**
 * Get the Conversations table from Catalyst Data Store
 */
export function getConversationsTable(catalystApp: catalystSDK.CatalystApp): any {
  const datastore = catalystApp.datastore();
  return datastore.table('Conversations');
}

/**
 * Create a new conversation session
 */
export function createNewSession(sessionId: string, userId: string = 'anonymous'): ConversationSession {
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
export function formatMessage(message: Omit<Message, 'timestamp'>): Message {
  return {
    ...message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Merge new context with existing context
 */
export function mergeContext(existingContext: SessionContext, newContext: Partial<SessionContext>): SessionContext {
  // Deep merge for objects like entities and preferences
  const merged = { ...existingContext };
  
  if (newContext.entities) {
    merged.entities = { ...(merged.entities || {}), ...newContext.entities };
  }
  
  if (newContext.preferences) {
    merged.preferences = { ...(merged.preferences || {}), ...newContext.preferences };
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