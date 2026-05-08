# Usage Guide

This guide walks through using GH Tracker to manage your Gloomhaven-based campaign.

---

## First Launch and Initial Setup

1. Open the app at [http://localhost:4200](http://localhost:4200) (dev) or your hosted URL.
2. On first launch, you will see an empty board with a settings menu icon.
3. Open **Settings** (gear icon) to review options. Most features can be toggled on/off here.
4. Open **Data Management** (wrench icon or from the menu) to enable additional content packs (community editions, solo scenarios, Envelope X, etc.).

No account or sign-in is required. All state is stored locally in your browser's `localStorage`.

---

## Selecting an Edition and Starting a Campaign

1. From the main menu, go to **Campaign** → **New Campaign**.
2. Select your edition (Gloomhaven, Frosthaven, Jaws of the Lion, etc.).
3. Add characters using the **+ Add Character** button. Select the class and enter the player name.
4. The party sheet is now active. You can track party gold, achievements, and campaign progress from here.

To manage multiple campaigns, use **Campaign** → **Manage Campaigns**.

---

## Running a Scenario

### Setup

1. From the campaign view, select a scenario from the scenario list or the world map.
2. The app automatically populates monster groups and standees for the first room.
3. Set the **scenario level** (or let the app calculate it based on character levels).

### During a Scenario

**Each round:**

1. Each player selects their ability cards (click the character's card icon to see the available cards).
2. Given the selected cards, choose the initiative value for each character.
3. Click **Draw** (or press `n`) to draw monster ability cards and sort all figures by initiative.
4. Take turns in order. Click a figure to open its action menu.

**Initiative:** All figures are sorted automatically. Ties between monsters and characters can be resolved manually.

**Health tracking:** Click a figure → use `+`/`-` arrows (or keyboard `→`/`←`) to adjust HP. Characters auto-exhaust at 0 HP; monsters auto-die.

**Conditions:** Click a figure → toggle condition buttons (stun, muddle, poison, etc.). Conditions auto-expire at the start of the affected figure's turn where applicable.

**Monster standees:** The app automatically places standees when a new room or section opens. You can manually add/remove standees from the monster group menu.

**Elements:** Click element icons to advance them through their states (strong → waning → inert). The app auto-advances all elements at the end of each round.

### Ending a Scenario

Click **Finish Scenario** (or press `Shift+F`). The app applies all rewards:

- XP and gold to characters
- Scenario unlocks to the campaign
- Party achievements

---

## Key Features Walkthrough

### Attack Modifier Decks

- Each character has their own modifier deck, built from their starting deck plus perks.
- Click a character → **AM Deck** to view, draw (`m`), or draw with advantage (`a`) / disadvantage (`d`).
- The monster modifier deck is shared. Blessings and curses are added automatically from scenario rules or manually.
- You can reveal, remove, or rearrange cards in the deck editor.

### Loot Deck

- Enable via Settings → **Loot Deck**.
- Press `l` with a character active to draw a loot card. The app applies enhancements automatically.
- For Frosthaven, the town guard deck is also supported.

### Scenario Rules

- Special rules (e.g., "shuffle X cards into the AM deck", "apply condition to monster", named monsters with bonus abilities) are displayed automatically when the scenario or section loads.
- The app applies many rules automatically; others show a confirmation prompt.

### Character Progression

- Open a character sheet (click character icon or press `s` on a focused character) to view and edit:
  - Level, XP, gold/resources
  - Items (buy, equip, manage item states during scenarios)
  - Perks and their effect on the AM deck
  - Battle goals, masteries
- Retiring a character and creating a new one is handled through the character sheet.

### Frosthaven Outpost

- Between scenarios, manage the outpost: calendar, resource tracking, building upgrades, town guard deck, and outpost attacks.
- Building 81 (Trials) and Building 90 (Challenges) mechanics are automated where possible.

### Party Sheet and Campaign

- Access via `p` (party sheet) or `g` (world map).
- Track party achievements, reputation, donations, scenarios completed.
- The scenario flow chart is accessible via `c`.

---

## Multi-Client Sync with GHT Server

GH Tracker supports synchronizing state across multiple devices/clients via [GHT Server](https://github.com/CIvanPiMa/GHT-server) — a companion WebSocket server that persists game state in SQLite and broadcasts changes to all connected clients in real time.

### Setup

1. Go to the hamburger menu → **Server**.
2. Enter the **Host** (IP or hostname of the server) and **Port** (default `8080`).
3. Enter a UUID as the **Room Code** (e.g. from [uuidgenerator.net](https://www.uuidgenerator.net)).
4. Click **Connect**. Share the same room code with other players — all connected clients will sync state in real time.

### Permissions

The server supports per-client permission management. The host (the client that connected with root access) can create additional room codes with restricted `Permissions` — e.g. a client that may only control specific characters. Manage these in the **Server** panel under **Permissions**.

### Self-hosting GHT Server

See [GHT Server](https://github.com/CIvanPiMa/GHT-server) for the source and full setup instructions. The quickest way to run the full stack on a home server is:

```bash
# from the GHT repo root
docker compose up --build
```

This starts the Angular app on port 80 and the sync server on port 8080. See [docs/installation.md](./installation.md#self-hosting-with-sync-server) for details.

---

## Settings Overview

Open Settings (gear icon) to configure:

| Setting         | Description                                             |
| --------------- | ------------------------------------------------------- |
| Scenario Level  | Manual override or auto-calculate from character levels |
| Character Items | Enable item state tracking during scenarios             |
| Battle Goals    | Enable battle goal deck                                 |
| Event Decks     | Enable event card management                            |
| Loot Deck       | Enable loot deck                                        |
| Errata Hints    | Show errata notifications                               |
| Display Options | HP display mode, trait display, player number labels    |
| Server          | GHT Server connection settings                          |
| Data Management | Enable/disable edition content packs                    |

Most features that impact physical component replacement can be toggled individually.

---

## Keyboard Shortcuts

- <kbd>CTRL</kbd> + <kbd>z</kbd>: Undo
- <kbd>CTRL</kbd> + <kbd>y</kbd> | <kbd>CTRL</kbd> + <kbd>SHIFT</kbd> + <kbd>Z</kbd>: Redo
- <kbd>ESC</kbd> | <kdb>←</kdb>: open main menu (In most browsers, the ESC key exits full-screen mode; use the BACKSPACE key instead)
- <kbd>↑</kbd> | <kbd>+</kbd>: Zoom-In
- <kbd>↓</kbd> | <kbd>-</kbd>: Zoom-Out
- <kbd>CTRL</kbd> + <kbd>r</kbd>: reset zoom
- <kbd>f</kbd>: Toggle Fullscreen
- <kbd>↹</kbd>: toggle active figure when drawn / toggle initiative input when focused input
- <kbd>n</kbd>: next round / draw
- <kbd>m</kbd>: draw AM card (deck depending on active figure, monster deck when not active, disabled when **Draw**)
- <kbd>a</kbd> like <kbd>m</kbd>, but draw with Advantage if enabled
- <kbd>d</kbd> like <kbd>m<</kbd>, but draw with Disadvantage if enabled
- <kbd>l</kbd>: draw from LootDeck / Inc. Moneytokens for active Character
- <kbd>SHIFT</kbd> + <kbd>l</kbd>: Dec. Moneytokens for active Character
- <kbd>1-6</kbd>: toggle through element state
- <kbd>h</kbd>: toggle *Hide absent figures*
- <kbd>s</kbd>: select figure/standee for opening menu with number key (<kbd>0-9</kbd>)
- <kbd>w</kbd>: select figure/standee for opening menu in fixed order with number key (<kbd>0-9</kbd>)
- <kbd>x</kbd>: difficulty/level menu
- <kbd>ALT</kbd> + <kbd>x</kbd>: Inc. XP for active Character
- <kbd>SHIFT</kbd> + <kbd>X</kbd>: Dec. XP for active Character
- <kbd>e</kbd>: scenario effects menu
- <kbd>SHIFT</kbd> + <kbd>f</kbd>: (finish) scenario menu
- <kbd>p</kbd>: open party sheet
- <kbd>g</kbd>: open global map
- <kbd>c</kbd>: open scenario chart
- <kbd>SHIFT</kbd> + <kbd>H</kbd>: toggle *Display hand size and level*
- <kbd>t</kbd>: toggle *Display traits*
- <kbd>#</kbd>: toggle *Display player number*
- <kbd>i</kbd>: toggle *Damage instead of HP*
- <kbd>?</kbd>: show keyboard shortcuts

On any open figure/standee menu, those shortcuts are disabled, currently shortcuts available in figure/standee:

- <kbd>→</kbd>: inc. current HP
- <kbd>←</kbd>: dec. current HP
- <kbd>0</kbd>-<kbd>9</kbd>: toggle condition/condition modifier
- <kbd>x</kbd>: inc. XP
- <kbd>SHIFT</kbd> + <kbd>X</kbd>: dec. XP
- <kbd>l</kbd>: inc. Loot
- <kbd>SHIFT</kbd> + <kbd>L</kbd>: dec. Loot
- <kbd>b</kbd>: inc. Bless
- <kbd>SHIFT</kbd> + <kbd>B</kbd>: dec. Bless
- <kbd>c</kbd>: inc. Curse
- <kbd>SHIFT</kbd> + <kbd>C</kbd>: dec. Curse
- <kbd>k</kbd> | <kbd>d</kbd>: kill/exhaust
- <kbd>↑</kbd>: inc. max. HP
- <kbd>↓</kbd>: dec. max. HP
- <kbd>s</kbd>: open character sheet
- <kbd>a</kbd>: toggle character absent

On open menu:

- <kbd>↵</kbd> | <kbd>SPACE</kbd>: confirm action / open submenu
- <kbd>ESC</kbd> | <kdb>⌫</kdb>: decline action / close menu (In most browsers, the ESC key exits full-screen mode; use the BACKSPACE key instead)
- <kbd>↹</kbd>: select action

---

## Mobile and PWA Tips

- Install as a PWA for the best mobile experience (see [docs/installation.md](./installation.md#pwa-install-as-app)).
- The layout adapts to screen size. Rotate to landscape for more space.
- Use pinch-to-zoom or the `↑`/`↓` keyboard shortcuts to adjust zoom level.
- State is saved locally on the device. Use GHT Server if you want to share a session across devices.
- The app works fully offline once installed as a PWA.
