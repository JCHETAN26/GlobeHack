const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function getRecommendation(userMessage, fleetState) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return "AI Dispatcher: API Key missing. Please set ANTHROPIC_API_KEY in .env. (Simulated Recommendation: Driver 1 is the best match due to HOS and proximity.)";
  }

  const systemPrompt = `
You are FleetMind AI, a dispatch co-pilot for small fleet operators.
Your goal is to recommend the best driver for a load based on Hours of Service (HOS), proximity, cost, and safety.

Current Fleet State:
${JSON.stringify(fleetState, null, 2)}

Guidelines:
1. Rank recommendations.
2. Explicitly mention safety warnings (e.g., if a driver is nearing HOS limits or has a fatigue flag).
3. Consider "deadhead" (distance to origin).
4. Be concise and professional.
5. Provide actionable insights.
`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        { role: "user", content: userMessage }
      ],
    });

    return response.content[0].text;
  } catch (error) {
    console.error('Claude API Error:', error);
    throw error;
  }
}

module.exports = { getRecommendation };
