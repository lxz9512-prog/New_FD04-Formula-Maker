import { demoSession } from '@/demo/storage';
import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Coffee, Timer } from "lucide-react";
import IPhoneFrame from "@client/src/components/IPhoneFrame";
import { useTranslation } from "@client/src/hooks/useTranslation";
import {
  formatVolumeFromMl,
  formatVolumeFromOz,
  useVolumeUnit,
} from "@client/src/contexts/VolumeUnitContext";

const FORMULA_RESULT_KEY = "formula_result";
interface FeedingStats {
  todayCupCount: number;
  todayCumulativeMl: number;
  lastFeedingMl: number;
  lastFeedingElapsedH: number;
  lastFeedingElapsedM: number;
}

interface FormulaResultData {
  waterTargetOz: number;
  waterActualOz: number;
  powderTargetG: number;
  powderActualG: number;
  temperatureMode?: 'room' | 'heated';
  tempTargetC: number | null;
  tempActualC: number | null;
  totalMilkTargetOz: number;
  totalMilkActualOz: number;
  timestamp: string;
  feedingStats?: FeedingStats;
}

const DEMO_DATA: FormulaResultData = {
  waterTargetOz: 4,
  waterActualOz: 4.0,
  powderTargetG: 17.6,
  powderActualG: 17.4,
  tempTargetC: 40,
  tempActualC: 40,
  totalMilkTargetOz: 4.2,
  totalMilkActualOz: 4.1,
  timestamp: "07/23 14:30",
  feedingStats: {
    todayCupCount: 3,
    todayCumulativeMl: 355,
    lastFeedingMl: 120,
    lastFeedingElapsedH: 2,
    lastFeedingElapsedM: 15,
  },
};

// Retained detailed result UI for future reference; not used by current routes.
const FormulaResult1: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { unit } = useVolumeUnit();

  const savedRaw = demoSession.getItem(FORMULA_RESULT_KEY);
  const data: FormulaResultData = savedRaw ? JSON.parse(savedRaw) : DEMO_DATA;

  const milkMet = data.totalMilkActualOz >= data.totalMilkTargetOz - 0.2;

  return (
    <IPhoneFrame background="linear-gradient(to bottom, #FFE29F 0%, #F8F7F5 40%)">
      <div className="flex h-full flex-col">
        <div className="px-5 pt-6 pb-2 text-center">
          <h1 className="text-[17px] font-semibold" style={{ color: "#221122" }}>
            {t("result.title")}
          </h1>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 pb-6">
          {/* Total Milk Ring */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center pt-2 pb-1"
          >
            <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
              {/* Outer pulse ring */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: 130, height: 130,
                  border: `1.5px solid ${milkMet ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Decorative ring */}
              <div
                className="absolute rounded-full"
                style={{
                  width: 118, height: 118,
                  border: `1px solid ${milkMet ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)"}`,
                }}
              />
              {/* Main badge */}
              <motion.div
                className="flex flex-col items-center justify-center rounded-full"
                style={{
                  width: 100, height: 100,
                  background: milkMet
                    ? "linear-gradient(145deg, #22C55E 0%, #16A34A 100%)"
                    : "linear-gradient(145deg, #EF4444 0%, #DC2626 100%)",
                  boxShadow: milkMet
                    ? "0 8px 32px rgba(34,197,94,0.35), 0 2px 8px rgba(34,197,94,0.2)"
                    : "0 8px 32px rgba(239,68,68,0.35), 0 2px 8px rgba(239,68,68,0.2)",
                }}
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.5 }}
                >
                  {milkMet ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                </motion.div>

              </motion.div>
            </div>
            <p className="mt-1 text-[13px]" style={{ color: "#999" }}>
              {data.timestamp}
            </p>

            {/* Accuracy Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-2 flex items-center justify-center gap-1.5"
            >
              <div
                className="flex items-center gap-1 rounded-full px-3 py-1"
                style={{ backgroundColor: "rgba(34,197,94,0.1)" }}
              >
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "#22C55E" }}
                />
                <span className="text-[12px] font-medium" style={{ color: "#22C55E" }}>
                  {t("result.accuracy")} 99%
                </span>
              </div>
            </motion.div>

            {/* Target & Actual */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="mt-4 flex w-full max-w-[280px] gap-3"
            >
              <div
                className="flex-1 rounded-[12px] px-3 py-2.5 text-center"
                style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
              >
                <p className="text-[11px]" style={{ color: "#999" }}>{t("result.target")}</p>
                <p className="mt-0.5 text-[15px] font-bold" style={{ color: "#221122" }}>
                  {formatVolumeFromOz(data.totalMilkTargetOz, unit)}
                </p>

              </div>
              <div
                className="flex-1 rounded-[12px] px-3 py-2.5 text-center"
                style={{ backgroundColor: "rgba(0,0,0,0.03)" }}
              >
                <p className="text-[11px]" style={{ color: "#999" }}>{t("result.actual")}</p>
                <p className="mt-0.5 text-[15px] font-bold" style={{
                  color: milkMet ? "#22C55E" : "#EF4444",
                }}>
                  {formatVolumeFromOz(data.totalMilkActualOz, unit)}
                </p>

              </div>
            </motion.div>
          </motion.div>

          {/* Water Temperature Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="overflow-hidden rounded-[16px] bg-white p-4"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}
          >
            <div className="mb-3 h-[2px] rounded-full" style={{
              background: "linear-gradient(90deg, #EF444460, #EF444410)",
            }} />
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium" style={{ color: "#666" }}>
                {t("result.waterTempLabel")}
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-[12px]" style={{ color: "#999" }}>{t("result.target")}</span>
                  <span className="text-[13px] font-medium" style={{ color: "#666" }}>
                    {data.temperatureMode === 'room' ? t('maker.roomTemp') : data.tempTargetC === null ? '—' : `${data.tempTargetC}°C`}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[12px]" style={{ color: "#999" }}>{t("result.actual")}</span>
                  <span className="text-[14px] font-bold" style={{
                    color: data.tempActualC === null || data.tempTargetC === null ? "#666" : Math.abs(data.tempActualC - data.tempTargetC) <= 2 ? "#22C55E" : "#EF4444",
                  }}>
                    {data.tempActualC === null ? '—' : `${data.tempActualC}°C`}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Daily Summary */}
          {data.feedingStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="rounded-[16px] p-4"
              style={{
                background: "linear-gradient(135deg, #FFF7ED 0%, #FEF3E2 100%)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Coffee className="h-4 w-4" style={{ color: "#C4956A" }} />
                <span className="text-[13px] font-semibold" style={{ color: "#221122" }}>
                  {t("result.dailySummary")}
                </span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: "#999" }}>
                    {t("common.today")}
                  </span>
                  <span className="text-[14px] font-bold" style={{ color: "#7D3C0F" }}>
                    {t("result.todayCup", {
                      count: data.feedingStats.todayCupCount,
                      total: formatVolumeFromMl(
                        data.feedingStats.todayCumulativeMl,
                        unit,
                      ),
                    })}
                  </span>
                </div>
                {data.feedingStats.lastFeedingMl > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: "#999" }}>
                      {t("result.lastFeeding")}
                    </span>
                    <div className="flex items-center gap-1">
                      <Timer className="h-3 w-3" style={{ color: "#999" }} />
                      <span className="text-[13px] font-medium" style={{ color: "#555" }}>
                        {formatVolumeFromMl(
                          data.feedingStats.lastFeedingMl,
                          unit,
                        )}{" "}
                        ·{" "}
                        {data.feedingStats.lastFeedingElapsedH > 0 &&
                          `${data.feedingStats.lastFeedingElapsedH}h `}
                        {data.feedingStats.lastFeedingElapsedM}m ago
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </div>

        {/* Bottom Action Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="px-5 pb-6"
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/device")}
            className="flex w-full items-center justify-center rounded-[26px] h-[52px]"
            style={{ background: "#7D3C0F" }}
          >
            <span className="text-[14px] font-semibold text-white">
              {t("result.backToControl")}
            </span>
          </motion.button>
        </motion.div>
      </div>
    </IPhoneFrame>
  );
};

export default FormulaResult1;
