/** Isolated mock data. Never reads or clears the original app's storage keys. */
export const PREFIX = 'New_FD04_demo_v1:';
function isolated(storage: Storage) {
  return {
    getItem: (key: string) => storage.getItem(PREFIX + key),
    setItem: (key: string, value: string) =>
      storage.setItem(PREFIX + key, value),
    removeItem: (key: string) => storage.removeItem(PREFIX + key),
    clear: () => {
      for (let i = storage.length - 1; i >= 0; i--) {
        const key = storage.key(i);
        if (key?.startsWith(PREFIX)) storage.removeItem(key);
      }
    },
  };
}
export const demoLocal = isolated(window.localStorage);
export const demoSession = isolated(window.sessionStorage);
export function resetStageData(stage: string) {
  const keys: Record<string, string[]> = {
    devices: [],
    settings: ['device_data'],
    baby: ['fd04_baby_profile'],
    preparation: ['device_data', 'mixing_chamber_count'],
    capture: ['capture_draft'],
    formula: [
      'formula_profiles',
      'selected_formula_id',
      'formula_profile',
      'formula_profile_configured',
    ],
    sync: [
      'formula_profiles',
      'selected_formula_id',
      'formula_profile',
      'formula_profile_configured',
    ],
    cleaning: ['cleaning_complete'],
    feeding: ['feeding_history', 'feeding_records', 'fd04_baby_profile'],
  };
  for (const key of keys[stage] ?? []) demoLocal.removeItem(key);
  if (stage === 'preparation') demoSession.removeItem('formula_result');
}
