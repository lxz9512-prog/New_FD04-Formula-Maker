import CaptureFailureDialog from '../CaptureFailureDialog';
import { demoEngine } from '@/demo/engine';
import { useOperation, useDemo } from '@/demo/react';
import { PageBackIcon } from '@/components/PageNavigation';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Image, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import IPhoneFrame from '@client/src/components/IPhoneFrame';
import { useTranslation } from '@client/src/hooks/useTranslation';

const CAMERA_VIEWFINDER_IMAGE =
  'https://miaoda.feishu.cn/aily/api/v1/feisuda/attachments/b21004fb-ac82-452b-862e-850249098c50/raw';

const CaptureFormula: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const firstUseSuffix =
    searchParams.get('source') === 'first-use' ? '?source=first-use' : '';
  const { t } = useTranslation();
  const [flashOn, setFlashOn] = useState(false);
  const { active } = useDemo();
  const current = active?.request.operation === 'capture.front' ? active : null;
  const isUploading = current?.status === 'loading';
  const uploadProgress = current?.progress ?? 0;
  const uploadFailed = current?.status === 'error' && current.scene?.id === 'capture.upload';
  const [showSuccess, setShowSuccess] = useState(false);

  const captureOperation = useOperation({
    operation: 'capture.front', stage: 'capture', label: '上传正面照片', delay: 1500,
    success: () => navigate('/capture-formula-back-side' + firstUseSuffix),
    edit: () => navigate('/formula-edit?mode=manual' + (firstUseSuffix ? '&source=first-use' : '')),
  });
  const handleCapture = () => {  captureOperation(); };


  return (
    <IPhoneFrame background="#ffffff" overlay={<CaptureFailureDialog
      failureCopy={uploadFailed ? {
        title: t('demo.captureFormulaStep2.uploadFailedTitle'),
        description: t('demo.captureFormulaStep2.uploadFailedDescription'),
        action: t('demo.captureFormulaStep2.retry'),
      } : null}
      onPrimary={demoEngine.retry}
      onManual={() => navigate('/formula-edit?mode=manual' + (firstUseSuffix ? '&source=first-use' : ''))}
      manualLabel={t('demo.captureFormulaStep2.enterManually')}
    />}>
      <div className="flex h-full flex-col">


        {/* Header */}
        <div className="fd06-page-nav">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/scan-formula' + firstUseSuffix)}
            className="fd06-page-back" aria-label={t('common.back')}
          >
            <PageBackIcon />
          </motion.button>
          <div className="flex-1 text-center">
            <span
              className="text-[17px] font-medium"
              style={{ color: '#221122' }}
            >
              {t('demo.captureFormula.title')}
            </span>
          </div>
          <div className="h-10 w-10" />
        </div>

        {/* Camera Viewport */}
        <div className="relative flex-1 overflow-hidden">
          {/* Upload Progress */}
          <AnimatePresence>
            {isUploading && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 right-0 top-0 z-50 px-4 pt-3"
              >
                <div
                  className="flex items-center gap-4 rounded-[20px] px-5 py-4"
                  style={{ background: 'rgba(255,255,255,0.95)' }}
                >
                  <div className="relative h-6 w-6">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{ border: '2px solid #e2dfe2' }}
                    />
                    <svg
                      className="h-6 w-6 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <line
                        x1="12"
                        y1="4"
                        x2="12"
                        y2="7"
                        stroke="#21161d"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="1"
                      />
                      <line
                        x1="17.5"
                        y1="5"
                        x2="15.5"
                        y2="8"
                        stroke="#21161d"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="0.85"
                      />
                      <line
                        x1="20.5"
                        y1="12"
                        x2="17"
                        y2="12"
                        stroke="#21161d"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="0.7"
                      />
                      <line
                        x1="17.5"
                        y1="19"
                        x2="15.5"
                        y2="16"
                        stroke="#21161d"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="0.55"
                      />
                      <line
                        x1="12"
                        y1="20"
                        x2="12"
                        y2="17"
                        stroke="#21161d"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="0.4"
                      />
                      <line
                        x1="6.5"
                        y1="19"
                        x2="8.5"
                        y2="16"
                        stroke="#21161d"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="0.3"
                      />
                      <line
                        x1="3.5"
                        y1="12"
                        x2="7"
                        y2="12"
                        stroke="#21161d"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="0.2"
                      />
                      <line
                        x1="6.5"
                        y1="5"
                        x2="8.5"
                        y2="8"
                        stroke="#21161d"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="0.1"
                      />
                    </svg>
                  </div>
                  <span className="text-[16px]" style={{ color: '#21161d' }}>
                    {t('demo.captureFormula.uploading', {
                      progress: uploadProgress,
                    })}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Toast */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 right-0 top-0 z-50 px-4 pt-3"
              >
                <div
                  className="flex items-center gap-4 rounded-[20px] px-5 py-4"
                  style={{ background: 'rgba(255,255,255,0.95)' }}
                >
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ background: '#4CAF50' }}
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span className="text-[16px]" style={{ color: '#21161d' }}>
                    {t('demo.captureFormula.successToast')}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Camera preview image */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${CAMERA_VIEWFINDER_IMAGE})`,
              backgroundSize: 'auto 140%',
              backgroundPosition: 'center 45%',
            }}
          />

          {/* Bottom Controls */}
          <div className="absolute inset-x-0 bottom-8 flex items-center justify-between px-12">
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="flex h-[52px] w-[52px] items-center justify-center rounded-[16px]"
              style={{ background: 'rgba(80,80,80,0.7)' }}
            >
              <Image className="h-6 w-6" style={{ color: '#fff' }} />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              aria-label="拍摄照片"
              onClick={handleCapture}
              className="flex h-[64px] w-[64px] items-center justify-center rounded-full"
              style={{
                background: 'transparent',
                boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.9)',
              }}
            >
              <div
                className="h-[48px] w-[48px] rounded-full"
                style={{ background: '#fff' }}
              />
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setFlashOn(!flashOn)}
              className="flex h-[52px] w-[52px] items-center justify-center rounded-[16px]"
              style={{
                background: 'rgba(80,80,80,0.7)',
              }}
            >
              <Zap
                className="h-6 w-6"
                style={{ color: flashOn ? '#FFD700' : '#fff' }}
              />
            </motion.button>
          </div>
        </div>
      </div>
    </IPhoneFrame>
  );
};

export default CaptureFormula;
