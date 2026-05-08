# Plan: GHT Sync Server + Docker Compose

The app already has WebSocket sync built into the Angular client (`StateManager.ts`) — it just needs a compatible server. I'll build a standalone Node.js + TypeScript server project at `~/Code/github.com/CIvanPiMa/GHT-server`, with Docker Compose in the GHT repo to bring up the full self-hosted stack.

**TL;DR**: Stand up `GHT-server` — a Node.js + TypeScript WebSocket server implementing the GHT sync protocol (reverse-engineered from `StateManager.ts`, with design inspiration from [ghs-server](../../../Lurkars/ghs-server)), backed by SQLite for persistence. Wire it together with the Angular nginx app via `docker-compose.yml`.

---

## Phase 1 — Project Scaffold (`GHT-server` repo)

1. Initialize `package.json` — deps: `ws`, `better-sqlite3`, `uuid`; devDeps: `typescript`, `ts-node-dev`, `@types/ws`, `@types/better-sqlite3`, `@types/node`, `@types/uuid`
2. Create `tsconfig.json` — strict, `target: ES2022`, `module: Node16`, `outDir: dist`
3. Create `.gitignore`, `README.md`

## Phase 2 — Database Layer

Inspired by ghs-server's schema: game state as a JSON blob, codes as the auth layer.

4. `src/db.ts` — initialize SQLite database at `DATA_DIR/ght-server.sqlite` (env: `DATA_DIR`, default `~/.ght`); create tables on startup:
   ```sql
   CREATE TABLE IF NOT EXISTS games (
     id    INTEGER PRIMARY KEY AUTOINCREMENT,
     game  TEXT  -- serialized GameModel JSON
   );
   CREATE TABLE IF NOT EXISTS game_codes (
     code     TEXT PRIMARY KEY,
     game_id  INTEGER REFERENCES games(id),
     permissions TEXT  -- JSON Permissions object; NULL = full access
   );
   CREATE TABLE IF NOT EXISTS settings (
     game_id   INTEGER PRIMARY KEY REFERENCES games(id),
     settings  TEXT  -- serialized Settings JSON
   );
   ```
5. `src/store.ts` — typed wrappers around the DB:
   - `getGameIdByCode(code)`, `getPermissionsByCode(code)`
   - `getGame(id)`, `createGame(gameJson)`, `setGame(id, gameJson)`
   - `getSettings(gameId)`, `setSettings(gameId, settingsJson)`
   - `saveCode(code, gameId, permissionsJson | null)`

## Phase 3 — WebSocket Server

6. `src/types.ts` — TypeScript interfaces: `GhtMessage`, `Permissions`, `SessionMeta` (tracks `gameId`, `ws` per connection)
7. `src/sessions.ts` — in-memory session registry:
   - `Map<WebSocket, SessionMeta>` (per-connection state)
   - `Map<number, Set<WebSocket>>` (gameId → connected clients)
   - `broadcast(gameId, sender, message)` helper
   - `removeSession(ws)` on close/error
8. `src/handlers.ts` — one handler per message type, using `store` + `sessions`:
   - `request-game` → look up / create game; associate session; send stored state + `serverVersion`
   - `game` / `game-undo` / `game-redo` → validate permissions; persist; broadcast to others
   - `request-settings` → send stored settings
   - `settings` → persist; broadcast to others
   - `permissions` → validate root access; persist new sub-code; broadcast
   - `ping` → no-op
   - `requestUpdate` → broadcast to all clients in room
   - `remoteCommand` → broadcast to all clients in room
9. `src/index.ts` — entry point:
   - `WebSocket.Server` on `PORT` (default `8080`)
   - `onmessage` → parse JSON → route to handler
   - `onclose` / `onerror` → `removeSession`
   - Also mounts a minimal HTTP server on the same port for `GET /` health check

## Phase 4 — REST API (optional, mirrors ghs-server)

10. `src/rest.ts` — HTTP routes on same Node `http.Server` (upgrade WebSocket on `/ws`, HTTP otherwise):
    - `GET /game` — `Authorization: <code>` header → return stored game JSON
    - `POST /game` — `Authorization: <code>` + body → update game (same permission/revision checks as WS)

## Phase 5 — Dockerfile (`GHT-server` repo)

11. `Dockerfile` — multi-stage:
    - Stage 1 (`builder`): `node:24-alpine`, `npm ci`, `npm run build`
    - Stage 2 (`runtime`): `node:24-alpine`, copy `dist/`, `node_modules/`; `CMD ["node", "dist/index.js"]`; expose `8080`; mount `/data` volume for SQLite file

## Phase 6 — Docker Compose (`GHT` repo)

12. `docker-compose.yml` at `GHT/` repo root:
    ```yaml
    services:
      app:
        build: .          # existing Dockerfile (nginx, Angular)
        ports: ["80:80"]
      server:
        build: ../GHT-server   # or image: ghcr.io/CIvanPiMa/ght-server:latest
        ports: ["8080:8080"]
        volumes: ["ght-server-data:/data"]
        environment:
          PORT: "8080"
          DATA_DIR: "/data"
          PUBLIC: "true"    # allow any UUID to create a new room
    volumes:
      ght-server-data:
    ```

## Phase 7 — Docs

13. Add "Self-Hosting" section to `GHT/README.md`:
    - `docker compose up --build`
    - Open app → Server menu → host: `<your-server-ip>`, port: `8080`, paste a UUID as the room code

---

## Relevant Files

| File | Location | Action |
|---|---|---|
| `StateManager.ts` | `GHT/src/app/game/businesslogic/` | Read only — protocol reference |
| `server.ts` | `GHT/src/app/ui/header/menu/server/` | Read only — connection config reference |
| `Dockerfile` | `GHT/` | Read only — reused in compose |
| `ghs-server/` | `../Lurkars/ghs-server/` | Read only — design inspiration |
| All files | `GHT-server/` | **Create** (new standalone project) |
| `docker-compose.yml` | `GHT/` | **Create** |
| `README.md` | `GHT/` | **Modify** — add self-hosting section |

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Persistence | **SQLite via `better-sqlite3`** | Survives restarts; zero-config; same pattern as ghs-server |
| Data dir | `DATA_DIR` env var, default `/data` in container | Docker volume mount |
| Auth | Game code = auth token; `NULL` permissions = root access | Matches existing app + ghs-server pattern |
| Public mode | `PUBLIC=true` env var → any UUID creates a new room | Needed for easy home-server setup |
| `serverVersion` | Static `"1.0.0"` string | Client shows it in UI; no functional impact |
| REST API | `GET`/`POST /game` with `Authorization` header | Mirrors ghs-server; useful for scripting/backup |
| Angular source | **No changes** | Client is already protocol-compatible |
| WS path | `/` (root) | Matches existing `StateManager.ts` URL building |

## WebSocket Protocol Reference (from `StateManager.ts`)

**Message shape**:
```json
{
  "code": "room-uuid",
  "password": "room-uuid",
  "type": "message-type",
  "payload": {},
  "undoinfo": [],
  "revision": 0,
  "undolength": 1,
  "serverVersion": "string"
}
```

| Type | Direction | Behavior |
|---|---|---|
| `request-game` | Client → Server | Send stored `GameModel` + `serverVersion`; create game if `PUBLIC=true` and code unknown |
| `game` | Bidirectional | Validate permissions; persist; broadcast to others |
| `game-undo` | Bidirectional | Validate revision; persist; broadcast |
| `game-redo` | Bidirectional | Same as `game-undo` |
| `request-settings` | Client → Server | Send stored settings |
| `settings` | Bidirectional | Persist; broadcast to others |
| `permissions` | Bidirectional | Root-only; persist new sub-code; broadcast |
| `ping` | Client → Server | No-op |
| `requestUpdate` | Server → Clients | Broadcast to all in room |
| `remoteCommand` | Bidirectional | Broadcast to all in room |
| `error` | Server → Client | `"Invalid game code"`, `"Invalid password"`, `"Permission(s) missing"`, `"invalid revision"` |

## Verification

1. `docker compose up --build` in `GHT/` — both containers start cleanly
2. Open app → Server menu → host: `localhost`, port: `8080`, paste a UUID → Connect
3. Open second tab with same UUID → change game state in one tab → verify it syncs
4. Undo/redo propagates across clients
5. Server restart → reconnect → game state restored from SQLite
