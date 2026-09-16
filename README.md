# core-pftrust-ess-ui

The Employee Self-Service portal for CorePF Trust — where a PF member checks their balance, downloads
statements, applies for an advance, transfers an old account in, and claims their fund when they leave.

Vue 3 · Vite · Tailwind CSS 4 (no component library) · Keycloak.

```bash
cp .env.example .env.local
npm install
npm run dev          # http://localhost:6064
```

`VITE_USE_FIXTURES=true` renders the screens with no API and no sign-in, which is useful for looking at
a screen in isolation. The member API is built, so `false` is the honest setting. See
[CLAUDE.md](./CLAUDE.md) for what exists, what does not, and the rules this app is built on.

Backend: `core-pftrust-service` — the same deployment the admin portal uses, not a separate codebase and
not a second deployment. ESS ships as a UI only.
Design: nineteen artboards at
<https://claude.ai/code/artifact/b6b8c3ae-5c78-4826-80f1-81dfb1f6ab6a>.
