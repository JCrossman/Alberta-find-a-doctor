# MCP Tool Reference

All tools are read-only and return public directory data with a source label
and a reminder to confirm information directly with the clinic.

## `find_provider`

Searches clinics and their providers near a location.

At least one location form is required:

- `postal_code`
- `address`
- both `latitude` and `longitude`

Optional filters:

| Input | Type | Notes |
| --- | --- | --- |
| `radius_km` | number | 1-70; defaults to 10 |
| `accepting_new_patients` | boolean | Defaults to true |
| `gender_preference` | `"male"` or `"female"` | Provider gender filter |
| `language` | string | Human-friendly language name |
| `pcn` | string | Human-friendly PCN name |
| `services` | string array | Open After Hours, Wheelchair Access, Walk-in Services, Virtual Appointments, or Online Booking |
| `walk_in_only` | boolean | Dedicated walk-in clinics only |

Example arguments:

```json
{
  "postal_code": "T6G 1L7",
  "radius_km": 10,
  "accepting_new_patients": true,
  "services": ["Wheelchair Access"]
}
```

## `find_provider_by_language`

Searches clinics near a location and identifies the providers who report
speaking the requested language.

Required:

- `language`
- one of the location forms described under `find_provider`

Optional:

- `radius_km`
- `accepting_new_patients`

Example arguments:

```json
{
  "language": "Punjabi",
  "address": "Mill Woods, Edmonton",
  "radius_km": 15
}
```

## `search_provider_by_name`

Searches physicians and nurse practitioners by full or partial name. The
upstream directory performs a broad multi-field search, so this tool
post-filters results to entries whose provider name contains the query.

| Input | Type | Notes |
| --- | --- | --- |
| `name` | string | Required; 2-100 characters |
| `include_nurse_practitioners` | boolean | Defaults to true |
| `doctors_only` | boolean | Cannot be combined with `nurse_practitioners_only` |
| `nurse_practitioners_only` | boolean | Cannot be combined with `doctors_only` |

Example arguments:

```json
{
  "name": "Smith",
  "doctors_only": true
}
```

## `get_provider_details`

Retrieves one full directory record using an ID returned by another tool.

| Input | Type | Notes |
| --- | --- | --- |
| `id` | positive integer | Required |
| `type` | `"clinic"`, `"physician"`, or `"nurse_practitioner"` | Required |

Example arguments:

```json
{
  "id": 123,
  "type": "clinic"
}
```

## Errors

Input validation failures and upstream failures are returned as MCP tool
results with `isError: true`. The server does not fabricate an empty success
response when a public service is unavailable.
