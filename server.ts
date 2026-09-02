import express from 'express';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const DATA_DIR = path.join(process.cwd(), 'data');
const STATE_FILE_PATH = path.join(DATA_DIR, 'app_state.json');

// In-memory cache for fast access and instant multi-client sync
let cachedAppState: any = null;
let cachedStateUpdatedAt: string = '';

// Initialize state from file on server boot
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(STATE_FILE_PATH)) {
    const raw = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    cachedAppState = parsed.state || parsed;
    cachedStateUpdatedAt = parsed.updatedAt || new Date().toISOString();
  }
} catch {
  cachedAppState = null;
  cachedStateUpdatedAt = '';
}

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Trust Reverse Proxy (Cloud Run / Nginx)
  app.set('trust proxy', 1);

  // 2. HTTPS Enforce / Redirect Middleware
  app.use((req, res, next) => {
    const proto = req.headers['x-forwarded-proto'];
    if (proto && proto !== 'https' && process.env.NODE_ENV === 'production') {
      const host = req.headers.host;
      return res.redirect(301, `https://${host}${req.url}`);
    }

    // Set Strict-Transport-Security Header
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    next();
  });

  // 3. Security Headers via Helmet (CSP & COEP disabled for embedded iframe preview compatibility)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hidePoweredBy: true,
      xContentTypeOptions: true,
      xDnsPrefetchControl: { allow: false },
      xFrameOptions: false, // allow iframe preview inside AI Studio
    })
  );

  // 4. Body Parser with Payload Limit
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // 5. Health Check Endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
      timestamp: new Date().toISOString(),
    });
  });

  // 6. Persistent Shared State Endpoints for Multi-Device / Cross-Computer Synchronization
  app.get('/api/app-state', (req, res) => {
    try {
      if (cachedAppState) {
        return res.json({
          ok: true,
          data: cachedAppState,
          updatedAt: cachedStateUpdatedAt || new Date().toISOString(),
        });
      }

      if (fs.existsSync(STATE_FILE_PATH)) {
        const raw = fs.readFileSync(STATE_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        cachedAppState = parsed.state || parsed;
        cachedStateUpdatedAt = parsed.updatedAt || new Date().toISOString();
        return res.json({
          ok: true,
          data: cachedAppState,
          updatedAt: cachedStateUpdatedAt,
        });
      }

      return res.json({
        ok: true,
        data: null,
        updatedAt: null,
      });
    } catch (err: any) {
      console.error('[API State Load Error] Status:', 500);
      return res.status(500).json({ ok: false, error: 'Failed to load server state' });
    }
  });

  app.post('/api/app-state', (req, res) => {
    try {
      const { state, updatedAt } = req.body || {};
      if (!state) {
        return res.status(400).json({ ok: false, error: 'State payload is required' });
      }

      const timestamp = updatedAt || new Date().toISOString();
      cachedAppState = state;
      cachedStateUpdatedAt = timestamp;

      // Asynchronously persist to JSON file on server disk
      const payloadToSave = JSON.stringify({ state, updatedAt: timestamp }, null, 2);
      fs.writeFile(STATE_FILE_PATH, payloadToSave, 'utf-8', (err) => {
        if (err) {
          console.error('[API State Write Error] Status:', 500);
        }
      });

      return res.json({
        ok: true,
        updatedAt: timestamp,
      });
    } catch (err: any) {
      console.error('[API State Save Error] Status:', 500);
      return res.status(500).json({ ok: false, error: 'Failed to save server state' });
    }
  });

  // 7. Gemini Proxy Endpoint (/api/generate)
  // Strict Privacy: Never log prompts, user input, personal data, or generated text in plaintext
  app.post('/api/generate', async (req, res) => {
    try {
      const {
        prompt,
        systemInstruction,
        model = 'gemini-3.7-flash',
        temperature,
        topP,
        topK,
        responseMimeType,
        responseSchema,
      } = req.body || {};

      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({ error: 'Prompt is required and must be a non-empty string' });
      }

      const ai = getGeminiClient();

      const config: Record<string, unknown> = {};
      if (systemInstruction) config.systemInstruction = systemInstruction;
      if (typeof temperature === 'number') config.temperature = temperature;
      if (typeof topP === 'number') config.topP = topP;
      if (typeof topK === 'number') config.topK = topK;
      if (responseMimeType) config.responseMimeType = responseMimeType;
      if (responseSchema) config.responseSchema = responseSchema;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        ...(Object.keys(config).length > 0 ? { config } : {}),
      });

      // Return generated text without logging sensitive data
      res.json({
        text: response.text || '',
        status: 'success',
      });
    } catch (err: any) {
      // Safe, masked error logging: record only status or generic error code, no raw text / prompt
      const statusCode = err?.status || err?.statusCode || 500;
      console.error('[API Proxy Error] Status:', statusCode);

      res.status(statusCode).json({
        error: 'AI content generation failed',
        code: statusCode,
      });
    }
  });

  // 7. Vite Middleware for Development / Static Serve for Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server securely running on port ${PORT}`);
  });
}

startServer();
