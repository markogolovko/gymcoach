# Exercise catalog

`src/data/exercises.json` is the language-neutral source of truth. It currently contains 122 movements: 82 calisthenics, bodyweight, and mobility entries plus 40 common weight-room and cardio entries. English labels and cues live separately in `src/i18n/exercises.en.json`, keyed by the same stable ID.

Each catalog row has this shape:

```json
{
  "id": "pull_up",
  "muscles": ["back", "biceps", "forearms"],
  "pattern": "pull",
  "level": 3,
  "type": "reps",
  "equipment": ["bodyweight", "pullup_bar"],
  "loadable": false,
  "progressions": ["archer_pull_up"],
  "regressions": ["assisted_pull_up"]
}
```

- `id` is stable, lowercase `snake_case`; saved sessions and capability records refer to it.
- `muscles` is a list of searchable muscle groups.
- `pattern` is `push`, `pull`, `legs`, `core`, `cardio`, `mobility`, or `full_body`.
- `level` is an approximate difficulty from 1 (entry level) to 5 (advanced).
- `type` is `reps` or `time`; timed targets are stored in seconds.
- `equipment` uses `bodyweight`, `pullup_bar`, `dip_bars`, `rings`, `parallettes`, `dumbbells`, `barbell`, `kettlebell`, `bands`, `cable`, `machine`, `bench`, or `cardio_machine`.
- `loadable` says whether Runner should show an external-load stepper. Loads and capabilities are stored in kg.
- `progressions` and `regressions` contain IDs from this file and power the local swap menu.

## Add a movement

1. Add a catalog row in `src/data/exercises.json` and choose an unused ID.
2. Add `{ "name": "…", "cue": "…" }` for that ID in `src/i18n/exercises.en.json`.
3. Add the same keys to each future `exercises.<language>.json` file when translating.
4. Link at least one regression or progression where a sensible option exists.
5. Keep the movement’s equipment tags accurate; generation filters by those tags before it sends IDs to the model.

The client requires every listed equipment tag to be selected. Allowed exercise levels default to 1–3 when there are no recorded capabilities; saved ability at a higher level expands the limit one level above the strongest recorded movement, up to level 5. The client rejects unknown IDs, IDs outside the equipment-and-level filtered allow list, timed/reps unit mismatches, and loads for non-loadable catalog movements.
