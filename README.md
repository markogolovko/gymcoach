# FORM · AI Gym Coach

A static, mobile-first workout planner and training log. It builds plans from an exercise catalog, your available equipment, capabilities, and a compact summary of completed sessions. Workouts keep working offline after they have been generated.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the local Vite URL on your phone or computer. Add your OpenAI API key in **Settings** to generate a workout. The key is stored in this browser’s IndexedDB and sent directly to `api.openai.com` only when you request a plan. Anyone with access to the browser profile can use the key. A backup excludes it unless you opt in.

`.env.local` is Git-ignored and can hold a local reference, but this static app does not load environment secrets into browser code. Enter the key in Settings to use it; production builds do not include `.env.local` values.

The app has no backend, analytics, or tracking. The service worker caches the app shell and static catalog; generating a new plan still needs an internet connection.

## Build and deploy

```sh
npm run build
npm run preview
npm test
```

The build output is the `dist/` folder.

### GitHub Pages

This repo is configured with a relative Vite base path, so it works at a project URL such as `https://<user>.github.io/<repo>/`.

1. In GitHub, open **Settings → Pages** and choose **GitHub Actions** as the build source.
2. Add a workflow that checks out the repo, installs Node 22, runs `npm ci` and `npm run build`, uploads `dist/` with `actions/upload-pages-artifact`, then deploys it with `actions/deploy-pages`.
3. The published site must use HTTPS for the installable PWA and browser storage APIs.

### Cloudflare Pages

Create a Pages project connected to the repository. Set the build command to `npm run build` and the output directory to `dist`. No environment variables or server functions are required.

## Install on iPhone

1. Open the deployed HTTPS site in Safari.
2. Tap **Share**, then **Add to Home Screen**.
3. Open FORM from the new Home Screen icon. Safari and the installed app have separate browser storage, so data created in one will not appear in the other.
4. In Settings, check the storage protection status and export a JSON backup regularly. iOS may clear site data when storage is not persistent.

The Runner saves each set and timer end time locally. Rest timers recalculate from timestamps after the app resumes; the Wake Lock API is used where the browser supports it.

## Data and recovery

All app state is stored through the asynchronous `Storage` interface. `LocalAdapter` is the only current implementation and stores settings, capabilities, weight entries, sessions, and metadata in IndexedDB. The database is versioned; schema changes belong in a migration branch in `src/storage/local.ts`.

Use **Settings → Export all data (JSON)** for a backup. iOS uses the share sheet when it supports file sharing; other browsers download the file. Import validates the backup version and shape before replacing app data. An omitted API key is preserved from the current browser when restoring; if restoring on a new device, enter the key again.

The API key is a browser-side secret. Anyone who can access this browser profile can use it. Do not include the key in a backup you plan to share.

## Project notes

- [Workout response contract](docs/schema.md)
- [Exact model system prompt](docs/prompt.md)
- [Exercise catalog format](docs/catalog.md)
- [Adding a translation](docs/i18n.md)
- [Future Supabase sync sketch](docs/future-supabase.md)
- [Token budget note](docs/token-budget.md)

The current frontend build is small: approximately 65 KB gzipped for the JavaScript and CSS together (excluding the browser’s service-worker runtime).
