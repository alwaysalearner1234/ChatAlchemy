# ChatAlchemy implementation plan

## Audit

- Frontend: React 19, TypeScript 7, Vite 8. `App.tsx` composes the existing overlay panels, SVG assets, and CSS design. `useMachineSocket.ts` owns a WebSocket client but currently simulates sessions, contributions, timer, and combinations in the browser.
- Existing functional pieces: palette and machine canvas; chat-command input; session-control UI; WebSocket reconnect and snapshot request; AI narrator and challenge presentation.
- Mocked: every machine mutation and session transition, timer expiration, combination detection, viewer count, activity feed, machine identity and challenge. No backend, tests, root scripts, or root env template exist.
- Contracts: frontend `MachineState` and `MachineEvent` lack revision, active combinations, mode and generated personality. Session vocabulary is ready/running/finished, so backend wire mapping will preserve that UI vocabulary while retaining richer backend states.
- WebSocket: `MachineWebSocket` sends state.request, component.add, session.start/pause/resume/finish/reset; client retries and requests snapshot after reconnect.
- UI assets: all ten component visual definitions are in `frontend/src/data/mockData.ts`; black-hole visual id maps to the Twitch command `!blackhole`.

## Target architecture and integration

- `backend/` TypeScript Node service owns machine/session state, component catalog, validated commands, deduplication, cooldowns, capacity, deterministic assembly, timer, WebSocket snapshots and broadcasts.
- DEMO runs by default, can accept the existing browser control and palette actions, and exposes a server demo-command endpoint/command for multiple identities. LIVE is an explicit mode requiring Twitch credentials; it must fail visibly rather than silently falling back.
- Twitch uses an authenticated chat adapter, with role metadata from the adapter and server-side configured streamer/moderators. OpenAI is optional, backend-only, schema-checked, timeout-bounded, and falls back deterministically.
- Existing React panels and visual assets remain. Extend their data contracts, remove client-side authority, and render session/machine state and generated challenge received over WebSocket.

## Requirements and priorities

1. Shared wire types and backend foundation/configuration.
2. Catalog, deterministic assembly rules, authoritative session lifecycle and tests.
3. WebSocket snapshot/event protocol and frontend integration.
4. Demo command path and visible DEMO/LIVE mode.
5. Optional Twitch and OpenAI adapters, authorization and docs.
6. README, env examples, typecheck/lint/test/build and known-issues review.

## Risks

- No existing server/deployment configuration or persistence; state is in-memory and restarts create a clean session.
- The current canvas has nine slots while the SRS permits thirty parts; retain layout and show the first nine visually while keeping all state/contributions.
- Live Twitch requires application credentials and a bot token with chat access; a usable DEMO requires none.
- OpenAI SDK structured-output APIs depend on SDK version; keep an independently validated fallback.

## Verification strategy

Backend unit tests for each rule, duplicate activation, deterministic positions, invalid commands, cooldown/capacity, session transitions/timer and fallback challenge. Run backend/frontend typecheck, lint, tests, and production build where scripts and installed dependencies permit; record actual outcomes in `PROGRESS.md`.
