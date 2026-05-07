# Quickstart: Ability Card Improvements

**Branch**: `001-ability-card-improvements` | **Date**: 2026-05-03

How to build, run, and verify each user story end-to-end.

---

## Prerequisites

```bash
git checkout 001-ability-card-improvements
npm install          # if dependencies changed
npm start            # runs prestart (build-data) then ng serve on :4200
```

Open `http://localhost:4200` in a browser. Add at least two characters with
ability decks (e.g., Gloomhaven → Brute + Spellweaver).

---

## US1 — Hand-Size Count Display

**Goal**: The hand-size badge on a character card shows "X/N" instead of "N".

1. Load a character with abilities (e.g., Brute, hand size 10).
2. On the main board, locate the hand-size badge (bottom-left of the character
   card). It should read `10/10`.
3. Open the ability cards panel for the Brute.
4. Toggle two cards to `discarded`. Close the dialog.
5. The badge should now read `8/10`.
6. Open the dialog again. Toggle one card to `lost`. Close.
7. Badge: `7/10`.
8. Toggle one card to `activated` (new toggle). Close.
9. Badge: `6/10`.
10. Recover a discarded card (short rest or manual toggle off). Badge increments.

**Edge case**: Mark all cards lost. Badge should read `0/10` (not hidden).

---

## US2 — Activated Card State

**Goal**: Cards can be marked "activated" with a highlighted toggle icon.

1. Open the Brute's ability cards panel.
2. Locate any "available" (un-discarded, un-lost) card.
3. In the card's `card-toggles top-right` area, the new activated-toggle icon
   (⚡ or similar) should appear alongside the existing spent/lost toggles.
4. Click the activated toggle. The icon should turn highlighted (active CSS class).
5. The card should now appear at the **top** of the sorted list (if
   `abilitySortByState` is enabled, which is the default).
6. Click the toggle again. The card returns to `available` state; icon un-highlights.
7. Mark the same card `discarded`. The activated toggle should not appear
   (disabled/hidden for discarded cards).
8. Close and reopen the app. The activated state must persist.

---

## US3 — Ability Card Sort by State

**Goal**: Cards in the ability panel sort by state; toggle lets player opt out.

1. Open the Brute's ability panel with a mix of states: 1 activated, 2 available,
   1 discarded, 1 lost, 1 not-in-deck.
2. Default view (sort toggle = on): order must be
   activated → available → discarded → lost → not-in-deck.
3. In the ability cards panel, find the "Sort by state" toggle button (in the
   panel header/toolbar). This button is also reflected in Settings →
   `abilitySortByState`.
4. Disable the toggle.
5. Re-open the ability panel. Cards should appear in their default sort order
   (initiative / cardId / etc.) without state grouping.
6. Re-enable the toggle. State grouping returns.
7. Close and reopen the app. Toggle preference must persist.

---

## US4 — Navigate to Next Character's Ability Panel

**Goal**: A navigation button inside the ability panel jumps to the next
character.

1. Ensure two characters with ability decks are on the board (e.g., Brute +
   Spellweaver), in that left-to-right figure order.
2. Open the Brute's ability panel.
3. A "next character" navigation button (arrow or label) should be visible in the
   panel header/menu.
4. Click it. The panel should transition to show the **Spellweaver's** ability
   cards.
5. Click again. Since Spellweaver is last, it wraps around to the **Brute**.
6. Remove one character from the board so only one remains. The navigation button
   must be hidden or disabled.

---

## Build verification

After implementing all stories:

```bash
npm run build   # must complete with no errors (prebuild runs build-data + lint)
```

Confirm the output in `dist/gh-tracker/` serves correctly. No console errors on
load. No TypeScript compile errors.
