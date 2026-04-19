/**
 * DispatchIQ — Express Server
 *
 * Main entry point for the backend API.
 * Connects all route modules and starts the server.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';

// Routes
import driverRoutes from './src/routes/drivers.js';
import loadRoutes from './src/routes/loads.js';
import dispatchRoutes from './src/routes/dispatch.js';
import fuelRoutes from './src/routes/fuel.js';
import fleetRoutes from './src/routes/fleet.js';
import chatRoutes from './src/routes/chat.js';
import expenseRoutes from './src/routes/expenses.js';
import tripRoutes from './src/routes/trips.js';

// Services
import WebSocketService from './src/services/websocket.js';

// Store
import store from './src/data/store.js';

// Middleware
import { errorHandler } from './src/middleware/errorHandler.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Initialize WebSocket service
const wsService = new WebSocketService(server);
store.wsService = wsService; // Attach to store for access in routes

// ─── Global Middleware ───────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, _res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/drivers', driverRoutes);
app.use('/api/loads', loadRoutes);
app.use('/api/dispatch', dispatchRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/fleet', fleetRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/trips', tripRoutes);

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'DispatchIQ Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── API Documentation ──────────────────────────────────────────────────────
app.get('/api', (_req, res) => {
  res.json({
    service: 'DispatchIQ API',
    version: '1.0.0',
    endpoints: {
      health: {
        'GET /api/health': 'Service health check',
      },
      drivers: {
        'GET /api/drivers': 'List all drivers (query: ?status=on_shift&available=true)',
        'GET /api/drivers/:id': 'Get driver details with HOS breakdown',
        'PATCH /api/drivers/:id': 'Update driver info (location, phone, truck)',
        'PATCH /api/drivers/:id/hos': 'Update HOS data',
        'POST /api/drivers/:id/start-shift': 'Start driver shift',
        'POST /api/drivers/:id/end-shift': 'End driver shift',
        'PATCH /api/drivers/:id/status': 'Toggle on_shift / off_shift',
      },
      loads: {
        'GET /api/loads': 'List all loads (query: ?status=available)',
        'GET /api/loads/:id': 'Get load details',
        'POST /api/loads': 'Create a new load',
        'POST /api/loads/:id/assign': 'Assign load to driver ({ driverId })',
        'POST /api/loads/:id/accept': 'Driver accepts assigned load ({ driverId })',
        'POST /api/loads/:id/drop': 'Driver drops a load ({ driverId })',
        'POST /api/loads/:id/deliver': 'Mark load delivered ({ driverId, fuelCost?, deadheadMiles? })',
      },
      dispatch: {
        'POST /api/dispatch/recommend': 'Get AI-ranked driver recommendations ({ loadId })',
        'POST /api/dispatch/recommend-new': 'Create load + get recommendations in one call',
        'GET /api/dispatch/backhaul/:loadId': 'Get backhaul opportunities (query: ?driverId=&radius=25)',
      },
      fuel: {
        'GET /api/fuel': 'List fuel receipts (query: ?days=30)',
        'GET /api/fuel/driver/:driverId': 'Driver fuel history',
        'POST /api/fuel': 'Upload fuel receipt ({ driverId, amount, gallons })',
        'GET /api/fuel/stats': 'Fleet fuel statistics',
      },
      fleet: {
        'GET /api/fleet/readiness': 'Fleet Readiness Board (live driver map data)',
        'GET /api/fleet/compliance': 'HOS Compliance View',
        'GET /api/fleet/summary': 'Weekly Fleet Summary (auto-generated)',
        'GET /api/fleet/cost': 'Cost Intelligence Dashboard (query: ?days=7)',
        'GET /api/fleet/cost/driver/:id': 'Per-driver cost breakdown',
        'GET /api/fleet/cost/lanes': 'Per-lane cost analysis',
        'GET /api/fleet/alerts': 'System alerts (query: ?type=&driverId=&unacknowledged=true)',
        'POST /api/fleet/alerts/:id/acknowledge': 'Acknowledge an alert',
      },
      chat: {
        'POST /api/chat': 'NLP dispatch assistant — natural language queries',
        'GET /api/chat/history': 'Conversation history (query: ?sessionId=default)',
        'CHAT_PROVIDER': 'Set to auto, claude, or gemini',
        'CLAUDE_API_KEY / GEMINI_API_KEY': 'Optional LLM providers for richer chat responses',
      },
    },
  });
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    error: {
      message: 'Endpoint not found',
      code: 404,
      hint: 'Visit GET /api for available endpoints',
    },
  });
});

// ─── Error Handler (must be last) ────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║          DispatchIQ Backend v1.0         ║');
  console.log('  ╠══════════════════════════════════════════╣');
  console.log(`  ║  Server:  http://localhost:${PORT}          ║`);
  console.log(`  ║  API:     http://localhost:${PORT}/api      ║`);
  console.log(`  ║  Health:  http://localhost:${PORT}/api/health║`);
  console.log(`  ║  WebSocket: ws://localhost:${PORT}         ║`);
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
});
