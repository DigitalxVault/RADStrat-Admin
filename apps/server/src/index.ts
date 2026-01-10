import express from 'express';
import cors from 'cors';
import { env } from './env.js';
import { logger } from './utils/logger.js';
import healthRouter from './routes/health.js';
import transcriptionSessionRouter from './routes/openaiTranscriptionSession.js';
import evaluatorRouter from './routes/evaluator.js';

// Validate environment
env.validate();

const app = express();

// Middleware - CORS with configurable origins
const corsOrigins = env.CORS_ORIGINS.split(',').map(origin => origin.trim());
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.text({ type: ['application/sdp', 'text/plain'], limit: '1mb' }));
app.use(express.raw({ type: 'application/sdp', limit: '1mb' }));

// Request logging middleware
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/health', healthRouter);
app.use('/api/openai/realtime/transcription-session', transcriptionSessionRouter);
// Use GA transcription session router (replaces legacy webrtcSessionRouter)
app.use('/api/webrtc/session', transcriptionSessionRouter);
app.use('/api/evaluator', evaluatorRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(env.PORT, () => {
  logger.info(`Server running on http://localhost:${env.PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
});
