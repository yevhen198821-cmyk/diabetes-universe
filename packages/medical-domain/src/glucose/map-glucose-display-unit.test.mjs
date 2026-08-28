import assert from 'node:assert/strict';
import test from 'node:test';

import { mapGlucoseDisplayUnitToMeasurementUnit } from './map-glucose-display-unit.ts';

test('mapGlucoseDisplayUnitToMeasurementUnit maps approved display symbols', () => {
  assert.equal(mapGlucoseDisplayUnitToMeasurementUnit('mmol_per_l'), 'mmol/L');
  assert.equal(mapGlucoseDisplayUnitToMeasurementUnit('mg_per_dl'), 'mg/dL');
});
