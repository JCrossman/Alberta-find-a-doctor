import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  findClinics,
  geocode,
  resolveLanguage,
  resolvePcn,
  resolveServices,
} from '../src/api/find-a-provider-client.js';

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    headers: { 'Content-Type': 'application/json' },
    status,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('directory lookups', () => {
  it('resolves human-friendly lookup values', () => {
    expect(resolveLanguage('punjabi')).toBe(33);
    expect(resolvePcn('Edmonton West')).toBe(36);
    expect(resolveServices(['wheelchair access', 'online booking'])).toEqual([2, 6]);
  });

  it('rejects unsupported lookup values', () => {
    expect(() => resolveLanguage('Klingon')).toThrow('Unknown language');
  });
});

describe('findClinics', () => {
  it('sends filters and removes noisy response fields', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL) =>
      jsonResponse({
        items: [
          {
            created_at: 'hidden',
            id: 12,
            name: 'Example Clinic',
            physicians: [{ id: 34, pivot: { hidden: true } }],
          },
        ],
        total: 1,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await findClinics({
      genderPreference: 'f',
      languageId: 33,
      lat: 53.5,
      limit: 1,
      lng: -113.5,
      pcnId: 36,
      radiusKm: 15,
      serviceIds: [2, 6],
      walkInOnly: true,
    });

    expect(result.items[0]).toEqual({
      id: 12,
      name: 'Example Clinic',
      physicians: [{ id: 34 }],
    });

    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requestUrl.origin).toBe('https://albertafindaprovider.ca');
    expect(requestUrl.searchParams.get('anp')).toBe('1');
    expect(requestUrl.searchParams.get('gender-pref')).toBe('f');
    expect(requestUrl.searchParams.get('language-ids[]')).toBe('33');
    expect(requestUrl.searchParams.get('pcn-ids[]')).toBe('36');
    expect(requestUrl.searchParams.getAll('service-ids[]')).toEqual(['2', '6']);
    expect(requestUrl.searchParams.get('is-dedicated-walk-in')).toBe('1');
  });

  it('surfaces upstream HTTP failures', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({}, 503)));
    await expect(findClinics({ lat: 53.5, lng: -113.5 })).rejects.toThrow(
      'Provider directory request failed (503',
    );
  });
});

describe('geocode', () => {
  it('falls back from Nominatim to an FSA lookup for a postal code', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(
        jsonResponse({
          places: [
            {
              latitude: '53.52',
              longitude: '-113.53',
              'place name': 'Edmonton',
              state: 'Alberta',
            },
          ],
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(geocode('T6G 1L7')).resolves.toEqual({
      displayName: 'Edmonton, Alberta (FSA T6G)',
      lat: 53.52,
      lng: -113.53,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
