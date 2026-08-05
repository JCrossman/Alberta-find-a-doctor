# Alberta Find a Doctor MCP

A read-only Model Context Protocol (MCP) server for finding Alberta clinics,
family physicians, and nurse practitioners using the public
[Alberta Find a Provider](https://albertafindaprovider.ca) directory.

The server supports searches by location, spoken language, provider name,
accepting-new-patients status, Primary Care Network (PCN), clinic services,
and walk-in availability. It does not book appointments, submit applications,
or access Alberta health records.

> This is an independent project. It is not operated by or endorsed by the
> Government of Alberta, Alberta Health Services, or the directory operator.
> Directory information can change; confirm availability and services directly
> with the clinic.

## Tools

| Tool | Purpose |
| --- | --- |
| `find_provider` | Search near a postal code, address, or latitude/longitude with optional filters. |
| `find_provider_by_language` | Find nearby clinics and identify providers who speak a requested language. |
| `search_provider_by_name` | Search physicians and nurse practitioners by full or partial name. |
| `get_provider_details` | Retrieve the full public record for an ID returned by a search. |

See [docs/TOOLS.md](docs/TOOLS.md) for complete inputs and examples.

## Requirements

- Node.js 20 or newer
- An MCP host that supports local stdio servers
- Network access to the public services listed in
  [docs/DATA-SOURCES.md](docs/DATA-SOURCES.md)

No API key, Alberta account, or environment variable is required.

## Install and run

```bash
git clone https://github.com/JCrossman/Alberta-find-a-doctor.git
cd Alberta-find-a-doctor
npm ci
npm run build
```

Configure your MCP host to start the built server:

```json
{
  "mcpServers": {
    "alberta-find-a-doctor": {
      "command": "node",
      "args": ["/absolute/path/to/Alberta-find-a-doctor/dist/index.js"]
    }
  }
}
```

Restart the host after changing its MCP configuration.

## Privacy and data boundaries

The server is designed for public provider-directory searches and has no
health-record authentication. It stores no data and uses no cookies or
credentials.

- Search coordinates and filters are sent to `albertafindaprovider.ca`.
- Postal codes and free-form locations may be sent to OpenStreetMap Nominatim.
- Postal-code fallback searches send the first three postal-code characters
  (the Forward Sortation Area) to Zippopotam.us.
- Tool results contain public clinic and provider information.

A location can still be personal information. Do not put patient names,
clinical notes, health numbers, or other private health information into tool
arguments.

## Development

```bash
npm ci
npm run dev
npm run check
```

`npm run check` runs strict type checking, unit tests, the production build,
and an MCP stdio protocol smoke test. To verify the current public directory
from your machine:

```bash
npm run smoke:live
```

The live smoke test is intentionally excluded from CI because it depends on an
external service.

## Source and licence

This focused server was extracted from the provider-search implementation in
[`JCrossman/ab-health-mcp`](https://github.com/JCrossman/ab-health-mcp) at
revision `5449a46b3fa52cfb003ec92e9068e533f6f33d5c`. Authenticated
health-record, portal, extension, and account-management code was deliberately
excluded.

Licensed under the [MIT License](LICENSE). See [NOTICE](NOTICE) for source
attribution.
