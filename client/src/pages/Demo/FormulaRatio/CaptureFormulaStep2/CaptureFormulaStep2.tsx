import CaptureFailureDialog from '../CaptureFailureDialog';
// @ts-expect-error Existing published navigation helper is a JS module.
import { openFormulaEditor, ratioSyncScreenState } from '@/demo/formula-edit-navigation.js';
import { demoEngine } from '@/demo/engine';
import { useLocation } from 'react-router-dom';
import { useOperation, useDemo } from '@/demo/react';
import { PageBackIcon } from '@/components/PageNavigation';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Image,
  Keyboard,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import IPhoneFrame from '@client/src/components/IPhoneFrame';
import { useTranslation } from '@client/src/hooks/useTranslation';

const CAMERA_VIEWFINDER_IMAGE =
  'https://miaoda.feishu.cn/aily/api/v1/feisuda/attachments/fd7da75a-d610-49cf-bf9a-18eb34fd941a/raw';

export type CaptureFailureMode = 'upload' | 'recognition';

interface CaptureFormulaStep2Props {
  initialFailure?: CaptureFailureMode;
}

const CaptureFormulaStep2: React.FC<CaptureFormulaStep2Props> = ({
  initialFailure,
}) => {
  const navigate = useNavigate();
  const editorLocation = useLocation();
  const [searchParams] = useSearchParams();
  const isFirstUse = searchParams.get('source') === 'first-use';
  const firstUseSuffix = isFirstUse ? '?source=first-use' : '';
  const recognitionResultPath = `/formula-edit?mode=recognition${
    isFirstUse ? '&source=first-use' : ''
  }`;
  const manualEntryPath = `/formula-edit?mode=manual${
    isFirstUse ? '&source=first-use' : ''
  }`;
  const { t } = useTranslation();
  const [flashOn, setFlashOn] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognizeProgress, setRecognizeProgress] = useState(0);
  const [staticFailureMode, setFailureMode] = useState<CaptureFailureMode | null>(
    initialFailure ?? null,
  );

  useEffect(() => {
    setFailureMode(initialFailure ?? null);
  }, [initialFailure]);

  const captureOperation = useOperation({
    operation: 'capture.analyze', stage: 'capture', label: '上传并识别配比', delay: 2600,
    success: () => openFormulaEditor(navigate, editorLocation, recognitionResultPath),
    edit: () => navigate('/formula-edit?mode=manual' + (firstUseSuffix ? '&source=first-use' : '')),
  });
  const { active } = useDemo();
  const injectedFailure = active?.request.operation === 'capture.analyze' && active.status === 'error'
    ? active.scene?.id === 'capture.upload' ? 'upload' : active.scene?.id === 'capture.recognition' ? 'recognition' : null : null;
  const failureMode = injectedFailure ?? (active?.request.operation === 'capture.analyze' ? null : staticFailureMode);
  const isUploadingNow = active?.request.operation === 'capture.analyze' && active.status === 'loading';
  const handleCapture = () => { setFailureMode(null); captureOperation(); };


  const handleFailurePrimaryAction = () => {
    if (failureMode === 'upload') {
      setFailureMode(null);
      if (injectedFailure) demoEngine.retry(); else handleCapture();
      return;
    }

    demoEngine.cancel();
    navigate('/scan-formula' + firstUseSuffix);
  };

  const failureCopy = failureMode
    ? {
        upload: {
          title: t('demo.captureFormulaStep2.uploadFailedTitle'),
          description: t('demo.captureFormulaStep2.uploadFailedDescription'),
          action: t('demo.captureFormulaStep2.retry'),
        },
        recognition: {
          title: t('demo.captureFormulaStep2.recognitionFailedTitle'),
          description: t(
            'demo.captureFormulaStep2.recognitionFailedDescription',
          ),
          action: t('demo.captureFormulaStep2.retake'),
        },
      }[failureMode]
    : null;

  const failureOverlay = <CaptureFailureDialog failureCopy={failureCopy}
    onPrimary={handleFailurePrimaryAction}
    onManual={() => openFormulaEditor(navigate, editorLocation, manualEntryPath)}
    manualLabel={t('demo.captureFormulaStep2.enterManually')} />;

  return (
    <IPhoneFrame background="#ffffff" overlay={failureOverlay}>
      <div className="relative flex h-full flex-col">


        {/* Header */}
        <div className="fd06-page-nav">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() =>
              navigate('/capture-formula-back-side' + firstUseSuffix)
            }
            className="fd06-page-back" aria-label={t('common.back')}
          >
            <PageBackIcon />
          </motion.button>
          <div className="flex-1 text-center">
            <span
              className="text-[17px] font-medium"
              style={{ color: '#221122' }}
            >
              {t('demo.captureFormulaStep2.title')}
            </span>
          </div>
          <div className="h-10 w-10" />
        </div>

        {/* Camera Viewport */}
        <div className="relative flex-1 overflow-hidden">
          {/* Upload Progress */}
          <AnimatePresence>
            {isUploadingNow && (
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
                    {t('demo.captureFormulaStep2.uploading', {
                      progress: active?.progress ?? 0,
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
                    {t('demo.captureFormulaStep2.successToast')}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Recognizing Progress */}
          <AnimatePresence>
            {isRecognizing && (
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
                    {t('demo.captureFormulaStep2.recognizing', {
                      progress: recognizeProgress,
                    })}
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

export default CaptureFormulaStep2;
