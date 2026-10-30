# ChatAlchemy

ChatAlchemy turns Twitch chat into a shared machine-building experience. The React overlay keeps the original design and SVG assets; a TypeScript backend now owns sessions, contributions, combinations, cooldowns, and challenge generation.

## Architecture

- `frontend/`: React 19 + TypeScript + Vite overlay and OBS browser source.
- `backend/`: Node.js + TypeScript WebSocket/HTTP server, deterministic assembly engine, optional Twitch chat adapter and OpenAI generation.
- Machine state is authoritative in the backend and held in memory. Restarting the backend starts a fresh session.
- The frontend reconnects automatically and requests a revisioned state snapshot.

## Prerequisites

- Node.js 20.19+ (Vite 8 requirement) and npm.
- Windows PowerShell commands below assume the repository root is the current directory.

## Install and run DEMO

Open two PowerShell terminals from `D:\ChatAlchemy`.

```powershell
cd backend
npm.cmd install
Copy-Item .env.example .env
npm.cmd run dev
```

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open the Vite URL (normally `http://localhost:5173`). DEMO mode uses the same backend session and assembly rules as LIVE. Start a session, use the palette or chat input to contribute, and finish to generate a machine identity and challenge. The HTTP demo endpoint supports scripted viewers:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:8080/api/demo-command -ContentType 'application/json' -Body '{"username":"viewer_one","command":"!gear"}'
```

The endpoint applies session checks, cooldowns and capacity limits. In DEMO, the streamer controls in the browser are available without credentials.

## Configuration

Copy `backend/.env.example` to `backend/.env`. The frontend uses `ws://localhost:8080` by default; set `VITE_WS_URL` in `frontend/.env.local` to override it.

| Variable | Purpose |
|---|---|
| `APP_MODE` | `DEMO` (default) or explicit `LIVE`; no automatic mode switching. |
| `PORT` | Backend HTTP and WebSocket port, default `8080`. |
| `BUILD_DURATION_SECONDS` | Contribution window, default `45`. |
| `MAX_COMPONENTS` | Machine capacity, default `30`. |
| `VIEWER_COOLDOWN_SECONDS` | Per-viewer contribution cooldown, default `3`. |
| `TWITCH_CHANNEL` | Channel to join in LIVE mode. |
| `TWITCH_USERNAME` | Twitch bot login. |
| `TWITCH_ACCESS_TOKEN` | Bot OAuth token with chat access; backend only. |
| `TWITCH_STREAMER_LOGIN` | Streamer account allowed to control the session. |
| `TWITCH_MODERATOR_LOGINS` | Comma-separated moderator logins. Role metadata from Twitch is also required. |
| `OPENAI_API_KEY` | Optional backend-only key for AI generation. |
| `OPENAI_MODEL` | Model name, default `gpt-4o-mini`. |

### Twitch setup (LIVE)

Create a Twitch developer application and a bot account/token that can join the target channel and read chat. Put the bot login/token, channel login, and streamer login in `backend/.env`, then set `APP_MODE=LIVE`. Restart the backend. Missing required Twitch credentials fail startup instead of falling back to DEMO. Supported viewer commands are `!gear`, `!laser`, `!portal`, `!battery`, `!duck`, `!blackhole`, `!spring`, `!fan`, `!magnet`, `!prism`, and `!machine`. Broadcaster/moderator controls are `!start`, `!pause`, `!resume`, `!finish`, `!reset`, and `!event`.

### OpenAI setup

Set `OPENAI_API_KEY` in the backend environment only. The backend sends component names, count, and combinations at finalization, requests JSON, validates the output, and uses a deterministic component-aware fallback if the API fails or returns invalid data.

## OBS browser source

Run both services, then add a Browser Source pointing at the frontend Vite URL during development. For a built overlay, run `npm.cmd run build` in `frontend` and serve `frontend/dist` from a static server; the backend must remain reachable at the configured WebSocket URL. Set the source resolution to match the stream layout. Keep backend credentials out of the browser source environment.

## Tests and checks

```powershell
cd backend
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

```powershell
cd frontend
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

## Troubleshooting

- **Overlay says it cannot connect:** ensure the backend is listening on port 8080, and check `VITE_WS_URL`.
- **Contributions are rejected:** start or resume a session; check cooldown and component capacity.
- **LIVE startup fails:** verify all three required Twitch environment values and use an OAuth token the bot can use to connect.
- **AI result is generic:** the app uses a deterministic fallback when no key is configured or the request/output fails.
- **Restart lost the build:** backend state is in memory and is not persisted.
