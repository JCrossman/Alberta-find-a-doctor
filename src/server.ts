import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { findProviderByLanguageTool } from './tools/find-provider-by-language.js';
import { findProviderTool } from './tools/find-provider.js';
import { getProviderDetailsTool } from './tools/get-provider-details.js';
import { searchProviderByNameTool } from './tools/search-provider-by-name.js';
import { SERVER_NAME, SERVER_VERSION } from './version.js';

const READ_ONLY_ANNOTATIONS = {
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
  readOnlyHint: true,
} as const;

const locationSchema = {
  address: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .optional()
    .describe('Free-form Alberta address or place name. Postal code is preferred for accuracy.'),
  latitude: z
    .number()
    .min(-90)
    .max(90)
    .optional()
    .describe('Latitude in decimal degrees. Must be provided with longitude.'),
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .optional()
    .describe('Longitude in decimal degrees. Must be provided with latitude.'),
  postal_code: z
    .string()
    .trim()
    .min(3)
    .max(7)
    .optional()
    .describe('Canadian postal code, for example T6G 1L7.'),
};

export function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  server.tool(
    findProviderTool.name,
    findProviderTool.description,
    {
      ...locationSchema,
      accepting_new_patients: z
        .boolean()
        .optional()
        .describe('Filter to clinics accepting new patients. Defaults to true.'),
      gender_preference: z
        .enum(['male', 'female'])
        .optional()
        .describe('Filter to clinics with a provider of this gender.'),
      language: z
        .string()
        .trim()
        .min(1)
        .max(100)
        .optional()
        .describe('Language spoken by the provider, for example Punjabi or Mandarin.'),
      pcn: z
        .string()
        .trim()
        .min(1)
        .max(100)
        .optional()
        .describe('Primary Care Network name, for example Edmonton West.'),
      radius_km: z
        .number()
        .min(1)
        .max(70)
        .optional()
        .describe('Search radius in kilometres. Defaults to 10 and allows 1-70.'),
      services: z
        .array(z.string().trim().min(1).max(100))
        .max(10)
        .optional()
        .describe('Services such as Wheelchair Access, Walk-in Services, or Online Booking.'),
      walk_in_only: z
        .boolean()
        .optional()
        .describe('Limit results to dedicated walk-in clinics. Defaults to false.'),
    },
    {
      title: 'Find Provider',
      ...READ_ONLY_ANNOTATIONS,
    },
    findProviderTool.handler,
  );

  server.tool(
    findProviderByLanguageTool.name,
    findProviderByLanguageTool.description,
    {
      ...locationSchema,
      accepting_new_patients: z
        .boolean()
        .optional()
        .describe('Filter to clinics accepting new patients. Defaults to true.'),
      language: z
        .string()
        .trim()
        .min(1)
        .max(100)
        .describe('Language spoken by the provider, for example Punjabi or Mandarin.'),
      radius_km: z
        .number()
        .min(1)
        .max(70)
        .optional()
        .describe('Search radius in kilometres. Defaults to 10 and allows 1-70.'),
    },
    {
      title: 'Find Provider by Language',
      ...READ_ONLY_ANNOTATIONS,
    },
    findProviderByLanguageTool.handler,
  );

  server.tool(
    searchProviderByNameTool.name,
    searchProviderByNameTool.description,
    {
      doctors_only: z
        .boolean()
        .optional()
        .describe('Return physicians only. Cannot be combined with nurse_practitioners_only.'),
      include_nurse_practitioners: z
        .boolean()
        .optional()
        .describe('Include nurse practitioners with physicians. Defaults to true.'),
      name: z
        .string()
        .trim()
        .min(2)
        .max(100)
        .describe('Full or partial provider name.'),
      nurse_practitioners_only: z
        .boolean()
        .optional()
        .describe('Return nurse practitioners only. Cannot be combined with doctors_only.'),
    },
    {
      title: 'Search Provider by Name',
      ...READ_ONLY_ANNOTATIONS,
    },
    searchProviderByNameTool.handler,
  );

  server.tool(
    getProviderDetailsTool.name,
    getProviderDetailsTool.description,
    {
      id: z.number().int().positive().describe('ID returned by a provider search tool.'),
      type: z
        .enum(['clinic', 'physician', 'nurse_practitioner'])
        .describe('The kind of record represented by the ID.'),
    },
    {
      title: 'Provider Details',
      ...READ_ONLY_ANNOTATIONS,
    },
    getProviderDetailsTool.handler,
  );

  return server;
}
