import { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useVolumeUnit } from '@/contexts/VolumeUnitContext';
import { demoLocal } from './storage';

/** Presentation settings share the original contexts and connector visibility event. */
export function PreviewControls() {
  const { language, setLanguage } = useTranslation();
  const { unit, setUnit } = useVolumeUnit();
  const [lines, setLines] = useState(
    () => demoLocal.getItem('show_interaction_lines') !== 'false',
  );
  useEffect(() => {
    const update = () =>
      setLines(demoLocal.getItem('show_interaction_lines') !== 'false');
    window.addEventListener('interactionLinesVisibilityChange', update);
    return () =>
      window.removeEventListener('interactionLinesVisibilityChange', update);
  }, []);
  return (
    <section className="scene-preview-controls" aria-label="显示设置">
      <div className="scene-control-row">
        <span>语言</span>
        <div className="scene-segment" role="group" aria-label="语言">
          {(['zh', 'en'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              aria-label={lang === 'zh' ? '中文' : 'English'}
              aria-pressed={language === lang}
              onClick={() => setLanguage(lang)}
            >
              {lang === 'zh' ? '中' : 'EN'}
            </button>
          ))}
        </div>
      </div>
      <div className="scene-control-row">
        <span>单位</span>
        <div className="scene-segment" role="group" aria-label="容量单位">
          {(['ml', 'oz'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`${value} unit`}
              aria-pressed={unit === value}
              onClick={() => setUnit(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
      <div className="scene-control-row">
        <span>交互连线</span>
        <button
          type="button"
          className="scene-switch"
          role="switch"
          aria-label="显示连接线"
          aria-checked={lines}
          onClick={() => {
            demoLocal.setItem('show_interaction_lines', String(!lines));
            window.dispatchEvent(new Event('interactionLinesVisibilityChange'));
          }}
        >
          <span />
        </button>
      </div>
    </section>
  );
}
