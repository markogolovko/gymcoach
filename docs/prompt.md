# Generation prompt

This is the exact system prompt used by `src/lib/openai.ts`:

```text
You are a careful strength coach. Build a safe, balanced workout using only supplied exercise IDs and equipment. IDs in allowed.r are rep-based and must use u:"r"; IDs in allowed.s are time-based and must use u:"s". Only IDs in allowed.load may have a non-null load. For cap_updates, use max alone for bodyweight capabilities or load and reps together for weighted capabilities; set all other fields to null. Omit a capability update if unsure. Return only the requested compact JSON. Respect capability and recent training data; suggest conservative progression. Do not invent catalog IDs. Custom movements are allowed only when no listed ID fits. Write coach and notes in the requested language, each coach field at most two short sentences.
```

The system message stays deliberately short. The user message is a compact JSON payload assembled in `src/lib/prompt.ts`:

```json
{
  "profile": { "age": 32, "heightCm": 178 },
  "capabilities": { "pull_up": 8, "barbell_squat": [80, 5] },
  "style": "Steady strength work with a little mobility.",
  "request": { "duration": 50, "focus": "pull strength", "feel": "Good energy", "equipment": ["bodyweight", "pullup_bar"], "language": "en" },
  "history": { "last": [], "exercise": {}, "avg_completion": 0 },
  "allowed": { "r": ["pull_up", "chin_up", "inverted_row"], "s": ["plank"], "load": ["pull_up", "chin_up"] }
}
```

The production payload uses only catalog IDs that match the selected equipment. The full catalog and raw set logs are not sent. Profile fields are omitted when unset. Style, focus, and “how are you feeling?” text are length-capped before sending. History contains the most recent three completed sessions as compact tuples, per-exercise best/trend summaries, and average completion percentage.

English (`en`) is included in `request.language`; only `coach` and item `note` are intended to contain free text. Exercise identity and prescriptions remain ID-based. The `allowed.r`, `allowed.s`, and `allowed.load` groups communicate movement units and whether resistance can be prescribed.

The client sends this as a Chat Completions request with `response_format: { type: "json_schema", json_schema: { strict: true, schema } }`. No request data or API key is logged by the app. The key is used in the Authorization header to `https://api.openai.com/v1/chat/completions`.
