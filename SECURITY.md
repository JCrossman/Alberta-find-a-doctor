# Security Policy

## Reporting a vulnerability

Use GitHub's private vulnerability reporting or security-advisory feature for
this repository. Do not open a public issue containing exploit details,
credentials, private locations, or personal health information.

## Security and privacy model

This server:

- exposes read-only tools;
- uses public, unauthenticated directory endpoints;
- stores no credentials, cookies, query history, or results;
- performs no appointment booking or other state-changing action;
- does not access Alberta health records.

Location searches leave the local process. See
`docs/DATA-SOURCES.md` for the exact recipients and fields. Users must not send
patient identifiers, clinical narratives, or other private health information
as tool arguments.

## Supported versions

Security fixes are applied to the current `main` branch. Until tagged releases
are published, no earlier revision is considered supported.

## Dependency handling

Runtime dependencies are intentionally limited to the official MCP SDK and
Zod. The lockfile is committed, Dependabot monitors npm dependencies, and CI
runs the full repository check on pull requests.
