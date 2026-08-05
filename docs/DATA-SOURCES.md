# Data Sources and Network Access

The server makes outbound HTTPS requests only during a tool call.

| Host | Purpose | Data sent |
| --- | --- | --- |
| `albertafindaprovider.ca` | Public clinic and provider directory | Coordinates, radius, directory filters, provider name, or public record ID |
| `nominatim.openstreetmap.org` | Address and full postal-code geocoding | The location string supplied by the user |
| `api.zippopotam.us` | Postal-code fallback | The first three postal-code characters (FSA) |

## Returned data

Directory responses can include public clinic and provider fields such as:

- clinic and provider names;
- business address and contact information;
- PCN and clinic affiliations;
- reported languages, specialties, and services;
- reported accepting-new-patients status;
- public directory record IDs.

The MCP removes upstream timestamps, relationship metadata, map polygons, and
other noisy implementation fields before returning results.

## Accuracy

The directory and geocoders are external services. Their availability,
coverage, schemas, and content can change independently of this project.
Results are informational and must be confirmed with the clinic.

## Personal information

The directory data is public, but the location used for a search may identify
or approximate a person. Do not combine it with patient names, health numbers,
clinical notes, or other private health information in tool arguments.
