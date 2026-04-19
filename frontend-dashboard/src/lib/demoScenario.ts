/**
 * Demo Scenario Setup
 * 
 * Creates a reproducible demo scenario with:
 * - 3 pending loads (PHX→DAL, PHX→LAS, TEM→ABQ)
 * - 2 drivers with tight HOS (<2 hours remaining)
 * - $2,140 in estimated deadhead waste
 * 
 * Usage: Call setupDemoScenario() in your demo, then navigate to dashboard
 */

export const DEMO_SCENARIO = {
  title: "Maria's Tuesday Morning",
  description: "3 pending loads, 2 drivers tight on HOS, $2,140 deadhead at risk",
  
  pendingLoads: [
    {
      id: "LOAD-001",
      origin: "Phoenix, AZ",
      destination: "Dallas, TX",
      distance: 450,
      weight: 38000,
      rate: 2100,
      type: "dry_van",
      status: "available",
    },
    {
      id: "LOAD-002",
      origin: "Phoenix, AZ",
      destination: "Las Vegas, NV",
      distance: 280,
      weight: 22000,
      rate: 1400,
      type: "reefer",
      status: "available",
    },
    {
      id: "LOAD-003",
      origin: "Tempe, AZ",
      destination: "Albuquerque, NM",
      distance: 460,
      weight: 40000,
      rate: 2200,
      type: "dry_van",
      status: "available",
    },
  ],

  tightHOSDrivers: [
    {
      id: "DRV-001",
      name: "Carlos Rivera",
      dailyHOS: 0.8,
      maxDaily: 11,
      weeklyHOS: 67.2,
      maxWeekly: 70,
      currentLocation: "Phoenix, AZ",
    },
    {
      id: "DRV-002",
      name: "Maria Santos",
      dailyHOS: 1.2,
      maxDaily: 11,
      weeklyHOS: 66.8,
      maxWeekly: 70,
      currentLocation: "Phoenix, AZ",
    },
  ],

  metrics: {
    pendingLoads: 3,
    tightHOSDrivers: 2,
    potentialDeadhead: 2140,
    weeklyRunRate: 12840,
    monthlyImpact: 51360,
  },

  optimalAssignments: [
    {
      loadId: "LOAD-001",
      driverId: "DRV-003", // John Davis (available in Dallas area)
      driverName: "John Davis",
      deadheadMiles: 12,
      deadheadCost: 48,
      hoursAvailable: 9.2,
      estimatedProfit: 1920,
      savings: 180,
    },
    {
      loadId: "LOAD-002",
      driverId: "DRV-001",
      driverName: "Carlos Rivera",
      deadheadMiles: 2,
      deadheadCost: 8,
      hoursAvailable: 10.1,
      estimatedProfit: 1340,
      savings: 140,
    },
    {
      loadId: "LOAD-003",
      driverId: "DRV-004", // Maria Santos (different Maria)
      driverName: "Maria Santos",
      deadheadMiles: 1,
      deadheadCost: 4,
      hoursAvailable: 8.5,
      estimatedProfit: 2050,
      savings: 210,
    },
  ],

  results: {
    originalDeadhead: 535,
    optimizedDeadhead: 85,
    totalSavings: 450,
    monthlyImpact: 11250,
    marginImprovement: 0.6, // from 4.2% to 4.8%
    marginDollarValue: 3800,
  },
};

/**
 * Initialize demo scenario in local storage
 * Allows dashboard to display demo data without backend changes
 */
export function setupDemoScenario() {
  localStorage.setItem("demo_scenario", JSON.stringify(DEMO_SCENARIO));
  localStorage.setItem("demo_mode", "true");
  console.log("✅ Demo scenario loaded. Reload dashboard to see changes.");
}

/**
 * Clear demo scenario
 */
export function clearDemoScenario() {
  localStorage.removeItem("demo_scenario");
  localStorage.removeItem("demo_mode");
  console.log("❌ Demo scenario cleared.");
}

/**
 * Check if demo mode is active
 */
export function isDemoMode(): boolean {
  return localStorage.getItem("demo_mode") === "true";
}

/**
 * Get demo scenario data
 */
export function getDemoScenario() {
  const data = localStorage.getItem("demo_scenario");
  return data ? JSON.parse(data) : null;
}

/**
 * Demo Console Script
 * 
 * Run this in browser console to activate demo:
 * 
 * import { setupDemoScenario } from '@/lib/demoScenario'
 * setupDemoScenario()
 * 
 * Or copy-paste this directly in console:
 * 
 * localStorage.setItem("demo_mode", "true");
 * localStorage.setItem("demo_scenario", JSON.stringify({
 *   "metrics": {
 *     "pendingLoads": 3,
 *     "tightHOSDrivers": 2,
 *     "potentialDeadhead": 2140,
 *     "weeklyRunRate": 12840,
 *     "monthlyImpact": 51360
 *   }
 * }));
 * window.location.reload();
 */

export const DEMO_CONSOLE_COMMAND = `
// Paste this into browser console to activate demo:
localStorage.setItem("demo_mode", "true");
localStorage.setItem("demo_scenario", JSON.stringify({
  "metrics": {
    "pendingLoads": 3,
    "tightHOSDrivers": 2,
    "potentialDeadhead": 2140,
    "weeklyRunRate": 12840,
    "monthlyImpact": 51360
  }
}));
window.location.reload();
`;
