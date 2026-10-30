import { useLoadOperation, PageOperationState } from '@/demo/react';
import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import IPhoneFrame from '@client/src/components/IPhoneFrame';
import {
  useTranslation,
  type Language,
} from '@client/src/hooks/useTranslation';
import { Image } from '@client/src/components/ui/image';
import deviceImage from '@/assets/fd04-device.png';
import {
  formatVolumeFromMl,
  useVolumeUnit,
} from '@client/src/contexts/VolumeUnitContext';

const DEVICE_IMAGE_URL = deviceImage;
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const DEMO_LAST_FORMULA_MADE_AT = new Date(Date.now() - 23 * MINUTE_MS);

const padDatePart = (value: number) => String(value).padStart(2, '0');

const formatLastFormulaTime = (
  date: Date,
  language: Language,
  now = new Date(),
) => {
  const elapsedMs = Math.max(0, now.getTime() - date.getTime());
  const totalMinutes = Math.floor(elapsedMs / MINUTE_MS);

  if (totalMinutes < 60) {
    return language === 'zh'
      ? `${totalMinutes}分钟前`
      : `${totalMinutes} m ago`;
  }

  if (elapsedMs < DAY_MS) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (language === 'zh') {
      return `${hours}小时${minutes > 0 ? `${minutes}分钟` : ''}前`;
    }

    return `${hours} h${minutes > 0 ? ` ${minutes} m` : ''} ago`;
  }

  if (elapsedMs <= 3 * DAY_MS) {
    const days = Math.floor(elapsedMs / DAY_MS);
    return language === 'zh'
      ? `${days}天前`
      : `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }

  const monthDay = `${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;
  return date.getFullYear() === now.getFullYear()
    ? monthDay
    : `${date.getFullYear()}-${monthDay}`;
};

const DeviceList: React.FC = () => {
  const navigate = useNavigate();
  const { loaded } = useLoadOperation('devices.load', 'devices');
  const { t, language } = useTranslation();
  const { unit } = useVolumeUnit();

  const handleDeviceClick = () => {
    navigate('/device');
  };

  return (
    <>
      <IPhoneFrame background="#fcf9f7">
        <div className="relative flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-8">
            <h1
              className="text-[24px] font-bold leading-tight"
              style={{ color: '#121212' }}
            >
              {t('deviceList.familyTitle')}
            </h1>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-white"
              style={{
                boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#121212"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </motion.button>
          </div>


          <PageOperationState operations={['devices.load']} emptyText="还没有可用设备" />
          {/* Scrollable Content */}
          <div className="flex-1 space-y-4 overflow-y-auto px-5 pt-5 pb-28" style={{ display: loaded ? undefined : 'none' }}>
            {/* Baby Monitor Card */}
            <div
              className="rounded-[20px] p-4"
              style={{ background: '#f0ecff' }}
            >
              {/* Monitor Header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Camera Icon */}
                  <Image
                    src="https://miaoda.feishu.cn/aily/api/v1/feisuda/attachments/85cb8fe4-88ab-4fcf-8275-7191a943ec21/raw"
                    alt="Camera"
                    className="h-9 w-9 shrink-0 object-contain"
                  />
                  <div className="flex flex-col gap-0.5">
                    <p
                      className="text-[16px] font-semibold leading-tight"
                      style={{ color: '#7042d8' }}
                    >
                      {t('deviceList.babyMonitor')}
                    </p>
                    <div className="flex items-center gap-1">
                      <svg
                        width="16"
                        height="10"
                        viewBox="0 0 24 14"
                        fill="none"
                      >
                        <rect
                          x="0.5"
                          y="0.5"
                          width="20"
                          height="13"
                          rx="2.5"
                          stroke="#7042d8"
                          strokeWidth="1.5"
                        />
                        <rect
                          x="2"
                          y="2"
                          width="15"
                          height="10"
                          rx="1.5"
                          fill="#7042d8"
                        />
                        <path
                          d="M22 5v4a2 2 0 000-4z"
                          fill="#7042d8"
                          fillOpacity="0.5"
                        />
                      </svg>
                      <span
                        className="text-[12px]"
                        style={{ color: '#7042d8', fontWeight: 500 }}
                      >
                        80%
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight
                  className="h-5 w-5 shrink-0"
                  style={{ color: '#b8a5e8' }}
                />
              </div>

              {/* Video Preview */}
              <div
                className="relative overflow-hidden rounded-[14px]"
                style={{ aspectRatio: '16/9' }}
              >
                <Image
                  src="https://miaoda.feishu.cn/aily/api/v1/feisuda/attachments/8a1ec7e0-f506-4a02-b394-62c7e554ab2e/raw"
                  alt="Baby Monitor"
                  className="h-full w-full object-cover"
                  // Playback controls are baked into the source image; crop them out.
                  style={{ transform: 'scale(1.3)', transformOrigin: 'center top' }}
                />
              </div>
            </div>

            {/* Formula Maker Device Card */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={handleDeviceClick}
              className="flex cursor-pointer items-center gap-4 rounded-[20px] px-4 py-4"
              style={{
                background: '#fff6e0',
              }}
            >
              {/* Device Image */}
              <div
                className="flex h-[80px] w-[80px] shrink-0 items-center justify-center rounded-[16px] bg-white"
                style={{ boxShadow: '0px 1px 4px rgba(0,0,0,0.04)' }}
              >
                <Image
                  src={DEVICE_IMAGE_URL}
                  alt="FD04"
                  className="h-[65px] w-[55px] object-contain"
                />
              </div>

              {/* Device Info */}
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[18px]"
                    style={{ color: '#7a3d17', fontWeight: 600 }}
                  >
                    FD04
                  </span>
                  <ChevronRight
                    className="h-5 w-5"
                    style={{ color: '#d4b896' }}
                  />
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[12px]" style={{ color: '#c4a882' }}>Recent</span>
                  <span className="text-[12px]" style={{ color: '#c4a882' }}>
                    {formatLastFormulaTime(
                      DEMO_LAST_FORMULA_MADE_AT,
                      language,
                    )}
                  </span>
                  <span className="text-[12px]" style={{ color: '#c4a882' }}>
                    ·
                  </span>
                  <span
                    className="text-[13px]"
                    style={{ color: '#7a3d17', fontWeight: 500 }}
                  >
                    {formatVolumeFromMl(180, unit)}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Tab Bar - Liquid Glass */}
          <div
            className="liquid-glass absolute bottom-[26px] left-4 right-4"
            style={{ height: 62, borderRadius: 31 }}
          >
            <div className="relative z-10 flex h-full items-center justify-around">
              <TabItem
                icon={
                  <Image
                    src="https://miaoda.feishu.cn/aily/api/v1/feisuda/attachments/a3dd92a2-9bc7-406c-a9ea-b7b62dfcf98d/raw"
                    alt="Home"
                    className="h-6 w-6"
                  />
                }
                label={t('deviceList.tabHome')}
                active={false}
              />
              <TabItem
                icon={
                  <Image
                    src="https://miaoda.feishu.cn/aily/api/v1/feisuda/attachments/f83ee628-7a91-4fed-894c-1f7d4763f83b/raw"
                    alt="Device"
                    className="h-6 w-6"
                  />
                }
                label={t('deviceList.tabDevice')}
                active={true}
              />
              <TabItem
                icon={
                  <Image
                    src="https://miaoda.feishu.cn/aily/api/v1/feisuda/attachments/01cbbc92-a939-4726-ae54-0e49f3c80db4/raw"
                    alt="Community"
                    className="h-6 w-6"
                  />
                }
                label={t('deviceList.tabCommunity')}
                active={false}
              />
              <TabItem
                icon={
                  <Image
                    src="https://miaoda.feishu.cn/aily/api/v1/feisuda/attachments/321f0f3e-e355-4bd0-afc3-8d77bc9f2a59/raw"
                    alt="Me"
                    className="h-6 w-6"
                  />
                }
                label={t('deviceList.tabMe')}
                active={false}
              />
            </div>
          </div>
        </div>
      </IPhoneFrame>
      <style>{`
      .liquid-glass {
        background: linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.45) 0%,
          rgba(255, 255, 255, 0.25) 40%,
          rgba(255, 255, 255, 0.15) 100%
        );
        backdrop-filter: blur(20px) saturate(1.8);
        -webkit-backdrop-filter: blur(20px) saturate(1.8);
        border: 1px solid rgba(255, 255, 255, 0.5);
        box-shadow:
          0 8px 32px rgba(0, 0, 0, 0.08),
          inset 0 1px 1px rgba(255, 255, 255, 0.6),
          inset 0 -1px 1px rgba(255, 255, 255, 0.15);
        overflow: hidden;
      }
      .liquid-glass::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 50%;
        border-radius: 31px 31px 0 0;
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.55) 0%,
          rgba(255, 255, 255, 0.08) 100%
        );
        pointer-events: none;
      }
      .liquid-glass::after {
        content: '';
        position: absolute;
        top: 1px;
        left: 10%;
        right: 10%;
        height: 1px;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(255, 255, 255, 0.8) 30%,
          rgba(255, 255, 255, 0.8) 70%,
          transparent 100%
        );
        pointer-events: none;
      }
    `}</style>
    </>
  );
};

interface TabItemProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

const TabItem: React.FC<TabItemProps> = ({ icon, label, active }) => (
  <button className="flex flex-col items-center justify-center gap-1 w-14">
    <div className="flex h-6 w-6 items-center justify-center">{icon}</div>
    <span
      className="text-[10px] leading-none"
      style={{ color: active ? '#121212' : '#999497', fontWeight: 500 }}
    >
      {label}
    </span>
  </button>
);

export default DeviceList;
