import {
  getClinicById,
  getProviderById,
} from '../api/find-a-provider-client.js';
import { errorResult, formattingDirective, type ToolResult } from './results.js';

export interface GetProviderDetailsArgs {
  id: number;
  type: 'clinic' | 'nurse_practitioner' | 'physician';
}

export const getProviderDetailsTool = {
  name: 'get_provider_details',
  description:
    'Get full details for a clinic, physician, or nurse practitioner using an ID returned by another search tool. Public data only; no Alberta account is needed.',
  handler: async (args: GetProviderDetailsArgs): Promise<ToolResult> => {
    try {
      if (!Number.isInteger(args.id) || args.id <= 0) {
        throw new Error('A positive integer id is required.');
      }

      const record =
        args.type === 'clinic'
          ? await getClinicById(args.id)
          : args.type === 'physician'
            ? await getProviderById(args.id, 0)
            : args.type === 'nurse_practitioner'
              ? await getProviderById(args.id, 1)
              : undefined;

      if (!record) {
        throw new Error('type must be clinic, physician, or nurse_practitioner.');
      }

      return {
        content: [
          formattingDirective('detail'),
          {
            type: 'text',
            text: JSON.stringify({
              id: args.id,
              note:
                'Confirm availability, services, and accepting-new-patients status directly with the provider.',
              record,
              source: 'albertafindaprovider.ca (public directory)',
              type: args.type,
            }),
          },
        ],
      };
    } catch (error) {
      return errorResult(error, 'Unknown error fetching provider details.');
    }
  },
};
