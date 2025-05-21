import express from 'express';
import * as catalystSDK from 'zcatalyst-sdk-node';
import { Request, Response } from 'express';
import { OpenAIService } from './services/openai';
import { FUNCTION_DEFINITIONS } from './ai/definitions';
import { FUNCTION_HANDLERS } from './ai/handlers';
import { generateSessionId } from './utils';
import { VoiceRequest, VoiceResponse } from './types';

const app = express();

app.use(express.json({ limit: '50mb' }));

app.post('/voice', async (req: Request, res: Response) => {
  try {

    catalystSDK.initialize(req as any);
    
    const { audio, sessionId = generateSessionId() } = req.body as VoiceRequest;
    
    if (!audio) {
      return res.status(400).json({ error: 'Audio is required' });
    }
    
    const openaiService = new OpenAIService();
    
    const userText = await openaiService.transcribeAudio(audio);
    console.log(`Transcribed text: ${userText}`);
    
    const functionCall = await openaiService.getFunctionCall(
      userText,
      FUNCTION_DEFINITIONS
    );
    console.log(`Selected function: ${functionCall.name}`);
    
    const functionHandler = FUNCTION_HANDLERS[functionCall.name];
    if (!functionHandler) {
      throw new Error(`Function ${functionCall.name} not implemented`);
    }
    
    const functionResult = await functionHandler(functionCall.arguments);
    console.log(`Function result:`, functionResult);
    
    const responseText = await openaiService.generateResponse(
      userText,
      functionCall.name,
      functionResult
    );
    console.log(`Response text: ${responseText}`);
    
    const audioResponse = await openaiService.textToSpeech(responseText);
    
    const response: VoiceResponse = {
      text: responseText,
      audio: audioResponse,
      context: {
        sessionId,
        lastFunction: functionCall.name,
        lastArguments: functionCall.arguments,
        lastResult: functionResult
      }
    };
    
    res.json(response);
  } catch (error: unknown) {
    console.error('Error processing voice request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    res.status(500).json({ 
      error: errorMessage,
      text: "I'm sorry, I encountered an error processing your request.",
      audio: null
    });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', message: 'Voice webhook is running' });
});

// Add a version endpoint to easily check configuration
app.get('/version', (req: Request, res: Response) => {
  res.status(200).json({
    version: '1.0.0',
    config: {
      hasFinancialService: !!process.env.FINANCIAL_SERVICE_URL,
      openAIConfigured: !!process.env.OPENAI_API_KEY
    }
  });
});

export = app;