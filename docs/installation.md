# Installation Guide

This guide covers all ways to install or deploy GH Tracker.

**Table of Contents**:

- [Development Setup](#development-setup)
- [Production Build](#production-build)
- [Docker](#docker)
  - [Production](#production)
  - [Development](#development)
- [Self-Hosting](#self-hosting)
- [PWA (Install as App)](#pwa-install-as-app)
- [Electron (Standalone Desktop App)](#electron-standalone-desktop-app)
- [Environment Configuration](#environment-configuration)

## Development Setup

Clone the repository and start the dev server:

```bash
git clone https://github.com/CIvanPiMa/GHT.git
cd gh-tracker
npm install
npm run start
```

The dev server is available at [http://localhost:4200](http://localhost:4200).

`npm run start` runs `scripts/build-data.js` automatically (via `prestart`) to compile the JSON data files in `data/` into `src/assets/data/` before launching the Angular dev server.

To watch for data file changes while developing:

```bash
npm run watch
```

This uses [nodemon](https://nodemon.io/) to re-run `build-data.js` whenever any file under `data/` changes.

## Production Build

```bash
npm run build
```

The `prebuild` hook runs `build-data.js` and `pre-build.js` automatically. The output is placed in `./dist/gh-tracker/`.

To serve the build locally for testing:

```bash
npx serve ./dist/gh-tracker
```

> The default production build sets the base URL to `/`. To use a different base path (e.g. for hosting at `example.com/gh-tracker/`), pass `--base-href`:
>
> ```bash
> npm run build -- --base-href /gh-tracker/
> ```

## Docker

### Production

Build and run the production image (served by nginx on port 80):

```bash
docker build -t gh-tracker .
docker run --rm -p 80:80 --name gh-tracker gh-tracker
```

### Development

Build the dev image and run it with your local source mounted for live reload (served on port 4200):

```bash
docker image prune -f
docker build -t gh-tracker-dev -f Dockerfile.dev .
docker run -it --rm -p 4200:4200 \
  -v $(pwd):/usr/src/gh-tracker \
  -v /usr/src/gh-tracker/node_modules \
  gh-tracker-dev
```

## Self-Hosting

Follow the [Production Build](#production-build) steps above, then copy `./dist/gh-tracker/` to your web server.

The app is a static Angular SPA. Configure your web server to serve `index.html` for all routes (catch-all / try_files).

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

| File                       | Used for                 |
| -------------------------- | ------------------------ |
| `environment.ts`           | Development (`ng serve`) |
| `environment.prod.ts`      | Production builds        |
| `environment.electron.ts`  | Electron builds          |
