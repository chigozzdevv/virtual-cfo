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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIService = void 0;
const openai_1 = __importDefault(require("openai"));
const utils_1 = require("../utils");
class OpenAIService {
    constructor(apiKey) {
        const key = apiKey || process.env.OPENAI_API_KEY;
        if (!key) {
            throw new Error('OpenAI API key is required');
        }
        this.client = new openai_1.default({ apiKey: key });
        this.config = {
            apiKey: key,
            speechToTextModel: 'whisper-1',
            textToSpeechModel: 'tts-1',
            textModel: 'gpt-4-turbo-preview',
            voice: 'alloy'
        };
    }
    transcribeAudio(audio) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const audioBuffer = (0, utils_1.prepareAudioForTranscription)(audio);
                const transcription = yield this.client.audio.transcriptions.create({
                    file: new File([audioBuffer], 'audio.webm', { type: 'audio/webm' }),
                    model: this.config.speechToTextModel
                });
                return transcription.text;
            }
            catch (error) {
                console.error('Error transcribing audio:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new Error(`Failed to transcribe audio: ${errorMessage}`);
            }
        });
    }
    getFunctionCall(userInput, functionDefinitions, systemMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.client.chat.completions.create({
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
            }
            catch (error) {
                console.error('Error getting function call:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new Error(`Failed to process user message: ${errorMessage}`);
            }
        });
    }
    generateResponse(userInput, functionName, functionResult) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.client.chat.completions.create({
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
            }
            catch (error) {
                console.error('Error generating response:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new Error(`Failed to generate response: ${errorMessage}`);
            }
        });
    }
    textToSpeech(text) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.client.audio.speech.create({
                    model: this.config.textToSpeechModel,
                    voice: this.config.voice,
                    input: text
                });
                const buffer = Buffer.from(yield response.arrayBuffer());
                return buffer.toString('base64');
            }
            catch (error) {
                console.error('Error converting text to speech:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                throw new Error(`Failed to convert text to speech: ${errorMessage}`);
            }
        });
    }
}
exports.OpenAIService = OpenAIService;
