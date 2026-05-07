# Tasks: Ability Card Improvements

**Input**: Design documents from `specs/001-ability-card-improvements/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | quickstart.md ✅

---

## Phase 1: Setup

**Purpose**: No new project infrastructure needed — existing Angular SPA, build pipeline, and IDB storage are already in place. This phase only establishes the `abilitySortByState` settings field (persistence backing for the sort toggle in the ability cards dialog) that US3 builds upon.

- [X] T001 [MODEL] Add `abilitySortByState: boolean = true` to `Settings` class in `src/app/game/model/Settings.ts`

**Checkpoint**: Settings field in place — phases 3–6 can proceed.

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: Add `activatedAbilities: number[]` to the `Character` model and its serialization contract. This is referenced by US1 (hand-count), US2 (toggle), US3 (sort rank), and US4 (nav helper) — no story can be fully implemented without it.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [MODEL] Add `activatedAbilities: number[] = []` field to `Character` class
- [X] T003 [MODEL] Add `activatedAbilities: number[]` field declaration to `GameCharacterModel` class
- [X] T004 [MODEL] Append `activatedAbilities: number[] = []` as last optional constructor parameter in `GameCharacterModel`
- [X] T005 [MODEL] Update `Character.toModel()` to pass `this.activatedAbilities || []` as last argument
- [X] T006 [MODEL] Update `Character.fromModel()` to restore `this.activatedAbilities = model.activatedAbilities || []`

**Checkpoint**: `activatedAbilities` persists across save/load — user story phases can now begin.

---

## Phase 3: User Story 1 — Hand-Size Count Display (Priority: P1) 🎯 MVP

**Goal**: The hand-size badge on every character card shows "X/N" where X = cards not in discarded, lost, or activated state.

**Independent Test**: Open any character's ability cards panel. The hand-size element must show "X/N". Discard a card → X decrements. Lose a card → X decrements. Activate a card (once US2 is done) → X decrements.

- [X] T007 [LOGIC] [US1] Add `inHandCount()` method to `CharacterComponent`
- [X] T008 [UI] [US1] Update the hand-size badge template

**Checkpoint**: Hand-size badge shows live "X/N" count. US1 is independently testable.

---

## Phase 4: User Story 2 — Activated Card State (Priority: P2)

**Goal**: Each ability card has an activate toggle. Toggling marks the card "activated" (persists across rounds, excluded from hand count, excluded from sort rank as top group).

**Independent Test**: Open a character's ability cards panel. Tap the activate toggle on an available card → icon highlights. Tap again → returns to available. Close and reopen the app → activated state persists.

- [X] T009 [LOGIC] [US2] Extend `toggleAbilityState()` to accept `'activatedAbilities'`
- [X] T010 [UI] [P] [US2] Add activated toggle button markup
- [X] T011 [STYLE] [P] [US2] Add `.activated` highlight style

**Checkpoint**: Activated state toggles, persists, and is visually distinct. US2 is independently testable.

---

## Phase 5: User Story 3 — Ability Card Sort by State (Priority: P3)

**Goal**: When `abilitySortByState` is enabled (default), cards sort in the order: activated → available → discarded → lost → not-in-deck. The player toggles this via a button in the ability cards panel header (preference persists via `settingsManager`).

**Independent Test**: With default settings, open the ability panel with cards in mixed states — order must match activated → available → discarded → lost → not-in-deck. Tap the sort toggle button in the panel header → default sort resumes. Close and reopen the app → preference persists.

- [X] T012 [LOGIC] [US3] Update `stateRank()` closure inside `ability-cards-dialog.ts`'s `update()` method
- [X] T013 [UI] [US3] Add sort-toggle button to ability cards dialog header

**Checkpoint**: Sort respects new rank order and respects the settings toggle. US3 is independently testable.

---

## Phase 6: User Story 4 — Navigate to Next Character's Ability Panel (Priority: P4)

**Goal**: A navigation button in the ability cards dialog closes the current panel and reopens it for the next character in figures-list order. Hidden when fewer than 2 characters have abilities enabled.

**Independent Test**: With ≥ 2 characters, open character A's panel → tap navigation → character B's panel opens. Tap again → wraps to A. Remove all but one character → navigation button is hidden.

- [X] T014 [LOGIC] [US4] Add `navigableCharacters()` helper to `AbilityCardsDialogComponent`
- [X] T015 [LOGIC] [US4] Add `openNextCharacter()` method to `AbilityCardsDialogComponent`
- [X] T016 [UI] [P] [US4] Add navigation button to the ability cards dialog header/toolbar

**Checkpoint**: Navigation cycles between characters. US4 is independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Verification, label strings, and build sign-off.

- [X] T017 [P] [LABEL] Add new UI label keys to `src/assets/locales/en.json`
- [X] T018 Run `npm run build` from repo root and confirm zero TypeScript and lint errors
- [X] T019 Follow `specs/001-ability-card-improvements/quickstart.md` to verify US1–US4 end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)        → no dependencies
Phase 2 (Foundation)   → depends on Phase 1
Phase 3–6 (US1–US4)   → all depend on Phase 2; can proceed independently after that
Phase 7 (Polish)       → depends on all story phases
```

### User Story Dependencies

- **US1 (P1)**: Depends on Foundation (Phase 2) only — start immediately after T006
- **US2 (P2)**: Depends on Foundation (Phase 2) only — can run in parallel with US1
- **US3 (P3)**: Depends on Foundation + US2 (needs `activatedAbilities` in rank logic) — after T009
- **US4 (P4)**: Depends on Foundation only — can run in parallel with US1 and US2

### Parallel Execution Opportunities

```
After Phase 2 completes:
  ├── Phase 3 (US1): T007, T008
  ├── Phase 4 (US2): T009 → [T010, T011 in parallel]
  └── Phase 6 (US4): T014 → T015 → T016

After Phase 4 (US2) completes:
  └── Phase 5 (US3): T012, T013

After all story phases:
  └── Phase 7: T017 [P] → T018 → T019
```

## Implementation Strategy

**MVP (Phase 1 + 2 + 3)**: Settings field + model change + hand-size count display.
Deliverable: live "X/N" count in the character card, zero new UI interactions.

**Increment 2 (+ Phase 4)**: Activated card toggle with persistence and visual feedback.

**Increment 3 (+ Phase 5)**: State-based sort gated behind settings toggle.

**Increment 4 (+ Phase 6)**: Character-to-character navigation in the ability panel.

**Full delivery (+ Phase 7)**: Polish, labels, build validation.
