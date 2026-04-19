/**
 * DispatchIQ — Chat Routes
 *
 * API endpoint for the NLP-powered dispatch assistant.
 *   POST /api/chat  - Process a natural language message
 *   GET  /api/chat/history - Get conversation history (in-memory)
 */

import { Router } from 'express';
import { processMessage } from '../engines/nlp.js';
import { generateChatReply } from '../engines/llm.js';
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

  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, []);
  }
  const history = conversations.get(sessionId);

  // Process through NLP engine
  const result = processMessage(trimmed);
  const llm = await generateChatReply({
    message: trimmed,
    history,
    deterministicResult: result,
  });

  // Build response
  const response = {
    reply: llm.reply,
    type: result.type,
    intent: result.intent,
    provider: llm.provider,
    model: llm.model,
    timestamp: new Date().toISOString(),
  };

  // Attach structured data if available
  if (result.load) response.load = result.load;
  if (result.recommendation) response.recommendation = result.recommendation;
  if (result.driver) response.driverId = result.driver;
  if (llm.warning) response.warning = llm.warning;

  // Store in conversation history
  history.push(
    { role: 'user', content: trimmed, timestamp: new Date().toISOString() },
    {
      role: 'assistant',
      content: llm.reply,
      type: result.type,
      provider: llm.provider,
      timestamp: response.timestamp,
    },
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
