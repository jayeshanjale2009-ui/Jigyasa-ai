/**
 * Jigyasa AI - Backend Chat Proxy (Unit 1)
 *
 * Single route: POST /chat
 * Proxies a user message to the Anthropic API server-side,
 * so the API key never reaches the client app.
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// CORS: allows the Android WebView app to call this Worker.
// Tighten "*" to your actual app's origin once you have one.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname !== "/chat" || request.method !== "POST") {
      return jsonResponse({ error: "Not found" }, 404);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return jsonResponse({ error: "message is required" }, 400);
    }

    if (!env.ANTHROPIC_API_KEY) {
      // Server misconfiguration — never expose details to the client
      return jsonResponse({ error: "Server is not configured correctly" }, 500);
    }

    // Call the Anthropic API with streaming enabled
    const anthropicResponse = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        stream: true,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!anthropicResponse.ok || !anthropicResponse.body) {
      return jsonResponse(
        { error: "Upstream AI request failed" },
        anthropicResponse.status || 502
      );
    }

    // Stream the response straight through to the client
    return new Response(anthropicResponse.body, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  },
};

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}
E0F
