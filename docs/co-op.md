# Shared café co-op (preview)

2–4 players share one independent café. Join by an eight-character room code; each member receives a private random session token. The room code invites a new member, while the token restores an existing seat. Tokens stay in the dedicated browser key `bean-around-coop-session-v1`, never in URLs. Do not share a token. Clearing browser storage loses that seat's recovery credential; the host can remove an offline seat.

## Play

Open /coop/, choose a name, create or join a room. The host handles procurement, upgrades, opening/closing and pausing. All players can choose the active customer, take a cup, add ingredients, operate a machine and deliver the shared cup. There is one shared workstation, so actions are serialized; a conflicting action asks the player to check the updated counter. This first co-op version uses the same core recipes, costs and rating rules as solo, but unsupported features such as branch expansion and competitions are blocked rather than performed locally.

At least two connected players are required to start/progress the shift. Disconnects do not consume patience while fewer than two remain. A disconnected host transfers control to an online member after 30 seconds, with the room paused. Reconnect uses the existing credential. Restarting the server restores each room paused.

## Architecture and integrity

Node 24, built-in HTTP and SQLite; no runtime npm dependencies. server/engine.cjs loads the existing gameplay core up to the explicit UI boundary in index.html; server/engine-bridge.js is an allowlisted command adapter, not a second implementation of recipes. The server owns time, stock, money and outcomes. No endpoint accepts uploaded game state. Commands use a saved monotonic member sequence and an authoritative revision. A repeated sequence cannot charge twice; conflicts do not auto-retry. Each change is persisted before acknowledgement/broadcast. Errors roll back the command; storage errors pause the room.

Authenticated fetch streaming carries snapshots. Tokens are hashed in SQLite, no token in public snapshots. Four seats are reserved including disconnected members. Origin checks, body limits, connection/action rate limits and a public-file allowlist are included. Apply TLS and edge rate limits when public; in-process limits do not replace edge protection. SSE buffering must be disabled by the reverse proxy.

The co-op client bypasses all solo localStorage reads/writes and IndexedDB restoration. It receives server snapshots in the existing renderer. The solo game is unchanged unless explicitly entering ?coop=1. Never use the co-op database as a solo save.

## Run and deploy

Run `node server/server.cjs` with Node 24, then open http://localhost:3000/coop/. Set COOP_DB to a persistent writable path. Default is data/coop.sqlite. Use exactly one instance with its persistent volume: this SQLite architecture must not be scaled to multiple independent replicas. Back up SQLite using its online backup tooling, including WAL consistency. No room auto-deletion is enabled.

Docker: build from repository root with `docker build -f server/Dockerfile -t bean-coop .`; run with port 3000 and a writable persistent volume mounted at /data (the process runs as node UID 1000). render.yaml is a deployment blueprint with a **paid** persistent-volume service; it has not been provisioned automatically.

Vercel's static deployment alone cannot host the persistent co-op process. Once a backend origin exists, set window.BEAN_COOP_SERVER in coop/config.js to that HTTPS origin, and allow the frontend origin in COOP_ORIGINS. Alternatively use the Node service's /coop/ URL, which serves the frontend too. Do not advertise the Vercel preview as functioning online co-op until this backend is configured.

## Verification

node --test tests/coop-server.cjs tests independent rooms, capacity, guest permissions, cup conflicts, duplicate commands, server-owned inventory, concurrent delivery, pause on disconnect, restart persistence, authentication and private-file access. The browser workflow opens four isolated browser contexts, creates/joins via the lobby, shares a cup, reloads a member, checks solo storage isolation and captures 375/390/430 screenshots on Chromium and WebKit. Existing solo regression/visual workflow runs separately. CI networking is localhost; public internet latency, TLS proxy configuration and physical devices require deployment testing.
