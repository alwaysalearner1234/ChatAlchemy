# ChatAlchemy implementation plan

## Current architecture

- `frontend/` is the existing React 19 + TypeScript + Vite overlay. Its layout, CSS, palette, and SVG artwork are retained; its WebSocket client validates incoming events and the hook applies revisioned authoritative state.
- `backend/` is a Node.js + TypeScript HTTP/WebSocket service. It owns the in-memory session, component catalog, contribution checks, combinations, timers, challenge generation, and optional Twitch/OpenAI adapters.
- DEMO is the default explicit mode. LIVE requires channel, bot login/token, and configured streamer login; browser controls and the demo-command endpoint are disabled in LIVE.
- Twitch moderator control requires both a configured moderator login and role metadata from Twitch. OpenAI output is schema-validated and bounded by a request timeout; challenge instructions come from approved templates and failures use deterministic output.

## SRS implementation plan and status

| Area | Scope | Status |
|---|---|---|
| Session authority and lifecycle | Backend-owned state, start/pause/resume/finish/reset, timer, reconnect snapshot, monotonically increasing revisions | Implemented; DEMO lifecycle/integration covered |
| Contributions and assembly | Catalog commands, cooldown, deduplication, capacity, deterministic placement and combinations | Implemented; unit and HTTP/WS integration covered |
| Overlay and OBS | Preserve existing UI; display session, contributions, combinations, generated identity and challenge; show first nine of up to configured capacity | Implemented; production build verified, no OBS performance measurement |
| DEMO controls | Browser commands and scripted HTTP viewer contribution | Implemented; integration covered |
| Twitch LIVE | Chat connection, viewer commands, broadcaster/configured moderator authorization, control commands | Implemented; network verification pending |
| OpenAI | Backend-only request, validated structured response, timeout, approved challenge instructions, deterministic fallback | Implemented; mock failure/validation covered; live API verification pending |
| Security and robustness | Runtime payload validation, HTTP body/rate bounds, WebSocket payload/message bounds, no credential logging, graceful shutdown | Implemented; targeted review and checks pending |
| Persistence and production telemetry | Durable sessions, durable analytics, deployment/OBS load test | Not implemented; state is in memory and restarts start a fresh session |

## Risks and limits

- Restarting the backend creates a fresh session; there is no database or durable history.
- The canvas has nine visual slots. Up to `MAX_COMPONENTS` remain in authoritative state, and the overlay identifies when more than nine exist.
- Twitch and OpenAI outcomes depend on external service availability and configured credentials. Their integration results are recorded separately from deterministic tests.
- HTTP rate limiting is process-local and keyed by remote address; production reverse-proxy deployment must preserve an appropriate client address and apply its own edge limits.

## Verification

Run backend typecheck, test, and build, and frontend typecheck, lint, and build from their respective directories. `PROGRESS.md` records the latest results and the SRS compliance evidence matrix.
