# ChatAlchemy frontend

React + TypeScript + Vite overlay. The existing visual design and SVG assets are retained; machine and session state comes from the backend over WebSocket.

Run the backend first using the root [README](../README.md). Then, in this directory:

```powershell
npm.cmd install
npm.cmd run dev
```

The default WebSocket URL is `ws://localhost:8080`. Override it in `.env.local` with `VITE_WS_URL` if needed. DEMO/LIVE mode is reported by the backend snapshot.

The client sends session controls, palette component additions, and state requests. It handles revisioned snapshots, component additions/rejections, combination activations, session updates, machine generation, challenge reveal, and errors. In LIVE mode, authorized Twitch accounts operate controls; browser controls are disabled.
