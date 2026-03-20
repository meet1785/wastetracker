import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';

import { checkDatabaseConnection } from './config/database';
import db from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import inventoryRoutes from './routes/inventory';
import recipeRoutes from './routes/recipes';
import analyticsRoutes from './routes/analytics';
import shoppingRoutes from './routes/shopping';
import communityRoutes from './routes/community';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);

// ─── Security & Performance Middleware ───────────────────────────────────────
app.use(helmet());
app.use(compression());

// CORS
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:8081').split(',');
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Body parsing & logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  const dbOk = await checkDatabaseConnection();
  const status = dbOk ? 200 : 503;
  res.status(status).json({
    status: dbOk ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: dbOk ? 'connected' : 'disconnected',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/community', communityRoutes);

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Background Jobs ──────────────────────────────────────────────────────────

// Daily: mark expired items and log waste automatically (runs at 1 AM)
cron.schedule('0 1 * * *', async () => {
  try {
    console.log('[Cron] Running daily expiry check...');
    const expiredItems = await db('inventory_items')
      .where('is_consumed', false)
      .where('is_wasted', false)
      .whereRaw('expiry_date < CURRENT_DATE')
      .select('id', 'user_id', 'name', 'category', 'quantity', 'unit', 'estimated_cost');

    for (const item of expiredItems) {
      await db('waste_logs').insert({
        user_id: item.user_id,
        item_id: item.id,
        item_name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        estimated_cost: item.estimated_cost,
        reason: 'expired',
      });
      await db('inventory_items').where('id', item.id).update({ is_wasted: true });
    }

    console.log(`[Cron] Processed ${expiredItems.length} expired items`);
  } catch (err) {
    console.error('[Cron] Error in daily expiry check:', err);
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
async function start(): Promise<void> {
  const dbOk = await checkDatabaseConnection();
  if (!dbOk) {
    console.warn('[Server] Warning: Starting without a database connection. Some features will be unavailable.');
  } else {
    console.log('[Server] Database connection established');
  }

  app.listen(PORT, () => {
    console.log(`[Server] FreshTrack API running on http://localhost:${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV ?? 'development'}`);
    console.log(`[Server] Health check: http://localhost:${PORT}/health`);
  });
}

start().catch(err => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});

export default app;
