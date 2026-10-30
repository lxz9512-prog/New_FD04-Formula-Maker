import { useOperation, PageOperationState } from '@/demo/react';
import { PageBackIcon } from '@/components/PageNavigation';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import './device-cleaning.css';
import descalingDevice from '@/assets/fd06-descaling-side.png';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Droplets,
  Thermometer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Beaker,
  Sparkles,
  ExternalLink,
  Headset,
  Home,
} from 'lucide-react';
import IPhoneFrame from '@client/src/components/IPhoneFrame';
import { Link as UniversalLink } from 'react-router-dom';
import { useTranslation } from '@client/src/hooks/useTranslation';
import {
  formatVolumeFromMl,
  useVolumeUnit,
} from '@client/src/contexts/VolumeUnitContext';

type CleaningMode = 'descaling' | 'sterilization';
type CleaningStep = 'select' | 'prepare' | 'running' | 'pause' | 'complete';
type RunningPhase = 'phase1' | 'phase2' | null;
type CleaningDialog = 'startDescaling' | 'exitSterilization' | null;

interface CleaningStatus {
  temperature: number;
  waterOutput: number;
  fanRunning: boolean;
  currentCycle: number;
  totalCycles: number;
  remainingTime: number;
  powerFlashing: boolean;
}

interface StepInfo {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const getDescalingSteps = (
  t: (key: string, params?: Record<string, string | number>) => string,
): StepInfo[] => [
  {
    title: t('cleaning.stepDescaling1'),
    description: t('cleaning.stepDescaling1Desc'),
    icon: <Beaker className="h-5 w-5" />,
  },
  {
    title: t('cleaning.stepPlaceContainer'),
    description: t('cleaning.stepPlaceContainerDesc'),
    icon: <Droplets className="h-5 w-5" />,
  },
  {
    title: t('cleaning.stepStartDescaling'),
    description: t('cleaning.stepStartDescalingDesc'),
    icon: <Play className="h-5 w-5" />,
  },
];

const getSterilizationSteps = (
  t: (key: string, params?: Record<string, string | number>) => string,
): StepInfo[] => [
  {
    title: t('cleaning.stepAddWater'),
    description: t('cleaning.stepAddWaterDesc'),
    icon: <Droplets className="h-5 w-5" />,
  },
  {
    title: t('cleaning.stepPlaceContainer'),
    description: t('cleaning.stepPlaceContainer2Desc'),
    icon: <Droplets className="h-5 w-5" />,
  },
  {
    title: t('cleaning.stepStartSterilization'),
    description: t('cleaning.stepStartSterilizationDesc'),
    icon: <Thermometer className="h-5 w-5" />,
  },
];

const DeviceCleaning: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useTranslation();
  const { unit } = useVolumeUnit();
  const formatUnitText = (value: string) => {
    if (unit === 'ml') return value;
    return value.replace(/(\d+(?:\.\d+)?)mL/g, (_, amount: string) =>
      formatVolumeFromMl(Number(amount), unit),
    );
  };
  const unitAwareT = (key: string, params?: Record<string, string | number>) =>
    formatUnitText(t(key, params));
  const [selectedMode, setSelectedMode] = useState<CleaningMode | null>(() => (location.state as { autoStartDescaling?: boolean } | null)?.autoStartDescaling ? 'descaling' : null);
  const [currentStep, setCurrentStep] = useState<CleaningStep>('select');
  const [dialog, setDialog] = useState<CleaningDialog>(null);
  const [prepareStep, setPrepareStep] = useState<1 | 2>(1);
  const [phase2PrepareStep, setPhase2PrepareStep] = useState<1 | 2>(1);
  const isDescalingPrepare =
    currentStep === 'prepare' && selectedMode === 'descaling';
  const [runningPhase, setRunningPhase] = useState<RunningPhase>(null);
  const isDescalingRunning =
    currentStep === 'running' && selectedMode === 'descaling';
  const isDescalingComplete =
    currentStep === 'complete' && selectedMode === 'descaling';
  const isDescalingPhase2Prepare =
    currentStep === 'pause' &&
    selectedMode === 'descaling' &&
    runningPhase === 'phase2';
  const isSterilizationRunning =
    currentStep === 'running' && selectedMode === 'sterilization';
  const showDescalingHomeButton = isDescalingRunning && !isDescalingComplete;
  const [descalingProgress, setDescalingProgress] = useState(0);
  const [status, setStatus] = useState<CleaningStatus>({
    temperature: 26,
    waterOutput: 0,
    fanRunning: false,
    currentCycle: 0,
    totalCycles: 5,
    remainingTime: 0,
    powerFlashing: false,
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoStarted = useRef(false);
  const [tubeStatus, setTubeStatus] = useState(230);

  const clearCleaningTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const simulateDescalingPhase1 = useCallback(() => {
    clearCleaningTimer();
    setDescalingProgress(0);
    const startedAt = performance.now();
    // Five-second demo, followed by a two-second completion checkmark.
    timerRef.current = setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const progress = Math.min(100, Math.floor(elapsed / 50));
      setDescalingProgress(progress);
      setStatus((prev) => ({
        ...prev,
        temperature: Math.min(50, 26 + progress * 0.8),
        waterOutput: progress === 100 ? 350 : Math.floor(progress / 20) * 30,
        fanRunning: progress > 0 && progress < 100,
        currentCycle: Math.floor(progress / 20),
        remainingTime: 0,
        powerFlashing: progress === 100,
      }));
      if (elapsed >= 7000) {
        clearCleaningTimer();
        setPhase2PrepareStep(1);
        setRunningPhase('phase2');
        setCurrentStep('pause');
      }
    }, 50);
  }, []);

  const simulateDescalingPhase2 = useCallback(() => {
    clearCleaningTimer();
    setDescalingProgress(0);
    const startedAt = performance.now();
    timerRef.current = setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const progress = Math.min(100, Math.floor(elapsed / 50));
      setDescalingProgress(progress);
      setStatus((prev) => ({
        ...prev,
        temperature: Math.min(45, 26 + progress * 0.38),
        waterOutput: 350 + Math.round((350 * progress) / 100),
        currentCycle: Math.floor(progress / 20),
        fanRunning: progress > 0 && progress < 100,
        remainingTime: 0,
        powerFlashing: false,
      }));
      // Keep stage 2 complete until the user chooses to return to settings.
      if (progress === 100) {
        clearCleaningTimer();
        setCurrentStep('complete');
      }
    }, 50);
  }, []);

  const simulateSterilization = useCallback(() => {
    let cycle = 0;
    let subStep = 0;
    let temp = 26;

    timerRef.current = setInterval(() => {
      setStatus((prev) => {
        let newTemp = prev.temperature;
        let newWater = prev.waterOutput;
        let newFan = prev.fanRunning;
        let newCycle = prev.currentCycle;
        let remaining = prev.remainingTime;

        if (subStep === 0) {
          newWater = 150;
          newFan = true;
          subStep = 1;
        } else if (subStep === 1) {
          newTemp = Math.min(70, prev.temperature + 5);
          newFan = false;
          if (newTemp >= 70) {
            subStep = 2;
            remaining = 180;
          }
        } else if (subStep === 2) {
          remaining = Math.max(0, prev.remainingTime - 1);
          newFan = true;
          if (remaining <= 0) {
            cycle++;
            if (cycle < 3) {
              subStep = 3;
              newCycle = cycle;
            } else {
              subStep = 4;
              newCycle = 3;
            }
          }
        } else if (subStep === 3) {
          newTemp = 26;
          subStep = 1;
        } else if (subStep === 4) {
          newTemp = Math.max(40, prev.temperature - 5);
          newFan = false;
          if (newTemp <= 40) {
            subStep = 5;
          }
        } else if (subStep === 5) {
          newWater = prev.waterOutput + 50;
          newFan = true;
          clearCleaningTimer();
          setCurrentStep('complete');
          return {
            ...prev,
            temperature: 40,
            waterOutput: newWater,
            fanRunning: false,
            currentCycle: 3,
          };
        }

        return {
          ...prev,
          temperature: newTemp,
          waterOutput: newWater,
          fanRunning: newFan,
          currentCycle: newCycle,
          remainingTime: remaining,
        };
      });
    }, 100);
  }, []);

  const beginCleaning = () => {
    setCurrentStep('running');
    setStatus((prev) => ({
      ...prev,
      waterOutput: 0,
      currentCycle: 0,
      powerFlashing: false,
    }));

    if (selectedMode === 'descaling') {
      setRunningPhase('phase1');
      simulateDescalingPhase1();
    } else {
      setRunningPhase(null);
      simulateSterilization();
    }
  };

  const startCleaningOperation = useOperation({ operation: 'cleaning.start', stage: 'cleaning', label: '启动管路清洁', success: beginCleaning }, () => { setSelectedMode('descaling'); setPrepareStep(2); setCurrentStep('prepare'); });
  const handleStartCleaning = () => startCleaningOperation();

  // Reminder deep links cross the same mock boundary as the normal start button.
  useEffect(() => {
    const state = location.state as { autoStartDescaling?: boolean } | null;
    if (state?.autoStartDescaling && !hasAutoStarted.current) {
      hasAutoStarted.current = true;
      setCurrentStep('prepare');
      setPrepareStep(2);
      startCleaningOperation();
      window.history.replaceState({ ...window.history.state, usr: null }, document.title);
    }
  }, [location.state, startCleaningOperation]);

  const handleContinuePhase2 = () => {
    setStatus((prev) => ({
      ...prev,
      temperature: 26,
      currentCycle: 0,
      powerFlashing: false,
    }));
    setCurrentStep('running');
    simulateDescalingPhase2();
  };

  const handleStartDescaling = () => {
    setSelectedMode('descaling');
    setPrepareStep(1);
    setCurrentStep('prepare');
  };

  const handleDialogConfirm = () => {
    const kind = dialog;
    setDialog(null);
    if (kind === 'startDescaling') {
      handleStartDescaling();
    } else if (kind === 'exitSterilization') {
      clearCleaningTimer();
      navigate('/device-settings');
    }
  };

  const handleReset = () => {
    clearCleaningTimer();
    if (selectedMode === 'descaling' && currentStep === 'complete') {
      setTubeStatus(0);
    }
    setCurrentStep('select');
    setPrepareStep(1);
    setPhase2PrepareStep(1);
    setSelectedMode(null);
    setRunningPhase(null);
    setStatus({
      temperature: 26,
      waterOutput: 0,
      fanRunning: false,
      currentCycle: 0,
      totalCycles: 5,
      remainingTime: 0,
      powerFlashing: false,
    });
  };

  useEffect(() => {
    return () => {
      clearCleaningTimer();
    };
  }, []);

  const getCurrentStatusText = (): string => {
    if (currentStep === 'complete') return t('cleaning.statusComplete');
    if (currentStep === 'pause') return t('cleaning.statusWaiting');
    if (
      status.temperature < 50 &&
      selectedMode === 'descaling' &&
      runningPhase === 'phase1'
    ) {
      return t('cleaning.statusHeating');
    }
    if (status.fanRunning && status.remainingTime > 0) {
      return t('cleaning.statusHolding');
    }
    if (status.fanRunning) {
      return t('cleaning.statusPumping');
    }
    return t('cleaning.statusStandby');
  };

  const getTubeStatusInfo = (value: number) => {
    if (value <= 200)
      return {
        label: t('cleaning.tubeExcellent'),
        color: '#52C41A',
        bg: '#F6FFED',
      };
    if (value <= 250)
      return { label: t('cleaning.tubeGood'), color: '#FAAD14', bg: '#FFFBE6' };
    return { label: t('cleaning.tubeFair'), color: '#FF4D4F', bg: '#FFF2F0' };
  };

  const renderModeSelect = () => {
    return (
      <main className="tube-cleaning-content">
        <section>
          <h2 className="tube-section-title">{t('cleaning.currentStatus')}</h2>
          <div className="tube-status-card">
            <span>{t('cleaning.sinceLastClean')}</span>
            <strong>{t('cleaning.bottlesMade', { count: tubeStatus })}</strong>
          </div>
        </section>
        <section className="tube-modes">
          <h2 className="tube-section-title">{t('cleaning.selectMode')}</h2>
          <div className="tube-mode-card">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setDialog('startDescaling')}
              className="tube-mode-button"
            >
              <span className="tube-mode-copy">
                <span className="tube-mode-title">
                  <Droplets size={20} strokeWidth={1.6} />
                  {t('cleaning.descaling')}
                </span>
                <span className="tube-mode-description">
                  {t('cleaning.descalingDesc')}
                </span>
              </span>
              <ChevronRight
                className="tube-mode-chevron"
                size={21}
                strokeWidth={1.6}
              />
            </motion.button>
            <UniversalLink
              to="https://www.momcozy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="tube-purchase-link"
            >
              <ExternalLink size={15} />
              {t('cleaning.buyDescaling')}
            </UniversalLink>
          </div>
          <div className="tube-mode-card">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedMode('sterilization');
                setCurrentStep('prepare');
              }}
              className="tube-mode-button"
            >
              <span className="tube-mode-copy">
                <span className="tube-mode-title">
                  <Thermometer size={20} strokeWidth={1.6} />
                  {t('cleaning.sterilizationMode')}
                </span>
                <span className="tube-mode-description">
                  {t('cleaning.sterilizationDesc')}
                </span>
              </span>
              <ChevronRight
                className="tube-mode-chevron"
                size={21}
                strokeWidth={1.6}
              />
            </motion.button>
          </div>
        </section>
        <section className="tube-recommendations">
          <h2 className="tube-section-title">{t('cleaning.tips')}</h2>
          <ol>
            <li>{t('cleaning.tip1')}</li>
            <li>{t('cleaning.tip2')}</li>
            <li>{t('cleaning.tip3')}</li>
          </ol>
        </section>
      </main>
    );
  };

  const renderDescalingPrepare = () => {
    const first = prepareStep === 1;
    return (
      <main className="descaling-prepare">
        <div className="descaling-prepare-copy">
          <p className="descaling-step-label">
            {language === 'zh' ? `步骤 ${prepareStep}` : `Step ${prepareStep}`}
          </p>
          <h2>
            {language === 'zh'
              ? first
                ? '准备除垢溶液'
                : '放置接水容器'
              : first
                ? 'Prepare the descaling solution'
                : 'Place the collection container'}
          </h2>
          <div
            className="descaling-step-track"
            aria-label={
              language === 'zh'
                ? `第 ${prepareStep} 步，共 2 步`
                : `Step ${prepareStep} of 2`
            }
          >
            <span className={first ? 'active' : ''} />
            <span className={!first ? 'active' : ''} />
          </div>
          <p className="descaling-step-description">
            {unitAwareT(
              first
                ? 'cleaning.stepDescaling1Desc'
                : 'cleaning.stepPlaceContainerDesc',
            )}
          </p>
        </div>
        <div className="descaling-device-illustration">
          <img
            src={descalingDevice}
            alt={
              language === 'zh' ? '调奶器侧面示意图' : 'Formula maker side view'
            }
          />
        </div>
        <div className="descaling-prepare-footer">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => (first ? setPrepareStep(2) : handleStartCleaning())}
          >
            {!first && <Play size={21} fill="currentColor" />}
            {first
              ? language === 'zh'
                ? '继续'
                : 'Continue'
              : t('cleaning.startClean')}
          </motion.button>
        </div>
      </main>
    );
  };

  const renderPrepareSteps = () => {
    const steps =
      selectedMode === 'descaling'
        ? getDescalingSteps(unitAwareT)
        : getSterilizationSteps(unitAwareT);
    const modeTitle =
      selectedMode === 'descaling'
        ? t('cleaning.descalingModeLabel')
        : t('cleaning.sterilizationModeLabel');
    const modeColor = selectedMode === 'descaling' ? '#F97316' : '#EF4444';

    return (
      <div className="flex flex-1 flex-col px-5 pt-4">
        <h2
          className="mb-4 text-[18px] font-semibold"
          style={{ color: '#1A1A1A' }}
        >
          {t('cleaning.prepareSteps', { mode: modeTitle })}
        </h2>

        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-[14px] bg-white p-4"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: index === 2 ? `${modeColor}15` : '#F5F5F5',
                }}
              >
                <span style={{ color: index === 2 ? modeColor : '#888888' }}>
                  {step.icon}
                </span>
              </div>
              <div className="flex-1">
                <p
                  className="text-[14px] font-medium"
                  style={{ color: '#1A1A1A' }}
                >
                  {index + 1}. {step.title}
                </p>
                <p
                  className="mt-1 text-[12px] leading-relaxed"
                  style={{ color: '#666666' }}
                >
                  {step.description}
                </p>
                {selectedMode === 'descaling' && index === 0 && (
                  <UniversalLink
                    to="https://www.momcozy.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 rounded-[8px] px-2.5 py-1.5"
                    style={{ background: '#FFF7ED' }}
                  >
                    <ExternalLink
                      className="h-3.5 w-3.5"
                      style={{ color: '#F97316' }}
                    />
                    <span
                      className="text-[12px] font-medium"
                      style={{ color: '#F97316' }}
                    >
                      {t('cleaning.buyDescaling')}
                    </span>
                  </UniversalLink>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex-1" />

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleStartCleaning}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-[26px] h-[52px]"
          style={{ background: modeColor }}
        >
          <Play className="h-5 w-5 text-white" />
          <span className="text-[15px] font-semibold text-white">
            {t('cleaning.startClean')}
          </span>
        </motion.button>
      </div>
    );
  };

  const renderDescalingRunning = () => {
    const progress = descalingProgress;
    const finished = progress === 100;
    const stage = runningPhase === 'phase2' ? 2 : 1;

    return (
      <div className="descaling-running">
        <div
          className="descaling-progress"
          role="progressbar"
          aria-label={language === 'zh' ? '清洁进度' : 'Cleaning progress'}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-valuetext={
            finished
              ? language === 'zh'
                ? `阶段 ${stage} 清洁完成`
                : `Stage ${stage} cleaning complete`
              : `${progress}%`
          }
        >
          <svg viewBox="0 0 250 250" aria-hidden="true">
            <defs>
              <linearGradient
                id="descaling-progress-fill"
                x1="0"
                y1="0"
                x2="0.3"
                y2="1"
              >
                <stop offset="0%" stopColor="#FFE17D" />
                <stop offset="100%" stopColor="#FFFCF2" />
              </linearGradient>
              <linearGradient
                id="descaling-check-fill"
                x1="0"
                y1="1"
                x2="1"
                y2="0"
              >
                <stop offset="0%" stopColor="#CF9D43" />
                <stop offset="55%" stopColor="#91511E" />
                <stop offset="100%" stopColor="#B78032" />
              </linearGradient>
            </defs>
            <circle
              cx="125"
              cy="125"
              r="109"
              fill="url(#descaling-progress-fill)"
            />
            {finished ? (
              <path
                d="M106 131 Q112 133 116 140 Q133 114 144 110"
                fill="none"
                stroke="url(#descaling-check-fill)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <>
                <circle
                  cx="125"
                  cy="125"
                  r="119"
                  fill="none"
                  stroke="#F2CE55"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="1 10"
                />
                <circle
                  cx="125"
                  cy="125"
                  r="119"
                  fill="none"
                  stroke="#F2CE55"
                  strokeWidth="4"
                  strokeLinecap="round"
                  pathLength="100"
                  strokeDasharray={`${progress} 100`}
                  transform="rotate(-90 125 125)"
                  opacity={progress > 0 ? 1 : 0}
                />
              </>
            )}
          </svg>
          {!finished && <span>{progress}%</span>}
        </div>
        <h2>
          {language === 'zh' ? (finished ? '清洁完成' : '清洁中') : 'Cleaning'}
        </h2>
        {!finished && (
          <p className="descaling-running-temperature">
            {language === 'zh' ? '温度' : 'Temp'}:{' '}
            {Math.round(status.temperature)} °C
          </p>
        )}
        {isDescalingComplete ? (
          <p role="status">
            {language === 'zh'
              ? '清洁已完成，可以继续调奶。'
              : 'Cleaning is complete. You can now prepare formula.'}
          </p>
        ) : finished && stage === 1 ? (
          <p role="status">
            {language === 'zh'
              ? '第一阶段清洁完成，即将自动跳转下一步'
              : 'Stage 1 cleaning is complete. The next step will start automatically.'}
          </p>
        ) : (
          <p>
            {language === 'zh'
              ? `${stage === 1 ? '共进行五轮清洁，' : ''}预计需要 5 分钟，请耐心等待。`
              : stage === 1
                ? 'Five cleaning cycles take about 5 minutes. Please wait while cleaning is in progress.'
                : 'Cleaning takes about 5 minutes. Please wait while cleaning is in progress.'}
          </p>
        )}
        {showDescalingHomeButton && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/')}
            className="mt-auto flex h-[50px] w-full items-center justify-center gap-2 rounded-[26px]"
            style={{
              background: '#FFFFFF',
              border: '1px solid #EADFD2',
              color: '#6B6360',
            }}
          >
            <Home className="h-4 w-4" strokeWidth={1.8} />
            <span className="text-[15px] font-medium">
              {t('cleaning.backToHome')}
            </span>
          </motion.button>
        )}
      </div>
    );
  };

  const renderRunningStatus = () => {
    const modeColor = selectedMode === 'descaling' ? '#F97316' : '#EF4444';
    const isPhase2 = runningPhase === 'phase2';

    return (
      <div className="flex flex-1 flex-col px-5 pt-4">
        <div className="mb-6 flex items-center justify-between">
          <h2
            className="text-[18px] font-semibold"
            style={{ color: '#1A1A1A' }}
          >
            {isPhase2
              ? t('cleaning.runningPhase2')
              : t('cleaning.runningInProgress')}
          </h2>
          {status.powerFlashing && (
            <span
              className="text-[12px] font-medium"
              style={{ color: modeColor }}
            >
              {t('cleaning.powerFlash')}
            </span>
          )}
        </div>

        <div
          className="mb-6 rounded-[20px] p-5"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f8f8 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[13px]" style={{ color: '#666666' }}>
              {t('cleaning.currentStatus')}
            </span>
            <span
              className="text-[13px] font-medium"
              style={{ color: modeColor }}
            >
              {getCurrentStatusText()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div
              className="rounded-[12px] bg-white p-3"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <Thermometer className="h-4 w-4" style={{ color: modeColor }} />
                <span className="text-[12px]" style={{ color: '#888888' }}>
                  {t('cleaning.waterTemp')}
                </span>
              </div>
              <p className="text-[24px] font-bold" style={{ color: '#1A1A1A' }}>
                {status.temperature}°C
              </p>
            </div>

            <div
              className="rounded-[12px] bg-white p-3"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <Droplets className="h-4 w-4" style={{ color: '#3B82F6' }} />
                <span className="text-[12px]" style={{ color: '#888888' }}>
                  {t('cleaning.waterOutput')}
                </span>
              </div>
              <p className="text-[24px] font-bold" style={{ color: '#1A1A1A' }}>
                {formatVolumeFromMl(status.waterOutput, unit)}
              </p>
            </div>

            <div
              className="rounded-[12px] bg-white p-3"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <div className="mb-1 flex items-center gap-1.5">
                <RotateCcw className="h-4 w-4" style={{ color: modeColor }} />
                <span className="text-[12px]" style={{ color: '#888888' }}>
                  {t('cleaning.cycles')}
                </span>
              </div>
              <p
                className="text-[14px] font-medium"
                style={{ color: '#1A1A1A' }}
              >
                {status.currentCycle} / {selectedMode === 'descaling' ? 5 : 3}{' '}
                {t('cleaning.cycleUnit')}
              </p>
            </div>
          </div>

          {status.remainingTime > 0 && (
            <div
              className="mt-4 rounded-[10px] p-3"
              style={{ background: `${modeColor}10` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px]" style={{ color: '#666666' }}>
                  {t('cleaning.countdown')}
                </span>
                <span
                  className="text-[14px] font-bold"
                  style={{ color: modeColor }}
                >
                  {Math.floor(status.remainingTime / 60)}:
                  {String(status.remainingTime % 60).padStart(2, '0')}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1" />

        {selectedMode === 'descaling' && runningPhase === 'phase1' && (
          <div
            className="mb-4 rounded-[12px] p-3"
            style={{ background: '#FEF3C7' }}
          >
            <div className="flex items-start gap-2">
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: '#D97706' }}
              />
              <p
                className="text-[12px] leading-relaxed"
                style={{ color: '#92400E' }}
              >
                {formatUnitText(t('cleaning.phase1Tip'))}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderPauseScreen = () => {
    if (isDescalingPhase2Prepare) {
      const first = phase2PrepareStep === 1;
      return (
        <main className="descaling-prepare">
          <div className="descaling-prepare-copy">
            <p className="descaling-step-label">
              {language === 'zh'
                ? `步骤 ${phase2PrepareStep}`
                : `Step ${phase2PrepareStep}`}
            </p>
            <h2>
              {language === 'zh'
                ? first
                  ? '清洗水箱并加水'
                  : '放置接水容器'
                : first
                  ? 'Clean and refill the water tank'
                  : 'Place the collection container'}
            </h2>
            <div
              className="descaling-step-track"
              aria-label={
                language === 'zh'
                  ? `第 ${phase2PrepareStep} 步，共 2 步`
                  : `Step ${phase2PrepareStep} of 2`
              }
            >
              <span className={first ? 'active' : ''} />
              <span className={!first ? 'active' : ''} />
            </div>
            <p className="descaling-step-description">
              {first
                ? formatUnitText(
                    language === 'zh'
                      ? '请清洗水箱，并重新加入不少于600mL的干净清水。'
                      : 'Clean the water tank, then refill it with at least 600mL of fresh water.',
                  )
                : formatUnitText(
                    language === 'zh'
                      ? '请在接水盘处放置容量大于400mL的接水容器。'
                      : 'Place a container on the drip tray. It must hold more than 400mL.',
                  )}
            </p>
          </div>
          <div className="descaling-device-illustration">
            <img
              src={descalingDevice}
              alt={
                language === 'zh'
                  ? '调奶器侧面示意图'
                  : 'Formula maker side view'
              }
            />
          </div>
          <div className="descaling-prepare-footer">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                first ? setPhase2PrepareStep(2) : handleContinuePhase2()
              }
            >
              {!first && <Play size={21} fill="currentColor" />}
              {first
                ? language === 'zh'
                  ? '继续'
                  : 'Continue'
                : language === 'zh'
                  ? '开始清洁'
                  : 'Start Cleaning'}
            </motion.button>
          </div>
        </main>
      );
    }
    const modeColor = selectedMode === 'descaling' ? '#F97316' : '#EF4444';

    return (
      <div className="flex flex-1 flex-col items-center justify-center px-5">
        <div
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: `${modeColor}15` }}
        >
          <Pause className="h-10 w-10" style={{ color: modeColor }} />
        </div>

        <h2
          className="mb-2 text-[20px] font-semibold"
          style={{ color: '#1A1A1A' }}
        >
          {runningPhase === 'phase2'
            ? t('cleaning.pausePreparePhase2')
            : t('cleaning.pauseTitle')}
        </h2>

        <p
          className="mb-8 text-center text-[14px]"
          style={{ color: '#666666' }}
        >
          {runningPhase === 'phase2'
            ? formatUnitText(t('cleaning.pausePhase2Desc'))
            : formatUnitText(t('cleaning.pauseDesc'))}
        </p>

        {runningPhase === 'phase2' ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleContinuePhase2}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-[26px] h-[52px]"
            style={{ background: modeColor }}
          >
            <Play className="h-5 w-5 text-white" />
            <span className="text-[15px] font-semibold text-white">
              {t('cleaning.continueClean')}
            </span>
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setCurrentStep('running');
              if (selectedMode === 'descaling') {
                simulateDescalingPhase1();
              } else {
                simulateSterilization();
              }
            }}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-[26px] h-[52px]"
            style={{ background: modeColor }}
          >
            <Play className="h-5 w-5 text-white" />
            <span className="text-[15px] font-semibold text-white">
              {t('cleaning.continueClean')}
            </span>
          </motion.button>
        )}
      </div>
    );
  };

  const renderCompleteScreen = () => {
    if (isDescalingComplete) {
      return (
        <>
          {renderDescalingRunning()}
          <div className="descaling-prepare-footer">
            <button type="button" onClick={() => navigate('/device-settings')}>
              {t('cleaning.backToSettings')}
            </button>
          </div>
        </>
      );
    }
    const modeColor = selectedMode === 'descaling' ? '#F97316' : '#EF4444';

    return (
      <div className="flex flex-1 flex-col items-center justify-center px-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: '#DCFCE7' }}
        >
          <CheckCircle2 className="h-10 w-10" style={{ color: '#22C55E' }} />
        </motion.div>

        <h2
          className="mb-2 text-[20px] font-semibold"
          style={{ color: '#1A1A1A' }}
        >
          {t('cleaning.completeTitle')}
        </h2>

        <p
          className="mb-8 text-center text-[14px]"
          style={{ color: '#666666' }}
        >
          {selectedMode === 'descaling'
            ? t('cleaning.completeDescaling')
            : t('cleaning.completeSterilization')}
        </p>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/device-settings')}
          className="flex w-full items-center justify-center gap-2 rounded-[26px] border h-[52px]"
          style={{ borderColor: '#E5E5E5', background: 'white' }}
        >
          <span
            className="text-[15px] font-medium"
            style={{ color: '#666666' }}
          >
            {t('cleaning.backToSettings')}
          </span>
        </motion.button>
      </div>
    );
  };

  const renderDialog = () => {
    if (!dialog) return null;
    const isStart = dialog === 'startDescaling';
    const accent = isStart ? '#F97316' : '#EF4444';

    return (
      <motion.div
        key={dialog}
        className="absolute inset-0 z-40 flex items-center justify-center px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        style={{ background: 'rgba(26, 20, 16, 0.38)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 6 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="w-full rounded-[26px] bg-white px-5 pb-4 pt-6"
          style={{ boxShadow: '0 20px 52px rgba(26,20,16,0.22)' }}
        >
          <div className="flex flex-col items-center text-center">
            <span
              className="flex h-[54px] w-[54px] items-center justify-center rounded-full"
              style={{ background: `${accent}18` }}
            >
              <AlertCircle
                className="h-7 w-7"
                strokeWidth={1.7}
                style={{ color: accent }}
              />
            </span>
            <h2
              className="mt-3 text-[17px] font-semibold leading-tight"
              style={{ color: '#1A1A1A' }}
            >
              {isStart
                ? t('cleaning.startDescalingTitle')
                : t('cleaning.exitTitle')}
            </h2>
            <p
              className="mt-2.5 text-[13px] leading-[1.55]"
              style={{ color: '#7A7377' }}
            >
              {isStart
                ? t('cleaning.startDescalingNotice')
                : t('cleaning.exitDesc')}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={handleDialogConfirm}
              className="h-[46px] w-full rounded-[15px] text-[15px] font-semibold text-white"
              style={{ background: accent }}
            >
              {isStart ? t('common.continue') : t('cleaning.exitConfirm')}
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => setDialog(null)}
              className="h-[46px] w-full rounded-[15px] text-[15px] font-semibold"
              style={{ background: '#F5F1ED', color: '#6B6360' }}
            >
              {t('common.cancel')}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <IPhoneFrame
      background={
        isDescalingPrepare ||
        isDescalingRunning ||
        isDescalingPhase2Prepare ||
        isDescalingComplete
          ? '#F9F7F6'
          : currentStep === 'select'
            ? '#F8F7F5'
            : '#F7F7F7'
      }
      overlay={<AnimatePresence>{dialog && renderDialog()}</AnimatePresence>}
    >
      <div
        className={`flex h-full flex-col ${currentStep === 'select' ? 'tube-cleaning-page' : ''}`}
      >
        <PageOperationState operations={['cleaning.start']} />
        <div className="fd06-page-nav">
          {(currentStep !== 'running' && !isDescalingComplete) ||
          isSterilizationRunning ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (isSterilizationRunning) {
                  setDialog('exitSterilization');
                  return;
                }
                if (isDescalingPhase2Prepare) {
                  if (phase2PrepareStep === 2) setPhase2PrepareStep(1);
                  else handleReset();
                } else if (currentStep === 'prepare') {
                  if (isDescalingPrepare && prepareStep === 2)
                    setPrepareStep(1);
                  else handleReset();
                } else {
                  navigate(-1);
                }
              }}
              aria-label={t('common.back')}
              className="fd06-page-back"
            >
              <PageBackIcon />
            </motion.button>
          ) : (
            <div className="h-8 w-8" />
          )}
          <h1
            className="text-[16px] font-semibold"
            style={{ color: '#1A1A1A' }}
          >
            {isDescalingComplete ||
            isDescalingPhase2Prepare ||
            (isDescalingRunning && runningPhase === 'phase2')
              ? language === 'zh'
                ? '阶段 2'
                : 'Stage 2'
              : isDescalingRunning
                ? language === 'zh'
                  ? '阶段 1'
                  : 'Stage 1'
                : isDescalingPrepare
                  ? language === 'zh'
                    ? '阶段 1/2'
                    : 'Stage 1/2'
                  : t('cleaning.title')}
          </h1>
          {currentStep === 'select' ||
          isDescalingPrepare ||
          isDescalingRunning ||
          isDescalingPhase2Prepare ||
          isDescalingComplete ? (
            <button
              type="button"
              className="fd06-page-back"
              aria-label={t('deviceAssistant.title')}
              onClick={() => navigate('/device-assistant')}
            >
              <Headset size={23} strokeWidth={1.6} />
            </button>
          ) : (
            <div className="h-8 w-8" />
          )}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {currentStep === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="tube-cleaning-scroll"
            >
              {renderModeSelect()}
            </motion.div>
          )}

          {currentStep === 'prepare' && (
            <motion.div
              key="prepare"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              {isDescalingPrepare
                ? renderDescalingPrepare()
                : renderPrepareSteps()}
            </motion.div>
          )}

          {currentStep === 'running' && (
            <motion.div
              key="running"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 flex-col"
            >
              {isDescalingRunning
                ? renderDescalingRunning()
                : renderRunningStatus()}
            </motion.div>
          )}

          {currentStep === 'pause' && (
            <motion.div
              key="pause"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              {renderPauseScreen()}
            </motion.div>
          )}

          {currentStep === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-1 flex-col"
            >
              {renderCompleteScreen()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </IPhoneFrame>
  );
};

export default DeviceCleaning;
