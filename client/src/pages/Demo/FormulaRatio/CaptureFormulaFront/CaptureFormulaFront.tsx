import { useOperation, PageOperationState } from '@/demo/react';
// @ts-expect-error Existing published navigation helper is a JS module.
import { openFormulaEditor, ratioSyncScreenState } from '@/demo/formula-edit-navigation.js';
import { useLocation } from 'react-router-dom';
import { PageBackIcon } from '@/components/PageNavigation';
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import IPhoneFrame from '@client/src/components/IPhoneFrame';
import { useTranslation } from '@client/src/hooks/useTranslation';
import { Image } from '@client/src/components/ui/image';

const FORMULA_CAN_IMAGE =
  'https://miaoda.feishu.cn/aily/api/v1/feisuda/attachments/03e0a358-6b1f-44a4-a041-8652fba6edf9/raw';

const NEUMORPHIC_SHADOW =
  '6px 6px 12px hsl(330 10% 85% / 0.25), -6px -6px 12px hsl(0 0% 100% / 0.8)';

const CaptureFormulaFront: React.FC = () => {
  const navigate = useNavigate();
  const editorLocation = useLocation();
  const [searchParams] = useSearchParams();
  const isFirstUse = searchParams.get('source') === 'first-use';
  const firstUseSuffix = isFirstUse ? '?source=first-use' : '';
  const manualEntryPath = `/formula-edit?mode=manual${
    isFirstUse ? '&source=first-use' : ''
  }`;
  const { t } = useTranslation();

  const openCamera = useOperation({ operation: 'camera.open', stage: 'capture', label: '打开相机', delay: 350, success: () => navigate('/capture-formula' + firstUseSuffix), edit: () => navigate('/formula-edit?mode=manual' + (firstUseSuffix ? '&source=first-use' : '')) });

  return (
    <IPhoneFrame background="hsl(45, 60%, 92%)">
      <div
        className="flex h-full flex-col"
        style={{
          background:
            'linear-gradient(180deg, hsl(45, 60%, 92%) 0%, hsl(39, 50%, 97%) 50%, #fff 100%)',
        }}
      >
      <PageOperationState operations={['camera.open']} />
        {/* Header */}
        <div className="fd06-page-nav">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(isFirstUse ? '/device' : '/formula-ratio')}
            className="fd06-page-back"
             aria-label={t('common.back')}
          >
            <PageBackIcon />
          </motion.button>
          <div className="flex-1 text-center pr-10">
            <span
              className="text-[17px] font-semibold"
              style={{ color: '#221122' }}
            >
              {t('demo.captureFormulaFront.title')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col items-center px-8 pt-8">
          {/* Formula Can Image */}
          <div className="mb-12">
            <Image
              src={FORMULA_CAN_IMAGE}
              alt={t('demo.captureFormulaFront.canAlt')}
              className="h-[200px] w-auto object-contain"
            />
          </div>

          {/* Step Label */}
          <p
            className="mb-2 text-center text-[13px] font-medium tracking-wider uppercase"
            style={{ color: 'hsl(300, 3%, 55%)' }}
          >
            {t('demo.captureFormulaFront.stepLabel')}
          </p>

          {/* Title */}
          <h1
            className="mb-3 text-center text-[24px] font-semibold leading-tight"
            style={{ color: '#221122' }}
          >
            {t('demo.captureFormulaFront.heading')}
          </h1>

          {/* Description */}
          <p
            className="max-w-[280px] text-center text-[15px] leading-relaxed"
            style={{ color: 'hsl(300, 3%, 55%)' }}
          >
            {t('demo.captureFormulaFront.description')}
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="px-8 pb-10">
          {/* Start Capturing Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={openCamera}
            className="mb-4 flex h-[56px] w-full items-center justify-center rounded-full text-[17px] font-semibold text-white"
            style={{ backgroundColor: 'hsl(24, 67%, 32%)' }}
          >
            {t('demo.captureFormulaFront.startCapturing')}
          </motion.button>

          {/* Enter Manually Link */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => openFormulaEditor(navigate, editorLocation, manualEntryPath)}
            className="flex h-[44px] w-full items-center justify-center text-[16px] font-medium"
            style={{ color: '#221122' }}
          >
            {t('demo.captureFormulaFront.enterManually')}
          </motion.button>
        </div>
      </div>
    </IPhoneFrame>
  );
};

export default CaptureFormulaFront;
