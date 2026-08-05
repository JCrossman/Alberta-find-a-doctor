import {
  findClinics,
  resolveLanguage,
  resolvePcn,
  resolveServices,
} from '../api/find-a-provider-client.js';
import { resolveLocation, type LocationArgs } from './location.js';
import { errorResult, formattingDirective, type ToolResult } from './results.js';

export interface FindProviderArgs extends LocationArgs {
  accepting_new_patients?: boolean;
  gender_preference?: 'female' | 'male';
  language?: string;
  pcn?: string;
  radius_km?: number;
  services?: string[];
  walk_in_only?: boolean;
}

export const findProviderTool = {
  name: 'find_provider',
  description:
    'Search for Alberta clinics and family doctors by location. Returns clinics with physicians, services, contact information, and location details. Public data only; no Alberta account is needed. Provide a postal code, address, or latitude and longitude.',
  handler: async (args: FindProviderArgs): Promise<ToolResult> => {
    try {
      const location = await resolveLocation(args);
      const data = await findClinics({
        acceptingNewPatients: args.accepting_new_patients,
        address: location.resolvedAddress,
        genderPreference:
          args.gender_preference === 'male'
            ? 'm'
            : args.gender_preference === 'female'
              ? 'f'
              : undefined,
        languageId: args.language ? resolveLanguage(args.language) : undefined,
        lat: location.lat,
        lng: location.lng,
        pcnId: args.pcn ? resolvePcn(args.pcn) : undefined,
        radiusKm: args.radius_km,
        serviceIds: args.services ? resolveServices(args.services) : undefined,
        walkInOnly: args.walk_in_only,
      });

      return {
        content: [
          formattingDirective('grouped_tables'),
          {
            type: 'text',
            text: JSON.stringify({
              note:
                'Confirm hours, services, and accepting-new-patients status directly with the clinic before visiting.',
              results: data,
              searchCenter: {
                lat: location.lat,
                lng: location.lng,
                resolvedAddress: location.resolvedAddress,
              },
              source: 'albertafindaprovider.ca (public directory)',
            }),
          },
        ],
      };
    } catch (error) {
      return errorResult(error, 'Unknown error during provider search.');
    }
  },
};
