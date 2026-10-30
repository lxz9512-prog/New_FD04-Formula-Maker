import { demoEngine } from '@/demo/engine';
import { useDemo, useOperation, PageOperationState } from '@/demo/react';
import { demoLocal, demoSession } from '@/demo/storage';
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  ArrowLeft,
  Settings,
  ChevronRight,
  Minus,
  Plus,
  Play,
  Lock,
  Droplets,
  Milk,
  BarChart3,
  Square,
  AlertTriangle,
  X,
  FlaskConical,
  NotebookTabs,
  Shield,
  SlidersHorizontal,
  Thermometer,
  Baby,
} from 'lucide-react';
import './control-page.css';
import { getResourceWarnings, getResourceAlarms, isResourceBlocked } from './resource-warnings';
import IPhoneFrame from '@client/src/components/IPhoneFrame';
import { useDeviceData } from '@client/src/hooks/useDeviceData';
import { useTranslation } from '@client/src/hooks/useTranslation';
import { Image } from '@client/src/components/ui/image';
import deviceImage from '@/assets/fd04-device.png';
import {
  formatVolumeFromMl,
  formatVolumeFromOz,
  mlToOz,
  ozToMl,
  roundVolume,
  useVolumeUnit,
} from '@client/src/contexts/VolumeUnitContext';

const DEVICE_IMAGE_URL = deviceImage;
// Keep the original detailed resource panels available for future restoration.
const SHOW_LEGACY_WATER_DETAILS = false;
const SHOW_LEGACY_FORMULA_DETAILS = false;
const SHOW_LEGACY_QUALITY_DETAILS = false;
const SHOW_LEGACY_CHAMBER_DETAILS = false;

const NEUMORPHIC_SHADOW =
  '6px 6px 12px hsl(330 10% 85% / 0.25), -6px -6px 12px hsl(0 0% 100% / 0.8)';
const NEUMORPHIC_INSET =
  'inset 4px 4px 8px hsl(330 10% 85% / 0.2), inset -4px -4px 8px hsl(0 0% 100% / 0.7)';
const BUTTON_SHADOW =
  '4px 4px 8px hsl(330 10% 85% / 0.3), -4px -4px 8px hsl(0 0% 100% / 0.8)';

type Mode = 'milk' | 'water';
type ResourcePopup = 'water' | 'powder' | 'formula' | null;
type WaterQualityLevel = 'excellent' | 'good' | 'poor';

const getWaterQualityLevel = (tds: number): WaterQualityLevel => {
  if (tds >= 100) return 'poor';
  if (tds >= 50) return 'good';
  return 'excellent';
};

const WATER_TEMP_OPTIONS = [
  { mode: 'room', fahrenheit: null, celsius: null },
  { mode: 'heated', fahrenheit: 100, celsius: 37 },
  { mode: 'heated', fahrenheit: 104, celsius: 40 },
  { mode: 'heated', fahrenheit: 113, celsius: 45 },
  { mode: 'heated', fahrenheit: 122, celsius: 50 },
  { mode: 'heated', fahrenheit: 158, celsius: 70 },
] as const;
const WATER_CONFIG: Record<
  Mode,
  { min: number; max: number; step: number; defaultAmount: number }
> = {
  milk: { min: 1, max: 11, step: 1, defaultAmount: 2 },
  water: { min: 1, max: 10, step: 1, defaultAmount: 5 },
};
const POWDER_REMAINING_GRAMS = 60;
const POWDER_PER_CUP_GRAMS = 20;
const POWDER_REMAINING_CUPS = Math.floor(
  POWDER_REMAINING_GRAMS / POWDER_PER_CUP_GRAMS,
);

interface FormulaProfile {
  brand: string;
  productLine: string;
  ageRange: string;
  powderPerScoop: number;
  waterPerScoop: number;
}

const DEFAULT_FORMULA_PROFILE: FormulaProfile = {
  brand: 'Kabrita',
  productLine: 'Pro-Total Comfort',
  ageRange: '12+ months',
  powderPerScoop: 8.8,
  waterPerScoop: 2,
};

const readFormulaProfile = (): FormulaProfile => {
  const stored = demoLocal.getItem('formula_profile');
  if (!stored) return DEFAULT_FORMULA_PROFILE;

  try {
    return { ...DEFAULT_FORMULA_PROFILE, ...JSON.parse(stored) };
  } catch {
    demoLocal.removeItem('formula_profile');
    return DEFAULT_FORMULA_PROFILE;
  }
};

interface StepperButtonProps {
  icon: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}

const StepperButton2: React.FC<StepperButtonProps> = ({
  icon,
  label,
  disabled,
  onClick,
}) => (
  <motion.button
    whileTap={disabled ? {} : { scale: 0.9 }}
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-150 disabled:opacity-50"
    style={{
      background: 'transparent',
      color: disabled ? '#B0B0B0' : '#221122',
    }}
  >
    {icon}
  </motion.button>
);

interface BabyFormulaMakerProps {
  waterLow?: boolean;
  powderError?: boolean;
  waterQualityError?: boolean;
  completionOverlay?: React.ReactNode;
  powderCleanReminder?: boolean;
  powderCleanDue?: boolean;
  nightWaterLow?: boolean;
  cleaningIncomplete?: boolean;
  waterCalibrationReminder?: boolean;
  tubeCleanReminder?: boolean;
  waterLowDismissable?: boolean;
  powderErrorDismissable?: boolean;
}

const BabyFormulaMaker: React.FC<BabyFormulaMakerProps> = ({
  waterLow,
  powderError,
  waterQualityError,
  completionOverlay,
  powderCleanReminder,
  nightWaterLow,
  powderCleanDue,
  cleaningIncomplete,
  waterCalibrationReminder: waterCalibrationReminderProp,
  tubeCleanReminder: tubeCleanReminderProp,
  waterLowDismissable,
  powderErrorDismissable,
}) => {
  const { active: demoActive } = useDemo();
  const fault = demoActive?.request.operation === 'preparation.start' && demoActive.status === 'error'
    ? demoActive.scene?.presentation : undefined;
  waterLow = waterLow || fault === 'water';
  powderError = powderError || fault === 'powder';
  waterQualityError = waterQualityError || fault === 'quality';
  powderCleanDue = powderCleanDue || fault === 'chamber';
  const [waterLowDismissed, setWaterLowDismissed] = useState(false);
  const [powderErrorDismissed, setPowderErrorDismissed] = useState(false);
  const [dismissedChamberCount, setDismissedChamberCount] =
    useState<number | null>(null);
  const [waterCalibrationDismissed, setWaterCalibrationDismissed] =
    useState(false);
  const [tubeCleanDismissed, setTubeCleanDismissed] = useState(false);
  const showWaterCalibrationReminder =
    false && waterCalibrationReminderProp && !waterCalibrationDismissed; // FD06 no longer supports water calibration; retain legacy UI only.
  const showTubeCleanReminder = tubeCleanReminderProp && !tubeCleanDismissed;
  const { t, language } = useTranslation();
  const { unit } = useVolumeUnit();
  const [storedMixingChamberCount, setMixingChamberCount] = useState<number>(() => {
    const stored = demoLocal.getItem('mixing_chamber_count');
    return stored ? parseInt(stored, 10) : 0;
  });
  // Exception pages preview matching readings without overwriting device storage.
  const mixingChamberCount = powderCleanDue ? Math.max(8, storedMixingChamberCount)
    : powderCleanReminder ? 6 : storedMixingChamberCount;
  const mixingChamberBlocked = mixingChamberCount >= 8;
  const waterLowActive =
    waterLow && !(waterLowDismissable && waterLowDismissed);
  const powderErrorActive =
    powderError && !(powderErrorDismissable && powderErrorDismissed);
  const navigate = useNavigate();
  const location = useLocation();
  const isPrimaryControlPage = location.pathname === '/device';
  const [mode, setMode] = useState<Mode>('milk');
  const [hasFormulaProfile, setHasFormulaProfile] = useState(
    () => demoLocal.getItem('formula_profile_configured') === 'true',
  );
  const [formulaProfile, setFormulaProfile] =
    useState<FormulaProfile>(readFormulaProfile);
  const showFormulaControls = !isPrimaryControlPage || hasFormulaProfile;
  const formulaSetupRequired =
    isPrimaryControlPage && mode === 'milk' && !hasFormulaProfile;
  const [waterAmount, setWaterAmount] = useState(
    WATER_CONFIG['milk'].defaultAmount,
  );
  const displayedWaterAmount =
    unit === 'oz'
      ? roundVolume(waterAmount)
      : Math.round(ozToMl(waterAmount) / 10) * 10;
  const displayedWaterMin = unit === 'oz' ? WATER_CONFIG[mode].min : 30;
  const displayedWaterMax =
    unit === 'oz' ? WATER_CONFIG[mode].max : mode === 'milk' ? 330 : 300;
  const adjustWaterAmount = (direction: -1 | 1) => {
    if (unit === 'oz') {
      setWaterAmount((current) =>
        Math.min(
          WATER_CONFIG[mode].max,
          Math.max(
            WATER_CONFIG[mode].min,
            Math.round(current) + direction * WATER_CONFIG[mode].step,
          ),
        ),
      );
      return;
    }

    const nextMl = Math.min(
      displayedWaterMax,
      Math.max(displayedWaterMin, displayedWaterAmount + direction * 10),
    );
    setWaterAmount(mlToOz(nextMl));
  };
  const [waterTempIndex, setWaterTempIndex] = useState(2);
  const [childLock, setChildLock] = useState(false);
  const [nightLight, setNightLight] = useState(false);
  const [isMaking, setIsMaking] = useState(false);
  const [showFormulaToast, setShowFormulaToast] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resourcePopup, setResourcePopup] = useState<ResourcePopup>(null);
  const resourceHeroRef = useRef<HTMLDivElement>(null);
  const [resourceTrigger, setResourceTrigger] = useState<HTMLButtonElement | null>(null);
  const showSimpleWaterTip = !SHOW_LEGACY_WATER_DETAILS && resourcePopup === 'water' && resourceTrigger?.dataset.resource === 'water';
  const showSimpleFormulaTip = !SHOW_LEGACY_FORMULA_DETAILS && resourcePopup === 'formula';
  const showSimpleQualityTip = !SHOW_LEGACY_QUALITY_DETAILS && resourcePopup === 'water' && resourceTrigger?.dataset.resource === 'quality';
  const showSimpleChamberTip = !SHOW_LEGACY_CHAMBER_DETAILS && resourcePopup === 'powder';
  const showSimpleResourceTip = showSimpleWaterTip || showSimpleFormulaTip || showSimpleQualityTip || showSimpleChamberTip;
  const [resourcePosition, setResourcePosition] = useState({ left: 0, bottom: 0, width: 218, arrow: 24 });
  const toggleResourcePopup = (kind: Exclude<ResourcePopup, null>, trigger: HTMLButtonElement) => {
    setResourcePopup(resourcePopup === kind && resourceTrigger === trigger ? null : kind);
    setResourceTrigger(trigger);
  };

  useLayoutEffect(() => {
    const hero = resourceHeroRef.current;
    if (!resourcePopup || !resourceTrigger || !hero) return;
    const reposition = () => {
      const bounds = hero.getBoundingClientRect();
      const trigger = resourceTrigger.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      // The phone preview can be scaled; convert viewport coordinates to local CSS pixels.
      const scaleX = bounds.width / hero.offsetWidth;
      const scaleY = bounds.height / hero.offsetHeight;
      const center = (trigger.left + trigger.width / 2 - bounds.left) / scaleX;
      const width = Math.min(showSimpleResourceTip ? 288 : resourcePopup === 'powder' ? 174 : resourcePopup === 'formula' ? 214 : 218, hero.offsetWidth);
      const left = Math.max(0, Math.min(center - width / 2, hero.offsetWidth - width));
      setResourcePosition({
        left,
        width,
        bottom: (bounds.bottom - trigger.top) / scaleY + 10,
        arrow: Math.max(12, Math.min(center - left, width - 12)),
      });
    };
    reposition();
    const observer = new ResizeObserver(reposition);
    observer.observe(hero);
    observer.observe(resourceTrigger);
    window.addEventListener('resize', reposition);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', reposition);
    };
  }, [resourcePopup, resourceTrigger, language, unit, showSimpleResourceTip]);
  const [showCompleteToast, setShowCompleteToast] = useState(false);
  const [lastFeeding, setLastFeeding] = useState<{
    oz: number;
    time: string;
  } | null>(null);
  const [storedDeviceData, updateDeviceData] = useDeviceData();
  const deviceData = {
    ...storedDeviceData,
    waterAmount: waterLow ? 0 : storedDeviceData.waterAmount,
    powderAmount: powderError ? 0 : storedDeviceData.powderAmount,
    waterTds: waterQualityError ? 100 : storedDeviceData.waterTds,
  };
  const feedingHistory = (() => {
    try {
      const value: unknown = JSON.parse(demoLocal.getItem('feeding_history') || '[]');
      return Array.isArray(value)
        ? value.filter((entry): entry is { ml: number; time: string } =>
            typeof entry?.ml === 'number' && typeof entry?.time === 'string' && dayjs(entry.time).isValid())
        : [];
    } catch { return []; }
  })();
  const recentFeeding = feedingHistory[feedingHistory.length - 1];
  const elapsedMinutes = recentFeeding ? Math.max(0, dayjs().diff(dayjs(recentFeeding.time), 'minute')) : 165;
  const elapsedLabel = elapsedMinutes < 60
    ? (language === 'zh' ? `${elapsedMinutes}分钟前` : `${elapsedMinutes} min ago`)
    : elapsedMinutes < 1440
      ? (language === 'zh' ? `${Math.floor(elapsedMinutes / 60)}小时${elapsedMinutes % 60}分钟前` : `${Math.floor(elapsedMinutes / 60)} h ${elapsedMinutes % 60} min ago`)
      : (language === 'zh' ? `${Math.floor(elapsedMinutes / 1440)}天前` : `${Math.floor(elapsedMinutes / 1440)} d ago`);
  const todayFeedings = feedingHistory.filter((entry) => dayjs(entry.time).isSame(dayjs(), 'day'));
  const todayMl = feedingHistory.length ? todayFeedings.reduce((sum, entry) => sum + entry.ml, 0) : 980;
  const waterStale =
    dayjs().diff(dayjs(deviceData.lastWaterRefill), 'hour') >= 24;
  const waterQualityLevel = getWaterQualityLevel(deviceData.waterTds);
  // Tank level shown as three coarse steps (low / mid / high) instead of an exact volume.
  const waterLevelRatio =
    deviceData.waterCapacity > 0
      ? deviceData.waterAmount / deviceData.waterCapacity
      : 0;
  const waterLevel: 'low' | 'mid' | 'high' =
    waterLevelRatio < 0.3 ? 'low' : waterLevelRatio < 0.7 ? 'mid' : 'high';
  const waterLevelLabel =
    language === 'zh'
      ? { low: '低', mid: '中', high: '高' }[waterLevel]
      : { low: 'Low', mid: 'Mid', high: 'High' }[waterLevel];
  // The level is conveyed by colour only on the control surface; the wording lives in the tap detail.
  const waterLevelColors = { low: '#D2382A', mid: '#C47910', high: '#1F63AC' };
  const waterLevelColor = waterLevelColors[waterLevel];
  const resourceWarnings = getResourceWarnings(deviceData.waterAmount, deviceData.powderAmount, waterQualityLevel, mixingChamberCount);
  const showPowderCleanReminder =
    mixingChamberCount === 6 && dismissedChamberCount !== mixingChamberCount;
  const resourceAlarms = getResourceAlarms(deviceData.waterAmount, deviceData.powderAmount, waterQualityLevel, mixingChamberCount);
  const hasResourceAlarm = Object.values(resourceAlarms).some(Boolean);
  const isBlocked = !isMaking && !formulaSetupRequired && isResourceBlocked(resourceAlarms, mode);
  const resourceAlarmMessages = [
    resourceAlarms.water && (language === 'zh' ? '水箱水量不足，请先加水' : 'Not enough water in the tank. Please refill first.'),
    resourceAlarms.formula && (language === 'zh' ? '设备出粉异常，请检查是否缺粉或出粉口堵塞' : 'Formula dispensing error. Check whether the powder container is empty or the powder outlet is blocked.'),
    resourceAlarms.quality && (language === 'zh' ? '检测到水箱水质较差，为了宝宝健康，建议换新鲜的水' : "Poor water quality detected in the tank. For your baby's health, we recommend replacing it with fresh water."),
    resourceAlarms.chamber && (language === 'zh' ? '混合仓已使用 8 次或以上，请清洁后调奶' : 'Mixing chamber used 8 or more times. Clean before making formula.'),
  ].filter((message): message is string => Boolean(message));
  const resourceQualityLabel = waterQualityLevel === 'good'
    ? (language === 'zh' ? '一般' : 'Normal')
    : t(waterQualityLevel === 'excellent' ? 'maker.waterQualityExcellent' : 'maker.waterQualityPoor');
  const waterQuality = {
    excellent: {
      label: t('maker.waterQualityExcellent'),
      color: '#2E7D32',
      background: '#E8F5E9',
    },
    good: {
      label: t('maker.waterQualityGood'),
      color: '#B26A00',
      background: '#FFF4D6',
    },
    poor: {
      label: t('maker.waterQualityPoor'),
      color: '#C62828',
      background: '#FDECEC',
    },
  }[waterQualityLevel];
  const powderStale =
    dayjs().diff(dayjs(deviceData.lastPowderRefill), 'hour') >= 24;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedWaterTemperature = WATER_TEMP_OPTIONS[waterTempIndex];
  const isHighWaterTemperature = selectedWaterTemperature.mode === 'heated' && selectedWaterTemperature.celsius >= 50;

  useEffect(() => {
    if (!isMaking) {
      setProgress(0);
      return;
    }
    const totalMs = 4000;
    const stepMs = 50;
    const increment = (stepMs / totalMs) * 100;
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        return next >= 100 ? 100 : next;
      });
    }, stepMs);
    return () => clearInterval(interval);
  }, [isMaking]);

  useEffect(() => {
    setWaterAmount(WATER_CONFIG[mode].defaultAmount);
  }, [mode]);

  useEffect(() => {
    const handleReset = () => {
      setMixingChamberCount(0);
      setDismissedChamberCount(null);
      setHasFormulaProfile(false);
      setFormulaProfile(DEFAULT_FORMULA_PROFILE);
      setMode('milk');
    };
    const handleProfileUpdated = () => {
      setHasFormulaProfile(true);
      setFormulaProfile(readFormulaProfile());
    };

    window.addEventListener('resetMixingChamber', handleReset);
    window.addEventListener('formulaProfileUpdated', handleProfileUpdated);
    return () => {
      window.removeEventListener('resetMixingChamber', handleReset);
      window.removeEventListener('formulaProfileUpdated', handleProfileUpdated);
    };
  }, []);

  const handleBack = () => {
    navigate('/');
  };

  const completePreparation = () => {
      setIsMaking(false);
      if (mode === 'milk') {
        const oz = waterAmount;
        const tempC = selectedWaterTemperature.celsius;
        const waterTargetMl = oz * 29.5735;
        const powderTargetG = +(
          (oz / formulaProfile.waterPerScoop) *
          formulaProfile.powderPerScoop
        ).toFixed(1);
        const totalMilkTarget = +(oz + powderTargetG / 10).toFixed(1);

        const waterActualMl = +(
          waterTargetMl +
          (Math.random() - 0.3) * 6
        ).toFixed(1);
        const waterActualOz = +(waterActualMl / 29.5735).toFixed(1);
        const powderActualG = +(
          powderTargetG +
          (Math.random() - 0.3) * 1
        ).toFixed(1);
        // Room mode has no numeric target; the demo has no measured ambient temperature.
        const tempActualC = tempC === null ? null : Math.round(tempC + (Math.random() - 0.3) * 4);
        const totalMilkActual = +(waterActualOz + powderActualG / 10).toFixed(
          1,
        );

        const feedingHistory: Array<{
          ml: number;
          time: string;
          totalMilk: number;
        }> = JSON.parse(demoLocal.getItem('feeding_history') || '[]');
        const today = dayjs().format('YYYY-MM-DD');
        const todayFeedings = feedingHistory.filter(
          (f: { time: string }) => dayjs(f.time).format('YYYY-MM-DD') === today,
        );
        const todayCupCount = todayFeedings.length + 1;
        const todayCumulativeMl =
          todayFeedings.reduce(
            (sum: number, f: { ml: number }) => sum + f.ml,
            0,
          ) + Math.round(waterActualOz * 29.5735);

        let lastFeedingMl = 0;
        let lastFeedingElapsedH = 0;
        let lastFeedingElapsedM = 0;
        if (feedingHistory.length > 0) {
          const prev = feedingHistory[feedingHistory.length - 1];
          lastFeedingMl = prev.ml;
          const diffMs = dayjs().diff(dayjs(prev.time), 'minute');
          lastFeedingElapsedH = Math.floor(diffMs / 60);
          lastFeedingElapsedM = diffMs % 60;
        }

        feedingHistory.push({
          ml: Math.round(waterActualOz * 29.5735),
          time: dayjs().toISOString(),
          totalMilk: totalMilkActual,
        });
        demoLocal.setItem('feeding_history', JSON.stringify(feedingHistory));

        demoSession.setItem(
          'formula_result',
          JSON.stringify({
            waterTargetOz: oz,
            waterActualOz,
            powderTargetG,
            powderActualG,
            temperatureMode: selectedWaterTemperature.mode,
            tempTargetC: tempC,
            tempActualC: tempActualC,
            totalMilkTargetOz: totalMilkTarget,
            totalMilkActualOz: totalMilkActual,
            timestamp: dayjs().toISOString(),
            feedingStats: {
              todayCupCount,
              todayCumulativeMl,
              lastFeedingMl,
              lastFeedingElapsedH,
              lastFeedingElapsedM,
            },
          }),
        );

        const newCount = mixingChamberCount + 1;
        setMixingChamberCount(newCount);
        demoLocal.setItem('mixing_chamber_count', String(newCount));
        setLastFeeding({ oz, time: dayjs().format('HH:mm') });
        const waterUsedL = +(oz * 0.0295735).toFixed(4);
        updateDeviceData({
          waterAmount: Math.max(
            0,
            +(deviceData.waterAmount - waterUsedL).toFixed(4),
          ),
          powderAmount: Math.max(
            0,
            +(deviceData.powderAmount - powderTargetG).toFixed(1),
          ),
        });

        navigate('/formula-result');
      } else {
        setShowCompleteToast(true);
        timerRef.current = setTimeout(() => setShowCompleteToast(false), 2500);
      }

  };
  const startOperation = useOperation({
    operation: 'preparation.start', stage: 'preparation', label: mode === 'milk' ? '调奶' : '出水', delay: 4000,
    success: completePreparation, cancel: () => { setIsMaking(false); setProgress(0); },
    eligible: scene => scene.id !== 'preparation.powder' || mode === 'milk',
  }, () => {
    setMode('milk');
    // Preview-only prerequisites stay in component memory, not saved profiles.
    setHasFormulaProfile(true);
  });
  useEffect(() => { if (demoActive?.request.operation === 'preparation.start' && demoActive.status === 'error') setIsMaking(false); }, [demoActive?.status]);
  const handleStart = () => {
    if (isResourceBlocked(resourceAlarms, mode) || formulaSetupRequired || isMaking) return;
    setIsMaking(true); setProgress(0); startOperation();
  };
  const handleStop = () => { demoEngine.cancel(); setIsMaking(false); };
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleFormulaCardClick = () => {
    navigate('/formula-ratio');
  };

  const handleFirstUseFormula = () => {
    navigate('/scan-formula?source=first-use');
  };

  return (
    <IPhoneFrame
      background="linear-gradient(180deg, #FCECBD 0%, #FAF0D7 20%, #F9F5EB 35%, #F8F7F5 44%, #F8F7F5 100%)"
      overlay={
        completionOverlay ?? (cleaningIncomplete ? (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.45)' }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="mx-8 w-full rounded-[20px] bg-white p-6"
                style={{
                  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                  marginTop: -30,
                }}
              >
                <div className="mb-4 flex items-center justify-center">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ background: '#FFF7ED' }}
                  >
                    <AlertTriangle
                      className="h-6 w-6"
                      style={{ color: '#F97316' }}
                    />
                  </div>
                </div>
                <h3
                  className="mb-2 text-center text-[17px] font-semibold"
                  style={{ color: '#1A1A1A' }}
                >
                  {t('maker.cleanIncompleteTitle')}
                </h3>
                <p
                  className="mb-6 text-center text-[14px] leading-relaxed"
                  style={{ color: '#666666' }}
                >
                  {t('maker.cleanIncompleteDesc')}
                </p>
                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate('/')}
                    className="flex flex-1 items-center justify-center rounded-[26px] border h-[52px]"
                    style={{ borderColor: '#E5E5E5', background: 'white' }}
                  >
                    <span
                      className="text-[15px] font-medium"
                      style={{ color: '#666666' }}
                    >
                      {t('common.back')}
                    </span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() =>
                      navigate('/device-cleaning', {
                        state: { autoStartDescaling: true },
                      })
                    }
                    className="flex flex-1 items-center justify-center rounded-[26px] h-[52px]"
                    style={{ background: '#F97316' }}
                  >
                    <span className="text-[15px] font-semibold text-white">
                      {t('common.continue')}
                    </span>
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        ) : undefined)
      }
    >
      <div className="fd06-control relative flex h-full flex-col" inert={completionOverlay ? true : undefined} aria-hidden={completionOverlay ? true : undefined} data-warning={Boolean(waterLowActive || powderErrorActive || powderCleanDue || nightWaterLow || showPowderCleanReminder || showWaterCalibrationReminder || showTubeCleanReminder)}>
        {/* Navigation Bar */}
        <PageOperationState operations={['preparation.start']} />
        <div className="control-nav flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            aria-label={t('common.back')}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white"
            style={{ boxShadow: '0px 2px 6px rgba(0,0,0,0.06)' }}
          >
            <ChevronRight className="h-6 w-6 rotate-180" style={{ color: '#221122' }} />
          </motion.button>
          <h1
            className="text-[17px] font-semibold"
            style={{ color: '#221122' }}
          >
            {language === 'zh' ? t('maker.title') : 'Formula Disp...'}
          </h1>
          <div className="control-nav-actions">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
              demoSession.setItem('device_assistant_return_to', '/device');
              navigate('/device-assistant');
            }} aria-label={t('deviceAssistant.title')}>
              <NotebookTabs className="h-5 w-5" />
            </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/device-settings')}
            aria-label={language === 'zh' ? '设备设置' : 'Device settings'}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white"
            style={{ boxShadow: '0px 2px 6px rgba(0,0,0,0.06)' }}
          >
            <Settings className="h-5 w-5" style={{ color: '#221122' }} />
          </motion.button>
          </div>
        </div>

        {hasResourceAlarm && (
          <div className="resource-alarm-banner" role="alert">
            <AlertTriangle aria-hidden="true" />
            <div>
              {resourceAlarmMessages.map(message => <p key={message}>{message}</p>)}
              {resourceAlarms.chamber && <button type="button" className="control-alert-action" onClick={() => navigate('/faq/mixing-chamber-cleaning')}><span>{language === 'zh' ? '前往清洁' : 'Go to cleaning'}</span><ChevronRight aria-hidden="true" /></button>}
              {resourceAlarms.formula && <button type="button" className="control-alert-action" onClick={() => navigate('/faq/powder-output-error')}><span>{t('maker.troubleShooting')}</span><ChevronRight aria-hidden="true" /></button>}
            </div>
          </div>
        )}

        {/* Retained legacy exception banners; unified data-driven alarms take precedence. */}
        {!hasResourceAlarm && waterLow && (waterLowDismissable ? !waterLowDismissed : true) && (
          <div
            className="control-alert-overlay absolute z-20 left-5 right-5 flex items-center gap-2 rounded-[14px] px-3 py-2.5"
            style={{
              background: 'linear-gradient(135deg, #FFF7ED 0%, #FEE2CE 100%)',
              boxShadow: '0 4px 16px rgba(234, 88, 12, 0.15)',
            }}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'rgba(234, 88, 12, 0.12)' }}
            >
              <AlertTriangle className="h-4 w-4" style={{ color: '#EA580C' }} />
            </div>
            <span
              className="flex-1 text-[12px] font-medium leading-snug"
              style={{ color: '#C2410C' }}
            >
              {t('maker.waterLow')}
            </span>
            {waterLowDismissable && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setWaterLowDismissed(true)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{ background: 'rgba(234, 88, 12, 0.12)' }}
              >
                <X className="h-3 w-3" style={{ color: '#EA580C' }} />
              </motion.button>
            )}
          </div>
        )}

        {/* Powder Error Warning Banner */}
        {!hasResourceAlarm && powderError &&
          (powderErrorDismissable ? !powderErrorDismissed : true) && (
            <div
              className="control-alert-overlay absolute z-20 left-5 right-5 rounded-[14px] px-3 py-2.5"
              style={{
                background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
                boxShadow: '0 4px 16px rgba(185, 28, 28, 0.12)',
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'rgba(185, 28, 28, 0.1)' }}
                >
                  <AlertTriangle
                    className="h-4 w-4"
                    style={{ color: '#B91C1C' }}
                  />
                </div>
                <span
                  className="flex-1 text-[12px] font-medium leading-snug"
                  style={{ color: '#991B1B' }}
                >
                  {t('maker.powderError')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (powderErrorDismissable) {
                    setPowderErrorDismissed(true);
                  } else {
                    navigate('/faq/powder-output-error');
                  }
                }}
                className="control-alert-action control-alert-action-offset"
              >
                <span>
                  {t('maker.troubleShooting')}
                </span>
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
          )}

        {/* Mixing Chamber Clean Reminder Banner - warning, non-blocking */}
        {!hasResourceAlarm && showPowderCleanReminder && (
          <div
            className="control-alert-overlay absolute z-20 left-5 right-5 flex items-center gap-2 rounded-[14px] px-3 py-2.5"
            style={{
              background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
              boxShadow: '0 4px 16px rgba(217, 119, 6, 0.12)',
            }}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'rgba(217, 119, 6, 0.1)' }}
            >
              <AlertTriangle className="h-4 w-4" style={{ color: '#D97706' }} />
            </div>
            <span
              className="flex-1 text-[12px] font-medium leading-snug"
              style={{ color: '#92400E' }}
            >
              {t('maker.cleanReminder')}
            </span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setDismissedChamberCount(mixingChamberCount)}
              aria-label={t('common.close')}
              title={t('common.close')}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'rgba(217, 119, 6, 0.1)' }}
            >
              <X className="h-3 w-3" style={{ color: '#D97706' }} />
            </motion.button>
          </div>
        )}

        {/* Mixing Chamber Clean Due Banner - blocking */}
        {!hasResourceAlarm && powderCleanDue && (
          <div
            className="control-alert-overlay absolute z-20 left-5 right-5 flex items-center gap-2 rounded-[14px] px-3 py-2.5"
            style={{
              background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
              boxShadow: '0 4px 16px rgba(185, 28, 28, 0.12)',
            }}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'rgba(185, 28, 28, 0.1)' }}
            >
              <AlertTriangle className="h-4 w-4" style={{ color: '#B91C1C' }} />
            </div>
            <span
              className="text-[12px] font-medium leading-snug"
              style={{ color: '#991B1B' }}
            >
              {t('maker.cleanDue')}
            </span>
          </div>
        )}

        {/* Night Water Low Banner - advance warning, non-blocking */}
        {!hasResourceAlarm && nightWaterLow && (
          <div
            className="control-alert-overlay absolute z-20 left-5 right-5 flex items-center gap-2 rounded-[14px] px-3 py-2.5"
            style={{
              background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
              boxShadow: '0 4px 16px rgba(79, 70, 229, 0.12)',
            }}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'rgba(79, 70, 229, 0.1)' }}
            >
              <AlertTriangle className="h-4 w-4" style={{ color: '#4F46E5' }} />
            </div>
            <span
              className="text-[12px] font-medium leading-snug"
              style={{ color: '#3730A3' }}
            >
              {t('maker.nightWaterLow')}
            </span>
          </div>
        )}

        {/* Water Calibration Reminder Banner - dismissable */}
        {!hasResourceAlarm && showWaterCalibrationReminder && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="control-alert-overlay absolute z-20 left-5 right-5 flex items-center gap-2 rounded-[14px] px-3 py-2.5"
            style={{
              background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
              boxShadow: '0 4px 16px rgba(79, 70, 229, 0.12)',
            }}
            onClick={() => navigate('/water-calibration')}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'rgba(79, 70, 229, 0.1)' }}
            >
              <Droplets className="h-4 w-4" style={{ color: '#4F46E5' }} />
            </div>
            <span
              className="flex-1 text-[12px] font-medium leading-snug cursor-pointer"
              style={{ color: '#3730A3' }}
            >
              {t('maker.waterCalibrationReminder')}
            </span>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setWaterCalibrationDismissed(true);
              }}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'rgba(79, 70, 229, 0.1)' }}
            >
              <X className="h-3 w-3" style={{ color: '#4F46E5' }} />
            </motion.button>
          </motion.div>
        )}

        {/* Tube Clean Reminder Banner - dismissable with action link */}
        {!hasResourceAlarm && showTubeCleanReminder && (
          <div
            className="control-alert-overlay absolute z-20 left-5 right-5 rounded-[14px] px-3 py-2.5"
            style={{
              background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
              boxShadow: '0 4px 16px rgba(79, 70, 229, 0.12)',
            }}
          >
            <div className="flex items-center gap-2">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                style={{ background: 'rgba(79, 70, 229, 0.1)' }}
              >
                <AlertTriangle
                  className="h-4 w-4"
                  style={{ color: '#4F46E5' }}
                />
              </div>
              <span
                className="flex-1 text-[12px] font-medium leading-snug"
                style={{ color: '#3730A3' }}
              >
                {t('maker.tubeCleanReminder')}
              </span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setTubeCleanDismissed(true)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{ background: 'rgba(79, 70, 229, 0.1)' }}
              >
                <X className="h-3 w-3" style={{ color: '#4F46E5' }} />
              </motion.button>
            </div>
            <button
              type="button"
              onClick={() => navigate('/device-cleaning')}
              className="control-alert-action control-alert-action-offset"
            >
              <span>{t('maker.tubeCleanGo')}</span>
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div
          className={`control-scroll flex-1 space-y-4 overflow-y-auto px-5 pb-3 transition-opacity duration-300 ${
            isMaking || waterLowActive || powderErrorActive || powderCleanDue
              ? 'pointer-events-none opacity-40'
              : ''
          }`}
        >
          {/* Device Image with Resource Indicators */}
          <motion.div
            ref={resourceHeroRef}
            layout
            className="control-hero relative flex flex-col items-center justify-center"
          >
            <Image
              src={DEVICE_IMAGE_URL}
              alt="Baby Formula Maker Device"
              className="control-device object-contain"
            />

            <div className="control-resources control-resources--single">
              {/* Water Level Indicator */}
              <div className="resource-water min-w-0" data-warning={resourceWarnings.water} data-alarm={resourceAlarms.water}>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  aria-expanded={resourcePopup === 'water' && resourceTrigger?.dataset.resource === 'water'}
                  data-resource="water"
                  aria-label={`${t('maker.waterTank')}: ${waterLevelLabel}`}
                  aria-controls="resource-detail-panel"
                  onClick={(event) => toggleResourcePopup('water', event.currentTarget)}
                  className="relative flex h-[70px] w-full flex-col items-center justify-center gap-0.5 rounded-[14px] px-1.5"
                  style={{
                    background: 'white',
                    boxShadow:
                      resourcePopup === 'water'
                        ? 'inset 0 0 0 1.5px #5B9BD5, 4px 4px 10px hsl(330 10% 85% / 0.25)'
                        : '4px 4px 10px hsl(330 10% 85% / 0.3), -4px -4px 10px hsl(0 0% 100% / 0.8)',
                  }}
                >
                  <Droplets className="h-4 w-4" style={{ color: waterLevelColor }} />
                  <span className="text-[9px]" style={{ color: '#999497' }}>
                    {t('maker.waterTank')}
                  </span>
                  <span
                    className="water-level-gauge"
                    role="img"
                    aria-label={`${t('maker.waterTank')}: ${waterLevelLabel}`}
                  >
                    {(['low', 'mid', 'high'] as const).map((key) => (
                      <span
                        key={key}
                        className="water-level-seg"
                        data-level={key}
                        data-active={waterLevel === key}
                      />
                    ))}
                  </span>
                </motion.button>
              </div>
            </div>

            <AnimatePresence initial={false} mode="wait">
              {resourcePopup && (
                <motion.div
                  id="resource-detail-panel"
                  key={`${resourcePopup}-${resourceTrigger?.dataset.resource}`}
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className={showSimpleResourceTip ? 'water-tank-tip absolute z-20' : 'absolute z-20 rounded-[16px] px-2.5 py-2'}
                  style={{
                    width: resourcePosition.width,
                    left: resourcePosition.left,
                    bottom: resourcePosition.bottom,
                    transformOrigin: `${resourcePosition.arrow}px bottom`,
                    background: 'rgba(255,255,255,0.99)',
                    boxShadow:
                      '0 8px 24px rgba(72,48,34,0.12), 0 2px 6px rgba(72,48,34,0.06)',
                  }}
                >
                  <div
                    className="absolute -bottom-[4px] h-2 w-2"
                    style={{
                      left: resourcePosition.arrow,
                      transform: 'translateX(-50%) rotate(45deg)',
                      background: 'white',
                    }}
                  />
                  {showSimpleResourceTip && (
                    showSimpleWaterTip ? (
                      <div className="water-level-tip">
                        <div className="water-level-tip-head">
                          <span className="water-level-tip-icon">
                            <Droplets
                              size={22}
                              strokeWidth={1.6}
                              style={{ color: waterLevelColor }}
                              aria-hidden="true"
                            />
                          </span>
                          <div className="water-level-tip-body">
                            <p className="water-level-tip-title">
                              {language === 'zh'
                                ? `水箱水量：${waterLevelLabel}`
                                : `Water level: ${waterLevelLabel}`}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="water-level-tip-close"
                            aria-label={language === 'zh' ? '关闭提示' : 'Close tip'}
                            onClick={() => setResourcePopup(null)}
                          >
                            <X size={20} strokeWidth={1.5} />
                          </button>
                        </div>
                        <div className="water-level-legend">
                          {(['low', 'mid', 'high'] as const).map((key) => (
                            <span
                              key={key}
                              className="water-level-legend-item"
                              data-active={waterLevel === key}
                            >
                              <i style={{ background: waterLevelColors[key] }} />
                              {language === 'zh'
                                ? { low: '低', mid: '中', high: '高' }[key]
                                : { low: 'Low', mid: 'Mid', high: 'High' }[key]}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="water-tank-tip-content">
                        {showSimpleChamberTip ? <SlidersHorizontal className="water-tank-tip-icon" size={22} strokeWidth={1.6} aria-hidden="true" /> : showSimpleQualityTip ? <Shield className="water-tank-tip-icon" size={22} strokeWidth={1.6} aria-hidden="true" /> : showSimpleFormulaTip ? <Milk className="water-tank-tip-icon" size={22} strokeWidth={1.6} aria-hidden="true" /> : <Droplets className="water-tank-tip-icon" size={22} strokeWidth={1.6} aria-hidden="true" />}
                        <p>{showSimpleChamberTip
                          ? (language === 'zh' ? '混合仓清洁后的使用次数（每调奶 8 次后请清洁）' : 'Number of uses after cleaning the mixing tank (clean after every 8 batches of formula)')
                          : showSimpleFormulaTip
                          ? (language === 'zh' ? '奶粉仓内剩余奶粉量' : 'Amount of Formula Remaining in the Powder Container')
                          : showSimpleQualityTip
                            ? (language === 'zh' ? '水箱内水质状态' : 'Water Quality Status in the Tank')
                            : (language === 'zh' ? '水箱内剩余水量' : 'Remaining Water Level in the Tank')}</p>
                        <button type="button" aria-label={language === 'zh' ? '关闭提示' : 'Close tip'} onClick={() => setResourcePopup(null)}>
                          <X size={20} strokeWidth={1.5} />
                        </button>
                      </div>
                    )
                  )}
                  {/* Legacy resource details remain available through the flags above. */}
                  <div hidden={showSimpleResourceTip}>
                  <div className="mb-1.5 flex items-center gap-1.5">
                    {resourcePopup === 'powder' ? (
                      <FlaskConical
                        className="h-3.5 w-3.5"
                        style={{
                          color: mixingChamberBlocked ? '#DC2626' : '#C4956A',
                        }}
                      />
                    ) : resourcePopup === 'formula' ? (
                      <Milk
                        className="h-3.5 w-3.5"
                        style={{ color: '#8B4A1B' }}
                      />
                    ) : (
                      <Droplets
                        className="h-3.5 w-3.5"
                        style={{ color: '#5B9BD5' }}
                      />
                    )}
                    <span
                      className="text-[12px] font-semibold"
                      style={{ color: '#221122' }}
                    >
                      {resourcePopup === 'powder'
                        ? t('maker.mixingChamber')
                        : resourcePopup === 'formula'
                          ? t('maker.formulaCan')
                          : t('maker.waterTank')}
                    </span>
                    <button
                      type="button"
                      aria-label="关闭详情"
                      title="关闭详情"
                      onClick={() => setResourcePopup(null)}
                      className="ml-auto flex h-4 w-4 items-center justify-center rounded-full"
                      style={{ background: '#F5F3F2', color: '#99918D' }}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>

                  {resourcePopup === 'powder' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[11px]"
                          style={{ color: '#999497' }}
                        >
                          {t('maker.useCount')}
                        </span>
                        <span
                          className="text-[13px] font-bold"
                          style={{
                            color: mixingChamberBlocked ? '#DC2626' : '#221122',
                          }}
                        >
                          {mixingChamberCount}次
                        </span>
                      </div>
                      {mixingChamberBlocked && (
                        <div
                          className="mt-1.5 flex items-center gap-1 rounded-[7px] px-2 py-1"
                          style={{ background: '#FEF2F2' }}
                        >
                          <AlertTriangle
                            className="h-3 w-3 shrink-0"
                            style={{ color: '#DC2626' }}
                          />
                          <span
                            className="text-[11px] leading-tight"
                            style={{ color: '#DC2626' }}
                          >
                            {t('maker.cleanDue')}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  {resourcePopup === 'formula' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[11px]"
                          style={{ color: '#999497' }}
                        >
                          {t('maker.remaining')}
                        </span>
                        <span
                          className="text-[13px] font-bold"
                          style={{ color: '#221122' }}
                        >
                          {t('maker.powderCupsRemaining', {
                            cups: Math.floor(deviceData.powderAmount / POWDER_PER_CUP_GRAMS),
                            grams: Math.round(deviceData.powderAmount),
                          })}
                        </span>
                      </div>
                      <div
                        className="mt-1.5 rounded-[7px] px-2 py-1.5 text-[9px] leading-relaxed"
                        style={{ color: '#7A6E68', background: '#F8F3EE' }}
                      >
                        {t('maker.powderAverageBasis', {
                          grams: POWDER_PER_CUP_GRAMS,
                        })}
                      </div>
                    </>
                  )}

                  {resourcePopup === 'water' && (
                    <>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[11px]"
                          style={{ color: '#999497' }}
                        >
                          {t('maker.remaining')}
                        </span>
                        <span
                          className="text-[12px] font-semibold"
                          style={{ color: '#221122' }}
                        >
                          {formatVolumeFromMl(deviceData.waterAmount * 1000, unit)}{' '}
                          /{' '}
                          {formatVolumeFromMl(deviceData.waterCapacity * 1000, unit)}
                        </span>
                      </div>
                      <div
                        className="mb-1.5 mt-1 h-[4px] overflow-hidden rounded-full"
                        style={{ background: '#F0EFEE' }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.round((deviceData.waterAmount / deviceData.waterCapacity) * 100)}%`,
                            background: '#5B9BD5',
                          }}
                        />
                      </div>
                      <div
                        className="flex items-center justify-between border-y py-1.5"
                        style={{ borderColor: '#F0EFEE' }}
                      >
                        <span
                          className="text-[11px]"
                          style={{ color: '#999497' }}
                        >
                          {t('maker.waterQualityTds')}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-[12px] font-semibold"
                            style={{ color: '#221122' }}
                          >
                            {deviceData.waterTds} ppm
                          </span>
                          <span
                            className="rounded-full px-1.5 py-1 text-[10px] font-semibold leading-none"
                            style={{
                              color: waterQuality.color,
                              background: waterQuality.background,
                            }}
                          >
                            {waterQuality.label}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span
                          className="text-[11px]"
                          style={{ color: '#999497' }}
                        >
                          {t('maker.lastRefill')}
                        </span>
                        <span
                          className="text-[12px] font-medium"
                          style={{ color: '#221122' }}
                        >
                          {dayjs(deviceData.lastWaterRefill).format(
                            'MM/DD HH:mm',
                          )}
                        </span>
                      </div>
                      {waterStale && (
                        <div
                          className="mt-2 flex items-center gap-1 rounded-[8px] px-2 py-1.5"
                          style={{ background: '#FFF7ED' }}
                        >
                          <AlertTriangle
                            className="h-3 w-3 shrink-0"
                            style={{ color: '#E67E22' }}
                          />
                          <span
                            className="text-[11px] leading-tight"
                            style={{ color: '#E67E22' }}
                          >
                            {t('maker.waterStale')}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/feeding-stats')}
            className="control-last-feed"
            aria-label={t('maker.feedingStats')}
          >
            <span className="last-feed-label">{language === 'zh' ? '最近一次调奶' : 'Recent'}</span>
            <ChevronRight className="last-feed-chevron" />
            <div className="last-feed-values">
              <span className="last-feed-amount" aria-label={formatVolumeFromMl(recentFeeding?.ml ?? 90, unit)}>
                <strong>{roundVolume(unit === 'ml' ? (recentFeeding?.ml ?? 90) : mlToOz(recentFeeding?.ml ?? 90))}</strong>
                <span>{unit}</span>
              </span>
              <span className="last-feed-elapsed" aria-label={elapsedLabel}>
                {elapsedLabel.split(/(\d+)/).filter(Boolean).map((part, index) =>
                  /^\d+$/.test(part)
                    ? <strong key={index}>{part}</strong>
                    : <span key={index}>{part}</span>
                )}
              </span>
            </div>
            <span className="last-feed-today">{language === 'zh' ? '今日' : 'Today'} {formatVolumeFromMl(todayMl, unit)}</span>
            <span className="last-feed-chart" aria-hidden="true">
              {(todayFeedings.length ? todayFeedings.slice(-7).map((entry) => Math.max(6, Math.min(32, entry.ml / 6))) : [20, 22, 14, 26, 20, 32, 20]).map((height, index) => <i key={index} style={{ height }} />)}
            </span>
          </motion.button>

          {/* Mode Toggle */}
          <div
            className="control-mode flex h-[46px] rounded-[24px] p-1"
            style={{
              background: '#F0EFEE',
            }}
          >
            {(['milk', 'water'] as const).map((m) => (
              <motion.button
                key={m}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode(m)}
                className="relative flex flex-1 items-center justify-center rounded-[18px] text-[15px] transition-all duration-200"
                style={
                  mode === m
                    ? {
                        background: 'white',
                        boxShadow: '0px 2px 6px rgba(0,0,0,0.05)',
                        color: '#221122',
                        fontWeight: 600,
                      }
                    : {
                        background: 'transparent',
                        color: '#999497',
                        fontWeight: 400,
                      }
                }
              >
                {m === 'milk' ? t('maker.milk') : t('maker.water')}
              </motion.button>
            ))}
          </div>

          {/* First-use formula setup */}
          {isPrimaryControlPage && mode === 'milk' && !hasFormulaProfile && (
            <motion.button
              data-connector="formula-first-use"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleFirstUseFormula}
              className="w-full rounded-[20px] bg-white px-5 py-4 text-left"
              style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.04)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'hsl(24 67% 32% / 0.08)' }}
                >
                  <FlaskConical
                    className="h-4 w-4"
                    style={{ color: '#7D3C0F' }}
                  />
                </div>
                <p
                  className="text-[13px] font-semibold"
                  style={{ color: '#8B4A1B' }}
                >
                  {t('deviceSettings.formulaRatio')}
                </p>
              </div>

              <p
                className="mt-3 text-balance text-[17px] font-semibold leading-[1.45]"
                style={{ color: '#221122' }}
              >
                {t('maker.firstUseFormulaTitle')}
              </p>
              <p
                className="mt-2 text-[13px] leading-relaxed"
                style={{ color: '#999497' }}
              >
                {t('maker.firstUseFormulaDesc')}
              </p>

              <div
                className="mt-4 flex items-center justify-between border-t pt-3"
                style={{ borderColor: '#F0EEEE' }}
              >
                <span
                  className="text-[14px] font-semibold"
                  style={{ color: '#7D3C0F' }}
                >
                  {t('maker.addFormulaInfo')}
                </span>
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-full"
                  style={{ background: 'hsl(24 67% 32% / 0.08)' }}
                >
                  <ChevronRight
                    className="h-4 w-4"
                    style={{ color: '#7D3C0F' }}
                  />
                </div>
              </div>
            </motion.button>
          )}

          {/* Formula Selection Card - only visible in milk mode */}
          <div className="control-parameters">
          {mode === 'milk' && showFormulaControls && (
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={handleFormulaCardClick}
              className="control-formula flex cursor-pointer items-center justify-between rounded-[20px] bg-white px-4 py-3"
              style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.04)' }}
            >
              <div>
                <p
                  className="text-[17px] font-semibold"
                  style={{ color: '#221122' }}
                >
                  <Milk className="mr-2 inline-block h-4 w-4" />{formulaProfile.brand}
                </p>
                <p className="mt-0.5 text-[13px]" style={{ color: '#999497' }}>
                  {t('maker.formulaRatioConfigured', {
                    powder: formulaProfile.powderPerScoop.toString(),
                    water: formatVolumeFromOz(
                      formulaProfile.waterPerScoop,
                      unit,
                    ),
                  })}
                </p>
              </div>
              <ChevronRight className="h-5 w-5" style={{ color: '#999497' }} />
            </motion.div>
          )}

          {/* Stepper Cards */}
          {(mode === 'water' || showFormulaControls) && (
            <div
              data-connector="water-stepper"
              className="control-steppers rounded-[20px] bg-white p-4"
              style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.04)' }}
            >
              {/* Water Amount */}
              <div className="control-stepper-row">
                <div className="flex items-center gap-1.5 mb-2">
                  <Baby className="h-4 w-4" />
                  <span
                    className="text-[15px] font-medium"
                    style={{ color: '#221122' }}
                  >
                    {mode === 'water'
                      ? t('maker.waterAmount')
                      : language === 'zh' ? '调奶量' : 'Formula Amount'}
                  </span>
                </div>
                <div
                  className="flex h-[44px] items-center justify-between rounded-[12px] px-2"
                  style={{ background: '#F5F5F5' }}
                >
                  <StepperButton2
                    label={language === 'zh' ? '减少水量' : 'Decrease amount'}
                    icon={<Minus className="h-5 w-5" />}
                    disabled={displayedWaterAmount <= displayedWaterMin}
                    onClick={() => adjustWaterAmount(-1)}
                  />
                  <motion.span
                    key={waterAmount}
                    initial={false}
                    animate={{ scale: 1 }}
                    className="flex-1 text-center text-[17px] font-semibold"
                    style={{ color: '#221122' }}
                  >
                    {displayedWaterAmount} {unit}
                  </motion.span>
                  <StepperButton2
                    label={language === 'zh' ? '增加水量' : 'Increase amount'}
                    icon={<Plus className="h-5 w-5" />}
                    disabled={displayedWaterAmount >= displayedWaterMax}
                    onClick={() => adjustWaterAmount(1)}
                  />
                </div>
                {mode === 'milk' && (
                  <p
                    className="mt-2 pl-2 text-[13px]"
                    style={{ color: '#999497' }}
                  >
                    {t('maker.mixWithConfigured', {
                      amount: parseFloat(
                        (
                          (waterAmount / formulaProfile.waterPerScoop) *
                          formulaProfile.powderPerScoop
                        ).toFixed(2),
                      ).toString(),
                      water: formatVolumeFromOz(
                        formulaProfile.waterPerScoop,
                        unit,
                      ),
                    })}
                  </p>
                )}
              </div>

              {/* Water Temp */}
              <div className="control-stepper-row">
                <div className="flex items-center gap-1.5 mb-2">
                  <Thermometer className="h-4 w-4" />
                  <span
                    className="text-[15px] font-medium"
                    style={{ color: '#221122' }}
                  >
                    {t('maker.waterTemp')}
                  </span>
                </div>
                <div
                  className="flex h-[44px] items-center justify-between rounded-[12px] px-2"
                  style={{ background: '#F5F5F5' }}
                >
                  <StepperButton2
                    label={language === 'zh' ? '降低水温' : 'Decrease temperature'}
                    icon={<Minus className="h-5 w-5" />}
                    disabled={waterTempIndex <= 0}
                    onClick={() =>
                      setWaterTempIndex(Math.max(0, waterTempIndex - 1))
                    }
                  />
                  <motion.span
                    key={waterTempIndex}
                    initial={false}
                    animate={{ scale: 1 }}
                    className="control-temperature-value flex-1 whitespace-nowrap text-center text-[17px] font-semibold"
                    style={{
                      color:
                        isHighWaterTemperature
                          ? '#E67E22'
                          : '#221122',
                    }}
                  >
                    {selectedWaterTemperature.mode === 'room'
                      ? t('maker.roomTemp')
                      : `${selectedWaterTemperature.celsius} °C`}
                  </motion.span>
                  <StepperButton2
                    label={language === 'zh' ? '提高水温' : 'Increase temperature'}
                    icon={<Plus className="h-5 w-5" />}
                    disabled={waterTempIndex >= WATER_TEMP_OPTIONS.length - 1}
                    onClick={() =>
                      setWaterTempIndex(
                        Math.min(
                          WATER_TEMP_OPTIONS.length - 1,
                          waterTempIndex + 1,
                        ),
                      )
                    }
                  />
                </div>
                {isHighWaterTemperature && (
                  <p
                    className="mt-2 pl-2 text-[12px]"
                    style={{ color: '#E67E22' }}
                  >
                    {t('maker.highTempWarning')}
                  </p>
                )}
              </div>
            </div>
          )}
          </div>

          {/* Child Lock */}
          <div
            className="flex items-center justify-between rounded-[20px] bg-white px-4 py-3"
            style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.04)' }}
          >
            <div>
              <span
                className="text-[16px] font-medium"
                style={{ color: '#221122' }}
              >
                {t('maker.childLock')}
              </span>
            </div>
            <motion.button
              type="button"
              aria-pressed={childLock}
              onClick={() => setChildLock(!childLock)}
              className="relative h-[22px] w-[40px] rounded-full p-[2px] transition-colors duration-300 disabled:cursor-default"
              style={{
                backgroundColor: childLock ? '#7D3C0F' : '#E8E8E8',
              }}
            >
              <motion.div
                className="h-[18px] w-[18px] rounded-full bg-white"
                style={{
                  boxShadow: childLock
                    ? 'none'
                    : 'inset 0 0 0 1px rgba(0,0,0,0.08)',
                }}
                animate={{ x: childLock ? 16 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </motion.button>
          </div>

          {/* Night Light */}
          <div
            data-connector="night-light"
            className="rounded-[20px] bg-white px-4 py-3"
            style={{ boxShadow: '0px 4px 12px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[16px] font-medium"
                style={{ color: '#221122' }}
              >
                {t('maker.nightLight')}
              </span>
              <motion.button
                type="button"
                aria-pressed={nightLight}
                onClick={() => setNightLight(!nightLight)}
                className="relative h-[22px] w-[40px] rounded-full p-[2px] transition-colors duration-300"
                style={{
                  backgroundColor: nightLight ? '#7D3C0F' : '#E8E8E8',
                }}
              >
                <motion.div
                  className="h-[18px] w-[18px] rounded-full bg-white"
                  style={{
                    boxShadow: nightLight
                      ? 'none'
                      : 'inset 0 0 0 1px rgba(0,0,0,0.08)',
                  }}
                  animate={{ x: nightLight ? 16 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>
          </div>

        </div>

        {/* Start Button - Fixed at bottom */}
        <div
          className="control-start relative z-10 shrink-0 px-5 pb-6 pt-2"
        >
          <motion.button
            hidden
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/feeding-stats')}
            className="mb-1.5 flex h-5 w-full items-center justify-center gap-2 whitespace-nowrap"
          >
            <span className="text-[11px]" style={{ color: '#999497' }}>
              {t('maker.lastFeed')}
            </span>
            <span
              className="text-[12px] font-medium tabular-nums"
              style={{ color: '#5E555A' }}
            >
              {lastFeeding
                ? `${lastFeeding.time} · ${formatVolumeFromOz(lastFeeding.oz, unit)}`
                : `06:30 · ${formatVolumeFromOz(4, unit)}`}
            </span>
            <BarChart3 className="h-3.5 w-3.5" style={{ color: '#8B4A1B' }} />
          </motion.button>

          <div className={isBlocked ? 'pointer-events-none' : ''}>
            <button
              type="button"
              disabled={isBlocked}
              onClick={() => {
                if (formulaSetupRequired) {
                  handleFirstUseFormula();
                  return;
                }
                if (waterLowDismissable && waterLowDismissed) {
                  setWaterLowDismissed(false);
                  return;
                }
                if (powderErrorDismissable && powderErrorDismissed) {
                  setPowderErrorDismissed(false);
                  return;
                }
                if (isMaking) {
                  handleStop();
                } else {
                  handleStart();
                }
              }}
              className="relative flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-[26px] text-[17px] font-semibold text-white transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed"
            >
              {isMaking && (
                <div
                  className="absolute left-0 top-0 h-full transition-all duration-100 ease-linear"
                  style={{
                    width: `${progress}%`,
                    background:
                      'linear-gradient(90deg, rgba(255,200,140,0.45) 0%, rgba(255,220,170,0.55) 60%, rgba(255,235,195,0.6) 100%)',
                    borderRadius: '26px 0 0 26px',
                  }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {isMaking ? (
                  <Square className="h-4 w-4 fill-current" />
                ) : formulaSetupRequired ? (
                  <Plus className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 fill-current" />
                )}
                {isMaking
                  ? t('maker.stop')
                  : formulaSetupRequired
                    ? t('maker.configureFormulaFirst')
                    : mode === 'milk'
                      ? (language === 'zh' ? '开始' : 'Start')
                      : (language === 'zh' ? '开始出水' : 'Start')}
              </span>
            </button>
          </div>
        </div>

        {/* Water-only completion toast; formula completion uses the result sheet. */}
        <AnimatePresence>
          {showCompleteToast && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="absolute top-16 right-5 left-5 z-30 flex items-center gap-3 rounded-[12px] px-4 py-2.5"
              style={{
                background: 'white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              }}
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={{ background: '#67C273' }}
              >
                <svg
                  className="h-3.5 w-3.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-[15px]" style={{ color: '#2c222b' }}>
                {mode === 'milk' ? t('maker.milkReady') : t('maker.waterReady')}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Formula Detail Toast */}
        <AnimatePresence>
          {showFormulaToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 right-5 left-5 z-30 rounded-2xl bg-foreground/80 px-4 py-3 text-center text-sm text-white backdrop-blur-sm"
            >
              {t('maker.formulaToast')}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </IPhoneFrame>
  );
};

export default BabyFormulaMaker;
