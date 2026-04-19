#!/bin/bash
# Quick Start Script for DispatchIQ Integration Testing
# Run this to verify frontend2 ↔ backend integration

set -e

echo "═══════════════════════════════════════════════════════════"
echo "  DispatchIQ: Frontend2 ↔ Backend Integration Tester"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if backend is running
echo "🔍 Checking backend status..."
if curl -s http://localhost:3001/api/drivers > /dev/null 2>&1; then
  echo "✅ Backend is running on port 3001"
else
  echo "❌ Backend is NOT running on port 3001"
  echo ""
  echo "📝 Start it with:"
  echo "   cd /Users/chetan/GlobeHack/backend"
  echo "   npm start"
  echo ""
  exit 1
fi

echo ""
echo "📊 Backend Data Summary:"
echo "═══════════════════════════════════════════════════════════"

# Get driver count
DRIVER_COUNT=$(curl -s http://localhost:3001/api/drivers | grep -o '"id"' | wc -l)
echo "👥 Drivers: $DRIVER_COUNT"

# Get load count
LOAD_COUNT=$(curl -s http://localhost:3001/api/loads | grep -o '"id"' | wc -l)
echo "📦 Loads: $LOAD_COUNT"

# Get trip count
TRIP_COUNT=$(curl -s http://localhost:3001/api/trips | grep -o '"id"' | wc -l)
echo "🚚 Trips: $TRIP_COUNT"

# Get expense count
EXPENSE_COUNT=$(curl -s http://localhost:3001/api/expenses | grep -o '"id"' | wc -l)
echo "💰 Expenses: $EXPENSE_COUNT"

echo ""
echo "✅ Backend Health Check Passed"
echo ""

echo "📍 Frontend2 Status:"
echo "═══════════════════════════════════════════════════════════"

if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "✅ Frontend2 is running on port 3000"
  echo ""
  echo "🌐 Open in browser:"
  echo "   http://localhost:3000"
  echo ""
else
  echo "⚠️  Frontend2 is NOT running on port 3000"
  echo ""
  echo "📝 Start it with:"
  echo "   cd /Users/chetan/GlobeHack/frontend2"
  echo "   npm run dev"
  echo ""
fi

echo "═══════════════════════════════════════════════════════════"
echo "✨ Integration Ready for Testing!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 Test Checklist:"
echo "  □ Open http://localhost:3000 in browser"
echo "  □ Check FleetCopilot shows $DRIVER_COUNT drivers"
echo "  □ Go to LoadAssignment tab"
echo "  □ Select a load and verify recommendations load"
echo "  □ Try assigning a load"
echo "  □ Open DevTools (F12) → Network → WS tab"
echo "  □ Verify WebSocket connection shows 'ws://localhost:3001'"
echo ""
echo "🔄 Real-Time Test:"
echo "  In another terminal, run:"
echo "  curl -X POST http://localhost:3001/api/expenses \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"driverId\":\"DRV-001\",\"tripId\":\"TRIP-001\",\"category\":\"fuel\",\"amount\":50}'"
echo ""
echo "  Watch the dashboard update in real-time! ✨"
echo ""
