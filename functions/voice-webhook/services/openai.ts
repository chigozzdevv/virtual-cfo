import OpenAI from 'openai';
import { FunctionDefinition, OpenAIConfig } from '../types';
import { prepareAudioForTranscription } from '../utils';

export class OpenAIService {
  private client: OpenAI;
  private config: OpenAIConfig;
  
  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    
    if (!key) {
      throw new Error('OpenAI API key is required');
    }
    
    this.client = new OpenAI({ apiKey: key });
    
    this.config = {
      apiKey: key,
      speechToTextModel: 'whisper-1',
      textToSpeechModel: 'tts-1',
      textModel: 'gpt-4-turbo-preview',
      voice: 'alloy'
    };
  }
  
  async transcribeAudio(audio: string | Buffer): Promise<string> {
    try {
      const audioBuffer = prepareAudioForTranscription(audio);
      
      const transcription = await this.client.audio.transcriptions.create({
        file: new File([audioBuffer], 'audio.webm', { type: 'audio/webm' }),
        model: this.config.speechToTextModel
      });
      
      return transcription.text;
    } catch (error: unknown) {
      console.error('Error transcribing audio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to transcribe audio: ${errorMessage}`);
    }
  }
  
  async getFunctionCall(userInput: string, functionDefinitions: FunctionDefinition[], systemMessage?: string): Promise<{ name: string, arguments: any }> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.textModel,
        messages: [
          { 
            role: 'system', 
            content: systemMessage || 'You are a voice-enabled financial assistant for a CFO. Answer concisely and professionally.' 
          },
          { role: 'user', content: userInput }
        ],
        tools: functionDefinitions.map(def => ({
          type: 'function',
          function: def
        })),
        tool_choice: 'auto'
      });
      
      const message = response.choices[0].message;
      
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        
        return {
          name: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments)
        };
      }
      
      return {
        name: 'generateResponse',
        arguments: { text: message.content || 'I\'m not sure how to help with that.' }
      };
    } catch (error: unknown) {
      console.error('Error getting function call:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to process user message: ${errorMessage}`);
    }
  }
  
  async generateResponse(userInput: string, functionName: string, functionResult: any): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.textModel,
        messages: [
          { 
            role: 'system', 
            content: 'You are a voice-enabled financial assistant for a CFO. Answer concisely and professionally.'
          },
          { role: 'user', content: userInput },
          { 
            role: 'function', 
            name: functionName, 
            content: JSON.stringify(functionResult)
          }
        ]
      });
      
      return response.choices[0].message.content || 'I couldn\'t generate a response.';
    } catch (error: unknown) {
      console.error('Error generating response:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate response: ${errorMessage}`);
    }
  }
  
  async textToSpeech(text: string): Promise<string> {
    try {
      const response = await this.client.audio.speech.create({
        model: this.config.textToSpeechModel,
        voice: this.config.voice,
        input: text
      });
      
      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer.toString('base64');
    } catch (error: unknown) {
      console.error('Error converting text to speech:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to convert text to speech: ${errorMessage}`);
    }
  }
}