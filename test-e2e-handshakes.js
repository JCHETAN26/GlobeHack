/**
 * End-to-End Handshake Test Suite
 * 
 * Tests the complete 3-handshake flow:
 * 1. Driver logs expense → Backend stores → Dashboard receives
 * 2. Driver completes trip → Backend generates report → Dashboard displays
 * 3. Dashboard receives real-time HOS updates
 * 
 * Simulates: Driver App (WS) + Backend (HTTP + WS) + Dashboard (WS)
 */

import http from 'http';
import https from 'https';
import { WebSocket } from 'ws';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  pass: (msg) => console.log(`${COLORS.green}✓ PASS${COLORS.reset} ${msg}`),
  fail: (msg) => console.log(`${COLORS.red}✗ FAIL${COLORS.reset} ${msg}`),
  info: (msg) => console.log(`${COLORS.blue}ℹ INFO${COLORS.reset} ${msg}`),
  warn: (msg) => console.log(`${COLORS.yellow}⚠ WARN${COLORS.reset} ${msg}`),
  test: (msg) => console.log(`${COLORS.cyan}[TEST]${COLORS.reset} ${msg}`),
  title: (msg) => console.log(`\n${COLORS.bright}${msg}${COLORS.reset}`),
};

const API_BASE = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001';

let passCount = 0;
let failCount = 0;

// ============================================================================
// Test 1: Driver connects and logs expense, Dashboard receives it
// ============================================================================
async function testExpenseHandshake() {
  log.title('═══ TEST 1: HANDSHAKE #2 (Expense Logging) ═══');

  return new Promise(async (resolve) => {
    let driverConnected = false;
    let dashboardConnected = false;
    let expenseReceived = false;
    let testPassed = false;

    const testTimeout = setTimeout(() => {
      if (!testPassed) {
        log.fail('Expense handshake test timed out');
        failCount++;
      }
      resolve();
    }, 8000);

    try {
      // 1. Dashboard connects and registers
      const dashboardWs = new WebSocket(WS_URL);
      const dashboardClientId = `dashboard-e2e-${Date.now()}`;

      dashboardWs.onopen = () => {
        log.info(`Dashboard registered as: ${dashboardClientId}`);
        dashboardConnected = true;

        dashboardWs.send(JSON.stringify({
          type: 'register',
          clientId: dashboardClientId,
          clientType: 'dashboard',
        }));
      };

      dashboardWs.onmessage = (event) => {
        const message = JSON.parse(event.data);
        log.info(`Dashboard received: ${message.type}`);

        if (message.type === 'expense:logged') {
          log.info(
            `✓ Dashboard received expense: $${message.payload.amount} (${message.payload.category})`
          );
          expenseReceived = true;

          // Verify expense data integrity
          if (
            message.payload.category === 'fuel' &&
            message.payload.amount === 52.5
          ) {
            log.pass('Expense data integrity verified');
            passCount++;
            testPassed = true;
            clearTimeout(testTimeout);
            dashboardWs.close();
            driverWs.close();
            resolve();
          }
        }
      };

      dashboardWs.onerror = (err) => {
        log.fail(`Dashboard WS error: ${err.message}`);
        failCount++;
        clearTimeout(testTimeout);
        resolve();
      };

      // 2. Driver connects and logs an expense
      const driverWs = new WebSocket(WS_URL);
      const driverClientId = `driver-e2e-${Date.now()}`;

      driverWs.onopen = () => {
        log.info(`Driver registered as: ${driverClientId}`);
        driverConnected = true;

        driverWs.send(JSON.stringify({
          type: 'register',
          clientId: driverClientId,
          clientType: 'driver',
          driverId: 'DRV-E2E-001',
        }));

        // Give dashboard time to register before driver logs expense
        setTimeout(() => {
          log.info('Driver logging expense...');
          driverWs.send(JSON.stringify({
            type: 'expense:logged',
            clientId: driverClientId,
            driverId: 'DRV-E2E-001',
            tripId: 'TRIP-E2E-001',
            payload: {
              id: `EXP-E2E-${Date.now()}`,
              category: 'fuel',
              amount: 52.5,
              fuel: {
                gallons: 15,
                pricePerGallon: 3.5,
                station: 'Love\'s',
              },
              location: {
                lat: 33.4484,
                lng: -112.074,
                address: 'Phoenix, AZ',
              },
              timestamp: new Date().toISOString(),
            },
          }));
        }, 1000);
      };

      driverWs.onerror = (err) => {
        log.fail(`Driver WS error: ${err.message}`);
        failCount++;
        clearTimeout(testTimeout);
        resolve();
      };
    } catch (err) {
      log.fail(`Expense handshake error: ${err.message}`);
      failCount++;
      clearTimeout(testTimeout);
      resolve();
    }
  });
}

// ============================================================================
// Test 2: Driver completes trip, Backend generates report, Dashboard receives
// ============================================================================
async function testTripCompletionHandshake() {
  log.title('═══ TEST 2: HANDSHAKE #3 (Trip Completion & Report) ═══');

  return new Promise(async (resolve) => {
    let testPassed = false;

    const testTimeout = setTimeout(() => {
      if (!testPassed) {
        log.fail('Trip completion handshake test timed out');
        failCount++;
      }
      resolve();
    }, 8000);

    try {
      // 1. Dashboard listens for trip completion
      const dashboardWs = new WebSocket(WS_URL);
      const dashboardClientId = `dashboard-e2e-trip-${Date.now()}`;

      dashboardWs.onopen = () => {
        log.info(`Dashboard registered for trip completion: ${dashboardClientId}`);

        dashboardWs.send(JSON.stringify({
          type: 'register',
          clientId: dashboardClientId,
          clientType: 'dashboard',
        }));
      };

      dashboardWs.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'trip:completed') {
          log.info(`✓ Dashboard received trip completion`);

          // Verify report structure or basic payload
          if (message.payload) {
            log.pass('Trip completion payload verified');
            log.info(
              `  Trip ID: ${message.tripId || 'confirmed'}, Driver: ${message.driverId}`
            );
            passCount++;
            testPassed = true;
            clearTimeout(testTimeout);
            dashboardWs.close();
            driverWs.close();
            resolve();
          }
        }
      };

      dashboardWs.onerror = (err) => {
        log.fail(`Dashboard WS error: ${err.message}`);
        failCount++;
        clearTimeout(testTimeout);
        resolve();
      };

      // 2. Driver completes trip via WebSocket
      const driverWs = new WebSocket(WS_URL);
      const driverClientId = `driver-e2e-trip-${Date.now()}`;

      driverWs.onopen = () => {
        log.info(`Driver registered for trip completion: ${driverClientId}`);

        driverWs.send(JSON.stringify({
          type: 'register',
          clientId: driverClientId,
          clientType: 'driver',
          driverId: 'DRV-E2E-002',
        }));

        // Driver completes trip
        setTimeout(() => {
          log.info('Driver completing trip...');
          driverWs.send(JSON.stringify({
            type: 'trip:completed',
            clientId: driverClientId,
            driverId: 'DRV-E2E-002',
            tripId: 'TRIP-E2E-002',
            payload: {
              completedAt: new Date().toISOString(),
            },
          }));
        }, 1000);
      };

      driverWs.onerror = (err) => {
        log.fail(`Driver WS error: ${err.message}`);
        failCount++;
        clearTimeout(testTimeout);
        resolve();
      };
    } catch (err) {
      log.fail(`Trip completion handshake error: ${err.message}`);
      failCount++;
      clearTimeout(testTimeout);
      resolve();
    }
  });
}

// ============================================================================
// Test 3: HOS Update Broadcast
// ============================================================================
async function testHosUpdateHandshake() {
  log.title('═══ TEST 3: HANDSHAKE #4 (HOS Update Broadcast) ═══');

  return new Promise(async (resolve) => {
    let testPassed = false;

    const testTimeout = setTimeout(() => {
      if (!testPassed) {
        log.fail('HOS update handshake test timed out');
        failCount++;
      }
      resolve();
    }, 8000);

    try {
      // 1. Dashboard listens for HOS updates
      const dashboardWs = new WebSocket(WS_URL);
      const dashboardClientId = `dashboard-e2e-hos-${Date.now()}`;

      dashboardWs.onopen = () => {
        log.info(`Dashboard registered for HOS updates: ${dashboardClientId}`);

        dashboardWs.send(JSON.stringify({
          type: 'register',
          clientId: dashboardClientId,
          clientType: 'dashboard',
        }));
      };

      dashboardWs.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'hos:updated') {
          log.info(`✓ Dashboard received HOS update from: ${message.driverId}`);

          if (
            message.payload &&
            message.payload.hoursDriven !== undefined &&
            message.payload.hosBreak !== undefined
          ) {
            log.pass('HOS data structure verified');
            log.info(
              `  Hours driven: ${message.payload.hoursDriven}h, Break at: ${message.payload.hosBreak}h`
            );
            passCount++;
            testPassed = true;
            clearTimeout(testTimeout);
            dashboardWs.close();
            driverWs.close();
            resolve();
          }
        }
      };

      dashboardWs.onerror = (err) => {
        log.fail(`Dashboard WS error: ${err.message}`);
        failCount++;
        clearTimeout(testTimeout);
        resolve();
      };

      // 2. Driver sends HOS update via WebSocket
      const driverWs = new WebSocket(WS_URL);
      const driverClientId = `driver-e2e-hos-${Date.now()}`;

      driverWs.onopen = () => {
        log.info(`Driver registered for HOS updates: ${driverClientId}`);

        driverWs.send(JSON.stringify({
          type: 'register',
          clientId: driverClientId,
          clientType: 'driver',
          driverId: 'DRV-E2E-003',
        }));

        // Driver updates HOS
        setTimeout(() => {
          log.info('Driver updating HOS...');
          driverWs.send(JSON.stringify({
            type: 'hos:updated',
            clientId: driverClientId,
            driverId: 'DRV-E2E-003',
            payload: {
              hoursDriven: 8.5,
              hosBreak: 2.0,
              timestamp: new Date().toISOString(),
            },
          }));
        }, 1000);
      };

      driverWs.onerror = (err) => {
        log.fail(`Driver WS error: ${err.message}`);
        failCount++;
        clearTimeout(testTimeout);
        resolve();
      };
    } catch (err) {
      log.fail(`HOS update handshake error: ${err.message}`);
      failCount++;
      clearTimeout(testTimeout);
      resolve();
    }
  });
}

// ============================================================================
// Test 4: Multiple Drivers Logging Expenses Simultaneously
// ============================================================================
async function testMultipleDriverExpenses() {
  log.title('═══ TEST 4: Multiple Drivers (Concurrent Expenses) ═══');

  return new Promise(async (resolve) => {
    let receivedCount = 0;
    const expectedCount = 3;
    const testTimeout = setTimeout(() => {
      if (receivedCount >= expectedCount) {
        log.pass(`All ${expectedCount} expenses received concurrently`);
        passCount++;
      } else {
        log.fail(`Only ${receivedCount}/${expectedCount} expenses received`);
        failCount++;
      }
      clearTimeout(testTimeout);
      resolve();
    }, 8000);

    try {
      // Dashboard listening
      const dashboardWs = new WebSocket(WS_URL);
      const dashboardClientId = `dashboard-e2e-multi-${Date.now()}`;

      dashboardWs.onopen = () => {
        log.info(`Dashboard listening for concurrent expenses`);

        dashboardWs.send(JSON.stringify({
          type: 'register',
          clientId: dashboardClientId,
          clientType: 'dashboard',
        }));
      };

      dashboardWs.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === 'expense:logged') {
          receivedCount++;
          log.info(
            `✓ Received expense ${receivedCount}/${expectedCount}: $${message.payload.amount} from ${message.driverId}`
          );

          if (receivedCount >= expectedCount) {
            dashboardWs.close();
            drivers.forEach((ws) => ws.close());
          }
        }
      };

      // Launch 3 drivers simultaneously
      const drivers = [];
      for (let i = 1; i <= 3; i++) {
        const driverWs = new WebSocket(WS_URL);
        const driverId = `DRV-E2E-MULTI-${i}`;
        const driverClientId = `driver-e2e-multi-${i}-${Date.now()}`;

        driverWs.onopen = () => {
          log.info(`Driver ${i} connected`);

          driverWs.send(JSON.stringify({
            type: 'register',
            clientId: driverClientId,
            clientType: 'driver',
            driverId,
          }));

          // Log expense
          setTimeout(() => {
            driverWs.send(JSON.stringify({
              type: 'expense:logged',
              clientId: driverClientId,
              driverId,
              tripId: `TRIP-MULTI-${i}`,
              payload: {
                id: `EXP-MULTI-${i}-${Date.now()}`,
                category: ['fuel', 'food', 'toll'][i - 1],
                amount: 25 * i,
                timestamp: new Date().toISOString(),
              },
            }));
          }, 500 * i);
        };

        drivers.push(driverWs);
      }
    } catch (err) {
      log.fail(`Multiple driver test error: ${err.message}`);
      failCount++;
      clearTimeout(testTimeout);
      resolve();
    }
  });
}

// ============================================================================
// Test 5: WebSocket Reconnection After Disconnect
// ============================================================================
async function testWebSocketReconnection() {
  log.title('═══ TEST 5: WebSocket Reconnection ═══');

  return new Promise(async (resolve) => {
    let reconnected = false;
    const testTimeout = setTimeout(() => {
      if (reconnected) {
        log.pass('Successfully reconnected after disconnect');
        passCount++;
      } else {
        log.fail('Failed to reconnect after disconnect');
        failCount++;
      }
      clearTimeout(testTimeout);
      resolve();
    }, 8000);

    try {
      const clientId = `driver-e2e-reconnect-${Date.now()}`;
      let ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        log.info('Driver connected');

        ws.send(JSON.stringify({
          type: 'register',
          clientId,
          clientType: 'driver',
          driverId: 'DRV-E2E-RECONNECT',
        }));

        // Force disconnect after 1 second
        setTimeout(() => {
          log.info('Simulating connection loss...');
          ws.close();

          // Wait and try to reconnect
          setTimeout(() => {
            ws = new WebSocket(WS_URL);

            ws.onopen = () => {
              log.info('✓ Reconnected to WebSocket');
              reconnected = true;

              ws.send(JSON.stringify({
                type: 'register',
                clientId: `${clientId}-reconnected`,
                clientType: 'driver',
                driverId: 'DRV-E2E-RECONNECT',
              }));

              clearTimeout(testTimeout);
              ws.close();
              resolve();
            };
          }, 2000);
        }, 1500);
      };

      ws.onerror = (err) => {
        log.fail(`WS error: ${err.message}`);
        failCount++;
        clearTimeout(testTimeout);
        resolve();
      };
    } catch (err) {
      log.fail(`Reconnection test error: ${err.message}`);
      failCount++;
      clearTimeout(testTimeout);
      resolve();
    }
  });
}

// ============================================================================
// Main Test Runner
// ============================================================================
async function runAllTests() {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║       DispatchIQ End-to-End Handshake Test Suite           ║
║         Driver App ↔️ Backend ↔️ Dashboard                  ║
╚════════════════════════════════════════════════════════════╝
`);

  log.info(`Backend: ${API_BASE}`);
  log.info(`WebSocket: ${WS_URL}`);
  log.info(`\nRunning 5 comprehensive tests...\n`);

  // Run tests sequentially
  await testExpenseHandshake();
  await testTripCompletionHandshake();
  await testHosUpdateHandshake();
  await testMultipleDriverExpenses();
  await testWebSocketReconnection();

  // Summary
  console.log(`
═══════════════════════════════════════════════════════════
TEST SUMMARY
═══════════════════════════════════════════════════════════`);

  console.log(`${COLORS.green}✓ PASSED: ${passCount}${COLORS.reset}`);
  console.log(`${COLORS.red}✗ FAILED: ${failCount}${COLORS.reset}`);

  const total = passCount + failCount;
  const percentage = ((passCount / total) * 100).toFixed(0);

  if (failCount === 0) {
    console.log(`\n${COLORS.green}${COLORS.bright}🎉 ALL TESTS PASSED! 🎉${COLORS.reset}`);
    console.log(`${COLORS.green}The 3-handshake system is working perfectly.${COLORS.reset}\n`);
  } else {
    console.log(
      `\n${COLORS.yellow}⚠️  ${failCount} test(s) failed. Check logs above.${COLORS.reset}\n`
    );
  }

  console.log(`═══════════════════════════════════════════════════════════\n`);
  process.exit(failCount > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
