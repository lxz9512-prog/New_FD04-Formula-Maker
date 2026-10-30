import { test } from 'node:test';
import assert from 'node:assert/strict';
function memoryStorage() {
  const data = new Map();
  return {
    get length() {
      return data.size;
    },
    key: (n) => [...data.keys()][n] ?? null,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}
globalThis.window = {
  localStorage: memoryStorage(),
  sessionStorage: memoryStorage(),
};
const { demoLocal, demoSession, PREFIX, resetStageData } =
  await import('../client/src/demo/storage.ts');
test('isolated storage never reads or clears original same-origin keys', () => {
  window.localStorage.setItem('formula_profile', 'original');
  assert.equal(demoLocal.getItem('formula_profile'), null);
  demoLocal.setItem('formula_profile', 'copy');
  assert.equal(window.localStorage.getItem(PREFIX + 'formula_profile'), 'copy');
  demoLocal.clear();
  assert.equal(window.localStorage.getItem('formula_profile'), 'original');
});
test('stage reset clears owned data and leaves other business stages untouched', () => {
  demoLocal.setItem('formula_profile', 'formula');
  demoLocal.setItem('device_data', 'device');
  demoLocal.setItem('mixing_chamber_count', '3');
  demoLocal.setItem('feeding_records', 'records');
  demoSession.setItem('formula_result', 'result');
  resetStageData('preparation');
  assert.equal(demoLocal.getItem('device_data'), null);
  assert.equal(demoLocal.getItem('mixing_chamber_count'), null);
  assert.equal(demoSession.getItem('formula_result'), null);
  assert.equal(demoLocal.getItem('formula_profile'), 'formula');
  assert.equal(demoLocal.getItem('feeding_records'), 'records');
  demoLocal.clear();
  demoSession.clear();
});
