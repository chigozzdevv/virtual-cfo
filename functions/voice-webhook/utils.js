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
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSessionId = generateSessionId;
exports.formatPeriod = formatPeriod;
exports.safeJsonParse = safeJsonParse;
exports.isBase64 = isBase64;
exports.prepareAudioForTranscription = prepareAudioForTranscription;
const crypto = __importStar(require("crypto"));
/**
 * Generate a unique session ID
 */
function generateSessionId() {
    return crypto.randomUUID();
}
/**
 * Format a time period in a readable way
 */
function formatPeriod(period) {
    const periodMap = {
        'this_month': 'this month',
        'last_month': 'last month',
        'this_quarter': 'this quarter',
        'last_quarter': 'last quarter',
        'this_year': 'this year',
        'last_year': 'last year'
    };
    return periodMap[period] || period;
}
/**
 * Safely parse JSON with error handling
 */
function safeJsonParse(text) {
    try {
        return JSON.parse(text);
    }
    catch (error) {
        console.error('Error parsing JSON:', error);
        return {};
    }
}
/**
 * Check if a value is a valid base64 string
 */
function isBase64(str) {
    const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    return base64Regex.test(str);
}
/**
 * Convert audio to the right format for OpenAI
 */
function prepareAudioForTranscription(audio) {
    if (typeof audio === 'string') {
        // If it's a base64 string, convert to buffer
        if (isBase64(audio)) {
            return Buffer.from(audio, 'base64');
        }
        // If it's a URL or another string type, throw error
        throw new Error('Audio must be provided as a Buffer or base64 string');
    }
    // Already a buffer
    return audio;
}
