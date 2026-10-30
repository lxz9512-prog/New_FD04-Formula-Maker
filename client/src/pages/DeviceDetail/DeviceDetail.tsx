import { demoEngine } from '@/demo/engine';
import { useOperation, PageOperationState } from '@/demo/react';
import { PageBackIcon } from '@/components/PageNavigation';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Check, X } from 'lucide-react';
import IPhoneFrame from '@client/src/components/IPhoneFrame';
import { Image } from '@client/src/components/ui/image';
import deviceImage from '@/assets/fd04-device.png';
import { useTranslation } from '@client/src/hooks/useTranslation';

const DEVICE_THUMBNAIL = deviceImage;

interface DetailRowProps {
  label: string;
  value: string;
  editable?: boolean;
  onClick?: () => void;
}

const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  editable,
  onClick,
}) => {
  return (
    <motion.button
      whileTap={editable ? { scale: 0.99 } : {}}
      onClick={onClick}
      disabled={!editable}
      className="flex w-full items-center justify-between px-4 py-3.5"
    >
      <span className="text-[14px]" style={{ color: '#888888' }}>
        {label}
      </span>
      <div className="flex items-center gap-1">
        <span className="text-[14px]" style={{ color: '#1A1A1A' }}>
          {value}
        </span>
        {editable && (
          <ChevronRight className="h-4 w-4" style={{ color: '#CCCCCC' }} />
        )}
      </div>
    </motion.button>
  );
};

const DeviceDetail: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [deviceName, setDeviceName] = useState('FD04');
  const [showEditName, setShowEditName] = useState(false);
  const [editName, setEditName] = useState(deviceName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showEditName) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [showEditName]);

  const handleBack = () => {
    navigate('/device-settings');
  };

  const saveName = useOperation({ operation: 'device.rename', stage: 'settings', label: '保存设备名称', success: () => { setDeviceName(editName.trim()); setShowEditName(false); }, edit: () => setShowEditName(true) }, () => { setShowEditName(true); });
  const handleSaveName = () => {
    const trimmed = editName.trim();
    if (trimmed) {
      saveName();
    }
  };

  const handleCancelEdit = () => {
    demoEngine.cancel();
    setEditName(deviceName);
    setShowEditName(false);
  };

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
          <h1
            className="text-[16px] font-semibold"
            style={{ color: '#1A1A1A' }}
          >
            {t('deviceDetail.title')}
          </h1>
          <div className="h-8 w-8" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {/* Device Image */}
          <div className="mb-4 flex items-center justify-center py-4">
            <div className="h-[100px] w-[100px] overflow-hidden rounded-2xl">
              <Image
                src={DEVICE_THUMBNAIL}
                alt={deviceName}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Detail Card */}
          <div className="overflow-hidden rounded-[10px] bg-white">
            <DetailRow
              label={t('deviceDetail.deviceName')}
              value={deviceName}
              editable
              onClick={() => {
                setEditName(deviceName);
                setShowEditName(true);
              }}
            />
            <div className="mx-4 border-b border-[#EEEEEE]" />
            <DetailRow
              label={t('deviceDetail.macAddress')}
              value="A4:C1:38:XX:XX:XX"
            />
            <div className="mx-4 border-b border-[#EEEEEE]" />
            <DetailRow
              label={t('deviceDetail.serialNumber')}
              value="FD04-2025-00381"
            />
          </div>
        </div>

        {/* Edit Name Overlay */}
        <AnimatePresence>
          {showEditName && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-30 flex items-end justify-center overflow-hidden"
              onClick={handleCancelEdit}
            >
              <div className="absolute inset-0 bg-black/30" />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                className="relative w-full rounded-t-[20px] bg-white px-5 pt-5 pb-8"
              >
                <div className="mb-4 flex items-center justify-between">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancelEdit}
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ background: '#F0F0F0' }}
                  >
                    <X className="h-4 w-4" style={{ color: '#666666' }} />
                  </motion.button>
                  <span
                    className="text-[16px] font-semibold"
                    style={{ color: '#1A1A1A' }}
                  >
                    {t('deviceDetail.editDeviceName')}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    aria-label="保存设备名称"
                    onClick={handleSaveName}
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ background: '#7D3C0F' }}
                  >
                    <Check className="h-4 w-4 text-white" />
                  </motion.button>
                </div>
                <PageOperationState operations={['device.rename']} />
                <input
                  ref={inputRef}
                  type="text"
                  aria-label="设备名称"
                  value={editName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditName(e.target.value)
                  }
                  maxLength={20}
                  className="w-full rounded-[10px] border border-[#E0E0E0] px-4 py-3 text-[15px] outline-none transition-colors focus:border-[#7D3C0F]"
                  style={{ color: '#1A1A1A' }}
                  placeholder={t('deviceDetail.namePlaceholder')}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </IPhoneFrame>
  );
};

export default DeviceDetail;
