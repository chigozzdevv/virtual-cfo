export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface FunctionHandler {
  (args: any): Promise<any>;
}

export interface VoiceRequest {
  audio: Buffer | string;
  sessionId?: string;
  previousContext?: string;
}

export interface VoiceResponse {
  text: string;
  audio: string;
  context?: any;
}

export interface OpenAIConfig {
  apiKey: string;
  speechToTextModel: string;
  textToSpeechModel: string;
  textModel: string;
  voice: string;
}