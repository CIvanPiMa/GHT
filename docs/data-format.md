# Data Format Reference

This document describes how GH Tracker's game data is structured, how the build pipeline works, and how to add new editions or custom content.

**Table of Contents**:

- [Data Pipeline Overview](#data-pipeline-overview)
- [Edition Folder Structure](#edition-folder-structure)
- [base.json Format](#basejson-format)
- [Character Data Format](#character-data-format)
- [Monster Data Format](#monster-data-format)
- [Scenario Data Format](#scenario-data-format)
- [Label / Translation Files](#label--translation-files)
- [How to Add a New Edition](#how-to-add-a-new-edition)
- [How to Add Custom Content](#how-to-add-custom-content)
- [Schema Validation](#schema-validation)

---

## Data Pipeline Overview

```
data/
  {edition}/           ← source JSON files (human-editable)
    base.json
    character/
    monster/
    scenarios/
    label/
    ...
          ↓
  scripts/build-data.js
          ↓
src/assets/data/
  {edition}.json       ← compiled single-file output (auto-generated, do not edit)
```

`scripts/build-data.js` is run automatically before every `npm run start` and `npm run build`. It merges all JSON files within each edition subfolder into a single output file per edition.

The compiled files in `src/assets/data/` are what the Angular app actually loads at runtime.

---

## Edition Folder Structure

Each edition folder in `data/` follows this layout:

```
data/{edition}/
  base.json              ← required: edition metadata
  items.json             ← optional: item definitions
  events.json            ← optional: event decks
  personal-quests.json   ← optional
  battle-goals.json      ← optional
  campaign.json          ← optional: campaign rules
  treasures.json         ← optional
  buildings.json         ← optional (Frosthaven)
  pets.json              ← optional (Frosthaven)
  trials.json            ← optional (Frosthaven)
  challenges.json        ← optional (Frosthaven)
  favors.json            ← optional (Frosthaven)
  character/
    {name}.json          ← one file per character class
    deck/                ← ability card deck definitions
  monster/
    {name}.json          ← one file per monster type
    deck/                ← monster ability card decks
  scenarios/
    {number}.json        ← one file per scenario
  sections/
    {ref}.json           ← section book entries
  label/
    en.json              ← English labels (required)
    de.json              ← German, etc.
    spoiler/             ← spoiler labels (same structure)
```

---

## base.json Format

Every edition requires a `base.json` with the following fields:

```json
{
  "edition": "gh",
  "conditions": [
    "stun", "immobilize", "disarm", "wound", "muddle",
    "poison", "invisible", "strengthen", "curse", "bless"
  ],
  "worldMap": {
    "width": 2958,
    "height": 2410
  },
  "logoUrl": "./assets/images/logos/gh.png"
}
```

| Field        | Type     | Description                                 |
| ------------ | -------- | ------------------------------------------- |
| `edition`    | string   | Edition identifier (must match folder name) |
| `conditions` | string[] | Conditions active in this edition           |
| `worldMap`   | object   | Pixel dimensions of the world map image     |
| `logoUrl`    | string   | Path to the edition logo image              |

Additional optional fields: `campaign`, `solo`, `crossover`, `version`.

---

## Character Data Format

Each character file in `character/{name}.json` defines a playable class:

```json
{
  "name": "brute",
  "characterClass": "inox",
  "gender": "m",
  "edition": "gh",
  "handSize": 10,
  "retireEvent": "42",
  "color": "#35acd5",
  "stats": [
    { "level": 1, "health": 10 },
    { "level": 2, "health": 12 },
    ...
    { "level": 9, "health": 26 }
  ],
  "perks": [
    {
      "type": "remove",
      "count": 1,
      "cards": [
        { "count": 2, "attackModifier": { "type": "minus1" } }
      ]
    },
    {
      "type": "replace",
      "count": 1,
      "cards": [
        { "count": 1, "attackModifier": { "type": "minus1" } },
        { "count": 1, "attackModifier": { "type": "plus1" } }
      ]
    },
    {
      "type": "add",
      "count": 2,
      "cards": [...]
    }
  ]
}
```

| Field            | Type                    | Description                                            |
| ---------------- | ----------------------- | ------------------------------------------------------ |
| `name`           | string                  | Internal identifier (matches filename without `.json`) |
| `characterClass` | string                  | Race/class group identifier                            |
| `gender`         | `"m"` \| `"f"` \| `"n"` | Character gender                                       |
| `edition`        | string                  | Edition this character belongs to                      |
| `handSize`       | number                  | Number of ability cards in hand                        |
| `retireEvent`    | string                  | Event card number drawn on retirement                  |
| `color`          | string                  | Hex color for UI display                               |
| `stats`          | array                   | HP per level (levels 1–9)                              |
| `perks`          | array                   | Perk definitions modifying the AM deck                 |

**Perk types:** `"remove"`, `"replace"`, `"add"`, `"ignoreScenarioEffects"`, `"addItem"`.

**Attack modifier card types:** `"miss"`, `"minus2"`, `"minus1"`, `"zero"`, `"plus1"`, `"plus2"`, `"crit"`, plus condition cards (e.g., `"stun"`, `"poison"`), rolling modifiers, and special cards.

---

## Monster Data Format

Each monster file in `monster/{name}.json`:

```json
{
  "name": "bandit-guard",
  "edition": "gh",
  "deck": "guard",
  "count": 6,
  "baseStat": { "type": "normal" },
  "stats": [
    { "level": 0, "health": 5, "movement": 2, "attack": 2 },
    { "level": 1, "health": 6, "movement": 3, "attack": 2 },
    ...
    { "type": "elite", "level": 0, "health": 9, "movement": 2, "attack": 3 },
    { "type": "elite", "level": 1, "health": 9, "movement": 2, "attack": 3,
      "actions": [{ "type": "shield", "value": 1 }]
    },
    ...
  ]
}
```

| Field      | Type   | Description                                                    |
| ---------- | ------ | -------------------------------------------------------------- |
| `name`     | string | Internal identifier                                            |
| `edition`  | string | Edition identifier                                             |
| `deck`     | string | Ability card deck name (references `monster/deck/{name}.json`) |
| `count`    | number | Number of standees                                             |
| `baseStat` | object | Base stat type (`normal` or `elite`)                           |
| `stats`    | array  | Stats per level, for both normal and elite variants            |

Each stat entry for `elite` type includes `"type": "elite"`. An `actions` array on a stat entry lists special abilities (shield, retaliate, flying, etc.) active at that level.

**Common action types:** `"shield"`, `"retaliate"`, `"flying"`, `"move"`, `"attack"`, `"range"`, `"heal"`, `"muddle"`, `"poison"`, etc.

---

## Scenario Data Format

Each scenario file in `scenarios/{number}.json`:

```json
{
  "index": "1",
  "name": "Black Barrow",
  "edition": "gh",
  "flowChartGroup": "intro",
  "coordinates": { "x": 1434, "y": 975, "width": 182, "height": 140, "gridLocation": "G-10" },
  "eventType": "road",
  "initial": true,
  "unlocks": ["2"],
  "links": ["2"],
  "rewards": {
    "partyAchievements": ["first-steps"]
  },
  "monsters": ["bandit-archer", "bandit-guard", "living-bones"],
  "rooms": [
    {
      "roomNumber": 1,
      "ref": "L1a",
      "initial": true,
      "rooms": [2],
      "monster": [
        { "name": "bandit-guard", "type": "normal" },
        { "name": "bandit-guard", "player2": "elite" },
        { "name": "bandit-guard", "player3": "normal", "player4": "normal" }
      ]
    }
  ]
}
```

| Field            | Type     | Description                                               |
| ---------------- | -------- | --------------------------------------------------------- |
| `index`          | string   | Scenario number (used for display and unlock tracking)    |
| `name`           | string   | Scenario display name                                     |
| `edition`        | string   | Edition identifier                                        |
| `flowChartGroup` | string   | Group on the scenario flow chart                          |
| `coordinates`    | object   | World map position                                        |
| `initial`        | boolean  | Whether this scenario is available at campaign start      |
| `unlocks`        | string[] | Scenario indexes unlocked on completion                   |
| `links`          | string[] | Scenarios this links to (for the flow chart)              |
| `rewards`        | object   | XP, gold, party/global achievements awarded on completion |
| `monsters`       | string[] | Monster types that can appear in this scenario            |
| `rooms`          | array    | Room definitions with per-player-count monster placement  |

Room monster entries support per-player-count placement using keys `"player2"`, `"player3"`, `"player4"`. A `"type"` key without player keys means the monster appears regardless of player count.

---

## Label / Translation Files

Label files in `label/` map internal string keys to localised display strings:

```json
{
  "ability": {
    "A Moment's Peace": "A Moment's Peace",
    "Accelerated End": "Accelerated End"
  },
  "condition": {
    "stun": "Stun",
    "poison": "Poison"
  }
}
```

Each supported language has its own file (`en.json`, `de.json`, `fr.json`, etc.). The `spoiler/` subfolder mirrors the same structure for spoiler content that is only loaded when spoilers are enabled.

---

## How to Add a New Edition

1. **Create the edition folder:**

   ```bash
   mkdir data/myedition
   ```

2. **Create `base.json`** with at minimum `edition`, `conditions`, and `logoUrl`.

3. **Add character files** in `data/myedition/character/{name}.json` — one per playable class.

4. **Add monster files** in `data/myedition/monster/{name}.json` — one per monster type.

5. **Add monster ability deck files** in `data/myedition/monster/deck/{deckname}.json`.

6. **Add scenario files** in `data/myedition/scenarios/{number}.json`.

7. **Add English labels** in `data/myedition/label/en.json`.

8. **Register the edition** in the build script — check `scripts/build-data.js` for how editions are enumerated (the script typically auto-discovers folders in `data/`).

9. Run `npm run start` and open **Data Management** to enable your edition.

---

## How to Add Custom Content

For custom content without a dedicated edition folder, use the `cc/` (Custom Content) or `ccug/` (Custom Content Unity Guild) folders, or load a custom JSON file directly via the app:

- **Settings → Data Management → Load Custom Data** — paste a URL or upload a JSON file conforming to the compiled edition format.

The custom data JSON must follow the same merged structure that `build-data.js` produces (i.e., the single-file `src/assets/data/{edition}.json` format, not the source folder structure).

---

## Schema Validation

A JSON schema is available at `data/schema.json`. It describes the structure of the compiled edition files.

To validate a compiled file against the schema:

```bash
npx ajv-cli validate -s data/schema.json -d src/assets/data/gh.json
```

> The schema is complex and covers the full compiled output format. When editing source files, refer to existing files of the same type as your primary reference.
