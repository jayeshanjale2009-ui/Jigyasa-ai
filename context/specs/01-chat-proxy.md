# Unit 1: Backend Chat Proxy

## Goal

A deployed backend endpoint that accepts a user message, calls the
Anthropic API server-side (key never exposed to the client), and
streams the response back. No auth, no database yet — just a
working, secure proxy.

## Design

No UI in this unit. This is a single Cloudflare Worker with one
route: `POST /chat`. Request body: `{ "message": "..." }`. Response:
a streamed text body (Server-Sent Events style chunks) that the
frontend can read incrementally in a later unit.

## Implementation

### Worker entry point (`backend/src/index.js`)

- Handles `POST /chat` only; any other route/method returns 404/405
- Reads `message` from the JSON request body
- Validates: reject empty/missing message with a 400
- Calls the Anthropic Messages API with `stream: true`, using the
  API key from the Worker's environment secret
  (`env.ANTHROPIC_API_KEY`) — never hardcoded, never logged
- Pipes the streamed response back to the client with CORS headers
  so the Android WebView app can call it

### Config (`backend/wrangler.toml`)

- Declares the Worker name and entry point
- `ANTHROPIC_API_KEY` is set as a secret via wrangler CLI, not
  committed to this file or to git

### Dependencies (`backend/package.json`)

- No external npm dependencies required — uses the Worker's built-in
  `fetch`

## Dependencies

- None (Cloudflare Workers runtime provides `fetch` natively)

## Verify when done

- [ ] Worker deploys successfully via `wrangler deploy`
- [ ] `ANTHROPIC_API_KEY` is set as a Cloudflare secret, not present
      anywhere in the repo
- [ ] `POST /chat` with `{"message": "hello"}` returns a real
      streamed response from Claude
- [ ] An invalid/empty message returns a 400, not a crash
- [ ] A request from a browser (different origin) succeeds — CORS
      headers are present
