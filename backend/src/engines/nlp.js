/**
 * DispatchIQ — Natural Language Processing Engine
 *
 * Parses dispatcher natural language queries into structured dispatch requests.
 * Handles queries like:
 *   "I need a driver for a 38000 lb dry van from Phoenix to Dallas"
 *   "Who can take a reefer load to LA? About 28000 lbs"
 *   "Find me someone with at least 8 hours HOS for a flatbed to Denver"
 *   "What drivers are available right now?"
 *   "Show me fleet status"
 *   "How's our cost per mile this week?"
 */

import store from '../data/store.js';
import { estimateRoadDistance, estimateDriveTime } from '../utils/geo.js';
import { generateRecommendation } from './dispatch.js';
import { runFleetComplianceCheck, calculateHOSRemaining, getDriverStatus } from './hos.js';
import { generateWeeklySummary } from './cost.js';

// ─── Location Database ───────────────────────────────────────────────────────
const LOCATIONS = {
  'phoenix':       { lat: 33.4484, lng: -112.074,  city: 'Phoenix, AZ' },
  'phx':           { lat: 33.4484, lng: -112.074,  city: 'Phoenix, AZ' },
  'tempe':         { lat: 33.4255, lng: -111.940,  city: 'Tempe, AZ' },
  'mesa':          { lat: 33.4152, lng: -111.832,  city: 'Mesa, AZ' },
  'scottsdale':    { lat: 33.4942, lng: -111.926,  city: 'Scottsdale, AZ' },
  'tucson':        { lat: 32.2226, lng: -110.975,  city: 'Tucson, AZ' },
  'flagstaff':     { lat: 35.1983, lng: -111.651,  city: 'Flagstaff, AZ' },
  'yuma':          { lat: 32.6927, lng: -114.628,  city: 'Yuma, AZ' },
  'chandler':      { lat: 33.3062, lng: -111.841,  city: 'Chandler, AZ' },
  'gilbert':       { lat: 33.3528, lng: -111.789,  city: 'Gilbert, AZ' },
  'glendale':      { lat: 33.5387, lng: -112.186,  city: 'Glendale, AZ' },
  'surprise':      { lat: 33.6292, lng: -112.368,  city: 'Surprise, AZ' },
  'prescott':      { lat: 34.5400, lng: -112.469,  city: 'Prescott, AZ' },
  'dallas':        { lat: 32.7767, lng: -96.797,   city: 'Dallas, TX' },
  'houston':       { lat: 29.7604, lng: -95.370,   city: 'Houston, TX' },
  'san antonio':   { lat: 29.4241, lng: -98.494,   city: 'San Antonio, TX' },
  'el paso':       { lat: 31.7619, lng: -106.485,  city: 'El Paso, TX' },
  'los angeles':   { lat: 34.0522, lng: -118.244,  city: 'Los Angeles, CA' },
  'la':            { lat: 34.0522, lng: -118.244,  city: 'Los Angeles, CA' },
  'san diego':     { lat: 32.7157, lng: -117.161,  city: 'San Diego, CA' },
  'san francisco': { lat: 37.7749, lng: -122.419,  city: 'San Francisco, CA' },
  'sf':            { lat: 37.7749, lng: -122.419,  city: 'San Francisco, CA' },
  'las vegas':     { lat: 36.1699, lng: -115.140,  city: 'Las Vegas, NV' },
  'vegas':         { lat: 36.1699, lng: -115.140,  city: 'Las Vegas, NV' },
  'denver':        { lat: 39.7392, lng: -104.990,  city: 'Denver, CO' },
  'albuquerque':   { lat: 35.0844, lng: -106.650,  city: 'Albuquerque, NM' },
  'salt lake':     { lat: 40.7608, lng: -111.891,  city: 'Salt Lake City, UT' },
  'salt lake city':{ lat: 40.7608, lng: -111.891,  city: 'Salt Lake City, UT' },
  'slc':           { lat: 40.7608, lng: -111.891,  city: 'Salt Lake City, UT' },
  'reno':          { lat: 39.5296, lng: -119.814,  city: 'Reno, NV' },
  'portland':      { lat: 45.5051, lng: -122.675,  city: 'Portland, OR' },
  'seattle':       { lat: 47.6062, lng: -122.332,  city: 'Seattle, WA' },
  'chicago':       { lat: 41.8781, lng: -87.6298,  city: 'Chicago, IL' },
  'atlanta':       { lat: 33.7490, lng: -84.3880,  city: 'Atlanta, GA' },
  'miami':         { lat: 25.7617, lng: -80.1918,  city: 'Miami, FL' },
  'nashville':     { lat: 36.1627, lng: -86.7816,  city: 'Nashville, TN' },
  'memphis':       { lat: 35.1495, lng: -90.0490,  city: 'Memphis, TN' },
  'kansas city':   { lat: 39.0997, lng: -94.5786,  city: 'Kansas City, MO' },
  'oklahoma city': { lat: 35.4676, lng: -97.5164,  city: 'Oklahoma City, OK' },
  'okc':           { lat: 35.4676, lng: -97.5164,  city: 'Oklahoma City, OK' },
};

// ─── Intent Classification ──────────────────────────────────────────────────

const INTENTS = {
  DISPATCH:     'dispatch',
  FLEET_STATUS: 'fleet_status',
  HOS_CHECK:    'hos_check',
  COST_QUERY:   'cost_query',
  DRIVER_CHECK: 'driver_check',
  AVAILABLE:    'available_drivers',
  HELP:         'help',
  GREETING:     'greeting',
};

/**
 * Process a natural language message from the dispatcher.
 *
 * @param {string} message - Raw user message
 * @returns {Object} Structured response with type, data, and natural language reply
 */
export function processMessage(message) {
  const normalized = message.toLowerCase().trim();
  const intent = classifyIntent(normalized);

  switch (intent) {
    case INTENTS.DISPATCH:
      return handleDispatchQuery(normalized, message);
    case INTENTS.FLEET_STATUS:
      return handleFleetStatus();
    case INTENTS.HOS_CHECK:
      return handleHOSCheck(normalized);
    case INTENTS.COST_QUERY:
      return handleCostQuery();
    case INTENTS.DRIVER_CHECK:
      return handleDriverCheck(normalized);
    case INTENTS.AVAILABLE:
      return handleAvailableDrivers();
    case INTENTS.GREETING:
      return handleGreeting();
    case INTENTS.HELP:
      return handleHelp();
    default:
      return handleUnknown(message);
  }
}

/**
 * Classify the intent of a message.
 */
function classifyIntent(msg) {
  // Dispatch queries
  if (matchesAny(msg, [
    'need a driver', 'find.*driver', 'who can take', 'assign.*load',
    'dispatch', 'send.*to', 'got a load', 'new load', 'load from',
    'load to', 'deliver.*to', 'haul.*to', 'pickup.*from', 'pick up',
    'find me someone', 'recommend.*driver', 'best driver', 'who should',
    'who.*available.*for', 'driver for', 'from.*to',
  ])) return INTENTS.DISPATCH;

  // Fleet status
  if (matchesAny(msg, [
    'fleet status', 'fleet overview', 'readiness', 'everyone',
    'all drivers', 'how.*fleet', 'fleet.*look', 'show.*fleet',
    'fleet board', 'how are we',
  ])) return INTENTS.FLEET_STATUS;

  // HOS check
  if (matchesAny(msg, [
    'hos', 'hours of service', 'compliance', 'hours remaining',
    'drive time', 'how many hours', 'can.*drive', 'rest',
    'fmcsa', 'eld', 'off duty',
  ])) return INTENTS.HOS_CHECK;

  // Cost queries
  if (matchesAny(msg, [
    'cost', 'cpm', 'cost per mile', 'spend', 'expense',
    'profit', 'margin', 'revenue', 'how much', 'budget',
    'deadhead', 'fuel spend', 'money', 'earning',
  ])) return INTENTS.COST_QUERY;

  // Specific driver check
  if (matchesAny(msg, [
    'how.*is.*doing', 'check on', 'status of', 'where.*is',
    'driver.*status',
  ])) return INTENTS.DRIVER_CHECK;

  // Available drivers
  if (matchesAny(msg, [
    'available', 'free', 'open', 'who.*ready', 'who.*idle',
    'unassigned',
  ])) return INTENTS.AVAILABLE;

  // Greeting
  if (matchesAny(msg, [
    '^hi$', '^hey$', '^hello', '^good morning', '^good afternoon',
    '^yo$', '^sup$', '^what.*up',
  ])) return INTENTS.GREETING;

  // Help
  if (matchesAny(msg, [
    'help', 'what can you', 'how.*work', 'commands', 'options',
  ])) return INTENTS.HELP;

  // Fallback: try to detect city-to-city pattern (probably a dispatch)
  const cities = extractCities(msg);
  if (cities.length >= 2) return INTENTS.DISPATCH;

  return null;
}

// ─── Intent Handlers ─────────────────────────────────────────────────────────

/**
 * Handle a dispatch/load query.
 * Parses origin, destination, weight, type, rate, HOS requirements.
 */
function handleDispatchQuery(normalized, original) {
  const parsed = parseDispatchParams(normalized);

  if (!parsed.pickup || !parsed.dropoff) {
    // Try harder to find cities
    const cities = extractCities(normalized);
    if (cities.length >= 2) {
      parsed.pickup = cities[0];
      parsed.dropoff = cities[1];
    } else if (cities.length === 1 && !parsed.pickup) {
      // Only destination mentioned, assume Phoenix pickup
      parsed.pickup = LOCATIONS['phoenix'];
      parsed.dropoff = cities[0];
    }
  }

  if (!parsed.pickup || !parsed.dropoff) {
    return {
      type: 'clarification',
      intent: 'dispatch',
      message: "I can help find the best driver! I need a bit more info though. Where's the **pickup** and **drop-off**? For example:\n\n> _\"I need a driver for a dry van from Phoenix to Dallas, 38000 lbs\"_",
      parsed,
    };
  }

  // Calculate distance and duration
  const distance = Math.round(estimateRoadDistance(
    parsed.pickup.lat, parsed.pickup.lng,
    parsed.dropoff.lat, parsed.dropoff.lng,
  ));
  const duration = Math.round(estimateDriveTime(distance) * 10) / 10;

  // Estimate rate if not provided
  const rate = parsed.rate || Math.round(distance * 2.50);
  const ratePerMile = distance > 0 ? Math.round((rate / distance) * 100) / 100 : 0;

  // Create load in store
  const load = store.createLoad({
    pickup: parsed.pickup,
    dropoff: parsed.dropoff,
    estimatedDuration: duration,
    estimatedDistance: distance,
    weight: parsed.weight || 35000,
    type: parsed.type || 'dry_van',
    rate,
    ratePerMile,
    pickupAppointment: null,
    deliveryDeadline: null,
    specialRequirements: {
      hazmat: parsed.hazmat || false,
      oversize: parsed.oversize || false,
      teamDriver: false,
    },
  });

  // Run dispatch engine
  const recommendation = generateRecommendation(load.id);

  // Filter by minimum HOS if specified
  let filteredRec = recommendation;
  if (parsed.minHOS && recommendation.recommendation) {
    const rec = recommendation.recommendation;
    if (rec.hosRemaining < parsed.minHOS) {
      // The recommended driver doesn't meet the HOS requirement
      const altWithHOS = (recommendation.alternatives || []).find(
        (a) => a.hosRemaining >= parsed.minHOS
      );
      if (altWithHOS) {
        filteredRec = {
          ...recommendation,
          note: `Recommended driver has ${rec.hosRemaining}hr HOS but you requested ${parsed.minHOS}hr minimum. Showing next best match.`,
          originalRecommendation: rec,
        };
      }
    }
  }

  // Build natural language response
  const reply = buildDispatchReply(load, filteredRec, parsed);

  return {
    type: 'dispatch_result',
    intent: 'dispatch',
    message: reply,
    load: {
      id: load.id,
      pickup: parsed.pickup.city,
      dropoff: parsed.dropoff.city,
      distance: `${distance} mi`,
      duration: `${duration} hr`,
      weight: `${parsed.weight || 35000} lbs`,
      type: parsed.type || 'dry_van',
      rate: `$${rate}`,
    },
    recommendation: filteredRec,
  };
}

function handleFleetStatus() {
  const drivers = store.getAllDrivers();
  const available = [];
  const assigned = [];
  const tight = [];
  const off = [];
  const ineligible = [];

  for (const d of drivers) {
    const status = getDriverStatus(d);
    if (d.status === 'off_shift') { off.push(d); continue; }
    if (d.currentLoadId) { assigned.push(d); continue; }
    if (status.status === 'tight') { tight.push(d); continue; }
    if (status.status === 'ineligible') { ineligible.push(d); continue; }
    available.push(d);
  }

  let msg = `## 🚛 Fleet Status\n\n`;
  msg += `**${drivers.length}** drivers total · **${available.length + tight.length}** available · **${assigned.length}** assigned · **${off.length}** off shift\n\n`;

  if (available.length > 0) {
    msg += `### 🟢 Available (${available.length})\n`;
    for (const d of available) {
      const hos = calculateHOSRemaining(d);
      msg += `- **${d.name}** — ${hos.effectiveRemaining}hr HOS · ${d.location.city} · ${d.truck.type}\n`;
    }
    msg += '\n';
  }

  if (tight.length > 0) {
    msg += `### 🟡 Tight HOS (${tight.length})\n`;
    for (const d of tight) {
      const hos = calculateHOSRemaining(d);
      msg += `- **${d.name}** — ${hos.effectiveRemaining}hr remaining · ${d.location.city}\n`;
    }
    msg += '\n';
  }

  if (assigned.length > 0) {
    msg += `### 🔵 On Assignment (${assigned.length})\n`;
    for (const d of assigned) {
      const load = store.getLoad(d.currentLoadId);
      msg += `- **${d.name}** — ${load?.dropoff?.city || 'delivery'}\n`;
    }
    msg += '\n';
  }

  if (ineligible.length > 0) {
    msg += `### 🔴 Ineligible (${ineligible.length})\n`;
    for (const d of ineligible) msg += `- **${d.name}** — needs rest\n`;
    msg += '\n';
  }

  return { type: 'fleet_status', intent: 'fleet_status', message: msg };
}

function handleHOSCheck(normalized) {
  // Check for specific driver name
  const driverName = findDriverName(normalized);

  if (driverName) {
    const driver = store.getAllDrivers().find(
      (d) => d.name.toLowerCase().includes(driverName)
    );
    if (driver) {
      const hos = driver.status !== 'off_shift' ? calculateHOSRemaining(driver) : null;
      const status = getDriverStatus(driver);
      let msg = `## ${status.statusEmoji} ${driver.name} — HOS Status\n\n`;
      if (driver.status === 'off_shift') {
        msg += `**Off shift** — not currently available.\n`;
        msg += `Weekly hours used: **${driver.hos.weeklyHoursDriven}** / ${driver.hos.cycleType === '70hr' ? 70 : 60}hr\n`;
      } else {
        msg += `- Drive time remaining: **${hos.driveHoursRemaining}hr**\n`;
        msg += `- On-duty remaining: **${hos.onDutyHoursRemaining}hr**\n`;
        msg += `- Weekly: **${hos.weeklyHoursUsed}** / ${hos.weeklyLimit}hr\n`;
        msg += `- Effective remaining: **${hos.effectiveRemaining}hr** (limited by ${hos.limitingFactor.replace(/_/g, ' ')})\n`;
        msg += `- Status: ${status.statusEmoji} ${status.message}\n`;
      }
      return { type: 'hos_detail', intent: 'hos_check', message: msg, driver: driver.id };
    }
  }

  // Fleet-wide HOS
  const compliance = runFleetComplianceCheck();
  let msg = `## 📋 HOS Compliance Overview\n\n`;
  msg += `**${compliance.clear}** clear · **${compliance.tight}** tight · **${compliance.ineligible}** ineligible · **${compliance.offShift}** off shift\n\n`;

  if (compliance.alerts.length > 0) {
    msg += `### ⚠️ Active Alerts\n`;
    for (const a of compliance.alerts.slice(0, 3)) {
      msg += `- **${a.driverName}**: ${a.message}\n`;
    }
    msg += '\n';
  }

  msg += `### Driver Hours\n`;
  for (const d of compliance.drivers.slice(0, 8)) {
    const emoji = d.statusEmoji;
    const hos = d.hosRemaining !== null ? `${d.hosRemaining}hr` : 'off';
    msg += `${emoji} **${d.name}** — ${hos} daily · ${d.weeklyHoursUsed}/${d.weeklyLimit}hr weekly\n`;
  }

  return { type: 'hos_overview', intent: 'hos_check', message: msg };
}

function handleCostQuery() {
  const summary = generateWeeklySummary();

  let msg = `## 💰 Cost Intelligence — ${summary.period}\n\n`;
  msg += `| Metric | Value |\n|---|---|\n`;
  msg += `| True CPM | **$${summary.costPerMile.true}**/mi |\n`;
  msg += `| Total Revenue | $${summary.financials.totalRevenue.toLocaleString()} |\n`;
  msg += `| Total Cost | $${summary.financials.totalCost.toLocaleString()} |\n`;
  msg += `| Profit | **$${summary.financials.totalProfit.toLocaleString()}** |\n`;
  msg += `| Margin | **${summary.financials.margin}%** |\n`;
  msg += `| Deadhead | ${summary.miles.deadheadPercentage}% ($${Math.round(summary.miles.deadheadCost)} waste) |\n`;
  msg += `| Trips | ${summary.tripCount} |\n\n`;

  if (summary.driverRankings?.length > 0) {
    msg += `### Top Performers (by CPM)\n`;
    for (const d of summary.driverRankings.slice(0, 5)) {
      msg += `- **${d.name}** — $${d.costPerMile}/mi · ${d.trips} trips · $${d.profit} profit\n`;
    }
    msg += '\n';
  }

  if (summary.insight) {
    msg += `### 💡 AI Insight\n${summary.insight}\n`;
  }

  return { type: 'cost_summary', intent: 'cost_query', message: msg };
}

function handleDriverCheck(normalized) {
  const driverName = findDriverName(normalized);
  if (!driverName) {
    return {
      type: 'clarification',
      intent: 'driver_check',
      message: "Which driver do you want to check on? Tell me their name and I'll pull up their full status.",
    };
  }

  const driver = store.getAllDrivers().find(
    (d) => d.name.toLowerCase().includes(driverName)
  );
  if (!driver) {
    return {
      type: 'not_found',
      intent: 'driver_check',
      message: `I couldn't find a driver matching "${driverName}". Here are our drivers:\n${store.getAllDrivers().map((d) => `• ${d.name}`).join('\n')}`,
    };
  }

  const status = getDriverStatus(driver);
  const hos = driver.status !== 'off_shift' ? calculateHOSRemaining(driver) : null;
  const activeLoad = store.getActiveLoadForDriver(driver.id);

  let msg = `## ${status.statusEmoji} ${driver.name}\n\n`;
  msg += `- **Status:** ${status.message}\n`;
  msg += `- **Location:** ${driver.location.city}\n`;
  msg += `- **Truck:** ${driver.truck.type} (${driver.truck.id})\n`;
  if (hos) {
    msg += `- **HOS:** ${hos.effectiveRemaining}hr remaining\n`;
    msg += `- **Weekly:** ${hos.weeklyHoursUsed}/${hos.weeklyLimit}hr\n`;
  }
  if (activeLoad) {
    msg += `- **Current Load:** ${activeLoad.pickup?.city} → ${activeLoad.dropoff?.city} (${activeLoad.status})\n`;
  }
  if (driver.performance) {
    msg += `- **On-time rate:** ${(driver.performance.onTimeRate * 100).toFixed(0)}%\n`;
    msg += `- **Avg CPM:** $${driver.performance.avgCostPerMile}\n`;
  }

  return { type: 'driver_detail', intent: 'driver_check', message: msg, driver: driver.id };
}

function handleAvailableDrivers() {
  const available = store.getAvailableDrivers();

  if (available.length === 0) {
    return {
      type: 'available_drivers',
      intent: 'available_drivers',
      message: "No drivers available right now. All on-shift drivers are currently assigned or ineligible.",
    };
  }

  let msg = `## 🟢 Available Drivers (${available.length})\n\n`;
  msg += `| Driver | HOS Left | Location | Truck | CPM |\n|---|---|---|---|---|\n`;

  for (const d of available) {
    const hos = calculateHOSRemaining(d);
    const cpm = d.performance?.avgCostPerMile || '—';
    msg += `| **${d.name}** | ${hos.effectiveRemaining}hr | ${d.location.city} | ${d.truck.type} | $${cpm} |\n`;
  }

  msg += `\nTell me your load details and I'll recommend the best match!`;

  return { type: 'available_drivers', intent: 'available_drivers', message: msg };
}

function handleGreeting() {
  const available = store.getAvailableDrivers().length;
  const total = store.getAllDrivers().length;
  return {
    type: 'greeting',
    intent: 'greeting',
    message: `Hey! 👋 I'm your dispatch assistant. **${available}/${total}** drivers available right now.\n\nWhat do you need? I can:\n- 🚛 **Find the best driver** for a load\n- 📊 **Show fleet status** or HOS compliance\n- 💰 **Pull cost intelligence** — CPM, margins, deadhead\n- 👤 **Check on a specific driver**\n\nJust tell me what you need in plain English!`,
  };
}

function handleHelp() {
  return {
    type: 'help',
    intent: 'help',
    message: `## 🤖 DispatchIQ Assistant — What I Can Do\n\n### 🚛 Find a Driver\n> _"I need a dry van driver from Phoenix to Dallas, 38000 lbs"_\n> _"Who can take a reefer load to LA with at least 8 hours?"_\n> _"Find me a flatbed for Tucson to El Paso"_\n\n### 📊 Fleet Status\n> _"Show me the fleet"_\n> _"Who's available?"_\n> _"How's the fleet looking?"_\n\n### ⏱️ HOS Compliance\n> _"Check HOS for Carlos"_\n> _"How many hours does Sarah have?"_\n> _"Show me compliance"_\n\n### 💰 Cost Intelligence\n> _"What's our cost per mile?"_\n> _"Show me margins"_\n> _"How much are we spending on deadhead?"_\n\n### 👤 Driver Status\n> _"How's Carlos doing?"_\n> _"Where is Sarah Chen?"_\n> _"Check on James Wilson"_`,
  };
}

function handleUnknown(original) {
  return {
    type: 'unknown',
    intent: null,
    message: `I'm not sure what you mean by "${original}". Try something like:\n\n- _"Find a driver for a dry van from Phoenix to Dallas"_\n- _"Who's available right now?"_\n- _"Show me fleet status"_\n- _"What's our cost per mile?"_\n\nType **help** for the full list of things I can do.`,
  };
}

// ─── Parsing Utilities ───────────────────────────────────────────────────────

/**
 * Parse dispatch parameters from a natural language message.
 */
function parseDispatchParams(msg) {
  const params = {};

  // Extract cities
  const cities = extractCities(msg);
  if (cities.length >= 2) {
    // Try to determine pickup vs dropoff by position relative to "from" and "to"
    const fromIdx = msg.indexOf(' from ');
    const toIdx = msg.indexOf(' to ');

    if (fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx) {
      params.pickup = cities[0];
      params.dropoff = cities[1];
    } else {
      params.pickup = cities[0];
      params.dropoff = cities[1];
    }
  } else if (cities.length === 1) {
    // Single city: could be destination (assume Phoenix pickup)
    if (msg.includes(' to ')) {
      params.pickup = LOCATIONS['phoenix'];
      params.dropoff = cities[0];
    } else if (msg.includes(' from ')) {
      params.pickup = cities[0];
    } else {
      params.dropoff = cities[0];
      params.pickup = LOCATIONS['phoenix'];
    }
  }

  // Extract weight
  const weightMatch = msg.match(/(\d{1,3}[,.]?\d{3})\s*(?:lb|lbs|pound|pounds)/i)
    || msg.match(/(\d{2,3})k?\s*(?:lb|lbs|pound|pounds)/i);
  if (weightMatch) {
    let w = weightMatch[1].replace(/[,\.]/g, '');
    params.weight = parseInt(w);
    if (params.weight < 1000) params.weight *= 1000; // e.g. "38" → 38000
  }

  // Extract truck type
  if (matchesAny(msg, ['dry\\s*van', 'general\\s*freight', 'standard'])) params.type = 'dry_van';
  else if (matchesAny(msg, ['reefer', 'refrigerat', 'cold', 'frozen', 'temperature'])) params.type = 'reefer';
  else if (matchesAny(msg, ['flatbed', 'flat\\s*bed', 'open\\s*deck'])) params.type = 'flatbed';
  else if (matchesAny(msg, ['tanker', 'liquid', 'bulk'])) params.type = 'tanker';

  // Extract rate
  const rateMatch = msg.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
  if (rateMatch) {
    params.rate = parseFloat(rateMatch[1].replace(/,/g, ''));
  }

  // Extract minimum HOS requirement
  const hosMatch = msg.match(/(?:at\s*least|minimum|min)\s*(\d+(?:\.\d+)?)\s*(?:hour|hr|hrs|hos)/i)
    || msg.match(/(\d+(?:\.\d+)?)\s*(?:hour|hr|hrs|hos)\s*(?:minimum|min|remaining|left|available)/i);
  if (hosMatch) {
    params.minHOS = parseFloat(hosMatch[1]);
  }

  // Check for special requirements
  params.hazmat = matchesAny(msg, ['hazmat', 'haz\\s*mat', 'hazardous', 'dangerous']);
  params.oversize = matchesAny(msg, ['oversize', 'over\\s*size', 'oversized', 'wide\\s*load']);

  return params;
}

/**
 * Extract city locations from a message.
 */
function extractCities(msg) {
  const found = [];
  const normalizedMsg = msg.toLowerCase();

  // Sort locations by name length (longest first) to match "salt lake city" before "salt lake"
  const sortedLocations = Object.entries(LOCATIONS)
    .sort((a, b) => b[0].length - a[0].length);

  const usedRanges = [];

  for (const [name, loc] of sortedLocations) {
    const idx = normalizedMsg.indexOf(name);
    if (idx !== -1) {
      // Check if this range overlaps with already found cities
      const end = idx + name.length;
      const overlaps = usedRanges.some(
        ([s, e]) => (idx >= s && idx < e) || (end > s && end <= e)
      );
      if (!overlaps) {
        found.push({ ...loc, _index: idx });
        usedRanges.push([idx, end]);
      }
    }
  }

  // Sort by position in string
  found.sort((a, b) => a._index - b._index);

  // Clean up
  return found.map(({ _index, ...rest }) => rest);
}

/**
 * Try to find a driver name in the message.
 */
function findDriverName(msg) {
  const allDrivers = store.getAllDrivers();
  const lower = msg.toLowerCase();

  // Try full name match first
  for (const d of allDrivers) {
    if (lower.includes(d.name.toLowerCase())) return d.name.toLowerCase();
  }

  // Try first name match
  for (const d of allDrivers) {
    const firstName = d.name.split(' ')[0].toLowerCase();
    if (lower.includes(firstName) && firstName.length > 2) return firstName;
  }

  // Try last name match
  for (const d of allDrivers) {
    const lastName = d.name.split(' ').slice(-1)[0].toLowerCase();
    if (lower.includes(lastName) && lastName.length > 2) return lastName;
  }

  return null;
}

/**
 * Build a natural language dispatch reply.
 */
function buildDispatchReply(load, recommendation, parsed) {
  const rec = recommendation.recommendation;
  const pickup = load.pickup.city;
  const dropoff = load.dropoff.city;
  const type = (parsed.type || 'dry_van').replace('_', ' ');

  let msg = `## 🚛 Dispatch Recommendation\n\n`;
  msg += `**${pickup}** → **${dropoff}** · ${load.estimatedDistance} mi · ~${load.estimatedDuration}hr · ${type}\n`;
  msg += `Rate: **$${load.rate}** ($${load.ratePerMile}/mi)\n\n`;

  if (!rec) {
    msg += `### ⚠️ No Eligible Drivers\n`;
    msg += `${recommendation.message || 'No drivers available for this load.'}\n\n`;

    if (recommendation.ineligible?.length > 0) {
      msg += `**Why each driver was rejected:**\n`;
      for (const d of recommendation.ineligible.slice(0, 5)) {
        msg += `- ❌ **${d.name}**: ${d.reason}\n`;
      }
    }

    msg += `\n_Try a shorter route, different truck type, or check back when drivers have rested._`;
    return msg;
  }

  // Top recommendation
  msg += `### ✅ Best Match: ${rec.driver.name}\n\n`;
  msg += `| Metric | Value |\n|---|---|\n`;
  msg += `| Score | **${Math.round(rec.compositeScore)}**/100 |\n`;
  msg += `| Deadhead | ${rec.deadheadMiles} mi |\n`;
  msg += `| HOS Remaining | ${rec.hosRemaining}hr |\n`;
  msg += `| Trip Requires | ${rec.tripRequires} |\n`;
  msg += `| Est. Cost | $${rec.costPerMile}/mi |\n`;
  msg += `| Est. Profit | **$${rec.estimatedTripProfit}** |\n`;
  msg += `| vs Fleet Avg | ${rec.vsFleetAverage} |\n\n`;

  msg += `**Reason:** ${rec.reason}\n`;

  // Backhaul
  if (rec.backhaul?.available && rec.backhaul.opportunity) {
    msg += `\n### 🔄 Return Load Available\n`;
    msg += `${rec.backhaul.opportunity.distanceToPickup} mi from drop · **+$${rec.backhaul.opportunity.estimatedRevenue}** revenue\n`;
  }

  // Note about HOS filter
  if (recommendation.note) {
    msg += `\n> ⚠️ ${recommendation.note}\n`;
  }

  // Alternatives
  const alts = recommendation.alternatives || [];
  if (alts.length > 0) {
    msg += `\n### Other Options\n`;
    for (const alt of alts.slice(0, 3)) {
      msg += `- **${alt.driver.name}** — Score ${Math.round(alt.compositeScore)} · ${alt.deadheadMiles}mi deadhead · ${alt.hosRemaining}hr HOS · $${alt.costPerMile}/mi\n`;
    }
  }

  return msg;
}

/**
 * Check if a string matches any of the patterns.
 */
function matchesAny(str, patterns) {
  return patterns.some((p) => new RegExp(p, 'i').test(str));
}
