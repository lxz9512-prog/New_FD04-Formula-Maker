import React from 'react';
import IPhoneFrame from '@/components/IPhoneFrame';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { PageBackIcon } from '@/components/PageNavigation';
// Published-only profile extension, kept readable and shared rather than reverse-engineering the bundle.
// @ts-expect-error Existing published JS module has no type declarations.
import { createBabyProfileFlow } from './baby-profile-flow.js';
import './baby-profile-flow.css';
const {
  AddBabyPage,
  MissingBabyPrompt: Prompt,
  hasBaby,
} = createBabyProfileFlow({
  React,
  DeviceFrame: IPhoneFrame,
  navigate: useNavigate,
  language: useTranslation,
  BackIcon: PageBackIcon,
});

export { AddBabyPage, hasBaby };
export function MissingBabyPrompt() {
  return (
    <IPhoneFrame>
      <Prompt />
    </IPhoneFrame>
  );
}
