import {
  searchProvidersByName,
  type JsonObject,
} from '../api/find-a-provider-client.js';
import { errorResult, formattingDirective, type ToolResult } from './results.js';

export interface SearchProviderByNameArgs {
  doctors_only?: boolean;
  include_nurse_practitioners?: boolean;
  name: string;
  nurse_practitioners_only?: boolean;
}

function providerNameMatches(provider: JsonObject, needle: string): boolean {
  return ['friendly_name', 'clinical_name', 'first_name', 'last_name'].some((field) =>
    String(provider[field] ?? '')
      .toLowerCase()
      .includes(needle),
  );
}

export const searchProviderByNameTool = {
  name: 'search_provider_by_name',
  description:
    'Search Alberta physicians and nurse practitioners by full or partial name. Returns clinic affiliations, PCN, languages, and accepting-new-patients information. Public data only; no Alberta account is needed.',
  handler: async (args: SearchProviderByNameArgs): Promise<ToolResult> => {
    try {
      const name = args.name?.trim();
      if (!name || name.length < 2) {
        throw new Error('Provide a name with at least two characters.');
      }
      if (args.doctors_only && args.nurse_practitioners_only) {
        throw new Error('doctors_only and nurse_practitioners_only cannot both be true.');
      }

      const includeDoctors = !args.nurse_practitioners_only;
      const includeNursePractitioners = args.nurse_practitioners_only
        ? true
        : args.doctors_only
          ? false
          : (args.include_nurse_practitioners ?? true);

      const requests: Array<Promise<Awaited<ReturnType<typeof searchProvidersByName>>>> = [];
      if (includeDoctors) {
        requests.push(
          searchProvidersByName({
            isNursePractitioner: 0,
            name,
          }),
        );
      }
      if (includeNursePractitioners) {
        requests.push(
          searchProvidersByName({
            isNursePractitioner: 1,
            name,
          }),
        );
      }

      const responses = await Promise.all(requests);
      const providers = responses.flatMap((response) => response.items);
      const upstreamMatches = responses.reduce(
        (total, response) => total + (response.total ?? response.items.length),
        0,
      );
      const needle = name.toLowerCase();
      const nameMatches = providers.filter((provider) => providerNameMatches(provider, needle));

      return {
        content: [
          formattingDirective('table', [
            'Name',
            'Type',
            'Clinic',
            'City',
            'PCN',
            'Accepting new patients',
          ]),
          {
            type: 'text',
            text: JSON.stringify({
              nameMatches: nameMatches.length,
              note:
                'Results are post-filtered to actual provider-name matches. Confirm availability directly with the provider.',
              providers: nameMatches,
              query: name,
              source: 'albertafindaprovider.ca (public directory)',
              upstreamMatches,
            }),
          },
        ],
      };
    } catch (error) {
      return errorResult(error, 'Unknown error during provider name search.');
    }
  },
};
