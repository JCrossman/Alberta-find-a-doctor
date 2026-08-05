const DIRECTORY_BASE_URL = 'https://albertafindaprovider.ca';
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const ZIPPOPOTAM_BASE_URL = 'https://api.zippopotam.us';
const USER_AGENT =
  'alberta-find-a-doctor-mcp/0.1 (+https://github.com/JCrossman/Alberta-find-a-doctor)';
const DEFAULT_TIMEOUT_MS = 15_000;

export const SERVICES: Readonly<Record<number, string>> = {
  1: 'Open After Hours',
  2: 'Wheelchair Access',
  4: 'Walk-in Services',
  5: 'Virtual Appointments',
  6: 'Online Booking',
};

export const LANGUAGES: Readonly<Record<number, string>> = {
  1: 'Cantonese',
  2: 'English',
  3: 'Arabic',
  5: 'French',
  7: 'German',
  9: 'Hungarian',
  11: 'Italian',
  13: 'Farsi',
  14: 'Polish',
  15: 'Portuguese',
  18: 'Hausa',
  19: 'Hindi',
  20: 'Tagalog',
  21: 'Spanish',
  22: 'Vietnamese',
  23: 'Korean',
  24: 'Japanese',
  27: 'Mandarin',
  28: 'Greek',
  31: 'Ukrainian',
  33: 'Punjabi',
  34: 'Romanian',
  35: 'Russian',
  37: 'Serbian',
  43: 'Somali',
  51: 'Urdu',
  54: 'Yoruba',
  58: 'Croatian',
  99: 'Other',
};

export const PCNS: Readonly<Record<number, string>> = {
  2: 'Calgary Foothills PCN',
  3: 'Highland PCN',
  4: 'Calgary Rural PCN',
  5: 'Calgary West Central PCN',
  6: 'Mosaic PCN',
  7: 'South Calgary PCN',
  9: 'Lakeland PCN',
  10: 'Bonnyville PCN',
  11: 'Cold Lake PCN',
  12: 'Wood Buffalo PCN',
  15: 'Grande Prairie PCN',
  18: 'Aspen PCN',
  19: 'Chinook PCN',
  20: 'Palliser PCN',
  21: 'Big Country PCN',
  23: 'Wolf Creek PCN',
  25: 'Wetaskiwin PCN',
  27: 'Kalyna Country PCN',
  28: 'Camrose PCN',
  30: 'Peaks to Prairies PCN',
  33: 'Edmonton North PCN',
  34: "Edmonton O-day'min PCN",
  35: 'Edmonton Southside PCN',
  36: 'Edmonton West PCN',
  38: 'Leduc Beaumont Devon PCN',
  39: 'Sherwood Park PCN',
  40: 'St. Albert Sturgeon PCN',
  41: 'WestView PCN',
  42: 'No PCN',
};

export type JsonObject = Record<string, unknown>;

export interface DirectoryResponse extends JsonObject {
  items: JsonObject[];
  limit?: number;
  offset?: number;
  page?: number;
  pages?: number;
  total?: number;
}

export interface GeocodedLocation {
  displayName: string;
  lat: number;
  lng: number;
}

export interface FindClinicsParams {
  acceptingNewPatients?: boolean;
  address?: string;
  genderPreference?: 'm' | 'f';
  languageId?: number;
  lat: number;
  limit?: number;
  lng: number;
  pcnId?: number;
  radiusKm?: number;
  serviceIds?: number[];
  walkInOnly?: boolean;
}

export interface SearchProvidersByNameParams {
  isNursePractitioner: 0 | 1;
  limit?: number;
  name: string;
  page?: number;
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function lookupId(table: Readonly<Record<number, string>>, value: string): number | null {
  const target = normalize(value);
  if (!target) {
    return null;
  }

  for (const [id, name] of Object.entries(table)) {
    if (normalize(name) === target) {
      return Number(id);
    }
  }

  for (const [id, name] of Object.entries(table)) {
    const normalizedName = normalize(name);
    if (normalizedName.includes(target) || target.includes(normalizedName)) {
      return Number(id);
    }
  }

  return null;
}

function resolveLookup(
  label: string,
  table: Readonly<Record<number, string>>,
  value: string,
): number {
  const id = lookupId(table, value);
  if (id === null) {
    throw new Error(
      `Unknown ${label}: "${value}". Supported ${label}s: ${Object.values(table).join(', ')}.`,
    );
  }
  return id;
}

export function resolveLanguage(name: string): number {
  return resolveLookup('language', LANGUAGES, name);
}

export function resolvePcn(name: string): number {
  return resolveLookup('PCN', PCNS, name);
}

export function resolveServices(names: string[]): number[] {
  return names.map((name) => resolveLookup('service', SERVICES, name));
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseDirectoryResponse(value: unknown): DirectoryResponse {
  if (!isJsonObject(value) || !Array.isArray(value.items) || !value.items.every(isJsonObject)) {
    throw new Error('The provider directory returned an unexpected response shape.');
  }

  return {
    ...value,
    items: value.items,
  };
}

const NOISY_FIELDS = new Set([
  'created_at',
  'updated_at',
  'deleted_at',
  'laravel_through_key',
  'polygon',
  'min_x',
  'min_y',
  'max_x',
  'max_y',
  'media',
  'rawDescription',
  'pivot',
]);

function trimResponse(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(trimResponse);
  }

  if (isJsonObject(value)) {
    const output: JsonObject = {};
    for (const [key, child] of Object.entries(value)) {
      if (!NOISY_FIELDS.has(key) && child !== null && child !== undefined) {
        output[key] = trimResponse(child);
      }
    }
    return output;
  }

  return value;
}

async function fetchJson(url: URL, errorLabel: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
        'User-Agent': USER_AGENT,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`${errorLabel} failed (${response.status} ${response.statusText}).`);
    }

    try {
      return await response.json();
    } catch {
      throw new Error(`${errorLabel} returned invalid JSON.`);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`${errorLabel} timed out after ${DEFAULT_TIMEOUT_MS}ms.`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function tryGeocoder(url: URL): Promise<unknown | null> {
  try {
    return await fetchJson(url, 'Geocoding request');
  } catch {
    return null;
  }
}

function parseNominatimResult(value: unknown): GeocodedLocation | null {
  if (!Array.isArray(value) || value.length === 0 || !isJsonObject(value[0])) {
    return null;
  }

  const hit = value[0];
  const lat = Number(hit.lat);
  const lng = Number(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || typeof hit.display_name !== 'string') {
    return null;
  }

  return { lat, lng, displayName: hit.display_name };
}

function parseZippopotamResult(value: unknown, fsa: string): GeocodedLocation | null {
  if (!isJsonObject(value) || !Array.isArray(value.places) || !isJsonObject(value.places[0])) {
    return null;
  }

  const place = value.places[0];
  const lat = Number(place.latitude);
  const lng = Number(place.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const placeName = typeof place['place name'] === 'string' ? place['place name'] : fsa;
  const province = typeof place.state === 'string' ? `, ${place.state}` : '';
  return {
    lat,
    lng,
    displayName: `${placeName}${province} (FSA ${fsa})`,
  };
}

async function geocodeWithNominatim(params: URLSearchParams): Promise<GeocodedLocation | null> {
  const url = new URL('/search', NOMINATIM_BASE_URL);
  url.search = params.toString();
  return parseNominatimResult(await tryGeocoder(url));
}

async function geocodeFsa(fsa: string): Promise<GeocodedLocation | null> {
  const url = new URL(`/ca/${encodeURIComponent(fsa)}`, ZIPPOPOTAM_BASE_URL);
  return parseZippopotamResult(await tryGeocoder(url), fsa);
}

export async function geocode(query: string): Promise<GeocodedLocation> {
  const cleaned = query.trim();
  if (!cleaned) {
    throw new Error('Empty location query.');
  }

  const postalMatch = cleaned.match(/^([A-Za-z]\d[A-Za-z])\s*(\d[A-Za-z]\d)$/);
  const fsaOnly = cleaned.match(/^([A-Za-z]\d[A-Za-z])$/);
  const fsa = (postalMatch?.[1] ?? fsaOnly?.[1])?.toUpperCase();

  if (postalMatch) {
    const postalCode = `${postalMatch[1].toUpperCase()} ${postalMatch[2].toUpperCase()}`;
    const params = new URLSearchParams({
      countrycodes: 'ca',
      format: 'json',
      limit: '1',
      postalcode: postalCode,
    });
    const result = await geocodeWithNominatim(params);
    if (result) {
      return result;
    }
  }

  if (fsa) {
    const result = await geocodeFsa(fsa);
    if (result) {
      return result;
    }
    throw new Error(
      `Could not resolve "${cleaned}" to coordinates. Try another postal code, an address, or latitude and longitude.`,
    );
  }

  const params = new URLSearchParams({
    countrycodes: 'ca',
    format: 'json',
    limit: '1',
    q: cleaned,
  });
  const result = await geocodeWithNominatim(params);
  if (result) {
    return result;
  }

  throw new Error(
    `Could not geocode "${cleaned}". Try a Canadian postal code or pass latitude and longitude.`,
  );
}

const CLINIC_EMBEDS = [
  'pcn',
  'physicians',
  'physicians.languages',
  'physicians.specialties',
  'services',
  'specialties',
];

const PROVIDER_EMBEDS = ['pcn', 'clinics', 'anp', 'languages', 'specialties'];

async function fetchDirectory(path: string, params: URLSearchParams): Promise<DirectoryResponse> {
  const url = new URL(path, DIRECTORY_BASE_URL);
  url.search = params.toString();
  const response = await fetchJson(url, 'Provider directory request');
  return parseDirectoryResponse(trimResponse(response));
}

export async function findClinics(params: FindClinicsParams): Promise<DirectoryResponse> {
  const query = new URLSearchParams({
    lat: String(params.lat),
    limit: String(Math.min(params.limit ?? 25, 25)),
    lng: String(params.lng),
    radius: String(params.radiusKm ?? 10),
  });

  if (params.acceptingNewPatients !== false) {
    query.set('anp', '1');
  }
  if (params.genderPreference) {
    query.set('gender-pref', params.genderPreference);
  }
  if (params.languageId !== undefined) {
    query.append('language-ids[]', String(params.languageId));
  }
  if (params.pcnId !== undefined) {
    query.append('pcn-ids[]', String(params.pcnId));
  }
  if (params.walkInOnly) {
    query.set('is-dedicated-walk-in', '1');
  }
  for (const serviceId of params.serviceIds ?? []) {
    query.append('service-ids[]', String(serviceId));
  }
  for (const embed of CLINIC_EMBEDS) {
    query.append('with[]', embed);
  }
  if (params.address) {
    query.set('address', params.address);
  }

  return fetchDirectory('/search', query);
}

export async function searchProvidersByName(
  params: SearchProvidersByNameParams,
): Promise<DirectoryResponse> {
  const query = new URLSearchParams({
    is_nurse_practitioner: String(params.isNursePractitioner),
    limit: String(Math.min(params.limit ?? 25, 25)),
    page: String(params.page ?? 1),
    'public-find': params.name,
  });
  for (const embed of PROVIDER_EMBEDS) {
    query.append('with[]', embed);
  }
  return fetchDirectory('/search/directory/physicians', query);
}

export async function getClinicById(id: number): Promise<DirectoryResponse> {
  const query = new URLSearchParams();
  query.append('ids[]', String(id));
  for (const embed of CLINIC_EMBEDS) {
    query.append('with[]', embed);
  }
  return fetchDirectory('/search/directory/clinics', query);
}

export async function getProviderById(
  id: number,
  isNursePractitioner: 0 | 1 = 0,
): Promise<DirectoryResponse> {
  const query = new URLSearchParams({
    is_nurse_practitioner: String(isNursePractitioner),
  });
  query.append('ids[]', String(id));
  for (const embed of PROVIDER_EMBEDS) {
    query.append('with[]', embed);
  }
  return fetchDirectory('/search/directory/physicians', query);
}
