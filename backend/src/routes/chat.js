/**
 * DispatchIQ — Chat Routes
 *
 * API endpoint for the NLP-powered dispatch assistant.
 *   POST /api/chat  - Process a natural language message
 *   GET  /api/chat/history - Get conversation history (in-memory)
 */

import { Router } from 'express';
import { processMessage } from '../engines/nlp.js';
import { asyncHandler, ValidationError } from '../middleware/errorHandler.js';

const router = Router();

// In-memory conversation history (per session, max 50 messages)
const conversations = new Map();

/**
 * POST /api/chat
 * Process a natural language dispatch query.
 *
 * Body: {
 *   message: string,
 *   sessionId?: string (optional, for conversation history)
 * }
 *
 * Response: {
 *   reply: string (markdown-formatted),
 *   type: string (dispatch_result | fleet_status | hos_check | etc),
 *   intent: string | null,
 *   data?: object (structured data like recommendation, load, etc),
 *   timestamp: string
 * }
 */
router.post('/', asyncHandler(async (req, res) => {
  const { message, sessionId = 'default' } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new ValidationError('message is required and must be a non-empty string');
  }

  const trimmed = message.trim();

  // Process through NLP engine
  const result = processMessage(trimmed);

  // Build response
  const response = {
    reply: result.message,
    type: result.type,
    intent: result.intent,
    timestamp: new Date().toISOString(),
  };

  // Attach structured data if available
  if (result.load) response.load = result.load;
  if (result.recommendation) response.recommendation = result.recommendation;
  if (result.driver) response.driverId = result.driver;

  // Store in conversation history
  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, []);
  }
  const history = conversations.get(sessionId);
  history.push(
    { role: 'user', content: trimmed, timestamp: new Date().toISOString() },
    { role: 'assistant', content: result.message, type: result.type, timestamp: response.timestamp },
  );
  // Keep last 50 messages
  if (history.length > 50) {
    conversations.set(sessionId, history.slice(-50));
  }

  res.json(response);
}));

/**
 * GET /api/chat/history
 * Get conversation history for a session.
 * Query: ?sessionId=default
 */
router.get('/history', asyncHandler(async (req, res) => {
  const { sessionId = 'default' } = req.query;
  const history = conversations.get(sessionId) || [];

  res.json({
    sessionId,
    messageCount: history.length,
    messages: history,
  });
}));

export default router;
