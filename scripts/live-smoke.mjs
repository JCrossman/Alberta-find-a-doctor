import assert from 'node:assert/strict';
import { findClinics } from '../dist/api/find-a-provider-client.js';

const response = await findClinics({
  acceptingNewPatients: false,
  lat: 53.5461,
  limit: 1,
  lng: -113.4938,
  radiusKm: 10,
});

assert.ok(Array.isArray(response.items));
assert.ok(response.items.length > 0, 'The live directory returned no Edmonton-area clinics.');
assert.equal(typeof response.items[0]?.id, 'number');

console.log(`Live directory smoke test passed: ${response.items.length} result received.`);
