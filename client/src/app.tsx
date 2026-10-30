import React from 'react';
import { AddBabyPage, MissingBabyPrompt } from './demo/BabyProfile';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import { VolumeUnitProvider } from './contexts/VolumeUnitContext';

import Layout from './components/Layout';
import NotFound from './pages/NotFound/NotFound';
import BabyFormulaMaker from './pages/BabyFormulaMaker/BabyFormulaMaker';
import DeviceList from './pages/DeviceList/DeviceList';
import FormulaRatio from './pages/Demo/FormulaRatio/FormulaRatio';
import FormulaRatioSync from './pages/Demo/FormulaRatioSync/FormulaRatioSync';
import CaptureFormulaBackSide from './pages/Demo/FormulaRatio/CaptureFormulaBackSide/CaptureFormulaBackSide';
import FeedingStats from './pages/FeedingStats/FeedingStats';
import CaptureFormulaFront from './pages/Demo/FormulaRatio/CaptureFormulaFront/CaptureFormulaFront';
import CaptureFormula from './pages/Demo/FormulaRatio/CaptureFormula/CaptureFormula';
import CaptureFormulaStep2 from './pages/Demo/FormulaRatio/CaptureFormulaStep2/CaptureFormulaStep2';
import FormulaEdit from './pages/Demo/FormulaRatio/FormulaEdit/FormulaEdit';
import AddFeedingRecord from './pages/AddFeedingRecord/AddFeedingRecord';
import FeedingGuide from './pages/FeedingGuide/FeedingGuide';
import DeviceSettings from './pages/DeviceSettings/DeviceSettings';
import DeviceDetail from './pages/DeviceDetail/DeviceDetail';
import PowderWater from './pages/PowderWater/PowderWater';
import DeviceCleaning from './pages/DeviceCleaning/DeviceCleaning';
import FormulaResult1 from './pages/FormulaResult1/FormulaResult1';
import WaterLowError from './pages/WaterLowError/WaterLowError';
import PowderError from './pages/PowderError/PowderError';
import PowderCleanReminder from './pages/PowderCleanReminder/PowderCleanReminder';
import PowderCleanDue from './pages/PowderCleanDue/PowderCleanDue';
import NightWaterLow from './pages/NightWaterLow/NightWaterLow';
import DeviceAssistant from './pages/DeviceAssistant/DeviceAssistant';
import FAQList from './pages/FAQList/FAQList';
import MixingChamberCleaning from './pages/FAQList/MixingChamberCleaning';
import PowderOutputError from './pages/PowderOutputError/PowderOutputError';
import NotificationSettings from './pages/NotificationSettings/NotificationSettings';
import CleaningIncomplete from './pages/CleaningIncomplete/CleaningIncomplete';
import TubeCleanReminder from './pages/TubeCleanReminder/TubeCleanReminder';

const RoutesComponent = () => {
  return (
    <LanguageProvider>
      <VolumeUnitProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DeviceList />} />
            <Route path="no-baby" element={<MissingBabyPrompt />} />
            <Route path="add-baby" element={<AddBabyPage />} />
            <Route path="device" element={<BabyFormulaMaker />} />
            <Route path="formula-ratio" element={<FormulaRatio />} />
            <Route path="formula-ratio-sync" element={<FormulaRatioSync />} />
            <Route path="scan-formula" element={<CaptureFormulaFront />} />
            <Route
              path="capture-formula-back-side"
              element={<CaptureFormulaBackSide />}
            />
            <Route path="feeding-stats" element={<FeedingStats />} />
            <Route
              path="feeding-stats/add-record"
              element={<AddFeedingRecord />}
            />
            <Route path="feeding-stats/guide" element={<FeedingGuide />} />
            <Route
              path="capture-formula-front"
              element={<CaptureFormulaFront />}
            />
            <Route path="capture-formula" element={<CaptureFormula />} />
            <Route
              path="capture-formula-step2"
              element={<CaptureFormulaStep2 />}
            />
            <Route
              path="capture-formula-step2/upload-failed"
              element={<CaptureFormulaStep2 initialFailure="upload" />}
            />
            <Route
              path="capture-formula-step2/recognition-failed"
              element={<CaptureFormulaStep2 initialFailure="recognition" />}
            />
            <Route path="formula-edit" element={<FormulaEdit />} />
            <Route path="device-settings" element={<DeviceSettings />} />
            <Route path="device-detail" element={<DeviceDetail />} />
            <Route path="powder-water" element={<PowderWater />} />
            <Route path="device-cleaning" element={<DeviceCleaning />} />
            <Route path="formula-result" element={<FormulaResult1 />} />
            <Route path="formula-result1" element={<FormulaResult1 />} />
            <Route path="water-low-error" element={<WaterLowError />} />
            <Route path="powder-error" element={<PowderError />} />
            <Route
              path="water-quality-error"
              element={<BabyFormulaMaker waterQualityError />}
            />
            <Route
              path="powder-clean-reminder"
              element={<PowderCleanReminder />}
            />
            <Route path="powder-clean-due" element={<PowderCleanDue />} />
            <Route path="night-water-low" element={<NightWaterLow />} />
            <Route
              path="cleaning-incomplete"
              element={<CleaningIncomplete />}
            />
            <Route path="device-assistant" element={<DeviceAssistant />} />
            <Route path="faq" element={<FAQList />} />
            <Route
              path="faq/mixing-chamber-cleaning"
              element={<MixingChamberCleaning />}
            />
            <Route
              path="faq/powder-output-error"
              element={<PowderOutputError />}
            />
            <Route
              path="water-calibration"
              element={<Navigate to="/device-settings" replace />}
            />
            <Route
              path="notification-settings"
              element={<NotificationSettings />}
            />
            <Route
              path="water-calibration-reminder"
              element={<Navigate to="/device" replace />}
            />
            <Route path="tube-clean-reminder" element={<TubeCleanReminder />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </VolumeUnitProvider>
    </LanguageProvider>
  );
};

export default RoutesComponent;
