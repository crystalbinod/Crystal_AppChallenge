import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

function loadEnv() {
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (!process.env[key]) {
      process.env[key] = rest.join('=').trim();
    }
  }
}

loadEnv();

const PORT = Number(process.env.GEMINI_PROXY_PORT || 3001);
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-3.5-flash'];

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function generateReply(body) {
  if (!API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY in .env');
  }

  const { userMessage, history = [], systemPrompt = '' } = body;
  if (!userMessage || typeof userMessage !== 'string') {
    throw new Error('userMessage is required');
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const errors = [];

  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemPrompt,
      });

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(userMessage);
      const text = result.response.text();

      if (!text?.trim()) {
        throw new Error('Empty Gemini response');
      }

      return text.trim();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${modelName}: ${message}`);
    }
  }

  throw new Error(errors.join(' | '));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/chat') {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  try {
    const rawBody = await readBody(req);
    const body = JSON.parse(rawBody || '{}');
    const text = await generateReply(body);
    sendJson(res, 200, { text });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendJson(res, 500, { error: message });
  }
});

server.listen(PORT, () => {
  console.log(`Gemini proxy running on http://localhost:${PORT}/api/chat`);
});
