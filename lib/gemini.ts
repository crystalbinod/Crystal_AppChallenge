import { Platform } from 'react-native';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildSystemPrompt } from './chatbot';

type HistoryMessage = {
  role: 'user' | 'assistant';
  text: string;
};

const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.5-flash'];

function getApiKey(): string | undefined {
  return process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim() || undefined;
}

function getProxyUrl(): string {
  return (
    process.env.EXPO_PUBLIC_GEMINI_PROXY_URL?.trim() ||
    'http://localhost:3001/api/chat'
  );
}

function normalizeHistory(history: HistoryMessage[]) {
  const mapped = history.map((message) => ({
    role: message.role === 'user' ? ('user' as const) : ('model' as const),
    parts: [{ text: message.text }],
  }));

  // Gemini expects history to start with a user turn.
  while (mapped.length > 0 && mapped[0].role === 'model') {
    mapped.shift();
  }

  return mapped;
}

export function hasGeminiApiKey(): boolean {
  return Boolean(getApiKey());
}

async function askGeminiViaProxy(
  userData: { [key: string]: any } | undefined,
  history: HistoryMessage[],
  userMessage: string,
): Promise<string> {
  const response = await fetch(getProxyUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userMessage,
      history: normalizeHistory(history),
      systemPrompt: buildSystemPrompt(userData),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini proxy failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  if (!data?.text || typeof data.text !== 'string') {
    throw new Error('Gemini proxy returned an empty response.');
  }

  return data.text.trim();
}

async function askGeminiDirect(
  userData: { [key: string]: any } | undefined,
  history: HistoryMessage[],
  userMessage: string,
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY in your .env file.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const chatHistory = normalizeHistory(history);
  let lastError: unknown;

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: buildSystemPrompt(userData),
      });

      const chat = model.startChat({ history: chatHistory });
      const result = await chat.sendMessage(userMessage);
      const text = result.response.text();

      if (!text?.trim()) {
        throw new Error('Gemini returned an empty response.');
      }

      return text.trim();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('All Gemini models failed.');
}

export async function askGemini(
  userData: { [key: string]: any } | undefined,
  history: HistoryMessage[],
  userMessage: string,
): Promise<string> {
  if (Platform.OS === 'web') {
    return askGeminiViaProxy(userData, history, userMessage);
  }

  return askGeminiDirect(userData, history, userMessage);
}
