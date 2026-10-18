# Token budget

The client shows a pre-send estimate computed from the exact compact system prompt, request payload, and response schema using a character-to-token approximation. Token boundaries vary by model and JSON content; the usage values returned by the API after the call are the actual counts. Validation retries are included in actual totals.

For a typical 45–60 minute calisthenics session with a short style note, 8–15 capabilities, and three compact recent sessions, expect roughly **1,000–2,000 estimated input tokens** and **500–1,000 output tokens**. Longer histories, more allowed IDs, and more exercise rows move the request toward the high end. The schema is included in every request and contributes to the input size.

Example request body before serialization (actual requests include more allowed IDs and the complete history summary):

```json
{
  "request": { "duration": 50, "focus": "pull strength", "feel": "good energy", "equipment": ["bodyweight", "pullup_bar"], "language": "en" },
  "capabilities": { "pull_up": 8, "chin_up": 10 },
  "history": { "last": [], "exercise": {}, "avg_completion": 0 },
  "allowed": { "r": ["pull_up", "chin_up", "inverted_row", "assisted_pull_up"], "s": ["plank"], "load": ["pull_up", "chin_up"] }
}
```

Output size is bounded by the response schema and a 32-movement client limit. A short plan with 8–12 movements is usually several hundred output tokens. Keep `note` fields short and let the frontend render exercise names, equipment labels, sets, timer copy, and progress prose itself.
