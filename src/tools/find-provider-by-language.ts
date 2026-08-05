import {
  findClinics,
  LANGUAGES,
  resolveLanguage,
  type JsonObject,
} from '../api/find-a-provider-client.js';
import { resolveLocation, type LocationArgs } from './location.js';
import { errorResult, formattingDirective, type ToolResult } from './results.js';

export interface FindProviderByLanguageArgs extends LocationArgs {
  accepting_new_patients?: boolean;
  language: string;
  radius_km?: number;
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function matchingProviders(clinic: JsonObject, languageId: number): JsonObject[] {
  if (!Array.isArray(clinic.physicians)) {
    return [];
  }

  return clinic.physicians.filter((provider): provider is JsonObject => {
    if (!isJsonObject(provider) || !Array.isArray(provider.languages)) {
      return false;
    }
    return provider.languages.some(
      (language) => isJsonObject(language) && Number(language.id) === languageId,
    );
  });
}

export const findProviderByLanguageTool = {
  name: 'find_provider_by_language',
  description:
    'Find Alberta clinics with at least one physician who speaks a requested language near a location. The response identifies the matching providers. Public data only; no Alberta account is needed.',
  handler: async (args: FindProviderByLanguageArgs): Promise<ToolResult> => {
    try {
      if (!args.language?.trim()) {
        throw new Error(
          `Specify a language. Supported languages: ${Object.values(LANGUAGES).join(', ')}.`,
        );
      }

      const languageId = resolveLanguage(args.language);
      const languageName = LANGUAGES[languageId];
      const location = await resolveLocation(args);
      const data = await findClinics({
        acceptingNewPatients: args.accepting_new_patients,
        address: location.resolvedAddress,
        languageId,
        lat: location.lat,
        lng: location.lng,
        radiusKm: args.radius_km,
      });

      const items = data.items.map((clinic) => {
        const providers = matchingProviders(clinic, languageId);
        return {
          ...clinic,
          providersSpeakingLanguage: providers.map((provider) => ({
            gender: provider.gender,
            id: provider.id,
            isNursePractitioner: Boolean(provider.nurse_practitioner),
            name: provider.friendly_name ?? provider.clinical_name,
          })),
        };
      });

      return {
        content: [
          formattingDirective('grouped_tables'),
          {
            type: 'text',
            text: JSON.stringify({
              clinicsMatching: items.length,
              language: languageName,
              note:
                `Each listed clinic reports at least one provider who speaks ${languageName}. ` +
                'Confirm language availability and accepting-new-patients status directly with the clinic.',
              results: { ...data, items },
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
      return errorResult(error, 'Unknown error during language-based provider search.');
    }
  },
};
