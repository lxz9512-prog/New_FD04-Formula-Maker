import { useOperation, OperationLabel } from '@/demo/react';
import { PageBackIcon } from '@/components/PageNavigation';
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Droplets, Milk, Check } from "lucide-react";
import dayjs from "dayjs";
import IPhoneFrame from "@client/src/components/IPhoneFrame";
import { useDeviceData } from "@client/src/hooks/useDeviceData";
import { useTranslation } from "@client/src/hooks/useTranslation";
import {
  mlToOz,
  ozToMl,
  roundVolume,
  useVolumeUnit,
} from "@client/src/contexts/VolumeUnitContext";

const L_TO_OZ = 33.814;

const PowderWater: React.FC = () => {
  const navigate = useNavigate();
  const [deviceData, updateDeviceData] = useDeviceData();
  const { t } = useTranslation();
  const { unit } = useVolumeUnit();

  const [powder, setPowder] = useState(deviceData.powderAmount);
  const [waterOz, setWaterOz] = useState(+(deviceData.waterAmount * L_TO_OZ).toFixed(1));
  const waterCapOz = +(deviceData.waterCapacity * L_TO_OZ).toFixed(1);
  const displayedWater = unit === "oz" ? roundVolume(waterOz) : ozToMl(waterOz);
  const displayedWaterCapacity = unit === "oz" ? roundVolume(waterCapOz) : ozToMl(waterCapOz);
  const [saved, setSaved] = useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const powderPercent = Math.round(
    (powder / deviceData.powderCapacity) * 100
  );
  const waterPercent = Math.round(
    (waterOz / waterCapOz) * 100
  );

  const handleBack = () => {
    navigate(-1);
  };

  const saveData = () => {
    updateDeviceData({
      powderAmount: powder,
      waterAmount: +(waterOz / L_TO_OZ).toFixed(4),
      lastWaterRefill: dayjs().toISOString(),
      lastPowderRefill: dayjs().toISOString(),
    });
    setSaved(true);
    timer.current = setTimeout(() => {
      navigate(-1);
    }, 800);
  };

  const handleSave = useOperation({ operation: 'resources.save', stage: 'settings', label: '保存粉水数据', success: saveData });
  return (
    <IPhoneFrame background="#F7F7F7">
      <div className="relative flex h-full flex-col">

        {/* Header */}
        <div className="fd06-page-nav">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="fd06-page-back" aria-label={t('common.back')}
          >
            <PageBackIcon />
          </motion.button>
          <h1 className="text-[16px] font-semibold" style={{ color: "#1A1A1A" }}>
            {t("powderWater.title")}
          </h1>
          <div className="h-8 w-8" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-28">
          {/* Powder Section */}
          <div className="mb-4 overflow-hidden rounded-[16px] bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Milk className="h-4 w-4" style={{ color: "#C4956A" }} />
              <span className="text-[14px] font-semibold" style={{ color: "#1A1A1A" }}>
                {t("powderWater.powderTank")}
              </span>
            </div>

            {/* Visual Bar */}
            <div className="mb-3 h-[8px] overflow-hidden rounded-full" style={{ background: "#F0EFEE" }}>
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${powderPercent}%` }}
                transition={{ duration: 0.3 }}
                style={{ background: "#C4956A" }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[12px]" style={{ color: "#888888" }}>
                {powder}g / {deviceData.powderCapacity}g
              </span>
              <span className="text-[12px] font-medium" style={{ color: "#C4956A" }}>
                {powderPercent}%
              </span>
            </div>

            {/* Input */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-[12px]" style={{ color: "#888888" }}>{t("powderWater.currentPowder")}</span>
              <div className="flex flex-1 items-center rounded-[10px] border border-[#E0E0E0] px-3 py-2">
                <input
                  type="number"
                  min={0}
                  max={deviceData.powderCapacity}
                  step={10}
                  value={powder}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = Math.min(
                      Math.max(0, Number(e.target.value)),
                      deviceData.powderCapacity
                    );
                    setPowder(val);
                  }}
                  className="w-full bg-transparent text-right text-[15px] font-medium outline-none"
                  style={{ color: "#1A1A1A" }}
                />
                <span className="ml-1 text-[13px]" style={{ color: "#888888" }}>g</span>
              </div>
            </div>
            <p className="mt-2 text-[11px]" style={{ color: "#BBBBBB" }}>
              {t("powderWater.powderRange", { capacity: deviceData.powderCapacity })}
            </p>
          </div>

          {/* Water Section */}
          <div className="mb-4 overflow-hidden rounded-[16px] bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
              <Droplets className="h-4 w-4" style={{ color: "#5B9BD5" }} />
              <span className="text-[14px] font-semibold" style={{ color: "#1A1A1A" }}>
                {t("powderWater.waterTank")}
              </span>
            </div>

            {/* Visual Bar */}
            <div className="mb-3 h-[8px] overflow-hidden rounded-full" style={{ background: "#F0EFEE" }}>
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${waterPercent}%` }}
                transition={{ duration: 0.3 }}
                style={{ background: "#5B9BD5" }}
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[12px]" style={{ color: "#888888" }}>
                {displayedWater} {unit} / {displayedWaterCapacity} {unit}
              </span>
              <span className="text-[12px] font-medium" style={{ color: "#5B9BD5" }}>
                {waterPercent}%
              </span>
            </div>

            {/* Input */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-[12px]" style={{ color: "#888888" }}>{t("powderWater.currentWater")}</span>
              <div className="flex flex-1 items-center rounded-[10px] border border-[#E0E0E0] px-3 py-2">
                <input
                  type="number"
                  min={0}
                  max={displayedWaterCapacity}
                  step={unit === "oz" ? 1 : 10}
                  value={displayedWater}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = Math.min(
                      Math.max(0, Number(e.target.value)),
                      displayedWaterCapacity
                    );
                    setWaterOz(unit === "oz" ? val : mlToOz(val));
                  }}
                  className="w-full bg-transparent text-right text-[15px] font-medium outline-none"
                  style={{ color: "#1A1A1A" }}
                />
                <span className="ml-1 text-[13px]" style={{ color: "#888888" }}>{unit}</span>
              </div>
            </div>
            <p className="mt-2 text-[11px]" style={{ color: "#BBBBBB" }}>
              {t("powderWater.waterRange", {
                capacity: displayedWaterCapacity,
                unit,
              })}
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="absolute right-0 bottom-0 left-0 px-4 pt-3 pb-8">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            className="flex w-full items-center justify-center gap-2 rounded-[26px] h-[52px]"
            style={{
              background: saved ? "#4CAF50" : "#7D3C0F",
              transition: "background 0.3s",
            }}
          >
            {saved ? (
              <>
                <Check className="h-5 w-5 text-white" />
                <span className="text-[15px] font-semibold text-white">{t("powderWater.saved")}</span>
              </>
            ) : (
              <span className="text-[15px] font-semibold text-white"><OperationLabel operation="resources.save">{t("common.save")}</OperationLabel></span>
            )}
          </motion.button>
        </div>

        {/* Save Toast */}
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-16 left-1/2 z-30 -translate-x-1/2 rounded-[10px] px-4 py-2"
            style={{ background: "rgba(76, 175, 80, 0.9)" }}
          >
            <span className="text-[13px] text-white">{t("powderWater.dataUpdated")}</span>
          </motion.div>
        )}
      </div>
    </IPhoneFrame>
  );
};

export default PowderWater;
