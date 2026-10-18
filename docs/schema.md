# Workout response schema

The model returns a compact version 1 workout. Chat Completions Structured Outputs uses the JSON Schema in `src/lib/workout-schema.ts` with `strict: true`. Every object is closed (`additionalProperties: false`) and every property is required. Values that do not apply are `null`.

```json
{
  "v": 1,
  "title": "Upper-body strength",
  "est_min": 50,
  "blocks": [
    {
      "t": "main",
      "items": [
        { "ex": "push_up", "name": null, "sets": 4, "tgt": 12, "u": "r", "load": null, "rest": 90, "note": null },
        { "ex": "custom", "name": "Band face pull", "sets": 3, "tgt": 15, "u": "r", "load": null, "rest": 60, "note": "Pause at the finish" }
      ]
    }
  ],
  "coach": "Keep two reps in reserve. Add reps before moving to a harder variation.",
  "cap_updates": [
    { "ex": "push_up", "max": 14, "load": null, "reps": null }
  ]
}
```

## Fields

| Field | Meaning | Validation |
|---|---|---|
| `v` | Contract version | Integer, exactly `1` |
| `title` | Short workout title | Up to 40 characters |
| `est_min` | Estimated total session duration | Integer, 1–300 minutes |
| `blocks` | Ordered workout sections | 1–12 blocks |
| `blocks[].t` | `warmup`, `main`, `superset`, `circuit`, `core`, `cardio`, or `cooldown` | Required enum |
| `blocks[].items` | Exercise prescriptions | 1–10 items per block; 32 total items maximum after client validation |
| `ex` | Catalog exercise ID or `custom` | Catalog IDs must be in the client’s equipment-filtered allow list |
| `name` | Name only for `custom` | `null` for catalog entries; custom name required and at most 48 characters |
| `sets` | Planned sets | Integer, 1–10 |
| `tgt` | Reps or seconds per set | Integer, 1–600 |
| `u` | Target unit | `r` for reps or `s` for seconds; must match catalog type |
| `load` | Prescribed external load in kg | `null` or 0–1000; rejected for non-loadable catalog entries |
| `rest` | Rest after a set, in seconds | Integer, 0–600 |
| `note` | Short exercise cue | `null` or up to 60 characters |
| `coach` | Rationale and progression cue in the selected language | Up to 260 characters and two sentences maximum |
| `cap_updates` | Suggested capability changes | Up to 12 catalog movements |
| `cap_updates[].max` | Suggested reps/seconds maximum | Use alone, with `load` and `reps` null |
| `cap_updates[].load`, `reps` | Suggested loaded capability | Use together with `max` null; load is in kg |

The frontend validates the response with Zod and then checks equipment allow-list membership, target units, loadability, custom names, item count, and capability-update combinations. It retries once with the validation message appended. A second failure is shown as a readable error. Custom items store their reps/seconds unit in `u`, so Runner behavior does not depend on a model-generated catalog record.

## Local workout state

Generated prescriptions are extended locally with a log array containing one entry per planned set: `{ done, reps, loadKg, completedAt }`. Each set tap and timer adjustment updates the session through `Storage`. These logging fields are never sent as raw history; generation receives only the compact local summary described in the prompt document.
