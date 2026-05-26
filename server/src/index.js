/**
 * server/src/index.js
 * ─────────────────────────────────────────────────────────────────────────────
 * HazardMap Express API — Entry Point (Hybrid REST & Socket.IO)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import requestLogger from './middleware/logger.js';
import errorHandler from './middleware/errorHandler.js';

import earthquakesRouter from './routes/earthquakes.js';
import sheltersRouter    from './routes/shelters.js';
import hospitalsRouter   from './routes/hospitals.js';
import simulateRouter    from './routes/simulate.js';

import { initSocket, getIO } from './socket/index.js';

const app = express();
const PORT = process.env.PORT || 5001;

// ── Security & Parsing ────────────────────────────────────────────────────────
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(requestLogger);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'HazardMap API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/earthquakes', earthquakesRouter);
app.use('/api/shelters', sheltersRouter);
app.use('/api/hospitals', hospitalsRouter);
app.use('/api/simulate', simulateRouter);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found', status: 404 } });
});

// ── Error Handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── HTTP Server & Socket.IO ───────────────────────────────────────────────────
const server = http.createServer(app);
initSocket(server);

// ── Start Server ──────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🌍 HazardMap API Server              ║
  ║   HTTP  →  http://localhost:${PORT}         ║
  ║   WS    →  ws://localhost:${PORT}           ║
  ║   Env   →  ${(process.env.NODE_ENV || 'development').padEnd(14)}            ║
  ╚══════════════════════════════════════════╝
  `);
});

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
function gracefulShutdown(signal) {
  console.log(`\n[${signal}] Shutting down gracefully...`);
  try {
    const io = getIO();
    io.close(() => console.log('Socket.IO server closed.'));
  } catch (err) {}
  
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
