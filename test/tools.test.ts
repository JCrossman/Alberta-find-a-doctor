import { afterEach, describe, expect, it, vi } from 'vitest';
import { findProviderByLanguageTool } from '../src/tools/find-provider-by-language.js';
import { findProviderTool } from '../src/tools/find-provider.js';
import { getProviderDetailsTool } from '../src/tools/get-provider-details.js';
import { searchProviderByNameTool } from '../src/tools/search-provider-by-name.js';

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
}

function resultPayload(result: Awaited<ReturnType<typeof findProviderTool.handler>>): Record<string, unknown> {
  return JSON.parse(result.content.at(-1)?.text ?? '{}') as Record<string, unknown>;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('find_provider', () => {
  it('requires a complete location', async () => {
    const result = await findProviderTool.handler({ latitude: 53.5 });
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('Latitude and longitude');
  });

  it('returns source-labelled directory results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ items: [{ id: 1, name: 'Clinic' }], total: 1 })),
    );

    const result = await findProviderTool.handler({
      accepting_new_patients: false,
      latitude: 53.5,
      longitude: -113.5,
    });
    const payload = resultPayload(result);
    expect(result.isError).toBeUndefined();
    expect(payload.source).toBe('albertafindaprovider.ca (public directory)');
  });
});

describe('find_provider_by_language', () => {
  it('identifies the providers who speak the requested language', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse({
          items: [
            {
              id: 1,
              physicians: [
                {
                  friendly_name: 'Dr Example',
                  id: 2,
                  languages: [{ id: 33, name: 'Punjabi' }],
                },
              ],
            },
          ],
          total: 1,
        }),
      ),
    );

    const result = await findProviderByLanguageTool.handler({
      language: 'Punjabi',
      latitude: 53.5,
      longitude: -113.5,
    });
    const payload = JSON.parse(result.content.at(-1)?.text ?? '{}') as {
      results?: { items?: Array<{ providersSpeakingLanguage?: Array<{ id?: number }> }> };
    };
    expect(payload.results?.items?.[0]?.providersSpeakingLanguage).toEqual([
      {
        id: 2,
        isNursePractitioner: false,
        name: 'Dr Example',
      },
    ]);
  });
});

describe('search_provider_by_name', () => {
  it('post-filters broad upstream matches by provider name', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          items: [
            { friendly_name: 'Dr Jane Smith', id: 1 },
            { friendly_name: 'Dr Other', id: 2, street_address: 'Smith Street' },
          ],
          total: 2,
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ items: [], total: 0 }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await searchProviderByNameTool.handler({ name: 'Smith' });
    const payload = JSON.parse(result.content.at(-1)?.text ?? '{}') as {
      nameMatches?: number;
      providers?: Array<{ id?: number }>;
    };
    expect(payload.nameMatches).toBe(1);
    expect(payload.providers).toEqual([{ friendly_name: 'Dr Jane Smith', id: 1 }]);
  });

  it('rejects contradictory provider type filters', async () => {
    const result = await searchProviderByNameTool.handler({
      doctors_only: true,
      name: 'Smith',
      nurse_practitioners_only: true,
    });
    expect(result.isError).toBe(true);
  });
});

describe('get_provider_details', () => {
  it('rejects invalid IDs before making a request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const result = await getProviderDetailsTool.handler({ id: 0, type: 'clinic' });
    expect(result.isError).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
