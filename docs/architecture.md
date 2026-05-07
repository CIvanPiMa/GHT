# GH Tracker — Architecture

**Table of Contents**:

- [1. Overview](#1-overview)
- [2. Repository Structure](#2-repository-structure)
- [3. Data Pipeline](#3-data-pipeline)
  - [3.1 Edition Folder Structure](#31-edition-folder-structure)
  - [3.2 build-data.js Compilation](#32-build-datajs-compilation)
  - [3.3 Runtime Loading](#33-runtime-loading)
- [4. Application Layers](#4-application-layers)
  - [4.1 Data Layer — `src/app/game/model/data/`](#41-data-layer--srcappgamemodeldata)
  - [4.2 Business Logic Layer — `src/app/game/businesslogic/`](#42-business-logic-layer--srcappgamebusinesslogic)
    - [GameManager (`GameManager.ts`)](#gamemanager-gamemanagerts)
    - [Manager Responsibilities](#manager-responsibilities)
    - [Command Layer — `src/app/game/commands/`](#command-layer--srcappgamecommands)
  - [4.3 UI Layer — `src/app/ui/`](#43-ui-layer--srcappui)
- [5. Game State Model](#5-game-state-model)
  - [5.1 The `Game` Class (`src/app/game/model/Game.ts`)](#51-the-game-class-srcappgamemodelgamets)
  - [5.2 `GameState` Enum](#52-gamestate-enum)
  - [5.3 Serialization](#53-serialization)
- [6. State Management](#6-state-management)
  - [6.1 Angular Signals (Reactive Layer)](#61-angular-signals-reactive-layer)
  - [6.2 StorageManager (Persistence)](#62-storagemanager-persistence)
  - [6.3 StateManager (Undo/Redo + Persistence)](#63-statemanager-undoredo--persistence)
- [7. Multi-Client Sync (GHT Server)](#7-multi-client-sync-ght-server)
  - [Message Flow](#message-flow)
  - [Conflict Resolution](#conflict-resolution)
  - [`Permissions`](#permissions)
- [8. Build System](#8-build-system)
  - [8.1 npm Scripts](#81-npm-scripts)
  - [8.2 Angular Build Configurations](#82-angular-build-configurations)
  - [8.3 Service Worker / PWA](#83-service-worker--pwa)
  - [8.4 Electron](#84-electron)
- [9. Deployment Options](#9-deployment-options)
- [10. Key Extension Points](#10-key-extension-points)
  - [10.1 Adding a New Game Edition](#101-adding-a-new-game-edition)
  - [10.2 Adding a New Manager / Feature](#102-adding-a-new-manager--feature)
  - [10.3 Adding a New UI Component](#103-adding-a-new-ui-component)
  - [10.4 Data Format Reference](#104-data-format-reference)
- [11. UI Screens \& Dialogs](#11-ui-screens--dialogs)
  - [11.1 App Shell](#111-app-shell)
  - [11.2 Header \& Main Menu](#112-header--main-menu)
  - [11.3 Footer \& Round Controls](#113-footer--round-controls)
  - [11.4 Character Figure \& Dialogs](#114-character-figure--dialogs)
  - [11.5 Monster Figure \& Dialogs](#115-monster-figure--dialogs)
  - [11.6 Entities-Menu Dialog](#116-entities-menu-dialog)
  - [11.7 Attack Modifier Deck](#117-attack-modifier-deck)
  - [11.8 Party Sheet](#118-party-sheet)
  - [11.9 Tools Panel](#119-tools-panel)

## 1. Overview

GH Tracker is a Progressive Web App companion for Gloomhaven-family board games. It runs entirely in the browser as an Angular SPA. Persistence is handled offline via IndexedDB (with a LocalStorage fallback), and optionally synchronized across multiple clients via a separate GHT Server over WebSocket.

```
┌───────────────────────────────┐
│  Browser (Angular SPA / PWA)  │
│  ┌──────────────────────────┐ │
│  │  UI Layer (Components)   │ │
│  ├──────────────────────────┤ │
│  │  Business Logic Layer    │ │
│  │  (GameManager + 25 mgrs) │ │
│  ├──────────────────────────┤ │
│  │  Data Layer (EditionData)│ │
│  └──────────────────────────┘ │
│           ↕ IndexedDB         │
└───────────────────────────────┘
          ↕ WebSocket (optional)
┌───────────────────────────────┐
│  GHT Server (external)        │
│  Multi-client sync / auth     │
└───────────────────────────────┘
```

Deployment targets: browser (PWA), Docker + nginx, Electron desktop app.

---

## 2. Repository Structure

```
gh-tracker/
├── angular.json            # Angular CLI workspace config (build targets, file replacements)
├── main.js                 # Electron entry point
├── ngsw-config.json        # Angular Service Worker / PWA config
├── package.json            # Scripts, dependencies, nodemon config
├── Dockerfile              # Multi-stage build → nginx image
├── docker-compose.yaml     # Production: serves on port 80
├── docker-compose.dev.yaml # Dev: node:24-alpine, ng serve on port 4200
├── docker-compose.server.yaml # (GHT server compose variant)
├── tsconfig*.json          # TypeScript configs (app, spec, electron)
├── eslint.config.mjs       # ESLint flat config
├── data/                   # Source game data (JSON) — one folder per edition
│   ├── schema.json         # JSON schema for data validation
│   └── {edition}/          # e.g. gh/, fh/, jotl/, cs/, …
│       ├── base.json       # Edition metadata, conditions, extensions
│       ├── items.json      # (if applicable)
│       ├── battle-goals.json
│       ├── events.json
│       ├── personal-quests.json
│       ├── treasures.json
│       ├── buildings.json  # (FH only)
│       ├── campaign.json
│       ├── character/      # One JSON per character class
│       ├── monster/        # One JSON per monster type
│       ├── scenarios/      # One JSON per scenario
│       ├── sections/       # Section card data
│       └── label/          # Locale label overrides
├── scripts/
│   ├── build-data.js       # Compiles data/ → src/assets/data/
│   ├── pre-build.js        # Pre-build steps (version injection, etc.)
│   ├── post-build.js       # Post-build steps (PWA manifest fixups, etc.)
│   ├── pre-commit.mjs      # Husky pre-commit hook
│   └── sort/               # Sort/lint helper scripts for data files
└── src/
    ├── index.html
    ├── main.ts             # Angular bootstrap
    ├── styles.scss         # Global styles
    ├── manifest.webmanifest
    ├── environments/       # environment.ts, .prod.ts, .electron.ts
    ├── assets/
    │   └── data/           # Compiled edition JSON files (gitignored, generated)
    └── app/
        ├── game/
        │   ├── model/      # Domain objects + data interfaces
        │   ├── businesslogic/  # 26 manager classes
        │   └── commands/   # Command pattern for reversible actions
        └── ui/             # Angular components
```

---

## 3. Data Pipeline

### 3.1 Edition Folder Structure

Each game edition lives under `data/{edition}/`. The required file is `base.json` (edition metadata). Additional files are optional:

| File / Folder          | Purpose                                            |
| ---------------------- | -------------------------------------------------- |
| `base.json`            | Edition id, name, conditions, extension references |
| `items.json`           | Item cards                                         |
| `battle-goals.json`    | Battle goal cards                                  |
| `events.json`          | Event cards                                        |
| `personal-quests.json` | Personal quest cards                               |
| `treasures.json`       | Treasure references                                |
| `campaign.json`        | Campaign state shape                               |
| `buildings.json`       | (FH-style) building definitions                    |
| `challenges.json`      | Challenge deck                                     |
| `trials.json`          | Trial cards                                        |
| `favors.json`          | Favor cards                                        |
| `pets.json`            | Pet cards                                          |
| `character/`           | One JSON per character class                       |
| `monster/`             | One JSON per monster type                          |
| `scenarios/`           | One JSON per scenario (overrides `scenarios.json`) |
| `sections/`            | Section card JSONs                                 |
| `label/`               | Locale-keyed label overrides                       |

### 3.2 build-data.js Compilation

`scripts/build-data.js` runs as a Node.js script **before every start/build/test** via npm lifecycle hooks (`prestart`, `prebuild`, `pretest`). During `npm run watch`, nodemon re-runs it whenever any file under `data/` changes.

Process per edition folder:

1. Read `base.json` as the base object.
2. Merge in all optional JSON files via `load_file()`.
3. Collect `character/` and `monster/` sub-folders as arrays via `load_subfolder()`.
4. Read `scenarios/` as individual files (each can override or extend `scenarios.json`).
5. Write the merged object to `src/assets/data/{edition}.json`.

### 3.3 Runtime Loading

`SettingsManager` holds a list of default edition data URLs pointing to `./assets/data/{edition}.json`. On startup it performs HTTP `fetch` calls for each enabled edition and populates `GameManager.editionData: EditionData[]`. Users can also add custom edition data URLs (e.g., from a remote GHT server) via settings.

---

## 4. Application Layers

### 4.1 Data Layer — `src/app/game/model/data/`

TypeScript interfaces/classes that mirror the compiled JSON structure. Key types:

| Type                  | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `EditionData`         | Top-level container for all edition content          |
| `CharacterData`       | Character class definition (stats, perks, abilities) |
| `MonsterData`         | Monster definition (stats, abilities, special rules) |
| `DeckData`            | Attack modifier / ability deck                       |
| `ScenarioData`        | Scenario definition (rooms, monsters, objectives)    |
| `ItemData`            | Item card                                            |
| `BattleGoal`          | Battle goal card                                     |
| `EventCard`           | Event card                                           |
| `PersonalQuest`       | Personal quest card                                  |
| `CampaignData`        | Campaign structure (prosperity, stickers)            |
| `BuildingData`        | (FH) Building definition                             |
| `TrialCard` / `Favor` | Trial/Favor system cards                             |

### 4.2 Business Logic Layer — `src/app/game/businesslogic/`

All managers are plain TypeScript classes (not Angular services, except `GhsManager` and `StorageManager`). They are instantiated as singletons by `GameManager` and exported as module-level constants.

#### GameManager (`GameManager.ts`)

Central coordinator. Holds the `Game` instance, all `EditionData`, all sub-manager references, and the two Angular `WritableSignal`s used to broadcast state changes to the UI:

- `uiChangeSignal: WritableSignal<number>` — incremented on any state mutation
- `uiChangeFromServer: WritableSignal<boolean>` — flags whether the change originated from the server

Export: `export const gameManager = new GameManager()` — used as a module-level singleton throughout the app.

#### Manager Responsibilities

| Manager                 | Responsibility                                                                                                                                                                                             |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `StateManager`          | Undo/redo stack, localStorage persistence, WebSocket connect/disconnect, server message handling, permissions                                                                                              |
| `StorageManager`        | Abstraction over IndexedDB (with LocalStorage fallback); reads/writes game state, settings, undo/redo arrays, backups                                                                                      |
| `SettingsManager`       | User settings load/save, edition data URL management, locale registration, spoiler filtering                                                                                                               |
| `EntityManager`         | Cross-entity operations (HP, conditions, exhaustion, round-end cleanup)                                                                                                                                    |
| `CharacterManager`      | Character add/remove, XP, perks, summons, ability deck management                                                                                                                                          |
| `MonsterManager`        | Monster add/remove, standee allocation, ability deck draw, monster entity state                                                                                                                            |
| `ObjectiveManager`      | Objective container add/remove, initiative, HP tracking                                                                                                                                                    |
| `AttackModifierManager` | Attack modifier deck draw, shuffle, curse/bless addition/removal, advantage/disadvantage                                                                                                                   |
| `ActionsManager`        | Ability action parsing and execution                                                                                                                                                                       |
| `LevelManager`          | Scenario level calculation (based on character levels, player count, solo adjustment)                                                                                                                      |
| `RoundManager`          | `nextGameState()` — transitions `GameState.draw ↔ GameState.next`, calls `next()` on all sub-managers                                                                                                      |
| `ScenarioManager`       | Scenario load/unload, room revelation, section application, scenario serialization                                                                                                                         |
| `ScenarioRulesManager`  | Evaluates and applies scenario-defined rules (spawn monsters, add objectives, etc.)                                                                                                                        |
| `ScenarioStatsManager`  | Tracks per-scenario performance statistics                                                                                                                                                                 |
| `ItemManager`           | Item equip/unequip, item state (spent/refreshed/consumed), item pool management                                                                                                                            |
| `LootManager`           | Loot deck build/draw, loot distribution to characters, section-based loot additions                                                                                                                        |
| `BattleGoalManager`     | Battle goal deck draw, assignment, completion tracking                                                                                                                                                     |
| `EventCardManager`      | Event card draw/resolution for road/city/outpost events                                                                                                                                                    |
| `BuildingsManager`      | (FH) Building unlock, repair, enhancement state                                                                                                                                                            |
| `ChallengesManager`     | Challenge deck management and completion tracking                                                                                                                                                          |
| `TrialsManager`         | Trial card state, active trial tracking                                                                                                                                                                    |
| `EnhancementsManager`   | Ability card enhancement application and cost calculation                                                                                                                                                  |
| `ImbuementManager`      | (FH) Imbuement system state                                                                                                                                                                                |
| `DebugManager`          | Development-only debugging utilities                                                                                                                                                                       |
| `GhsManager`            | Angular `Injectable` service; subscribes to `uiChangeSignal` via `effect()` and runs cross-cutting reactive logic (level recalculation, scenario rules, buildings, challenges, trials, permissions update) |

#### Command Layer — `src/app/game/commands/`

A Command pattern (`Command` base class + `CommandManager`) sits beneath `StateManager` and provides named, serializable actions (e.g., `character.hp`, `character.xp`, `attackModifierDeck.draw`, `round.state`). This enables structured undo/redo and clean server message routing.

### 4.3 UI Layer — `src/app/ui/`

All components are standalone Angular components using `ChangeDetectionStrategy.OnPush`. They inject `gameManager` and read from `uiChangeSignal` to trigger re-renders.

| Area                   | Path                              | Description                                                                                                 |
| ---------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| App shell              | `ui/main.ts` + `main.html`        | Root component; renders figure list, coordinates drag-drop, bootstraps keyboard shortcuts and pointer input |
| **figures/**           |                                   |                                                                                                             |
| `character/`           | `ui/figures/character/`           | Character card (HP bar, XP, conditions, items, abilities, loot) + full-view overlay                         |
| `monster/`             | `ui/figures/monster/`             | Monster card (standees, ability deck, stats) + dialogs                                                      |
| `objective-container/` | `ui/figures/objective-container/` | Objective/escort entity cards                                                                               |
| `ability/`             | `ui/figures/ability/`             | Ability card rendering                                                                                      |
| `actions/`             | `ui/figures/actions/`             | Ability action icons and effects display                                                                    |
| `attackmodifier/`      | `ui/figures/attackmodifier/`      | Attack modifier deck and drawn card display                                                                 |
| `battlegoal/`          | `ui/figures/battlegoal/`          | Battle goal assignment and tracking                                                                         |
| `challenges/`          | `ui/figures/challenges/`          | Challenge deck UI                                                                                           |
| `conditions/`          | `ui/figures/conditions/`          | Condition token display and picker                                                                          |
| `entities-menu/`       | `ui/figures/entities-menu/`       | Contextual entity action menu                                                                               |
| `errors/`              | `ui/figures/errors/`              | Figure error display                                                                                        |
| `event/`               | `ui/figures/event/`               | Event card display                                                                                          |
| `healthbar/`           | `ui/figures/healthbar/`           | Shared HP bar component                                                                                     |
| `items/`               | `ui/figures/items/`               | Item card display and management                                                                            |
| `loot/`                | `ui/figures/loot/`                | Loot card display                                                                                           |
| `party/`               | `ui/figures/party/`               | Party overview panel                                                                                        |
| `scenario-recap/`      | `ui/figures/scenario-recap/`      | Scenario completion summary                                                                                 |
| `standee/`             | `ui/figures/standee/`             | Monster standee number tokens                                                                               |
| `trials/`              | `ui/figures/trials/`              | Trials/Favors display                                                                                       |
| **header/**            | `ui/header/`                      | Top bar: edition selector, scenario picker, settings menu                                                   |
| **footer/**            | `ui/footer/`                      | Bottom bar: round controls, element board, game clock                                                       |
| **helper/**            | `ui/helper/`                      | Shared directives (`GhsLabel`, `GhsTooltip`, `FigureAutoscroll`, `PointerInput`), pipes, static utilities   |
| **tools/**             | `ui/tools/`                       | Side-panel tools (world map, party sheet, etc.)                                                             |

---

## 5. Game State Model

### 5.1 The `Game` Class (`src/app/game/model/Game.ts`)

The `Game` class is the single source of truth for all runtime state. Key fields:

| Field                          | Type                    | Description                                                                |
| ------------------------------ | ----------------------- | -------------------------------------------------------------------------- |
| `revision`                     | `number`                | Monotonically increasing change counter used for server conflict detection |
| `revisionOffset`               | `number`                | Baseline revision at session start (for delta calculation)                 |
| `edition`                      | `string \| undefined`   | Currently active game edition                                              |
| `state`                        | `GameState`             | Current round phase (`draw` or `next`)                                     |
| `figures`                      | `Figure[]`              | All active figures: `Character[]`, `Monster[]`, `ObjectiveContainer[]`     |
| `scenario`                     | `Scenario \| undefined` | Active scenario                                                            |
| `sections`                     | `Scenario[]`            | Revealed section cards                                                     |
| `scenarioRules`                | array                   | Active scenario rule identifiers + rule objects                            |
| `level`                        | `number`                | Current scenario level (1–7)                                               |
| `round`                        | `number`                | Current round number                                                       |
| `party`                        | `Party`                 | Active party (campaign progress, reputation, gold, etc.)                   |
| `parties`                      | `Party[]`               | All saved parties                                                          |
| `elementBoard`                 | `ElementModel[]`        | Element infusion state                                                     |
| `monsterAttackModifierDeck`    | `AttackModifierDeck`    | Monster AM deck                                                            |
| `allyAttackModifierDeck`       | `AttackModifierDeck`    | Ally AM deck                                                               |
| `lootDeck`                     | `LootDeck`              | Active loot deck                                                           |
| `challengeDeck`                | `ChallengeDeck`         | Active challenge deck                                                      |
| `playSeconds` / `totalSeconds` | `number`                | Session and total play time                                                |
| `server`                       | `boolean`               | Whether this state was received from the server                            |

### 5.2 `GameState` Enum

```typescript
export enum GameState {
  draw = 'draw',   // Players select initiatives; abilities not yet drawn
  next = 'next'    // Abilities drawn; round in progress
}
```

`RoundManager.nextGameState()` handles the transition: on `draw → next` it draws ability cards, sets initiatives, and applies start-of-round rules; on `next → draw` it advances the round counter, applies end-of-round effects across all managers, and resets transient entity state.

### 5.3 Serialization

`Game.toModel()` converts the live `Game` to a plain `GameModel` (JSON-serializable). `Game.fromModel()` reconstructs domain objects from a stored `GameModel`. This model shape is what is stored in IndexedDB and transmitted over WebSocket.

---

## 6. State Management

### 6.1 Angular Signals (Reactive Layer)

`GameManager` exposes two `WritableSignal`s:

- **`uiChangeSignal`** — every state mutation (from any manager) calls `gameManager.triggerUiChange()`, which increments this counter.
- **`uiChangeFromServer`** — set to `true` when the mutation originates from a server WebSocket message.

UI components declare dependencies on `uiChangeSignal` (directly or via `GhsManager`). Angular's `OnPush` change detection then re-evaluates only affected component trees.

`GhsManager` (an Angular `Injectable`) uses `effect(() => { gameManager.uiChangeSignal(); … })` to run cross-cutting reactive logic on every state change (level recalculation, scenario rule evaluation, building/challenge/trial updates, permission sync).

### 6.2 StorageManager (Persistence)

`StorageManager` (`src/app/game/businesslogic/StorageManager.ts`) abstracts the storage backend:

- **Primary**: IndexedDB (`ght-db`, version 1) with object stores: `game`, `settings`, `undo`, `redo`, `undo-infos`, `game-backup`.
- **Fallback**: `localStorage` when IndexedDB is unavailable (mobile browsers, private browsing).
- **Migration**: On first load with IndexedDB available, migrates any existing `localStorage` data.

Key operations: `writeGameModel`, `readGameModel`, `addBackup`, `write`/`read`/`readAll`/`writeArray`.

### 6.3 StateManager (Undo/Redo + Persistence)

`StateManager` (`src/app/game/businesslogic/StateManager.ts`) sits above `StorageManager` and manages:

- **Undo stack** (`undos: GameModel[]`) and **redo stack** (`redos: GameModel[]`) with associated `undoInfos` for labeling.
- `before()` / `after()` methods bracket mutations — `before()` snapshots current state to `undos`, `after()` persists to storage.
- On init, loads the last saved `GameModel` from IndexedDB and re-establishes the server connection if credentials are configured.
- Auto-backup on a timer: saves a backup copy to the `game-backup` store.

---

## 7. Multi-Client Sync (GHT Server)

When server credentials are configured (`serverUrl`, `serverPort`, `serverCode` in Settings), `StateManager.connect()` opens a WebSocket connection.

### Message Flow

| Direction       | Type          | Payload                                                             |
| --------------- | ------------- | ------------------------------------------------------------------- |
| Server → Client | `game`        | Full `GameModel` — replaces local state                             |
| Client → Server | `game`        | Full `GameModel` — sent after every `before()` call                 |
| Server → Client | `permissions` | `Permissions` object restricting which figures a client can control |

### Conflict Resolution

The `revision` field on `GameModel` is the conflict detector. If the client's `game.revision` is higher than the incoming server model's revision, the client treats this as a stale server push: it creates a backup of local state, logs a warning, and accepts the server state anyway (last-write-wins at server level).

### `Permissions`

The `Permissions` model (`src/app/game/model/Permissions.ts`) specifies which characters and monsters a given client is allowed to modify. When a server connection is active, `StateManager.updatePermissions()` enforces these before allowing mutations.

---

## 8. Build System

### 8.1 npm Scripts

| Script           | Command                                | Description                                                                 |
| ---------------- | -------------------------------------- | --------------------------------------------------------------------------- |
| `start`          | `prestart` → `ng serve`                | Build data, start dev server on port 4200                                   |
| `build`          | `prebuild` → `ng build` → `postbuild`  | Build data + pre-build, compile Angular (production), run post-build fixups |
| `watch`          | `nodemon`                              | Watch `data/` and re-run `build-data.js` on JSON changes                    |
| `test`           | `pretest` → `ng test`                  | Build data, run Karma tests                                                 |
| `lint`           | `eslint "src/**/*.{ts,html}"`          | Lint TypeScript and HTML templates                                          |
| `format`         | `prettier --write …`                   | Format TypeScript, HTML, SCSS                                               |
| `electron`       | build (electron config) → `electron .` | Run Electron desktop app                                                    |
| `electron:build` | build → `electron-builder`             | Package Electron app for distribution                                       |

### 8.2 Angular Build Configurations

Defined in `angular.json` under `projects.gh-tracker.architect.build.configurations`:

| Configuration | Environment File           | Notes                                             |
| ------------- | -------------------------- | ------------------------------------------------- |
| (default)     | `environment.ts`           | Dev: `production: false`, Service Worker enabled  |
| `production`  | `environment.prod.ts`      | Full optimization, output hashing, budget checks  |
| `electron`    | `environment.electron.ts`  | `electron: true`, `base-href ./` for file:// URLs |

Output directory: `dist/gh-tracker/`.

### 8.3 Service Worker / PWA

`ngsw-config.json` configures the Angular Service Worker for offline support. The default build includes Service Worker; Electron uses direct file access instead.

### 8.4 Electron

`main.js` is the Electron entry point. The `electron` npm script builds Angular with `--configuration electron --base-href ./` then launches Electron. `electron-builder` packages it for Linux (AppImage, RPM) and other targets defined in `package.json`.

---

## 9. Deployment Options

| Option                          | How                                                       | Trade-offs                                                                                         |
| ------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **PWA / Static hosting**        | `npm run build`, serve `dist/` from any web server or CDN | Simplest; offline support via Service Worker; no server needed for single-client use               |
| **Docker (production)**         | `docker compose up` (uses `Dockerfile`)                   | Multi-stage build → nginx:alpine image on port 80; easy to host on any container platform          |
| **Docker (dev)**                | `docker compose -f docker-compose.dev.yaml up`            | Mounts source volume, runs `ng serve` on port 4200 with live reload                                |
| **Electron**                    | `npm run electron:build`                                  | Offline desktop app; no browser required; Linux AppImage/RPM; `base-href ./` for local file access |
| **Self-hosted with GHT Server** | Deploy static files + run GHT Server separately           | Enables multi-client sync, permissions, and shared campaign state across devices                   |

---

## 10. Key Extension Points

### 10.1 Adding a New Game Edition

1. Create `data/{edition}/` with at minimum a `base.json` (set `edition`, `conditions`, optionally `extensions`).
2. Add character, monster, scenario, item JSON files as applicable (follow schema in `data/schema.json`).
3. Run `npm run start` — `build-data.js` will automatically compile `src/assets/data/{edition}.json`.
4. Add the compiled URL to `SettingsManager.defaultEditionDataUrls` if it should be enabled by default.

The `extensions` array in `base.json` maps an edition to its parent, enabling `GameManager.editionExtensions()` to resolve inherited content.

### 10.2 Adding a New Manager / Feature

1. Create `src/app/game/businesslogic/{Feature}Manager.ts` as a plain class accepting `game: Game` in its constructor.
2. Instantiate it in `GameManager` constructor and expose it as a public property.
3. If cross-cutting reactive logic is needed, add it to `GhsManager.onUiChangeUpdate()`.
4. If the feature introduces reversible user actions, add a `Command` subclass in `src/app/game/commands/` and register it in `CommandManager`.

### 10.3 Adding a New UI Component

1. Create a standalone Angular component under `src/app/ui/figures/` or the appropriate sub-folder.
2. Use `ChangeDetectionStrategy.OnPush` and inject `gameManager` to read reactive state.
3. Import and declare the component in the parent component's `imports` array (no NgModules).

### 10.4 Data Format Reference

For detailed JSON field documentation, see `resources/` and `data/schema.json`. (A dedicated `docs/data-format.md` is the planned reference for data additions.)

---

## 11. UI Screens & Dialogs

All screens are standalone Angular components. Selector names follow the `ght-*` prefix convention and match the CSS custom-element used in parent templates. Every component uses `ChangeDetectionStrategy.OnPush` and reads reactive state from `gameManager.uiChangeSignal`.

### 11.1 App Shell

| Selector   | File         | Description                                                                                                                                                                                                                                                                              |
| ---------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ght-main` | `ui/main.ts` | Root component. Renders the full figure list (`Character[]`, `Monster[]`, `ObjectiveContainer[]`), wires up drag-and-drop reordering, bootstraps keyboard shortcuts (`[ght-keyboard-shortcuts]`), and initialises pointer-input handling. All other UI is mounted inside this component. |

### 11.2 Header & Main Menu

The header bar (`ght-header`, `ui/header/header.ts`) is always visible at the top. It hosts the element infusion board and the hamburger button that opens the main menu.

| Selector                        | File                                                      | Description                                                                                                                        |
| ------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `ght-header`                    | `ui/header/header.ts`                                     | Top navigation bar. Contains element tokens (`ght-element`) and a menu toggle button.                                              |
| `ght-element`                   | `ui/header/element/element.ts`                            | Individual elemental infusion token. Cycles through waning/strong/inert states on tap.                                             |
| `ght-main-menu`                 | `ui/header/menu/menu.ts`                                  | Slide-in main menu panel. Entry point for all sub-menus below.                                                                     |
| `ght-character-menu`            | `ui/header/menu/character/character.ts`                   | Dialog for adding a character class to the active game.                                                                            |
| `ght-monster-menu`              | `ui/header/menu/monster/monster.ts`                       | Dialog for adding a monster type to the active game.                                                                               |
| `ght-scenario-menu`             | `ui/header/menu/scenario/scenario.ts`                     | Scenario picker: search, select, and load a scenario; set the current scenario level.                                              |
| `ght-section-menu`              | `ui/header/menu/section/section.ts`                       | Reveal a section card mid-scenario (adds it to `game.sections`).                                                                   |
| `ght-campaign-menu`             | `ui/header/menu/campaign/campaign.ts`                     | Campaign management: prosperity track, city/road stickers, donations, unlocked classes.                                            |
| `ght-settings-menu`             | `ui/header/menu/settings/settings.ts`                     | User settings dialog. Toggles features (abilities, items, loot, etc.), manages edition data URLs, sets locale and spoiler filters. |
| `ght-server-menu`               | `ui/header/menu/server/server.ts`                         | GHT Server connection configuration (URL, port, password). Initiates/terminates the WebSocket session.                             |
| `ght-datamanagement-menu`       | `ui/header/menu/datamanagement/datamanagement.ts`         | Import/export save data (JSON), clear state, restore backups.                                                                      |
| `ght-undo-dialog`               | `ui/header/menu/undo/dialog.ts`                           | Undo/redo history viewer. Shows labelled state snapshots; allows stepping back or forward.                                         |
| `ght-keyboard-shortcuts-dialog` | `ui/header/menu/keyboard-shortcuts/keyboard-shortcuts.ts` | Reference dialog listing all keyboard shortcuts available in the app.                                                              |
| `ght-about-menu`                | `ui/header/menu/about/about.ts`                           | About dialog: app version, links to upstream project, license info.                                                                |
| `ght-party-sheet`               | `ui/header/party/party-sheet.ts`                          | Inline party sheet panel showing party name, notes, reputation, gold and campaign progress. (See §11.8 for details.)               |
| `ght-game-clock-dialog`         | `ui/header/game-clock/game-clock.ts`                      | Session and total play-time display; allows pausing/resetting the game clock.                                                      |

### 11.3 Footer & Round Controls

The footer bar (`ui/footer/footer.ts`) is always visible at the bottom. It drives round-state transitions and provides quick-access round metadata.

| Selector               | File                                             | Description                                                                                                                |
| ---------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `ght-level`            | `ui/footer/level/level.ts`                       | Compact scenario-level display in the footer. Tapping opens `ght-level-dialog`.                                            |
| `ght-level-dialog`     | `ui/footer/level/level-dialog.ts`                | Scenario level editor: adjusts level, shows recommended level based on character levels and player count.                  |
| `ght-scenario-summary` | `ui/footer/scenario/summary/scenario-summary.ts` | Scenario completion overlay. Shown at end-of-scenario; summarises rewards (XP, gold, loot, checkmarks).                    |
| *(round button)*       | `ui/footer/footer.ts`                            | Central round-advance button. Calls `gameManager.roundManager.nextGameState()`, toggling between `draw` and `next` phases. |

### 11.4 Character Figure & Dialogs

The character card (`ght-character`, `ui/figures/character/character.ts`) is the primary in-play UI for a hero. Tapping areas of the card opens focused sub-dialogs.

| Selector                     | File                                                           | Description                                                                                                                                                                                                                                                                                                                                                  |
| ---------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ght-character`              | `ui/figures/character/character.ts`                            | Main character card. Shows HP bar, XP, conditions, initiative badge, and quick-action buttons (open sheet, open ability cards, open items).                                                                                                                                                                                                                  |
| `ght-character-sheet`        | `ui/figures/character/sheet/character-sheet.ts`                | Full character sheet panel: stats, perks, enhancements, personal quest progress, level-up controls.                                                                                                                                                                                                                                                          |
| `ght-character-sheet-dialog` | `ui/figures/character/dialogs/character-sheet-dialog.ts`       | Modal wrapper that presents `ght-character-sheet` as a full-screen overlay.                                                                                                                                                                                                                                                                                  |
| `ght-ability-cards-dialog`   | `ui/figures/character/sheet/abilities/ability-cards-dialog.ts` | Ability card hand manager. Displays the character's full ability deck; lets the player select cards for the round (up to 2), discard, lose, or recover cards. Cards can be sorted by initiative (default), name, level, card-id, or level+name; within each sort, cards are always grouped by state: **selected → available → discarded → lost → inactive**. |
| `ght-summon-dialog`          | `ui/figures/character/dialogs/summondialog.ts`                 | Add a summon to the character's summon list.                                                                                                                                                                                                                                                                                                                 |
| *(loot cards)*               | `ui/figures/character/dialogs/loot-cards.ts`                   | Shows loot cards drawn by the character during the scenario.                                                                                                                                                                                                                                                                                                 |
| *(retirement dialog)*        | `ui/figures/character/sheet/retirement-dialog.ts`              | Guides through the character retirement flow (personal quest completion, unlock rewards).                                                                                                                                                                                                                                                                    |
| *(move resources)*           | `ui/figures/character/sheet/move-resources.ts`                 | Transfers gold or resources between party members.                                                                                                                                                                                                                                                                                                           |
| `ght-character-level-dialog` | `ui/figures/entities-menu/level-dialog/level-dialog.ts`        | Adjusts a character's level and updates stat targets accordingly.                                                                                                                                                                                                                                                                                            |
| *(items)*                    | `ui/figures/items/items.ts`                                    | Item management sub-panel: equip/unequip items, track spent/refreshed state.                                                                                                                                                                                                                                                                                 |

### 11.5 Monster Figure & Dialogs

The monster card (`ght-monster`, `ui/figures/monster/monster.ts`) tracks all standees and the shared ability deck for a monster type.

| Selector                          | File                                                | Description                                                                                                              |
| --------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `ght-monster`                     | `ui/figures/monster/monster.ts`                     | Monster card. Shows all active standees with HP bars, the drawn ability card, and controls for adding/removing standees. |
| `ght-monster-stats`               | `ui/figures/monster/stats/stats.ts`                 | Inline stat block for a monster at the current scenario level (move, attack, range, special abilities).                  |
| `ght-monster-stats-popup`         | `ui/figures/monster/stats/stats-dialog.ts`          | Popup overlay showing the full monster stat block across all levels.                                                     |
| `ght-monster-ability-card`        | `ui/figures/monster/cards/ability-card.ts`          | Displays the currently drawn monster ability card (initiative, actions, shuffle indicator).                              |
| `ght-monster-level-dialog`        | `ui/figures/monster/dialogs/level-dialog.ts`        | Set the monster's level independently of the scenario level.                                                             |
| `ght-monster-numberpicker`        | `ui/figures/monster/dialogs/numberpicker.ts`        | Inline standee number toggle strip for quickly marking a standee alive/dead.                                             |
| `ght-monster-numberpicker-dialog` | `ui/figures/monster/dialogs/numberpicker-dialog.ts` | Modal wrapper for the standee picker, used when adding new standees.                                                     |

### 11.6 Entities-Menu Dialog

| Selector                   | File                                               | Description                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ght-entities-menu-dialog` | `ui/figures/entities-menu/entities-menu-dialog.ts` | Context-menu overlay that opens when long-pressing any figure card. Provides figure-specific actions: apply/remove conditions, fine-grained HP adjustment, initiative override, summon management, loot assignment, random item/scenario draw, and outpost-attack controls. Also contains favour management (`favors/`) and additional AM-deck selection (`additional-am-select/`). |

### 11.7 Attack Modifier Deck

| Selector                            | File                                                         | Description                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `ght-attackmodifierdeck`            | `ui/figures/attackmodifier/attackmodifierdeck.ts`            | Compact deck widget shown on character/monster cards. Displays remaining-card count and the last drawn modifier.  |
| `ght-attackmodifierdeck-dialog`     | `ui/figures/attackmodifier/attackmodifierdeck-dialog.ts`     | Full attack modifier deck dialog: shows drawn cards, curses/blesses remaining, perk tracking, and shuffle status. |
| `ght-attackmodifierdeck-fullscreen` | `ui/figures/attackmodifier/attackmodifierdeck-fullscreen.ts` | Full-screen single-card draw view, useful for display on a shared monitor.                                        |
| `ght-attackmodifier`                | `ui/figures/attackmodifier/attackmodifier.ts`                | Renders a single attack modifier card face.                                                                       |
| `ght-attackmodifier-draw`           | `ui/figures/attackmodifier/attackmodifier-draw.ts`           | Animates the card-draw reveal.                                                                                    |
| `ght-attackmodifier-effect`         | `ui/figures/attackmodifier/attackmodifier-effect.ts`         | Renders rolling/chained modifier effects.                                                                         |

### 11.8 Party Sheet

| Selector          | File                             | Description                                                                                                                                                                                                                        |
| ----------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ght-party-sheet` | `ui/header/party/party-sheet.ts` | Party management overlay accessible from the header. Tracks party name, notes, reputation, collective gold, achievement stickers, and links to individual character retirement status. Multiple parties can be saved and switched. |

### 11.9 Tools Panel

Side-panel tools are optional overlays for extended game management. They are opened from the main menu or keyboard shortcuts and operate independently of the main figure list.

| Selector                                | File                                                                   | Description                                                                                                |
| --------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `ght-attackmodifier-tool`               | `ui/tools/attackmodifier/attackmodifier-tool.ts`                       | Standalone attack modifier tool: draw cards for any deck without being tied to a specific figure.          |
| `ght-decks-tool`                        | `ui/tools/decks/decks-tool.ts`                                         | Browse and manage all attack modifier and ability decks in the current game.                               |
| `ght-items-cards-tool`                  | `ui/tools/items/items-cards-tool.ts`                                   | Full item card browser for the active edition(s); supports filtering by tier, class, and availability.     |
| `ght-event-cards-tool`                  | `ui/tools/events/event-cards-tool.ts`                                  | Event card tool: draw road/city/outpost event cards and apply results.                                     |
| `ght-treasures-tool`                    | `ui/tools/treasures/treasures-tool.ts`                                 | Treasure reference panel for looking up numbered treasure results.                                         |
| `ght-random-monster-cards-tool`         | `ui/tools/random-monster-cards/random-monster-cards-tool.ts`           | Draws random monster ability cards from any monster deck for ad-hoc encounters.                            |
| `ght-loot-deck-standalone`              | `ui/tools/standalone/loot-deck/loot-deck-standalone.ts`                | Standalone loot deck widget for use without a full scenario loaded.                                        |
| `ght-initiative-standalone`             | `ui/tools/standalone/initiative/initiative-standalone.ts`              | Standalone initiative tracker: enter initiative values for characters and monsters and display turn order. |
| `ght-attackmodifier-standalone`         | `ui/tools/standalone/attackmodifier/attackmodifier-standalone.ts`      | Standalone attack modifier deck, embeddable outside a full game session.                                   |
| `ght-enhancement-calculator-standalone` | `ui/tools/standalone/enhancement-calculator/enhancement-calculator.ts` | Calculates ability card enhancement costs based on type, level, and previous enhancements.                 |
| `ght-edition-editor`                    | `ui/tools/editor/edition.ts`                                           | In-app editor for creating or modifying edition `base.json` metadata.                                      |
| `ght-character-editor`                  | `ui/tools/editor/character/character.ts`                               | Visual editor for character ability decks and perks.                                                       |
| `ght-monster-editor`                    | `ui/tools/editor/monster/monster.ts`                                   | Visual editor for monster stat blocks and ability decks.                                                   |
| `ght-deck-editor`                       | `ui/tools/editor/deck/deck.ts`                                         | Generic deck editor for attack modifier and ability decks.                                                 |
