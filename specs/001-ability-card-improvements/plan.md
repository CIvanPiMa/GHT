# Implementation Plan: Ability Card Improvements

**Branch**: `001-ability-card-improvements` | **Date**: 2026-05-03 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-ability-card-improvements/spec.md`

## Summary

Five ability-card UX improvements extracted from the README TODO list:

1. **Hand-size count** (P1) — Show "X/N" in the character card's hand-size badge,
   where X = cards currently in hand (not discarded, lost, or activated).
2. **Activated card state** (P2) — Add a new `activatedAbilities: number[]` field
   to `Character` / `GameCharacterModel` with a per-card toggle icon; persists
   across rounds; excluded from "in hand" count.
3. **State-based sort toggle** (P3) — Sort ability cards by state
   (activated → available → discarded → lost → not in deck); behind a
   `abilitySortByState` settings flag defaulting to `true`.
4. **Navigation between characters** (P4) — Button in the ability cards dialog to
   cycle to the next character's ability panel (figures-list order).

## Technical Context

**Language/Version**: TypeScript 5 / Angular 17 (standalone components, OnPush)
**Primary Dependencies**: Angular CDK Dialog/Overlay, Angular Signals, RxJS
**Storage**: IndexedDB (`ght-db`); LocalStorage fallback
**Testing**: Jest / Angular TestBed (`*.spec.ts` alongside source files)
**Target Platform**: Modern browser (PWA), Electron desktop, Docker+nginx
**Project Type**: Angular SPA / PWA companion app (offline-capable)
**Performance Goals**: UI state changes reflect in < 200 ms; ability card toggle responds in < 200 ms with immediate visual feedback
**Constraints**: Offline-first; backward-compatible serialization (`GameCharacterModel`); no new Angular services except for `GhsManager`/`StorageManager` pattern
**Scale/Scope**: 4 user stories, ~7 files modified; no edition data changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Verify compliance with all five GH Tracker principles before proceeding:

- [x] **I. Code Style & Naming** — All modified files follow `PascalCase` class
  naming, absolute `src/` imports, standalone + OnPush, Angular 17+ `@if`/`@for`.
- [x] **II. UX Consistency** — No new CDK dialogs beyond the existing pattern;
  activated icon follows existing `card-toggle-btn` CSS class + SVG icon pattern;
  `abilitySortByState` lives in `settingsManager.settings` (persisted); the
  toggle button lives in the ability cards dialog header.
- [x] **III. Layered Architecture** — `Character` model change is in `model/`;
  UI components contain no game-rule logic; UI accesses state only via
  `gameManager`/`settingsManager` singletons; `uiChangeSignal` remains the sole
  re-render trigger.
- [x] **IV. Data Management** — No `data/{edition}/` JSON changes; no
  `data/schema.json` update needed; `GameCharacterModel.activatedAbilities`
  serialized with `|| []` backward-compat default; no new display strings require
  `label/en.json` entries for game *data* (only UI label keys).
- [x] **V. State Correctness** — `activatedAbilities` mutations wrapped in
  `stateManager.before()`/`after()` via extended `toggleAbilityState()`;
  `activatedAbilities` round-trips through `toModel()`/`fromModel()`.

## Project Structure

### Documentation (this feature)

```text
specs/001-ability-card-improvements/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 — tech decisions
├── data-model.md        # Phase 1 — model + storage changes
├── quickstart.md        # Phase 1 — how to run & verify
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
src/app/game/model/
├── Character.ts                    # MODIFY: add activatedAbilities to Character + GameCharacterModel
└── Settings.ts                     # MODIFY: add abilitySortByState

src/app/ui/figures/character/
├── character.ts                    # MODIFY: inHandCount(), navigableCharacters()
├── character.html                  # MODIFY: hand-size badge "X/N"
└── sheet/abilities/
    ├── ability-cards-dialog.ts     # MODIFY: activatedAbilities, sort toggle, navigation
    ├── ability-cards-dialog.html   # MODIFY: activated toggle btn, nav button
    └── ability-cards-dialog.scss   # MODIFY: .activated highlight style
```

**Structure Decision**: Single Angular SPA project. All changes are within
`src/app/`. No new files or folders.

## Complexity Tracking

> No constitution violations. Table omitted.
