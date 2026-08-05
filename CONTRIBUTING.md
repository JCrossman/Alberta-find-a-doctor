# Contributing

## Development setup

1. Install Node.js 20 or newer.
2. Run `npm ci`.
3. Run `npm run check` before submitting a change.

Use `npm run dev` to start the TypeScript entry point directly. MCP protocol
messages use stdout, so diagnostic output must use stderr.

## Change guidelines

- Keep every tool read-only.
- Do not add health-record access, account credentials, appointment booking,
  or state-changing actions.
- Do not use real patient information in source, fixtures, tests, issues, or
  pull requests.
- Treat all upstream responses as untrusted and validate any newly consumed
  structure.
- Preserve source attribution and the independent-project disclaimer.
- Add or update tests when tool inputs, upstream parameters, or result shaping
  changes.
- Document any new outbound host in `docs/DATA-SOURCES.md`.

## Testing upstream changes

Unit tests mock network calls and must remain deterministic. Use
`npm run smoke:live` for an explicit live check. Do not make live external
requests part of the default test suite or CI.

If the public directory API changes, record only the minimum response shape
needed to update synthetic fixtures. Do not commit browser profiles, cookies,
HAR files, or unrelated browsing data.
