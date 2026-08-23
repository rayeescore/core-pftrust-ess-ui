# core-pftrust-ess-ui

The Employee Self-Service portal for CorePF Trust — where a PF member checks their balance, downloads
statements, applies for an advance, transfers an old account in, and claims their fund when they leave.

Vue 3 · Vite · Tailwind CSS 4 (no component library) · Keycloak.

```bash
cp .env.example .env.local
npm install
npm run dev          # http://localhost:6064
```

`VITE_USE_FIXTURES=true` (the default in `.env.example`) renders the screens with no API and no sign-in,
because the member API is still being built. See [CLAUDE.md](./CLAUDE.md) for what exists, what does not,
and the rules this app is built on.

Backend: `core-pftrust-service`, deployed a second time on port 6065 — not a separate codebase.
Design: nineteen artboards at
<https://claude.ai/code/artifact/b6b8c3ae-5c78-4826-80f1-81dfb1f6ab6a>.
