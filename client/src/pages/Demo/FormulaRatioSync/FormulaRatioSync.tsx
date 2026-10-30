// @ts-expect-error Existing published navigation helper is a JS module.
import { openFormulaEditor, ratioSyncScreenState } from '@/demo/formula-edit-navigation.js';
import { useLocation } from 'react-router-dom';
import { useOperation, PageOperationState } from '@/demo/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, BellRing, Check, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import BabyFormulaMaker from '@client/src/pages/BabyFormulaMaker/BabyFormulaMaker';
import { useTranslation } from '@client/src/hooks/useTranslation';
import {
  formatVolumeFromOz,
  useVolumeUnit,
} from '@client/src/contexts/VolumeUnitContext';
import {
  FormulaProfileData,
  FormulaProfileListItem,
  readFormulaProfiles,
  readSelectedFormulaId,
  updateFormulaProfile,
} from '../FormulaRatio/formulaProfiles';

/** 用户在机器端手动修改后的粉水配比（X : Y） */
const DEVICE_RATIO = { powderPerScoop: 9.5, waterPerScoop: 3 };

const SPRING = { type: 'spring' as const, stiffness: 320, damping: 30 };

const FormulaRatioSync: React.FC = () => {
  const navigate = useNavigate();
  const editorLocation = useLocation();
  const { t } = useTranslation();
  const { unit } = useVolumeUnit();

  const [profiles, setProfiles] =
    useState<FormulaProfileListItem[]>(readFormulaProfiles);
  const restore = React.useRef(ratioSyncScreenState(editorLocation.state)).current;
  const [selectedId, setSelectedId] = useState<string>(() => restore.selectedId ?? readSelectedFormulaId());
  const [alertOpen, setAlertOpen] = useState(!restore.drawerOpen);
  const [drawerOpen, setDrawerOpen] = useState(restore.drawerOpen);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fmtRatio = useCallback(
    (profile: { powderPerScoop: number; waterPerScoop: number }) =>
      `${profile.powderPerScoop} g : ${formatVolumeFromOz(profile.waterPerScoop, unit)}`,
    [unit],
  );

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const refresh = () => {
    setProfiles(readFormulaProfiles());
    setSelectedId(readSelectedFormulaId());
  };

  const syncTarget = React.useRef<string | null>(null);
  const syncOperation = useOperation({ operation: 'sync.apply', stage: 'sync', label: '同步设备配比', success: () => {
    const id = syncTarget.current ?? selectedId;
    const target = profiles.find((profile) => profile.id === id);
    if (!target) return;

    const data: FormulaProfileData = {
      brand: target.brand,
      productLine: target.productLine,
      ageRange: target.ageRange,
      powderPerScoop: DEVICE_RATIO.powderPerScoop,
      waterPerScoop: DEVICE_RATIO.waterPerScoop,
    };

    updateFormulaProfile(id, data);
    refresh();
    setAlertOpen(false);
    setDrawerOpen(false);
    setPendingId(null);
    setToast(
      id === selectedId
        ? t('demo.formulaRatioSync.syncedCurrent')
        : t('demo.formulaRatioSync.syncedOther', { brand: target.brand }),
    );
  } }, () => { syncTarget.current = selectedId; setAlertOpen(false); setDrawerOpen(true); });

  const syncTo = (id: string) => { syncTarget.current = id; syncOperation(); };

  const openDrawer = () => {
    setAlertOpen(false);
    setPendingId(null);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setPendingId(null);
  };

  const replay = () => {
    setPendingId(null);
    setDrawerOpen(false);
    setAlertOpen(true);
  };

  return (
    <div className="scene-sync relative w-[393px] shrink-0" style={{ height: 852 }}>
      {/* 背景：设备控制页 */}
      <BabyFormulaMaker />

      {/* 演示控制：重新播放弹窗 */}
      <div
        className="absolute z-30 w-[60px] rounded-[12px] border border-black/5 bg-white/80 p-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.07)] backdrop-blur-sm"
        style={{ left: 'calc(100% + 2px)', top: 170 }}
      >
        <button
          type="button"
          onClick={replay}
          aria-label={t('demo.formulaRatioSync.replay')}
          title={t('demo.formulaRatioSync.replay')}
          className="flex h-7 w-full items-center justify-center rounded-[8px] bg-black/[0.035] text-[#8A8380] transition-colors hover:bg-black/[0.06]"
        >
          <BellRing className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 屏幕内的弹窗 / 抽屉 / Toast 层（与控制页屏幕区域完全对齐） */}
      <div
        className="scene-sync-overlays pointer-events-none absolute overflow-hidden rounded-[46px]"
        style={{ left: 8, top: 8, width: 377, height: 836, zIndex: 40 }}
      >
        <div className="pointer-events-auto"><PageOperationState operations={['sync.apply']} /></div>
        <AnimatePresence>
          {alertOpen && (
            <motion.div
              key="sync-alert"
              className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{ background: 'rgba(34, 17, 34, 0.38)' }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 6 }}
                transition={SPRING}
                className="w-full rounded-[26px] bg-white px-5 pb-4 pt-6"
                style={{ boxShadow: '0 20px 52px rgba(34,17,34,0.22)' }}
              >
                <div className="flex flex-col items-center text-center">
                  <span
                    className="flex h-[54px] w-[54px] items-center justify-center rounded-full"
                    style={{ background: 'hsl(24 67% 32% / 0.10)' }}
                  >
                    <AlertTriangle
                      className="h-7 w-7"
                      strokeWidth={1.7}
                      style={{ color: '#8B4A1B' }}
                    />
                  </span>
                  <h2
                    className="mt-3 text-[17px] font-semibold leading-tight"
                    style={{ color: '#221122' }}
                  >
                    {t('demo.formulaRatioSync.alertTitle')}
                  </h2>
                  <p
                    className="mt-2.5 text-[13px] leading-[1.5]"
                    style={{ color: '#7A7377' }}
                  >
                    {t('demo.formulaRatioSync.alertDesc')}
                  </p>
                  <span
                    className="mt-2 inline-flex items-center rounded-[10px] px-3 py-1.5 text-[15px] font-semibold tracking-wide"
                    style={{
                      background: 'hsl(24 67% 32% / 0.09)',
                      color: '#8B4A1B',
                    }}
                  >
                    {fmtRatio(DEVICE_RATIO)}
                  </span>
                  <p
                    className="mt-2.5 text-[13px] leading-[1.5]"
                    style={{ color: '#7A7377' }}
                  >
                    {t('demo.formulaRatioSync.alertQuestion')}
                  </p>
                </div>

                <div className="mt-5 flex flex-col gap-2">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={openDrawer}
                    className="h-[46px] w-full rounded-[15px] text-[15px] font-semibold text-white"
                    style={{ background: '#8B4A1B' }}
                  >
                    {t('demo.formulaRatioSync.pickAndSync')}
                  </motion.button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setAlertOpen(false)}
                    className="h-[46px] w-full rounded-[15px] text-[15px] font-semibold"
                    style={{ background: '#F5F1ED', color: '#6B6360' }}
                  >
                    {t('demo.formulaRatioSync.ignore')}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {drawerOpen && (
            <motion.div
              key="sync-drawer"
              className="pointer-events-auto absolute inset-0 z-50 flex flex-col justify-end"
            >
              <motion.div
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                style={{ background: 'rgba(34, 17, 34, 0.36)' }}
                onClick={closeDrawer}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 33 }}
                className="relative flex max-h-[76%] flex-col rounded-t-[26px] bg-white"
                style={{ boxShadow: '0 -12px 40px rgba(34,17,34,0.16)' }}
              >
                <div
                  className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full"
                  style={{ background: '#E7E1DC' }}
                />

                <div className="flex shrink-0 items-start justify-between px-5 pb-3 pt-3">
                  <div className="min-w-0">
                    <h3
                      className="text-[16px] font-semibold"
                      style={{ color: '#221122' }}
                    >
                      {t('demo.formulaRatioSync.pickTitle')}
                    </h3>
                    <p
                      className="mt-1 text-[12px]"
                      style={{ color: '#A79FA3' }}
                    >
                      {t('demo.formulaRatioSync.pickDesc')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeDrawer}
                    aria-label={t('common.close')}
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                    style={{ background: '#F5F1ED' }}
                  >
                    <X className="h-3.5 w-3.5" style={{ color: '#8B4A1B' }} />
                  </button>
                </div>

                <div className="shrink-0 px-5">
                  <div
                    className="flex items-center justify-between rounded-[12px] px-3 py-2"
                    style={{ background: 'hsl(24 67% 32% / 0.07)' }}
                  >
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: '#8B4A1B' }}
                    >
                      {t('demo.formulaRatioSync.deviceLabel')}
                    </span>
                    <span
                      className="text-[12px] font-semibold"
                      style={{ color: '#8B4A1B' }}
                    >
                      {fmtRatio(DEVICE_RATIO)}
                    </span>
                  </div>
                </div>

                <div className="relative mt-2.5 flex-1 overflow-hidden">
                  <div className="h-full space-y-2 overflow-y-auto px-5 pb-3">
                    {profiles.map((profile) => {
                      const isPending = pendingId === profile.id;
                      const isActive = selectedId === profile.id;
                      return (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() => setPendingId(profile.id)}
                          className="flex w-full items-center gap-3 rounded-[16px] px-3.5 py-2.5 text-left transition-colors"
                          style={{
                            background: isPending ? '#FBF2E9' : '#FFFFFF',
                            border: `1px solid ${
                              isPending
                                ? 'hsl(24 67% 32% / 0.30)'
                                : 'hsl(30 20% 92%)'
                            }`,
                          }}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-1.5">
                              <span
                                className="text-[14px] font-semibold"
                                style={{ color: '#221122' }}
                              >
                                {profile.brand}
                              </span>
                              {isActive && (
                                <span
                                  className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                                  style={{
                                    background: 'hsl(24 67% 32% / 0.10)',
                                    color: '#8B4A1B',
                                  }}
                                >
                                  {t('demo.formulaRatio.active')}
                                </span>
                              )}
                            </p>
                            <p
                              className="mt-0.5 truncate text-[11px]"
                              style={{ color: '#B0A8AC' }}
                            >
                              {profile.productLine} · {profile.ageRange}
                            </p>
                            <p
                              className="mt-1 text-[12px] font-medium"
                              style={{ color: '#8B4A1B' }}
                            >
                              {fmtRatio(profile)}
                            </p>
                          </div>
                          <span
                            className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full"
                            style={{
                              background: isPending ? '#8B4A1B' : 'transparent',
                              border: isPending
                                ? 'none'
                                : '1.5px solid hsl(30 15% 86%)',
                            }}
                          >
                            {isPending && (
                              <Check
                                className="h-3 w-3 text-white"
                                strokeWidth={3.2}
                              />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-7"
                    style={{
                      background:
                        'linear-gradient(to top, #FFFFFF 12%, rgba(255,255,255,0))',
                    }}
                  />
                </div>

                <div
                  className="flex shrink-0 gap-2.5 border-t px-5 pt-3.5"
                  style={{
                    borderColor: 'hsl(30 20% 94%)',
                    paddingBottom: 24,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => openFormulaEditor(navigate, editorLocation, '/formula-edit?mode=manual', { formulaRatioSync: { drawerOpen: true, selectedId } })}
                    className="h-[46px] flex-1 rounded-[15px] text-[15px] font-semibold"
                    style={{ background: '#F5F1ED', color: '#8B4A1B' }}
                  >
                    {t('demo.formulaRatioSync.addNew')}
                  </button>
                  <button
                    type="button"
                    disabled={!pendingId}
                    onClick={() => pendingId && syncTo(pendingId)}
                    className="h-[46px] flex-[1.4] rounded-[15px] text-[15px] font-semibold text-white transition-opacity"
                    style={{
                      background: pendingId ? '#8B4A1B' : '#D8D0CA',
                      cursor: pendingId ? 'pointer' : 'default',
                    }}
                  >
                    {t('demo.formulaRatioSync.confirmSync')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toast && (
            <motion.div
              key="sync-toast"
              className="absolute inset-x-0 top-1/2 z-[60] flex -translate-y-1/2 justify-center"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
            >
              <span className="flex items-center gap-1.5 rounded-[14px] bg-[rgba(34,17,34,0.86)] px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">
                <Check className="h-4 w-4" strokeWidth={3} />
                {toast}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FormulaRatioSync;
