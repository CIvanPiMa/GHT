# GH Tracker

**Table of Contents**:

- [Introduction](#introduction)
- [Install](#install)

## Introduction

*GH Tracker* is a **companion app** for Gloomhaven-based board games.

It manages scenario play by tracking initiative, health, conditions, and monster standees Automates attack modifier and loot decks;
Applies scenario-specific rules; and
Tracks full character, party, and campaign progression across **Gloomhaven**, **Frosthaven**, **Jaws of the Lion**, **Forgotten Circles**, **Gloomhaven 2nd Edition**, **Button & Bugs**, **The Crimson Scales**, **Trail of Ashes**, and more.

It runs in any modern browser with no install required, supports multi-client sync via [GHT Server](https://github.com/Lurkars/ght-server), and can be installed as a PWA or Electron app for offline use.

## Install

See [docs/installation.md](./docs/installation.md) for the full guide. Quick options:

- **PWA:** Open in browser → install via browser menu. [Chrome](https://support.google.com/chrome/answer/9658361) · [Safari iOS](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Installing#safari_for_ios_iphoneos_ipados) · [Firefox Android](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Installing#firefox_for_android)
- **Self-host:** Unzip the release zip onto your web server, or build and run with Docker: `docker build -t gh-tracker . && docker run --rm -p 80:80 gh-tracker`
- **Build from source:** `npm run build` — output at `./dist/gh-tracker`

---

Forked from [Lurkars/gloomhavensecretariat](https://github.com/Lurkars/gloomhavensecretariat)
