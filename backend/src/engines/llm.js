import store from '../data/store.js';
import { generateWeeklySummary } from './cost.js';
import { runFleetComplianceCheck, calculateHOSRemaining, getDriverStatus } from './hos.js';

const DEFAULT_SYSTEM_PROMPT = `You are DispatchIQ, an operations copilot for a trucking dispatcher.

Rules:
- Use only the supplied fleet context and deterministic dispatch data.
- Do not invent drivers, loads, HOS values, or financial numbers.
- If the data is missing, say that clearly.
- Prefer concise operational answers in markdown.
- Highlight blockers, risks, and recommended next steps when relevant.
- If deterministic dispatch or compliance data is provided, treat it as authoritative.`;

function compactDriver(driver) {
  const hos = calculateHOSRemaining(driver);
  const status = getDriverStatus(driver);

  return {
    name: driver.name,
    city: driver.location.city,
    truckType: driver.truck.type,
    status: status.status,
    hosRemaining: hos.effectiveRemaining,
    currentLoadId: driver.currentLoadId || null,
  };
}

function buildFleetSnapshot() {
  const drivers = store.getAllDrivers();
  const summary = generateWeeklySummary();
  const compliance = runFleetComplianceCheck();

  return {
    generatedAt: new Date().toISOString(),
    driverCount: drivers.length,
    availableDrivers: store.getAvailableDrivers().length,
    drivers: drivers.slice(0, 8).map(compactDriver),
    alerts: compliance.alerts.slice(0, 5).map((alert) => ({
      severity: alert.severity,
      driverName: alert.driverName,
      message: alert.message,
    })),
    weeklySummary: {
      period: summary.period,
      tripCount: summary.tripCount,
      trueCostPerMile: summary.costPerMile.true,
      deadheadPercentage: summary.miles.deadheadPercentage,
      revenue: summary.financials.totalRevenue,
      profit: summary.financials.totalProfit,
      margin: summary.financials.margin,
      insight: summary.insight,
    },
  };
}

function buildUserPrompt(message, deterministicResult) {
  const payload = {
    userMessage: message,
    deterministicResult: {
      type: deterministicResult.type,
      intent: deterministicResult.intent,
      reply: deterministicResult.message,
      load: deterministicResult.load || null,
      recommendation: deterministicResult.recommendation || null,
    },
    fleetSnapshot: buildFleetSnapshot(),
  };

  return `Use the deterministic result and fleet snapshot below to answer the dispatcher.\n\n${JSON.stringify(payload, null, 2)}`;
}

function getConfiguredProvider() {
  const configured = (process.env.CHAT_PROVIDER || 'auto').toLowerCase();
  const hasClaude = Boolean(process.env.CLAUDE_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);

  if (configured === 'claude' && hasClaude) return 'claude';
  if (configured === 'gemini' && hasGemini) return 'gemini';
  if (configured === 'auto') {
    if (hasClaude) return 'claude';
    if (hasGemini) return 'gemini';
  }

  return null;
}

function toAnthropicMessages(history, prompt) {
  const base = history.map((entry) => ({
    role: entry.role === 'assistant' ? 'assistant' : 'user',
    content: entry.content,
  }));

  base.push({ role: 'user', content: prompt });
  return base;
}

async function generateWithClaude({ history, prompt }) {
  const model = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 900,
      temperature: 0.2,
      system: DEFAULT_SYSTEM_PROMPT,
      messages: toAnthropicMessages(history, prompt),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
    .trim();

  return {
    provider: 'claude',
    text,
    model: data.model || model,
  };
}

function toGeminiContents(history, prompt) {
  const contents = history.map((entry) => ({
    role: entry.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: entry.content }],
  }));

  contents.push({
    role: 'user',
    parts: [{ text: prompt }],
  });

  return contents;
}

async function generateWithGemini({ history, prompt }) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: DEFAULT_SYSTEM_PROMPT }],
        },
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 900,
        },
        contents: toGeminiContents(history, prompt),
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const text = (data.candidates?.[0]?.content?.parts || [])
    .map((part) => part.text || '')
    .join('\n')
    .trim();

  return {
    provider: 'gemini',
    text,
    model,
  };
}

export async function generateChatReply({ message, history, deterministicResult }) {
  const provider = getConfiguredProvider();

  if (!provider) {
    return {
      provider: 'local',
      model: null,
      reply: deterministicResult.message,
    };
  }

  const prompt = buildUserPrompt(message, deterministicResult);
  const recentHistory = history.slice(-12);

  try {
    const result =
      provider === 'claude'
        ? await generateWithClaude({ history: recentHistory, prompt })
        : await generateWithGemini({ history: recentHistory, prompt });

    if (!result.text) {
      throw new Error(`${provider} returned an empty response`);
    }

    return {
      provider: result.provider,
      model: result.model,
      reply: result.text,
    };
  } catch (error) {
    console.error(`[Chat LLM] Falling back to local NLP: ${error instanceof Error ? error.message : String(error)}`);
    return {
      provider: 'local_fallback',
      model: null,
      reply: deterministicResult.message,
      warning: error instanceof Error ? error.message : String(error),
    };
  }
}
