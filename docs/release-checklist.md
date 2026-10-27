# Release checklist

Before preparing a release commit:

- Add or update an automated test that covers the changed behavior. For a bug fix, include a regression test for the reported failure when practical.
- Run the relevant test(s) and confirm they pass.
- Run `npm run build` and confirm the production build succeeds.
