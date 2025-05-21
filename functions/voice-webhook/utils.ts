import * as crypto from 'crypto';

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return crypto.randomUUID();
}

/**
 * Format a time period in a readable way
 */
export function formatPeriod(period: string): string {
  const periodMap: Record<string, string> = {
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
export function safeJsonParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return {};
  }
}

/**
 * Check if a value is a valid base64 string
 */
export function isBase64(str: string): boolean {
  const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
  return base64Regex.test(str);
}

/**
 * Convert audio to the right format for OpenAI
 */
export function prepareAudioForTranscription(audio: string | Buffer): Buffer {
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