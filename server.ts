import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { translateIdiomaticText } from './src/engine/translator.js';
import { lexiconRepo } from './src/engine/lexiconRepo.js';
import { getLoggedTranslations } from './src/engine/fallback.js';
import { IdiomEntry, Language } from './src/types/index.js';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing middleware
app.use(express.json());

// Input Sanitization Middleware
function sanitizeBody(req: Request, res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    }
  }
  next();
}

// Translate Validation Middleware
function validateTranslateInput(req: Request, res: Response, next: NextFunction): void {
  const { text, sourceLang, targetLang } = req.body || {};

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({
      error: {
        code: 'INVALID_INPUT',
        message: 'Field "text" is required and must be a non-empty string.',
      },
    });
    return;
  }

  if (sourceLang !== 'yo' && sourceLang !== 'en') {
    res.status(400).json({
      error: {
        code: 'INVALID_LANGUAGE',
        message: 'Field "sourceLang" must be either "yo" or "en".',
      },
    });
    return;
  }

  if (targetLang !== 'yo' && targetLang !== 'en') {
    res.status(400).json({
      error: {
        code: 'INVALID_LANGUAGE',
        message: 'Field "targetLang" must be either "yo" or "en".',
      },
    });
    return;
  }

  next();
}

// Lexicon Entry Validation Middleware
function validateLexiconEntry(req: Request, res: Response, next: NextFunction): void {
  const { yoruba, literalGloss, figurativeSense, englishEquivalents } = req.body || {};

  if (!yoruba || typeof yoruba !== 'string') {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Field "yoruba" is required.',
      },
    });
    return;
  }

  if (!literalGloss || typeof literalGloss !== 'string') {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Field "literalGloss" is required.',
      },
    });
    return;
  }

  if (!figurativeSense || typeof figurativeSense !== 'string') {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Field "figurativeSense" is required.',
      },
    });
    return;
  }

  if (!Array.isArray(englishEquivalents) || englishEquivalents.length === 0) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Field "englishEquivalents" must be a non-empty array of strings.',
      },
    });
    return;
  }

  next();
}

// API Routes

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    llmDisambiguationEnabled: process.env.ENABLE_LLM_DISAMBIGUATION === 'true',
    timestamp: new Date().toISOString(),
  });
});

// Translation Endpoint
app.post(
  '/api/translate',
  sanitizeBody,
  validateTranslateInput,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { text, sourceLang, targetLang } = req.body as {
        text: string;
        sourceLang: Language;
        targetLang: Language;
      };

      const result = await translateIdiomaticText(text, sourceLang, targetLang);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// Lexicon Listing (Paginated)
app.get('/api/lexicon', (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';

    const result = lexiconRepo.getPaginated(page, limit, search);
    res.json({
      entries: result.entries,
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit) || 1,
    });
  } catch (err) {
    next(err);
  }
});

// Add Lexicon Entry (Curator View)
app.post(
  '/api/lexicon',
  sanitizeBody,
  validateLexiconEntry,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body as Omit<IdiomEntry, 'id'>;
      const created = lexiconRepo.add({
        yoruba: body.yoruba,
        literalGloss: body.literalGloss,
        figurativeSense: body.figurativeSense,
        englishEquivalents: body.englishEquivalents,
        register: body.register || 'proverbial',
        usageNote: body.usageNote || '',
        isProverb: Boolean(body.isProverb),
        sourceNote: body.sourceNote || 'curator added entry',
        verified: Boolean(body.verified),
      });

      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }
);

// Edit Lexicon Entry
app.put(
  '/api/lexicon/:id',
  sanitizeBody,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updated = lexiconRepo.update(id, req.body);

      if (!updated) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Lexicon entry with id "${id}" not found.`,
          },
        });
        return;
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// Flagged / Low-Confidence Translation Logs
app.get('/api/flagged', (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = getLoggedTranslations();
    const flagged = logs.filter((l) => l.overallConfidence === 'fallback' || l.fallbackUsed);
    res.json({
      flaggedCount: flagged.length,
      totalLogs: logs.length,
      logs: flagged,
    });
  } catch (err) {
    next(err);
  }
});

// Centralized Error-Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred on the server.',
    },
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[YorùbáÒwe Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
