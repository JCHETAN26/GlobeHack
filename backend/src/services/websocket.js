/**
 * WebSocket Service
 * 
 * Real-time bidirectional communication between:
 *   - Driver app (WebSocket client)
 *   - Backend (WebSocket server)
 *   - Dashboard (WebSocket client)
 * 
 * Broadcasts:
 *   - Load assignments to drivers
 *   - Expense updates to dashboard
 *   - Trip completion reports
 *   - HOS updates
 */

import { WebSocketServer } from 'ws';

// WebSocket connection states
const WS_OPEN = 1;

class WebSocketService {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.clients = new Map(); // clientId → { ws, type: 'driver'|'dashboard', driverId?, userId? }
    
    this.wss.on('connection', (ws) => this.handleConnection(ws));
  }

  handleConnection(ws) {
    console.log('[WebSocket] New connection');

    ws.on('message', (data) => this.handleMessage(ws, data));
    ws.on('close', () => this.handleDisconnect(ws));
    ws.on('error', (err) => console.error('[WebSocket] Error:', err.message));
  }

  handleMessage(ws, data) {
    try {
      const message = JSON.parse(data);
      const { type, clientId, clientType, driverId, userId, tripId, payload } = message;

      // Register client on first handshake
      if (type === 'register') {
        this.clients.set(clientId, {
          ws,
          type: clientType, // 'driver' | 'dashboard'
          driverId,
          userId,
          connectedAt: new Date().toISOString(),
        });
        console.log(`[WebSocket] Client registered: ${clientId} (${clientType})`);
        ws.send(JSON.stringify({ type: 'registered', clientId }));
        return;
      }

      // Relay messages based on type, preserving all metadata
      if (type === 'load:assigned') {
        this.broadcastToDriver(driverId, {
          type: 'load:assigned',
          driverId,
          payload,
        });
      } else if (type === 'expense:logged') {
        this.broadcastToDashboard({
          type: 'expense:logged',
          driverId,
          tripId,
          payload,
        });
      } else if (type === 'trip:completed') {
        this.broadcastToDashboard({
          type: 'trip:completed',
          driverId,
          tripId,
          payload,
        });
      } else if (type === 'hos:updated') {
        this.broadcastToDashboard({
          type: 'hos:updated',
          driverId,
          payload,
        });
      }
    } catch (err) {
      console.error('[WebSocket] Message error:', err.message);
    }
  }

  handleDisconnect(ws) {
    let clientId = null;
    for (const [id, client] of this.clients.entries()) {
      if (client.ws === ws) {
        clientId = id;
        this.clients.delete(id);
        break;
      }
    }
    console.log(`[WebSocket] Client disconnected: ${clientId}`);
  }

  // Server methods to broadcast to clients
  broadcastToDriver(driverId, message) {
    for (const [, client] of this.clients.entries()) {
      if (client.type === 'driver' && client.driverId === driverId && client.ws.readyState === WS_OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  broadcastToDashboard(message) {
    for (const [, client] of this.clients.entries()) {
      if (client.type === 'dashboard' && client.ws.readyState === WS_OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  broadcastToAll(message) {
    for (const [, client] of this.clients.entries()) {
      if (client.ws.readyState === WS_OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    }
  }

  getConnectedClients() {
    return Array.from(this.clients.values()).map((c) => ({
      type: c.type,
      driverId: c.driverId,
      userId: c.userId,
      connectedAt: c.connectedAt,
    }));
  }
}

export default WebSocketService;
