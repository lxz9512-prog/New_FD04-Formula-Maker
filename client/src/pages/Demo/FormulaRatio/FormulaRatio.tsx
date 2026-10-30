import { useLoadOperation, useOperation, OperationLabel, PageOperationState } from '@/demo/react';
import { demoEngine } from '@/demo/engine';
// @ts-expect-error Existing published navigation helper is a JS module.
import { openFormulaEditor, ratioSyncScreenState } from '@/demo/formula-edit-navigation.js';
import { useLocation } from 'react-router-dom';
import { PageBackIcon } from '@/components/PageNavigation';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, ScanLine } from 'lucide-react';
import { motion } from 'framer-motion';
import IPhoneFrame from '@client/src/components/IPhoneFrame';
import { useTranslation } from '@client/src/hooks/useTranslation';
import {
  formatVolumeFromOz,
  useVolumeUnit,
} from '@client/src/contexts/VolumeUnitContext';
import {
  readFormulaProfiles,
  readSelectedFormulaId,
  setActiveFormulaProfile,
} from './formulaProfiles';

const FormulaRatio: React.FC = () => {
  const navigate = useNavigate();
  const editorLocation = useLocation();
  const { t } = useTranslation();
  const { unit } = useVolumeUnit();
  const { loaded } = useLoadOperation('formula.load', 'formula');
  const pendingId = React.useRef<string>('');
  const [profiles] = useState(readFormulaProfiles);
  const [selectedId, setSelectedId] = useState(readSelectedFormulaId);
  const orderedProfiles = [
    ...profiles.filter((profile) => profile.id === selectedId),
    ...profiles.filter((profile) => profile.id !== selectedId),
  ];

  const handleBack = () => {
    navigate('/device');
  };

  const selectProfile = useOperation({
    operation: 'formula.select', stage: 'formula', label: '切换配比',
    success: () => { const profile = profiles.find(item => item.id === pendingId.current); if (profile) { setSelectedId(profile.id); setActiveFormulaProfile(profile); } },
  }, () => { pendingId.current ||= profiles.find(item => item.id !== selectedId)?.id ?? profiles[0]?.id ?? ''; });
  const handleSelect = (id: string) => {
    if (demoEngine.getSnapshot().active?.status === 'loading') return;
    pendingId.current = id; selectProfile();
  };

  return (
    <IPhoneFrame background="radial-gradient(ellipse 140% 58% at 50% 0%, #FDE397 0%, #FDE397 30%, transparent 70%), #F7F7F7">
      <div className="relative flex h-full flex-col">
        <div className="fd06-page-nav">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="fd06-page-back"
             aria-label={t('common.back')}
          >
            <PageBackIcon />
          </motion.button>
          <h1
            className="text-center text-[17px] font-semibold"
            style={{ color: '#221122' }}
          >
            {t('demo.formulaRatio.title')}
          </h1>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/scan-formula')}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white"
            style={{ boxShadow: '0px 2px 6px rgba(0,0,0,0.06)' }}
          >
            <ScanLine className="h-4 w-4" style={{ color: '#221122' }} />
          </motion.button>
        </div>


        <PageOperationState operations={['formula.load', 'formula.select']} emptyText="暂无配比，请扫描或手动添加" />
        <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-6 pt-4">
          {loaded && orderedProfiles.map((profile) => {
            const isSelected = selectedId === profile.id;
            return (
              <motion.div
                key={profile.id}
                layout="position"
                transition={{
                  layout: {
                    duration: 0.28,
                    ease: [0.22, 1, 0.36, 1],
                  },
                }}
                onClick={() => handleSelect(profile.id)}
                className={`relative cursor-pointer rounded-[20px] pr-14 transition-[min-height,padding,background-color,border-color,box-shadow] duration-200 ${
                  isSelected
                    ? 'min-h-[94px] py-[18px] pl-5'
                    : 'min-h-[76px] py-3.5 pl-4'
                }`}
                style={{
                  background: isSelected ? '#FFFCF8' : '#FFFFFF',
                  border: isSelected
                    ? '1px solid hsl(24 67% 32% / 0.16)'
                    : '1px solid transparent',
                  boxShadow: isSelected
                    ? '0px 8px 22px rgba(125,60,15,0.10)'
                    : '0px 4px 12px rgba(0,0,0,0.04)',
                }}
              >
                {isSelected && (
                  <motion.span
                    initial={{ opacity: 0, y: -3 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-3 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: 'hsl(24 67% 32% / 0.1)',
                      color: '#8B4A1B',
                    }}
                  >
                    <OperationLabel operation="formula.select">{t('demo.formulaRatio.active')}</OperationLabel>
                  </motion.span>
                )}
                <div className={isSelected ? 'pr-12' : ''}>
                  <p className="text-[16px] font-semibold" style={{ color: '#221122' }}>
                    {profile.brand}
                    <span className="ml-2 text-[12px] font-normal" style={{ color: '#B8B3B5' }}>
                      {profile.addedAt}
                    </span>
                  </p>
                  <p
                    className="mt-1 text-[13px]"
                    style={{ color: '#999497' }}
                  >
                    {t('demo.formulaRatio.scoopInfo', {
                      scoopGrams: profile.powderPerScoop,
                      water: formatVolumeFromOz(profile.waterPerScoop, unit),
                    })}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  aria-label={`${t('demo.formulaRatio.edit')} ${profile.brand}`}
                  title={t('demo.formulaRatio.edit')}
                  onClick={(event) => {
                    event.stopPropagation();
                    openFormulaEditor(navigate, editorLocation, `/formula-edit?source=list&id=${profile.id}`);
                  }}
                  className={`absolute right-2.5 flex h-8 w-8 items-center justify-center ${
                    isSelected ? 'bottom-3' : 'bottom-2'
                  }`}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F7F3EF]">
                    <Pencil className="h-3 w-3" style={{ color: '#8B4A1B' }} />
                  </span>
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </IPhoneFrame>
  );
};

export default FormulaRatio;
