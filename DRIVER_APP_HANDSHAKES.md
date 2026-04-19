# DispatchIQ Driver App ↔️ Backend ↔️ Dashboard Handshakes

## Architecture Overview

**Real-time bidirectional communication** using WebSocket between:
- **Driver App** (Expo) — Driver mobile client
- **Backend** (Node.js/Express) — Server with WebSocket + API
- **Dashboard** (React/Vite) — Maria's operations dashboard

---

## 3 Core Handshakes

### Handshake #1: Load Assignment (Backend → Driver)

**Flow:**
1. Maria selects a driver on dashboard & assigns a load
2. Dashboard sends request to backend `/api/dispatch/assign`
3. Backend stores assignment in store, broadcasts via WebSocket to driver:
   ```json
   {
     "type": "load:assigned",
     "driverId": "DRV-001",
     "payload": {
       "loadId": "LOAD-001",
       "pickup": { "city": "Phoenix", "state": "AZ", ... },
       "dropoff": { "city": "Tucson", "state": "AZ", ... },
       "miles": 120,
       "rate": 420,
       "deadline": "2026-04-28 3:00 PM"
     }
   }
   ```
4. Driver app receives notification, displays load details on **Status Screen**
5. Driver can **Accept** (creates trip) or **Decline** (load goes back to board)

**Files Involved:**
- Backend: `src/services/websocket.js` (broadcast logic)
- Backend: `src/routes/dispatch.js` (assign endpoint)
- Driver App: `hooks/useWebSocket.ts` (WS client)
- Driver App: `app/(tabs)/status.tsx` (displays current load)

---

### Handshake #2: Expense Logging (Driver → Backend → Dashboard)

**Flow:**
1. Driver opens **Expense Logger Screen**, selects category (⛽ Fuel, 🍔 Food, etc.)
2. Driver enters amount, optional notes, fuel details
3. Driver taps **"Log Expense"** button
4. Driver app sends via WebSocket:
   ```json
   {
     "type": "expense:logged",
     "driverId": "DRV-001",
     "tripId": "TRIP-001",
     "payload": {
       "id": "EXP-1234567",
       "category": "fuel",
       "amount": 45.50,
       "fuel": {
         "gallons": 10.5,
         "pricePerGallon": 3.43,
         "station": "Pilot"
       },
       "location": { "lat": 33.4484, "lng": -112.074 },
       "timestamp": "2026-04-28T14:30:00Z"
     }
   }
   ```
5. Backend receives expense, stores in memory:
   ```javascript
   store.expenses.set(expenseId, expense);
   ```
6. Backend broadcasts to dashboard:
   ```json
   {
     "type": "expense:logged",
     "driverId": "DRV-001",
     "tripId": "TRIP-001",
     "payload": { ... }
   }
   ```
7. Dashboard receives & updates **Trip Summary Dashboard** in real-time
8. Trip expenses appear live as driver logs them

**Files Involved:**
- Driver App: `app/(tabs)/expenses.tsx` (logs expense)
- Driver App: `hooks/useWebSocket.ts` → `logExpense()` method
- Backend: `src/routes/expenses.js` (POST `/api/expenses`)
- Backend: `src/services/websocket.js` (broadcasts to dashboard)
- Dashboard: Frontend (listens to WebSocket, displays expenses)

---

### Handshake #3: Trip Completion & Report Generation (Driver → Backend → Dashboard)

**Flow:**
1. Driver completes all stops, logs final expenses
2. Driver opens **Status Screen**, taps **"✓ Complete Load"** button
3. Driver app sends via WebSocket:
   ```json
   {
     "type": "trip:completed",
     "driverId": "DRV-001",
     "tripId": "TRIP-001",
     "payload": {
       "completedAt": "2026-04-28T17:45:00Z"
     }
   }
   ```
4. Backend receives trip completion event
5. Backend calls `generateTripReport(tripId, driverId)`:
   - Gathers all expenses for trip
   - Calculates cost intelligence (CPM, margin, profit)
   - Checks HOS compliance
   - Generates AI summary
   - Returns structured report object
6. Backend broadcasts report to dashboard:
   ```json
   {
     "type": "trip:completed",
     "driverId": "DRV-001",
     "tripId": "TRIP-001",
     "payload": {
       "id": "REPORT-TRIP-001",
       "lane": "Phoenix → Tucson",
       "distance": { "totalMiles": 120, "loadedMiles": 120, "deadheadMiles": 0 },
       "expenses": {
         "byCategory": { "fuel": { "total": 45.50 }, ... },
         "total": 52.45
       },
       "costIntelligence": {
         "totalCostPerMile": 0.44,
         "revenue": 420,
         "profit": 367.55,
         "margin": 87.51
       },
       "aiSummary": "✅ Excellent efficiency: Cost per mile is 23% below fleet average. Strong margin at 88%..."
     }
   }
   ```
7. Dashboard auto-generates **Trip Report** and displays to Maria
8. Trip marked complete, driver can accept new load

**Files Involved:**
- Driver App: `app/(tabs)/status.tsx` (Complete Load button)
- Driver App: `hooks/useWebSocket.ts` → `completeTrip()` method
- Backend: `src/engines/reporting.js` (generateTripReport)
- Backend: `src/services/websocket.js` (broadcasts report)
- Dashboard: Frontend (displays auto-generated report)

---

## Data Flow Diagram

```
DRIVER APP                    BACKEND                    DASHBOARD
   │                            │                           │
   │──── ws.connect ────>       │                           │
   │   (register as driver)      │                           │
   │                      <──── registered ─────            │
   │                            │                           │
   │                            │                      Maria assigns load
   │                            │    <───── assign load ───  │
   │                            │                            │
   │  <─── broadcast:load ───────  (via WebSocket)          │
   │    (Display on Status Screen)                          │
   │                            │                           │
   │ Driver logs expense        │                           │
   │──── expense:logged ────>    │                           │
   │  (Fuel, Food, Toll)        │                           │
   │                            ├──── broadcast:expense ─>  │
   │                            │  (Dashboard updates live)  │
   │                            │                  (Shows $$ │
   │                            │                   in trip) │
   │                            │                           │
   │ Driver completes trip      │                           │
   │──── trip:completed ────>    │                           │
   │                            ├──────────────────────>     │
   │                            │  Trip Report Generated     │
   │                            │  - Cost Intelligence       │
   │                            │  - Expense Summary         │
   │                            │  - HOS Compliance          │
   │                            │  - AI Summary              │
   │                            │  (Auto-sent to Maria)      │
   │                            │                           │
```

---

## WebSocket Message Types

| Message Type | Direction | Trigger | Payload |
|---|---|---|---|
| `register` | Driver → Backend | Initial connection | `{ clientId, clientType: 'driver', driverId }` |
| `registered` | Backend → Driver | After registration | `{ clientId }` |
| `load:assigned` | Backend → Driver | Maria assigns load | Load details (pickup, dropoff, rate, deadline) |
| `expense:logged` | Driver → Backend | Driver logs expense | Expense object (category, amount, receipt, etc.) |
| `expense:logged` | Backend → Dashboard | Expense received | Expense object (for Maria's dashboard) |
| `trip:completed` | Driver → Backend | Driver finishes trip | Trip completion timestamp |
| `trip:completed` | Backend → Dashboard | Report generated | Full trip report with cost intelligence |
| `hos:updated` | Driver → Backend | HOS changes | Hours driven, break time, compliance flags |
| `hos:updated` | Backend → Dashboard | HOS received | HOS update for fleet visibility |

---

## API Endpoints (HTTP Fallback)

If WebSocket unavailable, HTTP endpoints available:

**Expenses:**
- `POST /api/expenses` — Log new expense
- `GET /api/expenses/trip/:tripId` — Get trip expenses
- `GET /api/expenses/driver/:driverId` — Get driver expense history
- `GET /api/expenses/stats` — Fleet expense statistics

**Dispatch:**
- `POST /api/dispatch/assign` — Assign load to driver
- `GET /api/dispatch/recommendations/:driverId` — Get dispatch suggestions

**Fleet:**
- `GET /api/fleet` — Fleet overview (for dashboard)

---

## Testing the Handshakes

### Test 1: Load Assignment
```bash
# Start backend
cd backend && npm run dev

# In another terminal, test endpoint:
curl -X POST http://localhost:3001/api/dispatch/assign \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "DRV-001",
    "loadId": "LOAD-001"
  }'

# Driver app receives broadcast via WS
```

### Test 2: Expense Logging
```bash
# In driver app (Expo):
import { useWebSocket } from '@/hooks/useWebSocket';
const { logExpense } = useWebSocket();

logExpense({
  tripId: 'TRIP-001',
  category: 'fuel',
  amount: 45.50,
  fuel: { gallons: 10.5, pricePerGallon: 3.43, station: 'Pilot' }
});

# Or via HTTP:
curl -X POST http://localhost:3001/api/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "driverId": "DRV-001",
    "tripId": "TRIP-001",
    "category": "fuel",
    "amount": 45.50
  }'
```

### Test 3: Trip Completion & Report
```bash
# In driver app:
const { completeTrip } = useWebSocket();
completeTrip('TRIP-001');

# Backend generates report and broadcasts
# Dashboard receives and displays auto-generated report
```

---

## Backend WebSocket Server Setup

```javascript
// server.js
import http from 'http';
import WebSocketService from './src/services/websocket.js';

const server = http.createServer(app);
const wsService = new WebSocketService(server);
store.wsService = wsService; // Attach to store for route access

server.listen(PORT, () => {
  console.log(`WebSocket: ws://localhost:${PORT}`);
});
```

---

## Driver App WebSocket Client

```typescript
// hooks/useWebSocket.ts
export function useWebSocket(backendUrl = 'ws://localhost:3001') {
  const ws = new WebSocket(backendUrl);
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    
    if (message.type === 'load:assigned') {
      // Update Status Screen with new load
    }
    if (message.type === 'expense:logged') {
      // Refresh expense summary
    }
  };
  
  return { connected, send, logExpense, completeTrip, updateHOS };
}
```

---

## Next Steps

1. **Test WebSocket connection** — Verify driver app connects to backend
2. **Test load assignment** — Verify dashboard can push loads to driver
3. **Test expense logging** — Verify expenses sync from driver to dashboard
4. **Test trip completion** — Verify reports auto-generate and appear on dashboard
5. **Add receipts** — Implement photo upload for fuel/repair receipts
6. **Add real GPS** — Use expo-location for actual driver location
7. **Add voice commands** — Integrate voice-to-text for Screen 5

---

## Implementation Status

✅ **Completed:**
- WebSocket service in backend
- Expense API endpoints
- Trip report generation engine
- Driver app with 5 screens
- WebSocket client hook
- Real-time data sync architecture

🔄 **In Progress:**
- Testing all 3 handshakes
- Integration with dashboard (Maria's view)
- Receipt photo upload

⏳ **Future:**
- Voice command processing
- Real GPS tracking
- Offline sync capability
- Expense photo OCR

---

## Key Files

**Backend:**
- `server.js` — HTTP + WebSocket server
- `src/services/websocket.js` — Real-time message broker
- `src/routes/expenses.js` — Expense API
- `src/engines/reporting.js` — Trip report generator
- `src/data/store.js` — In-memory data store

**Driver App:**
- `hooks/useWebSocket.ts` — WebSocket client
- `app/(tabs)/status.tsx` — Load assignment + completion
- `app/(tabs)/expenses.tsx` — Expense logger
- `app/(tabs)/summary.tsx` — Trip summary
- `app/(tabs)/hos.tsx` — HOS tracker
- `app/(tabs)/voice.tsx` — Voice assistant

---

Built with ❤️ for DispatchIQ Driver Experience
