<!--
SYNC IMPACT REPORT
==================
Version change: (new) → 1.0.0
Added sections:
  - Core Principles (I–V: Code Style & Naming, UX Consistency, Layered Architecture,
    Data Management & Integrity, State Correctness & Reversibility)
  - Development Workflow
  - Governance
Templates requiring updates:
  ✅ .specify/templates/plan-template.md  — Constitution Check gates updated
  ✅ .specify/templates/spec-template.md  — UX and data sections referenced
  ✅ .specify/templates/tasks-template.md — Angular/TypeScript task categories noted
Deferred items: none
-->

# GH Tracker Constitution

## Core Principles

### I. Code Style, Naming Conventions & Formatting

All TypeScript and Angular code MUST conform to the project ESLint + Prettier
configuration (`eslint.config.mjs`). Linting gates MUST pass before any PR is merged.

**Naming**:
- Classes, components, interfaces, enums: `PascalCase` (e.g., `CharacterManager`,
  `AttackModifierDeckComponent`, `GameState`).
- Variables, functions, module-level singletons: `camelCase` (e.g., `gameManager`,
  `settingsManager`, `nextGameState()`).
- File names MUST use `kebab-case` for folder names and component selectors
  (e.g., `entities-menu/`, `ability-cards-dialog.ts`). Manager and model files
  MUST use `PascalCase` matching their class name (e.g., `CharacterManager.ts`).
- SCSS classes MUST use `kebab-case`. BEM-style nesting is preferred within component
  `.scss` files.

**Imports**:
- All TypeScript imports MUST use absolute `src/` paths
  (e.g., `import … from 'src/app/game/…'`). Relative path imports (`./`, `../`)
  are forbidden and enforced via ESLint `no-restricted-imports`.

**Angular component style**:
- All components MUST be standalone (`standalone: true`).
- `ChangeDetectionStrategy.OnPush` is REQUIRED on every component.
- Use Angular 17+ built-in control flow (`@if`, `@for`, `@switch`) instead of
  structural directives (`*ngIf`, `*ngFor`).
- Component files MUST follow the triplet `{name}.ts` / `{name}.html` /
  `{name}.scss` (no inline templates or inline styles except trivial cases).

### II. User Experience Consistency

The UI MUST feel uniform across all supported game editions and all device types
(desktop browser, mobile browser, PWA, Electron).

- Interaction patterns (tap/click, drag, long-press via `PointerInput`) MUST be
  consistent: a gesture that works on one figure card MUST work identically on
  comparable figure cards across editions.
- Visual tokens (colours, spacing, iconography from `src/assets/`) MUST come from
  the shared SCSS variables defined in `src/styles.scss`; per-component magic
  numbers are forbidden.
- New dialogs and overlays MUST use Angular CDK `Dialog` / `Overlay` (consistent
  with existing `CharacterSheetDialog`, `EntitiesMenuDialogComponent`, etc.).
  Custom modal implementations are not permitted.
- Shared display logic (labels, tooltips, pipes) MUST live in `src/app/ui/helper/`
  (`GhsLabel`, `GhsTooltip`, `GhsMinZeroPipe`, etc.) and MUST be reused rather
  than duplicated.
- Any new feature visible to the user MUST be behind a `settingsManager.settings`
  feature flag when it affects existing behaviour, to preserve backward
  compatibility for current users.

### III. Layered Architecture (NON-NEGOTIABLE)

The three-layer boundary between **Data**, **Business Logic**, and **UI** MUST be
strictly respected:

| Layer | Location | Rule |
|---|---|---|
| Data | `src/app/game/model/` | Plain TypeScript interfaces/classes only. Zero Angular dependencies. |
| Business Logic | `src/app/game/businesslogic/` | Plain TypeScript singleton managers. NO Angular `@Injectable` except `GhsManager` and `StorageManager`. |
| UI | `src/app/ui/` | Angular standalone components. MUST NOT contain game-rule logic. |

- `GameManager` is the sole coordinator between managers. UI components MUST interact
  with game state only through `gameManager` (the module-level singleton export) and
  `settingsManager`. Direct cross-manager calls from UI are forbidden.
- `uiChangeSignal` (a `WritableSignal<number>` on `gameManager`) is the ONLY
  mechanism for triggering OnPush re-renders. Components MUST call
  `uiChangeSignal()` (read in template or via `effect`) rather than manually calling
  `ChangeDetectorRef.detectChanges()` except in documented exceptional cases.
- New game-rule capabilities MUST be added as a new named manager class in
  `src/app/game/businesslogic/` (e.g., `TrialsManager.ts`) and registered with
  `GameManager`. Feature logic must not accumulate inside existing managers beyond
  their stated responsibility.

### IV. Data Management & Integrity

The `data/{edition}/` JSON files are the single authoritative source for all game
content. The compiled output in `src/assets/data/` is machine-generated and MUST
NOT be edited by hand.

- Every new edition MUST include at minimum a valid `base.json` conforming to
  `data/schema.json`. Schema validation MUST pass (`npm run build-data --validate`
  or equivalent) before a data PR is merged.
- The `scripts/build-data.js` script is the ONLY permitted data transform step.
  Ad-hoc data reshaping in application code is forbidden; reshape at build time or
  via the model layer.
- Edition folder names MUST use the game's short code in lowercase (e.g., `gh`,
  `fh`, `jotl`, `cs`). Sub-folder and file names follow the conventions defined in
  `docs/data-format.md`.
- Label files (`label/en.json` is required; other locales optional) MUST provide
  human-readable strings for all new edition-specific keys. Hardcoded display
  strings in TypeScript or HTML templates are forbidden.
- The `Game.toModel()` / `Game.fromModel()` serialization contract MUST remain
  backward compatible. Adding fields is a MINOR change; removing or renaming fields
  is a MAJOR breaking change requiring a migration path.

### V. State Correctness & Reversibility

`Game` is the single source of truth for all runtime game state. Every mutation
MUST preserve undo/redo support.

- All state mutations MUST be wrapped with `stateManager.before()` /
  `stateManager.after()` (or issued as a named `Command` through `CommandManager`).
  Direct mutation of `gameManager.game` fields outside this bracket is forbidden.
- `StorageManager` is the ONLY code that reads from or writes to IndexedDB /
  LocalStorage. Components and managers MUST NOT access browser storage APIs
  directly.
- Multi-client sync via GHT Server uses last-write-wins with server-authoritative
  conflict resolution. Local optimistic mutations MUST be designed to be safely
  overwritten by an incoming server state without data loss.
- Game state MUST be fully reconstructable from the persisted `GameModel` JSON at
  any point. Features that require ephemeral client-only state MUST clearly
  document why and isolate it from the serialized model.

## Development Workflow

- **Branch**: all feature work MUST happen on a feature branch
  (`{number}-{short-description}`) created via `speckit.git.feature` before writing
  any code.
- **Pre-commit**: the `scripts/pre-commit.mjs` Husky hook MUST pass (ESLint, data
  sort checks). Bypassing it with `--no-verify` is not permitted.
- **Build data before serving**: `npm start` and `npm run build` automatically run
  `build-data.js` via lifecycle hooks (`prestart`, `prebuild`). Never manually copy
  compiled data files.
- **Testing**: unit tests live alongside source files (`*.spec.ts`). New manager
  methods and utility functions SHOULD include a corresponding spec. UI component
  specs are encouraged but not mandatory for cosmetic-only changes.
- **Documentation**: non-trivial architecture decisions MUST be reflected in
  `docs/architecture.md`. New data formats MUST be documented in
  `docs/data-format.md`.

## Governance

This constitution supersedes all other informal conventions and README snippets
regarding code style, architecture, and data management. In conflicts, the
constitution wins.

**Amendment procedure**:
1. Open a PR with the proposed change to `.specify/memory/constitution.md`.
2. Bump `CONSTITUTION_VERSION` following semantic versioning:
   - **MAJOR**: removing or redefining a principle.
   - **MINOR**: adding a principle or materially expanding guidance.
   - **PATCH**: wording clarifications, typo fixes.
3. Update `LAST_AMENDED_DATE` to the PR merge date.
4. Propagate changes to affected templates (`plan-template.md`,
   `spec-template.md`, `tasks-template.md`) in the same PR.
5. All open feature branches must be rebased and verified against the new version
   before merging.

All PRs MUST include a "Constitution Check" section confirming compliance with
Principles I–V. Complexity that appears to violate a principle MUST be explicitly
justified in the PR description.

**Version**: 1.0.0 | **Ratified**: 2026-05-03 | **Last Amended**: 2026-05-03
