# Release checklist

## App version

- `package.json` is the source of the app version. `vite.config.ts` injects it into the build, and Settings displays it.
- Bump the version with `npm version <patch|minor|major> --no-git-tag-version`. This updates `package.json` and `package-lock.json` without creating a Git commit or tag.
- While the app is `0.x`, use a patch bump for fixes and a minor bump for feature releases. Use `1.0.0` for the first stable release. After `1.0.0`, follow SemVer: patch for compatible fixes, minor for compatible features, and major for breaking changes.
- App versioning is separate from data compatibility. Only change IndexedDB `DB_VERSION` or the backup format `version` when their stored formats require a migration; routine app releases do not require those schema versions to change.

Before preparing a release commit:

- Choose and apply the app version bump for the release.
- Add or update an automated test that covers the changed behavior. For a bug fix, include a regression test for the reported failure when practical.
- Run the relevant test(s) and confirm they pass.
- Run `npm run build` and confirm the production build succeeds.
