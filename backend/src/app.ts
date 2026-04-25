import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import transcriptRouter from './routes/transcriptRouter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

const isWildcard = allowedOrigins.includes('*');

app.use(
  cors({
    origin: (origin, callback) => {
      // In production with wildcard, or no-origin requests (Postman, same-origin serverless)
      if (!origin || isWildcard || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/transcript', transcriptRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
