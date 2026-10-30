import { useOperation, OperationLabel } from '@/demo/react';
import { demoEngine } from '@/demo/engine';
import { PageBackIcon } from '@/components/PageNavigation';
import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bell, AlertCircle } from "lucide-react";
import IPhoneFrame from "@client/src/components/IPhoneFrame";
import { useTranslation } from "@client/src/hooks/useTranslation";

interface NotificationItem {
  key: string;
  labelKey: string;
}

const NOTIFICATION_ITEMS: NotificationItem[] = [
  { key: "lowWater", labelKey: "notificationSettings.lowWater" },
  { key: "lowPowder", labelKey: "notificationSettings.lowPowder" },
  { key: "powderClean", labelKey: "notificationSettings.powderClean" },
  { key: "tubeClean", labelKey: "notificationSettings.tubeClean" },
];

const NotificationSettings: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [toggles, setToggles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NOTIFICATION_ITEMS.map((item) => [item.key, true]))
  );

  const pending = React.useRef({ key: 'lowWater', value: false });
  const saveToggle = useOperation({ operation: 'settings.notifications', stage: 'settings', label: '保存提醒设置', success: () => {
    const {key, value} = pending.current; setToggles(prev => ({...prev, [key]: value}));
  } }, () => { pending.current = {key: 'lowWater', value: !toggles.lowWater}; });
  const handleToggle = (key: string) => {
    if (demoEngine.getSnapshot().active?.status === 'loading') return;
    pending.current = {key, value: !toggles[key]}; saveToggle();
  };

  return (
    <IPhoneFrame background="#F7F7F7">
      <div className="flex h-full flex-col">

        {/* Header */}
        <div className="fd06-page-nav">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="fd06-page-back" aria-label={t('common.back')}
          >
            <PageBackIcon />
          </motion.button>
          <h1
            className="text-[16px] font-semibold"
            style={{ color: "#1A1A1A" }}
          >
            {t("notificationSettings.title")}
          </h1>
          <div className="h-8 w-8" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {/* Tip */}
          <div
            className="mb-4 flex items-start gap-2 rounded-[10px] p-3"
            style={{ backgroundColor: "#FFF9F5" }}
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: "#8B4A1B" }}
            />
            <p
              className="text-[12px] leading-relaxed"
              style={{ color: "#8B4A1B" }}
            >
              <OperationLabel operation="settings.notifications">{t("notificationSettings.tip")}</OperationLabel>
            </p>
          </div>

          {/* Notification List */}
          <div className="overflow-hidden rounded-[10px] bg-white">
            {NOTIFICATION_ITEMS.map((item, index) => (
              <div
                key={item.key}
                className={`flex items-center justify-between px-4 py-3.5 ${
                  index < NOTIFICATION_ITEMS.length - 1
                    ? "border-b border-[#EEEEEE]"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bell
                    className="h-4 w-4"
                    style={{ color: "#888888" }}
                  />
                  <span
                    className="text-[14px]"
                    style={{ color: "#1A1A1A" }}
                  >
                    {t(item.labelKey)}
                  </span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  role="switch" aria-label={t(item.labelKey)} aria-checked={toggles[item.key]}
                  onClick={() => handleToggle(item.key)}
                  className="relative h-[22px] w-[40px] rounded-full p-[2px] transition-colors duration-300"
                  style={{
                    backgroundColor: toggles[item.key]
                      ? "#8B4A1B"
                      : "#E0E0E0",
                  }}
                >
                  <motion.div
                    className="h-[18px] w-[18px] rounded-full bg-white"
                    style={{
                      boxShadow: toggles[item.key]
                        ? "none"
                        : "inset 0 0 0 1px rgba(0,0,0,0.08)",
                    }}
                    animate={{ x: toggles[item.key] ? 16 : 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                </motion.button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </IPhoneFrame>
  );
};

export default NotificationSettings;
