import { useState } from 'react';
import { useOperation, OperationLabel } from './react';
import { demoLocal } from './storage';
import React from 'react';
import IPhoneFrame from '@/components/IPhoneFrame';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { PageBackIcon } from '@/components/PageNavigation';
// Published-only profile extension, kept readable and shared rather than reverse-engineering the bundle.
// @ts-expect-error Existing published JS module has no type declarations.
import { createBabyProfileFlow } from './baby-profile-flow.js';
import './baby-profile-flow.css';
const { MissingBabyPrompt: Prompt, hasBaby } = createBabyProfileFlow({
  React,
  DeviceFrame: IPhoneFrame,
  navigate: useNavigate,
  language: useTranslation,
  BackIcon: PageBackIcon,
});

export { hasBaby };
export function MissingBabyPrompt() {
  return (
    <IPhoneFrame>
      <Prompt />
    </IPhoneFrame>
  );
}

export function AddBabyPage() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const zh = language === 'zh';
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('unspecified');
  const today = new Date();
  const maxDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const save = useOperation(
    {
      operation: 'baby.save',
      stage: 'baby',
      label: '保存宝宝档案',
      success: () => {
        if (!name.trim() || !birthday || birthday > maxDate) return;
        demoLocal.setItem(
          'fd04_baby_profile',
          JSON.stringify({ name: name.trim(), birthday, gender }),
        );
        window.dispatchEvent(new Event('fd04BabyProfileChanged'));
        navigate('/device', { replace: true });
      },
      edit: () => {},
    },
    () => {
      setName((n) => n || '演示宝宝');
      setBirthday((d) => d || '2026-01-01');
    },
  );
  return (
    <IPhoneFrame background="#F8F7F5">
      <div className="baby-add-page">
        <div className="fd06-page-nav">
          <button
            className="fd06-page-back"
            aria-label={zh ? '返回' : 'Back'}
            onClick={() => navigate('/device')}
          >
            <PageBackIcon />
          </button>
          <h1>{zh ? '添加宝宝' : 'Add Baby'}</h1>
          <div style={{ width: 32 }} />
        </div>
        <form
          className="baby-add-form"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <div className="baby-add-intro">
            <span className="baby-add-avatar">♡</span>
            <h2>{zh ? '认识一下你的小宝贝' : 'Meet Your Little One'}</h2>
            <p>
              {zh
                ? '完善宝宝信息，开始记录每一次喂养。'
                : 'Add a few details to start tracking feedings.'}
            </p>
          </div>
          <div className="baby-fields">
            <label htmlFor="baby-name">{zh ? '宝宝昵称' : 'Baby’s Name'}</label>
            <input
              id="baby-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={30}
            />
            <label htmlFor="baby-birthday">
              {zh ? '出生日期' : 'Date of Birth'}
            </label>
            <input
              id="baby-birthday"
              type="date"
              min="1900-01-01"
              max={maxDate}
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              required
            />
            <label htmlFor="baby-gender">
              {zh ? '宝宝性别（选填）' : 'Gender (Optional)'}
            </label>
            <select
              id="baby-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="unspecified">
                {zh ? '暂不填写' : 'Prefer not to say'}
              </option>
              <option value="girl">{zh ? '女宝宝' : 'Girl'}</option>
              <option value="boy">{zh ? '男宝宝' : 'Boy'}</option>
            </select>
          </div>
          <p className="baby-local-note">
            {zh
              ? '演示信息仅保存在当前浏览器，不会上传。'
              : 'Demo details stay in this browser and are not uploaded.'}
          </p>
          <button type="submit" className="baby-primary baby-save">
            <OperationLabel operation="baby.save">
              {zh ? '保存' : 'Save'}
            </OperationLabel>
          </button>
        </form>
      </div>
    </IPhoneFrame>
  );
}
