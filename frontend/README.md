# ChatAlchemy frontend

React + Vite + TypeScript frontend for the ChatAlchemy collaborative machine-building overlay.

## Run locally

```powershell
npm.cmd install --legacy-peer-deps
npm.cmd run dev
```

Without a WebSocket URL, the app runs in Demo Mode with local mock state.

To connect to the backend:

```powershell
$env:VITE_WS_URL="ws://localhost:8080"
npm.cmd run dev
```

See [.env.example](./.env.example) for the expected variable.

## Backend contract

The frontend accepts JSON WebSocket events: `state.snapshot`, `component.added`, `component.rejected`, `session.updated`, `machine.generated`, `challenge.revealed`, `combination.activated`, and `error`.

It sends: `state.request`, `component.add`, `session.start`, `session.pause`, `session.resume`, `session.finish`, and `session.reset`.

The client reconnects after connection loss and requests a fresh state snapshot after reconnecting.
