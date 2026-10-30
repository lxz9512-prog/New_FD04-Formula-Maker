import { demoLocal } from '@/demo/storage';
import React, { useEffect, createContext, useContext, useMemo, useState } from 'react';

export type VolumeUnit = 'ml' | 'oz';

export const ML_PER_OZ = 29.5735;

export const roundVolume = (value: number) => Number(value.toFixed(1));
export const ozToMl = (value: number) => roundVolume(value * ML_PER_OZ);
export const mlToOz = (value: number) => value / ML_PER_OZ;

export const formatVolumeFromOz = (value: number, unit: VolumeUnit) =>
  unit === 'oz'
    ? `${roundVolume(value)} oz`
    : `${roundVolume(value * ML_PER_OZ)} ml`;

export const formatVolumeFromMl = (value: number, unit: VolumeUnit) =>
  unit === 'ml'
    ? `${roundVolume(value)} ml`
    : `${roundVolume(value / ML_PER_OZ)} oz`;

interface VolumeUnitContextValue {
  unit: VolumeUnit;
  setUnit: (unit: VolumeUnit) => void;
}

const VolumeUnitContext = createContext<VolumeUnitContextValue | null>(null);

export const VolumeUnitProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [unit, setUnitState] = useState<VolumeUnit>(() =>
    demoLocal.getItem('demo_volume_unit') === 'ml' ? 'ml' : 'oz',
  );

  useEffect(() => {
    const reset = () => setUnitState('oz');
    window.addEventListener('demo-data-reset', reset);
    return () => window.removeEventListener('demo-data-reset', reset);
  }, []);

  const value = useMemo<VolumeUnitContextValue>(
    () => ({
      unit,
      setUnit: (nextUnit) => {
        setUnitState(nextUnit);
        demoLocal.setItem('demo_volume_unit', nextUnit);
      },
    }),
    [unit],
  );

  return (
    <VolumeUnitContext.Provider value={value}>
      {children}
    </VolumeUnitContext.Provider>
  );
};

export const useVolumeUnit = () => {
  const context = useContext(VolumeUnitContext);
  if (!context) {
    throw new Error('useVolumeUnit must be used within VolumeUnitProvider');
  }
  return context;
};
