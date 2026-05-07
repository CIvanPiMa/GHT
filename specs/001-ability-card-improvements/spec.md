# Feature Specification: Ability Card Improvements

**Feature Branch**: `001-ability-card-improvements`
**Created**: 2026-05-03
**Status**: Draft
**Input**: User description: "given the todos in the readme"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hand-Size Count Display (Priority: P1)

A player managing a character wants to see at a glance how many ability cards are
currently in their hand (available to play) compared to their maximum hand size.
Today the panel shows only "Hand Size: 8" — they have no immediate feedback about
how many cards remain usable after discards, losses, and activations.

**Why this priority**: This is the simplest change with the highest immediate value.
It surfaces critical information already tracked in the game state without any new
interaction or state changes. Players frequently need this count to decide whether
to rest.

**Independent Test**: Open any character's ability cards panel. The hand-size
element must show "X/8" (or the character's actual hand size), where X reflects
the count of cards currently in the "available" state. Discarding a card must
immediately decrement X. Losing a card must also decrement X. Activating a card
must also decrement X.

**Acceptance Scenarios**:

1. **Given** a character with 8 hand-size and 0 discarded/lost/activated cards,
   **When** the ability cards panel is opened, **Then** the hand-size element
   displays "8/8".
2. **Given** a character has 2 discarded and 1 lost card,
   **When** the ability cards panel is viewed, **Then** it displays "5/8".
3. **Given** a character has 1 activated card (new state),
   **When** viewing the hand-size element, **Then** the activated card is NOT
   counted as "in hand" and the count reflects this.
4. **Given** the hand-size count is displayed, **When** any card state changes
   (discard, lose, activate, recover), **Then** the count updates immediately
   without a page reload.

---

### User Story 2 - Activated Card State (Priority: P2)

A player wants to mark an ability card as "activated" — a distinct state from
available, discarded, or lost — to track cards that have been triggered but not
yet spent. Each card in the ability cards panel must have a toggle icon that
visually marks it as activated, and activated cards must be visually distinct
(highlighted icon) from non-activated cards.

**Why this priority**: This models a real in-game mechanic missing from the
tracker. Without it, players must remember activated cards mentally. It also
unblocks the sort-order feature (US3) and affects the hand-size count (US1).

**Independent Test**: Open a character's ability cards panel. Tap/click the
activate toggle on any card. The icon must become highlighted. Tap again to
deactivate. The card's state must be reflected in the hand-size count (US1):
an activated card reduces the "in hand" count.

**Acceptance Scenarios**:

1. **Given** a card is in the "available" state, **When** the player taps the
   activate toggle, **Then** the card transitions to "activated" and the icon
   appears highlighted.
2. **Given** a card is "activated", **When** the player taps the toggle again,
   **Then** the card returns to "available" and the icon returns to its
   un-highlighted state.
3. **Given** a card is "discarded" or "lost", **When** viewing that card,
   **Then** the activate toggle is not available (activated state only applies
   to cards currently in the deck / available).
4. **Given** a card is "activated", **When** the round ends or the game state
   resets, **Then** the card remains in the "activated" state — the player must
   manually tap the toggle to return it to "available". Activation persists
   across rounds until explicitly cleared by the player.

---

### User Story 3 - Ability Card Sort by State (Priority: P3)

A player wants the selected/displayed cards in the ability cards panel to be
automatically sorted by their state so the most actionable cards appear first.
The sort order is: **activated → available → discarded → lost → not in deck**.
A toggle button in the ability cards panel header (defaulting to on) lets players
opt out of this extra sorting if they prefer manual order. The toggle preference
is persisted via `abilitySortByState` in the settings store.

**Why this priority**: This improves scannability of the ability cards panel,
especially late in a round when cards are in mixed states. The toggle preserves
backward compatibility for players who prefer the existing order.

**Independent Test**: With the sort toggle enabled (default), open the ability
cards panel for a character that has cards in multiple states. Verify cards
appear in activated → available → discarded → lost → not-in-deck order. Toggle
the setting off; verify cards revert to the previous order.

**Acceptance Scenarios**:

1. **Given** the sort toggle is enabled and a character has cards in various
   states, **When** the ability cards panel is displayed, **Then** cards are
   ordered: activated first, then available, then discarded, then lost, then
   cards not in the current deck.
2. **Given** a card changes state (e.g., available → discarded), **When** the
   state change is confirmed, **Then** the sort order updates immediately to
   reflect the new state.
3. **Given** the sort toggle button in the ability cards panel is disabled by the
   player, **When**
   the ability cards panel is displayed, **Then** cards appear in their default
   (non-state-sorted) order.
4. **Given** the sort toggle setting is changed, **When** the player closes and
   reopens the session, **Then** the toggle preference is persisted.

---

### User Story 4 - Navigate to Next Character's Ability Panel (Priority: P4)

A player managing multiple characters wants a quick navigation button inside the
ability cards panel that jumps directly to the next character's ability cards
panel, without closing the dialog and searching for the next character card.

**Why this priority**: Reduces friction during the ability-selection phase when
multiple characters are involved. Each navigation action currently requires
several taps.

**Independent Test**: With two or more characters in play, open character A's
ability cards panel. Tap the navigation button. Character B's ability cards panel
must open (or character A's panel must update to show character B's cards). The
sequence must cycle through all characters with ability cards enabled.

**Acceptance Scenarios**:

1. **Given** multiple characters are in play with abilities enabled, **When** the
   navigation button is tapped in one character's ability cards panel, **Then**
   the view transitions to the next character's ability cards panel.
2. **Given** the last character's ability cards panel is open, **When** the
   navigation button is tapped, **Then** the view wraps around to the first
   character's ability cards panel.
3. **Given** only one character has abilities enabled, **When** that character's
   ability cards panel is open, **Then** the navigation button is hidden or
   disabled (no meaningful next target).
4. **Given** multiple characters are in play, the navigation order MUST follow
   the order characters appear in the figures list on the main screen
   (left-to-right / top-to-bottom). This order is stable and matches the visual
   layout the player already uses as a reference.

---

### Edge Cases

- What happens when a character has 0 cards in hand (all lost)? Hand-size element
  should show "0/N" rather than hiding.
- If a card is both activated and the user tries to discard it, which state wins?
  (Assumption: discard/lose takes precedence over activated.)
- Navigation button with 0 or 1 character — button must degrade gracefully.
- If the sort toggle is on and all cards are in the same state, sort order is
  unchanged (no visible impact).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The ability cards panel MUST display the current number of "in-hand"
  cards alongside the maximum hand size in the format "X/N" (e.g., "5/8").
- **FR-002**: "In-hand" count MUST be defined as cards that are NOT in the
  discarded, lost, activated, or inactive (not-in-deck) state.
- **FR-003**: The in-hand count MUST update in real time whenever any card's state
  changes.
- **FR-004**: Each ability card MUST display an activate toggle icon.
- **FR-005**: The activate toggle MUST only be available for cards in the "available"
  state (not discarded, lost, or not-in-deck).
- **FR-006**: The activated state MUST be visually distinct from all other card
  states via a highlighted icon.
- **FR-007**: The ability cards panel MUST support sorting cards by state in the
  order: activated → available → discarded → lost → not in deck.
- **FR-008**: The state-based sort MUST be controllable via a toggle button in the
  ability cards panel header that defaults to enabled.
- **FR-009**: The sort toggle preference MUST persist across sessions.
- **FR-010**: The ability cards panel MUST include a navigation control to advance
  to the next character's ability cards panel.
- **FR-011**: Navigation MUST cycle through all characters that have abilities
  enabled, in a consistent order.
- **FR-012**: The navigation control MUST be hidden or disabled when only one
  character has abilities enabled.
### Key Entities

- **AbilityCardState**: The state of a single ability card — one of: available,
  activated, discarded, lost, not-in-deck. "Activated" is a new state to be added.
- **HandSizeCount**: Derived value — count of cards NOT in the discarded, lost,
  activated, or inactive state for a character, displayed alongside the static
  maximum hand size.
- **AbilitySortPreference**: A boolean setting per user (or per character) indicating
  whether state-based sort is enabled.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can see their current in-hand count without any additional
  taps — it is always visible in the hand-size element when the ability cards panel
  is open.
- **SC-002**: The activate toggle responds to a single tap/click in under 200ms
  with immediate visual feedback (no loading state required).
- **SC-003**: Players can navigate from one character's ability panel to the next
  in a single tap, reducing multi-character management to N taps for N characters
  (versus N×3+ taps today).
- **SC-004**: 100% of state changes (discard, lose, activate, recover) are
  reflected in both the hand-size count and sort order without a page reload.
- **SC-005**: Sort toggle preference survives app restart — no preference loss.

## Assumptions

- "Available" means a card is in the current deck and not discarded, lost, or
  activated. This aligns with the existing `character.discardedAbilities`,
  `character.lostAbilities`, and `character.inactiveAbilities` tracking, with
  "activated" as a new parallel collection.
- The activate toggle applies only to ability cards visible in the ability cards
  dialog — not to action cards or item cards.
- The navigation button cycles through characters in the order they appear in
  `gameManager.game.figures` (the existing figures list order), not initiative order,
  unless clarified otherwise.
- All new strings exposed to users (toggle label) require entries in `label/en.json`.

## GH Tracker Constitution Constraints *(mandatory)*

Reference [`.specify/memory/constitution.md`](.specify/memory/constitution.md).

- **I. Code Style** — All modified components standalone + OnPush; `src/` absolute
  imports; manager files `PascalCase`. The activate toggle icon and sort setting
  must follow the existing SCSS token system.
- **II. UX Consistency** — The activate toggle icon must use the same icon system
  as existing condition/state icons. New display strings go in `label/en.json`.
  The sort toggle is a button in the ability cards panel; its state is persisted
  via `settingsManager` (`abilitySortByState`).
- **III. Architecture** — Touches UI layer (ability-cards-dialog component) and
  business logic layer (new `activated` state tracked in Character model, sort
  logic in ability-cards-dialog). No game-rule logic inside components.
- **IV. Data** — No game data JSON files are modified. The "activated" state is
  runtime state, not edition data. `data/schema.json` does not need updating.
  However, `character.activatedAbilities: number[]` must be added to the
  serialized `CharacterModel` with backward-compatible defaults (empty array).
- **V. State** — All mutations to `activatedAbilities` and sort preference MUST be
  wrapped in `stateManager.before()`/`after()`. The activated card state must
  round-trip through `Game.toModel()`/`Game.fromModel()` to survive undo/redo and
  session persistence.
