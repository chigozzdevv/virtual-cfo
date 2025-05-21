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
const openai_1 = require("./services/openai");
const definitions_1 = require("./ai/definitions");
const handlers_1 = require("./ai/handlers");
const utils_1 = require("./utils");
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: '50mb' }));
app.post('/voice', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        catalystSDK.initialize(req);
        const { audio, sessionId = (0, utils_1.generateSessionId)() } = req.body;
        if (!audio) {
            return res.status(400).json({ error: 'Audio is required' });
        }
        const openaiService = new openai_1.OpenAIService();
        const userText = yield openaiService.transcribeAudio(audio);
        console.log(`Transcribed text: ${userText}`);
        const functionCall = yield openaiService.getFunctionCall(userText, definitions_1.FUNCTION_DEFINITIONS);
        console.log(`Selected function: ${functionCall.name}`);
        const functionHandler = handlers_1.FUNCTION_HANDLERS[functionCall.name];
        if (!functionHandler) {
            throw new Error(`Function ${functionCall.name} not implemented`);
        }
        const functionResult = yield functionHandler(functionCall.arguments);
        console.log(`Function result:`, functionResult);
        const responseText = yield openaiService.generateResponse(userText, functionCall.name, functionResult);
        console.log(`Response text: ${responseText}`);
        const audioResponse = yield openaiService.textToSpeech(responseText);
        const response = {
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
    }
    catch (error) {
        console.error('Error processing voice request:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        res.status(500).json({
            error: errorMessage,
            text: "I'm sorry, I encountered an error processing your request.",
            audio: null
        });
    }
}));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Voice webhook is running' });
});
// Add a version endpoint to easily check configuration
app.get('/version', (req, res) => {
    res.status(200).json({
        version: '1.0.0',
        config: {
            hasFinancialService: !!process.env.FINANCIAL_SERVICE_URL,
            openAIConfigured: !!process.env.OPENAI_API_KEY
        }
    });
});
module.exports = app;
