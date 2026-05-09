# Installation Guide

This guide covers all ways to install or deploy GH Tracker.

**Table of Contents**:

- [Development Setup](#development-setup)
- [Production Build](#production-build)
- [PWA (Install as App)](#pwa-install-as-app)
- [Electron (Standalone Desktop App)](#electron-standalone-desktop-app)
- [Environment Configuration](#environment-configuration)

## Development Setup

Clone this and the server repositories:

```bash
git clone https://github.com/CIvanPiMa/GHT.git
git clone https://github.com/CIvanPiMa/GHT-server.git
```

Run the Dev Docker Compose to start both the Angular app and the sync server together:

```bash
docker compose -f docker-compose.dev.yml up --build
```

- The app will be available at [http://localhost:4200](http://localhost:4200).
- The sync server will be available at `ws://localhost:4201` for WebSocket connections from the app.

To watch for data file changes while developing:

```bash
npm run watch
```

This uses [nodemon](https://nodemon.io/) to re-run `build-data.js` whenever any file under `data/` changes.

## Production Build

You can build the app and server for production with the docker-compose setup:

```bash
docker compose -f docker-compose.yml up --build
```

This builds the app and server with production optimizations.

- The app is served via nginx on port 8081.
- The sync server is available at `ws://localhost:8082` for WebSocket connections from the app.

## PWA (Install as App)

GH Tracker is a Progressive Web App — it can be installed on any device that supports PWAs:

- **Chrome (desktop/Android):** [Instructions](https://support.google.com/chrome/answer/9658361)
- **Safari (iOS/iPadOS):** [Instructions](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Installing#safari_for_ios_iphoneos_ipados)
- **Firefox (Android):** [Instructions](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Installing#firefox_for_android)
- Other browsers: search for "install PWA \<your browser\>"

Once installed, the app works fully offline.

## Electron (Standalone Desktop App)

**Build from source:**

```bash
npm run electron:build
# then run:
electron . --no-sandbox
# or shortcut:
npm run electron
```

## Environment Configuration

Environment files are in `src/environments/`:

| File                      | Used for                 |
| ------------------------- | ------------------------ |
| `environment.ts`          | Development (`ng serve`) |
| `environment.prod.ts`     | Production builds        |
| `environment.electron.ts` | Electron builds          |
