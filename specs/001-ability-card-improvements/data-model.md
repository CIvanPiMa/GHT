# Data Model: Ability Card Improvements

**Branch**: `001-ability-card-improvements` | **Date**: 2026-05-03

---

## 1. Updated: `Character` class

**File**: `src/app/game/model/Character.ts`

Add one new field alongside the existing ability-state arrays:

```ts
// existing
discardedAbilities: number[] = [];
lostAbilities: number[] = [];
inactiveAbilities: number[] = [];
selectedAbilities: number[] = [];

// NEW
activatedAbilities: number[] = [];
```

No constructor change required — field initializer handles default.

---

## 2. Updated: `GameCharacterModel` class

**File**: `src/app/game/model/Character.ts` (bottom of file)

### 2a. New field declaration

```ts
// existing last fields:
discardedAbilities: number[];
lostAbilities: number[];
inactiveAbilities: number[];
selectedAbilities: number[];

// NEW
activatedAbilities: number[];
```

### 2b. Constructor parameter (append as last optional param)

```ts
constructor(
  // ... all existing params ...
  selectedAbilities: number[] = [],
  activatedAbilities: number[] = []   // NEW — defaults to [] for backward compat
) {
  // ...
  this.selectedAbilities = selectedAbilities;
  this.activatedAbilities = activatedAbilities;  // NEW
}
```

### 2c. `toModel()` update in `Character`

```ts
// existing last arguments to new GameCharacterModel(...)
  this.discardedAbilities || [],
  this.lostAbilities || [],
  this.inactiveAbilities || [],
  this.selectedAbilities || [],
  this.activatedAbilities || []   // NEW — append as last arg
```

### 2d. `fromModel()` update in `Character`

```ts
// existing last lines:
this.discardedAbilities = model.discardedAbilities || [];
this.lostAbilities = model.lostAbilities || [];
this.inactiveAbilities = model.inactiveAbilities || [];
this.selectedAbilities = model.selectedAbilities || [];

// NEW — || [] ensures backward compat with old saves
this.activatedAbilities = model.activatedAbilities || [];
```

**Backward compatibility**: Old persisted `GameModel` JSON will not contain
`activatedAbilities`. `model.activatedAbilities || []` evaluates to `[]` in that
case — no data loss, no runtime error.

---

## 3. Updated: `Settings` class

**File**: `src/app/game/model/Settings.ts`

Add two new fields with defaults (follow alphabetical order within the file):

```ts
// NEW — add near other "ability*" settings (line ~5):
abilitySortByState: boolean = true;

```

No migration required. Old persisted settings without these keys will use the
class-level defaults on load (the `[index: string]: any` index signature +
`Object.assign` in `settingsManager.applySettings()` handles this automatically).

---

## 4. Summary of file changes



| File | Change type | Notes |
|---|---|---|
| `src/app/game/model/Character.ts` | Modified | Add `activatedAbilities` to `Character` + `GameCharacterModel` |
| `src/app/game/model/Settings.ts` | Modified | Add `abilitySortByState` |
| `src/app/ui/figures/character/character.ts` | Modified | `inHandCount()` method, `openAbilityCards()` with nav |
| `src/app/ui/figures/character/character.html` | Modified | Hand-size display `X/N` |
| `src/app/ui/figures/character/sheet/abilities/ability-cards-dialog.ts` | Modified | `activatedAbilities`, state sort toggle, navigation |
| `src/app/ui/figures/character/sheet/abilities/ability-cards-dialog.html` | Modified | Activated toggle button, navigation button |
| `src/app/ui/figures/character/sheet/abilities/ability-cards-dialog.scss` | Modified | Activated highlight style |
