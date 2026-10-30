import { demoSession } from '@/demo/storage';
import { PageBackIcon } from '@/components/PageNavigation';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Moon,
  Scale,
  Sparkles,
  Gauge,
} from 'lucide-react';
import IPhoneFrame from '@client/src/components/IPhoneFrame';
import { Image } from '@client/src/components/ui/image';
import deviceImage from '@/assets/fd04-device.png';
import { useTranslation } from '@client/src/hooks/useTranslation';
import './device-settings.css';

const DEVICE_THUMBNAIL = deviceImage;

interface SettingItem {
  label: string;
  icon?: React.ReactNode;
  rightText?: string;
  rightBadge?: 'new';
  rightNode?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  hidden?: boolean;
  onClick?: () => void;
}

const SettingRow: React.FC<{ item: SettingItem; isLast: boolean }> = ({
  item,
  isLast,
}) => {
  return (
    <div
      className={`px-4 py-3.5 ${!isLast ? 'border-b border-[#EEEEEE]' : ''}`}
    >
      <motion.button
        whileTap={item.disabled ? {} : { scale: 0.99 }}
        onClick={item.onClick}
        disabled={item.disabled}
        className="flex w-full items-center justify-between disabled:opacity-50"
      >
        <div className="flex items-center gap-2.5">
          {item.icon}
          <span className="text-[14px]" style={{ color: '#1A1A1A' }}>
            {item.label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {item.rightText && (
            <span className="text-[13px]" style={{ color: '#888888' }}>
              {item.rightText}
              {item.rightBadge === 'new' && (
                <span
                  className="ml-1.5 inline-block h-2 w-2 rounded-full align-middle"
                  style={{ background: '#FF4D4F' }}
                />
              )}
            </span>
          )}
          {item.rightNode}
          {!item.rightNode && (
            <ChevronRight className="h-5 w-5" style={{ color: '#CCCCCC' }} />
          )}
        </div>
      </motion.button>
      {item.description && (
        <p
          className="mt-1.5 pl-[26px] text-[12px] leading-relaxed"
          style={{ color: '#999999' }}
        >
          {item.description}
        </p>
      )}
    </div>
  );
};

const SettingSection: React.FC<{
  title: string;
  items: SettingItem[];
}> = ({ title, items }) => {
  const visibleItems = items.filter((item) => !item.hidden);
  return (
    <div className="mb-3">
      <p
        className="mb-1.5 px-4 text-[11px] font-normal"
        style={{ color: '#888888' }}
      >
        {title}
      </p>
      <div className="overflow-hidden rounded-[10px] bg-white">
        {visibleItems.map((item, index) => (
          <SettingRow
            key={item.label}
            item={item}
            isLast={index === visibleItems.length - 1}
          />
        ))}
      </div>
    </div>
  );
};

const DeviceSettings: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [nightLightAuto, setNightLightAuto] = useState(false);

  const handleBack = () => {
    navigate('/device');
  };

  const deviceFunctionItems: SettingItem[] = [
    {
      label: t('deviceSettings.formulaRatio'),
      icon: <Scale className="h-4 w-4" style={{ color: '#888888' }} />,
      onClick: () => navigate('/formula-ratio'),
    },

    {
      label: t('deviceSettings.tubeCleaning'),
      icon: <Sparkles className="h-4 w-4" style={{ color: '#888888' }} />,
      onClick: () => navigate('/device-cleaning'),
    },
    {
      label: t('deviceSettings.waterCalibration'),
      hidden: true,
      icon: <Gauge className="h-4 w-4" style={{ color: '#888888' }} />,
      onClick: () => navigate('/water-calibration'),
    },
    {
      label: t('deviceSettings.nightLightAuto'),
      icon: (
        <Moon
          className="h-4 w-4"
          style={{ color: nightLightAuto ? '#8B4A1B' : '#888888' }}
        />
      ),
      description: t('deviceSettings.nightLightDesc'),
      rightNode: (
        <motion.button
          onClick={() => setNightLightAuto(!nightLightAuto)}
          className="relative h-[22px] w-[40px] rounded-full p-[2px] transition-colors duration-300"
          style={{
            backgroundColor: nightLightAuto ? '#8B4A1B' : '#E0E0E0',
          }}
        >
          <motion.div
            className="h-[18px] w-[18px] rounded-full bg-white"
            style={{
              boxShadow: nightLightAuto
                ? 'none'
                : 'inset 0 0 0 1px rgba(0,0,0,0.08)',
            }}
            animate={{ x: nightLightAuto ? 16 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </motion.button>
      ),
    },
  ];

  return (
    <IPhoneFrame background="#F7F7F7">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="fd06-page-nav">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            aria-label={t('common.back')}
            className="fd06-page-back"
          >
            <PageBackIcon />
          </motion.button>
          <h1
            className="text-[16px] font-semibold"
            style={{ color: '#1A1A1A' }}
          >
            {t('deviceSettings.title')}
          </h1>
          <div className="h-[43px] w-[43px] shrink-0" />
        </div>

        <div className="device-settings-content flex-1 overflow-y-auto px-4 pb-6">
          {/* Device Info Card */}
          <div className="mb-3 overflow-hidden rounded-[10px] bg-white">
            <motion.button
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate('/device-detail')}
              className="flex w-full items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="h-[44px] w-[44px] overflow-hidden rounded-lg">
                  <Image
                    src={DEVICE_THUMBNAIL}
                    alt="FD04"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p
                    className="text-[15px] font-medium"
                    style={{ color: '#1A1A1A' }}
                  >
                    FD04
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5" style={{ color: '#CCCCCC' }} />
            </motion.button>
          </div>

          {/* Device Functions */}
          <SettingSection
            title={t('deviceSettings.deviceFunctions')}
            items={deviceFunctionItems}
          />

          {/* General Settings */}
          <SettingSection
            title={t('deviceSettings.generalSettings')}
            items={[
              {
                label: t('deviceSettings.smartAssistant'),
                onClick: () => {
                  demoSession.setItem('device_assistant_return_to', '/device-settings');
                  navigate('/device-assistant');
                },
              },
              {
                label: t('deviceSettings.notificationSettings'),
                onClick: () => navigate('/notification-settings'),
              },
              {
                label: t('deviceSettings.firmwareUpdate'),
                rightText: 'New' as const,
                rightBadge: 'new' as const,
              },
              {
                label: t('deviceSettings.shareDevice'),
              },
            ]}
          />

          {/* Action Buttons */}
          <div className="mt-2 space-y-2">
            <motion.button
              whileTap={{ scale: 0.99 }}
              className="flex w-full items-center justify-center rounded-[26px] bg-white h-[52px]"
            >
              <span
                className="text-[14px] font-normal"
                style={{ color: '#FFA52F' }}
              >
                {t('deviceSettings.restartDevice')}
              </span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.99 }}
              className="flex w-full items-center justify-center rounded-[26px] bg-white h-[52px]"
            >
              <span
                className="text-[14px] font-normal"
                style={{ color: '#FF4D4F' }}
              >
                {t('deviceSettings.deleteDevice')}
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </IPhoneFrame>
  );
};

export default DeviceSettings;
