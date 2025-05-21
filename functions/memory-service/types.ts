// Conversation message types
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Session context types
export interface SessionContext {
  lastFunction?: string;
  lastArguments?: any;
  lastResult?: any;
  entities?: Record<string, any>;
  preferences?: Record<string, any>;
}

// Conversation session
export interface ConversationSession {
  sessionId: string;
  userId: string;
  messages: Message[];
  context: SessionContext;
  createdAt: string;
  updatedAt: string;
}

// API request/response types
export interface StoreMessageRequest {
  sessionId: string;
  userId?: string;
  message: Omit<Message, 'timestamp'>;
  context?: Partial<SessionContext>;
}

export interface UpdateContextRequest {
  sessionId: string;
  context: Partial<SessionContext>;
}

export interface GetSessionRequest {
  sessionId: string;
  messageLimit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}