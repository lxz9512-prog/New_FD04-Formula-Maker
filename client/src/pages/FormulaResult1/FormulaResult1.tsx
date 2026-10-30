import { hasBaby } from '@/demo/BabyProfile';
import { demoSession } from '@/demo/storage';
import React, { useEffect, useId, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import BabyFormulaMaker from '../BabyFormulaMaker/BabyFormulaMaker';
import { useTranslation } from '@/hooks/useTranslation';
import { formatVolumeFromOz, roundVolume, ozToMl, useVolumeUnit } from '@/contexts/VolumeUnitContext';
import './formula-result.css';
import loggedMascot from '@/assets/feeding-logged-mascot.png';

interface ResultData {
  totalMilkTargetOz: number;
  totalMilkActualOz: number;
  timestamp: string;
}

function readResult(): ResultData {
  const fallback = { totalMilkTargetOz: 2.9, totalMilkActualOz: 2.8, timestamp: new Date().toISOString() };
  try {
    const data = JSON.parse(demoSession.getItem('formula_result') || 'null');
    if (data && Number.isFinite(data.totalMilkTargetOz) && data.totalMilkTargetOz > 0 &&
      Number.isFinite(data.totalMilkActualOz) && data.totalMilkActualOz >= 0 && typeof data.timestamp === 'string') return data;
  } catch { /* Direct preview or invalid saved result: use sample values. */ }
  return fallback;
}

export default function FormulaResult1() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { unit } = useVolumeUnit();
  const reducedMotion = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const gradientId = useId();
  const [data] = React.useState(readResult);
  const [showLogged, setShowLogged] = React.useState(false);
  const acknowledge = () => { if (hasBaby()) setShowLogged(true); else navigate('/no-baby'); };
  useEffect(() => { dialogRef.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    if (!showLogged) return;
    dialogRef.current?.focus({ preventScroll: true });
    const timeout = window.setTimeout(() => navigate('/device', { replace: true }), 2000);
    return () => window.clearTimeout(timeout);
  }, [showLogged, navigate]);

  // Show target-match accuracy, penalizing both under- and over-dispensing.
  const accuracy = Math.floor(Math.max(0, 1 - Math.abs(data.totalMilkActualOz - data.totalMilkTargetOz) / data.totalMilkTargetOz) * 100);
  const legacyDate = /^(\d{2})\/(\d{2}) (\d{2}):(\d{2})$/.exec(data.timestamp);
  const date = dayjs(legacyDate ? `${dayjs().year()}-${legacyDate[1]}-${legacyDate[2]}T${legacyDate[3]}:${legacyDate[4]}:00` : data.timestamp);
  const timeLabel = date.isValid()
    ? language === 'zh' ? date.format('M月D日 HH:mm') : date.locale('en').format('MMM D, h:mm a')
    : data.timestamp;
  const actual = roundVolume(unit === 'oz' ? data.totalMilkActualOz : ozToMl(data.totalMilkActualOz));

  return <BabyFormulaMaker completionOverlay={
    <motion.div className="formula-result-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}>
      <motion.section ref={dialogRef} tabIndex={-1} className={`formula-result-sheet${showLogged ? ' formula-logged-sheet' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId}
        initial={{ y: reducedMotion ? 0 : '100%' }} animate={{ y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.32, ease: 'easeOut' }}
        onKeyDown={event => {
          if (event.key === 'Escape') { event.preventDefault(); acknowledge(); }
          if (event.key === 'Tab') { event.preventDefault(); (showLogged ? dialogRef.current : buttonRef.current)?.focus(); }
        }}>
        {showLogged ? <div className="formula-logged-content" role="status" aria-live="polite">
          <img className="formula-logged-mascot" src={loggedMascot} alt="" />
          <h1 id={titleId}>{language === 'zh' ? '已记录' : 'Logged'}</h1>
          <svg className="formula-logged-flourish" viewBox="0 0 180 28" fill="none" aria-hidden="true">
            <path d="M4 17C46 23 77 15 106 9S158 3 171 15C178 25 161 26 167 18L178 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p>{language === 'zh' ? '今日数据已更新，每一点变化，都是宝宝悄悄长大的印记。' : "Today's data has been updated; every little change means the baby is quietly growing."}</p>
        </div> : <>
        <header>
          <h1 id={titleId}>{language === 'zh' ? '调奶完成' : 'Formula Complete'}</h1>
          <p>{timeLabel}</p>
        </header>
        <div className="formula-result-ring" role="img" aria-label={`${language === 'zh' ? '准确率' : 'Accuracy'} ${accuracy}%`}>
          <svg viewBox="0 0 160 160" aria-hidden="true">
            <defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#FFC653" /><stop offset="1" stopColor="#FFE887" /></linearGradient></defs>
            <circle cx="80" cy="80" r="68" fill="none" stroke="#fffdf7" strokeWidth="17" />
            <circle cx="80" cy="80" r="68" fill="none" stroke={`url(#${gradientId})`} strokeWidth="17" strokeLinecap="round" pathLength="100" strokeDasharray={`${accuracy} 100`} transform="rotate(-90 80 80)" />
          </svg>
          <strong>{accuracy}%</strong>
        </div>
        <div className="formula-result-amount">
          <p><strong>{actual}</strong><span> / {formatVolumeFromOz(data.totalMilkTargetOz, unit)}</span></p>
          <span>{language === 'zh' ? '调奶量' : 'Formula Amount'}</span>
        </div>
        <button ref={buttonRef} type="button" className="formula-result-confirm" onClick={acknowledge}>{language === 'zh' ? '知道了' : 'Got It'}</button>
        </>}
      </motion.section>
    </motion.div>
  } />;
}
