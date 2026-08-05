# Architecture

## Scope

This repository contains one local stdio MCP server and four read-only tools.
It has no web server, database, account system, browser extension, or
health-record integration.

## Request flow

```text
MCP host
  |
  | JSON-RPC over stdin/stdout
  v
MCP server and Zod input validation
  |
  +-- location supplied as coordinates
  |
  +-- postal code or address
  |     |
  |     +-- OpenStreetMap Nominatim
  |     +-- Zippopotam FSA fallback for postal codes
  |
  v
albertafindaprovider.ca public REST endpoints
  |
  v
response validation and noisy-field removal
  |
  v
source-labelled MCP text content
```

The process reserves stdout for MCP protocol messages. Fatal startup errors
are written to stderr.

## Components

- `src/index.ts`: stdio process entry point.
- `src/server.ts`: MCP server metadata, schemas, annotations, and registration.
- `src/api/find-a-provider-client.ts`: geocoding, lookup tables, outbound HTTP,
  response validation, and response trimming.
- `src/tools/`: tool-specific orchestration and result shaping.
- `scripts/stdio-smoke.mjs`: process-level MCP handshake and tool-list test.
- `scripts/live-smoke.mjs`: opt-in check against the public provider directory.

## Trust boundaries

All network responses are untrusted. The client:

1. Enforces request timeouts.
2. Rejects non-success HTTP responses.
3. Rejects invalid JSON.
4. Checks the expected directory response envelope.
5. Removes upstream implementation metadata and oversized fields before
   returning data to the MCP host.

The directory remains authoritative. This server does not infer provider
availability or guarantee that a clinic will accept a patient.

## Data persistence

There is none. Each tool call performs a fresh public lookup. The server does
not write files, maintain a cache, create cookies, or accept credentials.

## Extraction provenance

The original provider client and tool behavior came from
`JCrossman/ab-health-mcp` revision
`5449a46b3fa52cfb003ec92e9068e533f6f33d5c`. The standalone server removes
all authenticated health-record dependencies and adds focused validation,
tests, documentation, and CI.
