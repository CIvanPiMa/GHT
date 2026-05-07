# Research: Ability Card Improvements

**Branch**: `001-ability-card-improvements` | **Date**: 2026-05-03
**Phase**: 0 — All NEEDS CLARIFICATION items resolved

---

## 1. How to add `activatedAbilities` to the existing model

**Decision**: Add `activatedAbilities: number[] = []` as a new property on
`Character` (mirrors `discardedAbilities`, `lostAbilities`, `inactiveAbilities`).
Extend `GameCharacterModel` with a matching `activatedAbilities: number[]` field.
Update `toModel()` to pass `this.activatedAbilities || []` and `fromModel()` to set
`this.activatedAbilities = model.activatedAbilities || []`.

**Rationale**: All existing ability-state arrays follow the exact same pattern.
`|| []` defaults in `fromModel()` guarantee backward compatibility with saves that
pre-date this feature (field simply absent in the JSON → treated as empty array).

**Alternatives considered**:
- Storing activated as a separate `Set<number>` — rejected because all other
  state arrays are `number[]`; uniformity reduces cognitive overhead.
- Adding an "activatedAbilities" field to the `Ability` data model — rejected
  because activation is runtime state per character, not edition data.

---

## 2. `stateRank` — integration of `activated` into existing sort

**Decision**: The existing `stateRank()` closure inside `update()` in
`AbilityCardsDialogComponent` already computes a numeric sort rank. Extend it to
add rank 0 for activated (displacing selected from 0 to 1), or rank 0 for both
activated and selected (since selected cards appear in a dedicated "Selected for
Round" section above the main list anyway).

Final rank mapping (when `abilitySortByState` toggle is on):

| State | Rank |
|---|---|
| activated | 0 |
| selected (for round) | 1 |
| available (in deck, no other state) | 2 |
| discarded | 3 |
| lost | 4 |
| not in deck (inactive) | 5 |

When `abilitySortByState` is **off**, `stateRank` returns the same constant (0) for
all cards — the sort falls through to the secondary criterion (initiative/cardId/
name) only, preserving user-defined order.

**Rationale**: The `stateRank` function is already wired into every sort branch.
Adding a guarded call is the minimal change.

**Alternatives considered**:
- Keeping selected at rank 0 — rejected because the spec requires activated to
  surface first.
- New sort type `'state'` added to `sorts[]` — rejected because the toggle is a
  settings flag, not a per-session sort mode.

---

## 3. `toggleAbilityState` — adding `activatedAbilities`

**Decision**: Extend the existing `toggleAbilityState()` signature from:
```ts
field: 'discardedAbilities' | 'lostAbilities' | 'inactiveAbilities'
```
to:
```ts
field: 'discardedAbilities' | 'lostAbilities' | 'inactiveAbilities' | 'activatedAbilities'
```
The existing mutual-exclusivity loop already clears a card from all other fields
when a new field is set — `activatedAbilities` simply joins the `allFields` array.

**Constraint**: The activate toggle is only rendered when a card is **not** in the
`discardedAbilities` or `lostAbilities` list (activated state only applies to
"available" or "in deck" cards). This is enforced in the template via `@if`.

**Rationale**: Zero new logic; purely extends existing pattern.

---

## 4. Hand-size count in `character.ts` component

**Decision**: Compute `inHandCount` as a getter or method in
`CharacterComponent` (`src/app/ui/figures/character/character.ts`):

```ts
inHandCount(): number {
  const abilities = gameManager.deckData(this.character, true).abilities;
  return abilities.filter((_, i) =>
    this.character.progress.deck.includes(i) ||
    abilities[i]?.level === 1 ||
    abilities[i]?.level === 'X'
  ).filter((_, i) => {
    const idx = abilities.indexOf(_);
    return !(this.character.discardedAbilities || []).includes(idx)
        && !(this.character.lostAbilities || []).includes(idx)
        && !(this.character.activatedAbilities || []).includes(idx);
  }).length;
}
```

Then in `character.html` the hand-size element changes from:
```html
{{ character.handSize }}
```
to:
```html
{{ inHandCount() }}/{{ character.handSize }}
```

The `character.html` is already inside the `uiChangeSignal` reactive scope via the
`GhsManager` effect, so live updates require no additional wiring.

**Rationale**: The hand-size element is on the character card (`character.ts`), not
inside the ability dialog. The count must be live-reactive; using a method computed
at render time (triggered by `uiChangeSignal`) is the same pattern used throughout
the app.

---

## 5. Navigation between characters in the ability cards dialog

**Decision**: Add a navigation button inside `AbilityCardsDialogComponent` that:
1. Reads the ordered list of characters with abilities from
   `gameManager.game.figures` (same order as the main board — figures list order,
   resolved in User Story 4 clarification).
2. Finds the current character's index in that list.
3. Closes the current dialog (`this.dialogRef.close()`) and immediately opens a
   new `AbilityCardsDialogComponent` for the next character.

The navigation button is hidden when fewer than 2 characters have non-empty ability
decks (guarded in template by `@if (navigableCharacters().length > 1)`).

**Rationale**: The dialog already holds a `DialogRef` and a `Dialog` injectable —
both are available via CDK inject. Closing and reopening is the cleanest approach
because CDK dialogs are stateful containers; trying to swap `data` would require
breaking the CDK contract.

**Alternative considered**: Pass the full character list as dialog `data` and swap
the component's local `character` binding in-place — rejected because `DIALOG_DATA`
is injected once at construction time; re-rendering in-place would require a
full `ngOnInit` reset cycle that is functionally equivalent to close+reopen.

---

## 6. New settings flags

**Decision**: Add one new boolean field to `Settings` class:

| Property | Default | Purpose |
|---|---|---|
| `abilitySortByState` | `true` | Persists the sort-by-state toggle in the ability cards panel |

Follows the existing `Settings` field pattern (no constructor needed; default
initializer in class body). Persists automatically via the existing
`settingsManager.saveSettings()` → IndexedDB `settings` store flow.

**Note**: The toggle is surfaced as a button in the ability cards dialog header,
not in the global Settings screen. Tapping the button calls
`settingsManager.settings.abilitySortByState = !value` + `settingsManager.saveSettings()`
so the preference survives app close/reopen.
