/** POST to /api/chat */
export async function sendChatMessage(message: string): Promise<ChatResponse> {
  const res = await fetch("http://localhost:3001/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || `Chat error: ${res.status}`);
  }
  return res.json();
}

export interface ChatResponse {
  reply: string;
  type: string;
  intent: string | null;
  timestamp: string;
  provider?: string;
  model?: string | null;
  warning?: string;
  load?: {
    id: string;
    pickup: string;
    dropoff: string;
    distance: string;
    duration: string;
    weight: string;
    type: string;
    rate: string;
  };
  recommendation?: Record<string, unknown>;
  driverId?: string;
}
