# GH Tracker

**Table of Contents**:

- [Introduction](#introduction)
- [Install](#install)
- [Self-Hosting (app + sync server)](#self-hosting-app--sync-server)

## Introduction

*GH Tracker* is a **companion app** for Gloomhaven-based board games.

It manages scenario play by tracking initiative, health, conditions, and monster standees Automates attack modifier and loot decks;
Applies scenario-specific rules; and
Tracks full character, party, and campaign progression across:

- **Gloomhaven**
- **Frosthaven**
- **Jaws of the Lion**
- **Forgotten Circles**
- **Gloomhaven 2nd Edition**
- **Button & Bugs**
- **The Crimson Scales**
- **Trail of Ashes**
- and more...

It runs in any modern browser with no install required, supports multi-client sync via [GHT Server](https://github.com/Lurkars/ght-server), and can be installed as a PWA or Electron app for offline use.

## Install

See [docs/installation.md](./docs/installation.md) for the full guide. Quick options:

- **PWA:** Open in browser → install via browser menu. [Chrome](https://support.google.com/chrome/answer/9658361) · [Safari iOS](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Installing#safari_for_ios_iphoneos_ipados) · [Firefox Android](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Installing#firefox_for_android)
- **Self-host:** Unzip the release zip onto your web server, or build and run with Docker: `docker build -t gh-tracker . && docker run --rm -p 80:80 gh-tracker`
- **Build from source:** `npm run build` — output at `./dist/gh-tracker`

## Self-Hosting (app + sync server)

Run the Angular app and sync server together with Docker Compose:

```bash
# no local clone of GHT-server required — Docker pulls both repos from GitHub
docker compose up --build
```

- App is served on **port 8081**
- Sync server is served on **port 8082** (WebSocket)
- Game state is persisted in a named Docker volume (`ght-server-data`)

**Connect the app to your server:**

1. Open the app → hamburger menu → **Server**
2. Set **Host** to your server's IP or hostname
3. Set **Port** to `8082`
4. Enter any UUID as the **Room Code** (e.g. generate one at [uuidgenerator.net](https://www.uuidgenerator.net))
5. Click **Connect** — share the same room code with other players to sync

> The server runs in `PUBLIC=true` mode by default, meaning any new room code automatically creates a new game. To restrict this, set `PUBLIC=false` in [docker-compose.yml](./docker-compose.yml) and pre-register room codes manually.

---

Forked from [Lurkars/gloomhavensecretariat](https://github.com/Lurkars/gloomhavensecretariat)
