# Stormhaven City Atlas

An interactive Three.js city atlas for **Stormhaven**, a D&D 5e campaign set in a vertical, rain-soaked city powered by captured lightning. The city is modeled at three scales — whole-city silhouette and elevation hierarchy, per-ward architecture, and orientable neighborhood lenses — aligned to a painted cartographer's reference map.

Live: [map.stormhaven.online](https://map.stormhaven.online)

## Layout

| Path | Purpose |
|------|---------|
| `app/stormhaven-map.tsx` | City model: land/wall outlines, district coordinates, elevation bands, canals, streets, dense urban fabric, landmarks, labels, cameras, renderer instrumentation |
| `app/stormhaven-architecture.ts` | Reusable architecture kit (massing, silhouettes, working-system props) |
| `app/globals.css` | Responsive interface and visual treatment |
| `ops/map-server.mjs` | Local production server (port `30001`) |
| `ops/start-map-atlas.cmd` / `start-map-tunnel.cmd` | Windows launchers for the production server and the cloudflared tunnel |
| `tests/rendered-html.test.mjs` | Rendered-HTML, performance-contract, and geography regression tests |
| `public/assets/stormhaven-cartographer-reference.webp` | Painted city-map reference the atlas is aligned to |

## Stack

Next.js (vinext on Cloudflare) + React 19 + Three.js + Tailwind 4. Optional Drizzle/D1 bindings are declared in `.openai/hosting.json`.

## Quick start

Prerequisites: Node.js `>=22.13.0`

```bash
npm install
npm run dev     # local dev server
npm run build   # production build
npm test        # build + rendered-HTML and geography regression tests
npm run lint
```

## Local production and public tunnel

On the host machine for `map.stormhaven.online`, two scheduled tasks keep the site up:

- **Stormhaven Map Atlas** — production server on `127.0.0.1:30001`
- **Stormhaven Map Tunnel** — cloudflared tunnel serving `map.stormhaven.online` (local listener `30002`)

Verify after (re)starting: `http://127.0.0.1:30001/` returns HTTP 200, then `https://map.stormhaven.online/` returns HTTP 200 and references the same `stormhaven-map-*.js` bundle as localhost.

## Notes

- Workspace deployments inject `oai-authenticated-user-*` headers for signed-in visitors; anonymous visitors have none. See `app/chatgpt-auth.ts` for the optional sign-in helpers.
- Geography is canon-first: stated relative positions from the painted map and campaign notes take precedence over procedural convenience, and explicit corrections are protected by regression tests.
