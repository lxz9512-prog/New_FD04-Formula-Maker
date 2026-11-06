import BabyFormulaMaker from '@/pages/BabyFormulaMaker/BabyFormulaMaker';
import FormulaSyncControls from './FormulaSyncControls';

export default function FormulaRatioSync() {
  return (
    <div
      className="scene-sync relative w-[393px] shrink-0"
      style={{ height: 852 }}
    >
      <BabyFormulaMaker syncControls={false} />
      <FormulaSyncControls />
    </div>
  );
}
