import { demoLocal } from '@/demo/storage';
import { useOperation } from '@/demo/react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from '@client/src/hooks/useTranslation';
import { motion } from 'framer-motion';
import { Minus, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Calendar } from '@client/src/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@client/src/components/ui/popover';
import { Button } from '@client/src/components/ui/button';
import { Textarea } from '@client/src/components/ui/textarea';
import {
  ML_PER_OZ,
  roundVolume,
  useVolumeUnit,
} from '@client/src/contexts/VolumeUnitContext';

type FeedType = '亲喂' | '瓶喂' | '奶粉';

const FEED_TYPES: FeedType[] = ['亲喂', '瓶喂', '奶粉'];
const FEEDER_OPTIONS = ['妈妈', '爸爸', '祖父母', '亲友'];
const AMOUNT_MIN = 10;
const AMOUNT_MAX = 500;
const AMOUNT_STEP = 10;

const CARD_SHADOW = '0px 4px 12px rgba(0,0,0,0.04)';

interface FeedingRecordFormProps {
  onClose: () => void;
}

const FeedingRecordForm: React.FC<FeedingRecordFormProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const { unit } = useVolumeUnit();
  const [feedType, setFeedType] = useState<FeedType>('奶粉');
  const [amount, setAmount] = useState(120);
  const [amountInput, setAmountInput] = useState('120');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState(format(new Date(), 'HH:mm'));
  const [startTime, setStartTime] = useState(
    format(new Date(Date.now() - 20 * 60 * 1000), 'HH:mm'),
  );
  const [endTime, setEndTime] = useState(format(new Date(), 'HH:mm'));
  const [feeder, setFeeder] = useState('妈妈');
  const [remark, setRemark] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const displayAmount = (valueMl: number) =>
    unit === 'ml' ? roundVolume(valueMl) : roundVolume(valueMl / ML_PER_OZ);
  const amountStep = unit === 'ml' ? AMOUNT_STEP : 1;
  const amountMin = displayAmount(AMOUNT_MIN);
  const amountMax = displayAmount(AMOUNT_MAX);

  useEffect(() => {
    setAmountInput(String(displayAmount(amount)));
  }, [unit]);

  const commitDisplayedAmount = (displayed: number) => {
    const nextMl = unit === 'ml' ? displayed : displayed * ML_PER_OZ;
    const clampedMl = Math.min(AMOUNT_MAX, Math.max(AMOUNT_MIN, nextMl));
    setAmount(clampedMl);
    setAmountInput(String(displayAmount(clampedMl)));
  };

  const feedTypeLabels: Record<FeedType, string> = {
    亲喂: t('feedingRecord.type.breastfeed'),
    瓶喂: t('feedingRecord.type.bottle'),
    奶粉: t('feedingRecord.type.formula'),
  };

  const feederLabels: Record<string, string> = {
    妈妈: t('feedingRecord.feeder.mom'),
    爸爸: t('feedingRecord.feeder.dad'),
    祖父母: t('feedingRecord.feeder.grandparents'),
    亲友: t('feedingRecord.feeder.relatives'),
  };

  const successTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (successTimer.current) clearTimeout(successTimer.current); }, []);
  const submitOperation = useOperation({ operation: 'feeding.save', stage: 'feeding', label: '保存喂养记录', success: () => {
    const records = JSON.parse(demoLocal.getItem('feeding_records') || '[]');
    records.unshift({ id: crypto.randomUUID(), type: feedType, amount: feedType === '亲喂' ? undefined : amount,
      durationMinutes: feedType === '亲喂' ? Math.max(1, (Date.parse(`2000-01-01T${endTime}`) - Date.parse(`2000-01-01T${startTime}`)) / 60000) : undefined,
      time: `${format(selectedDate, 'MM/dd')} ${selectedTime}`, feeder, remark });
    demoLocal.setItem('feeding_records', JSON.stringify(records));
    window.dispatchEvent(new Event('feedingRecordsChanged'));
    setSubmitted(true);
    successTimer.current = setTimeout(() => { setSubmitted(false); onClose(); }, 1000);
  }, edit: () => {} });
  const handleSubmit = () => { if (!submitted) submitOperation(); };

  return (
    <>
      <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-4">
        {/* Feed Type */}
        <div
          className="rounded-[18px] bg-white p-4"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <p
            className="mb-3 text-[15px] font-semibold"
            style={{ color: '#221122' }}
          >
            {t('feedingRecord.feedType')}
          </p>
          <div
            className="flex h-[40px] rounded-[20px] p-1"
            style={{ background: '#F0EFEE' }}
          >
            {FEED_TYPES.map((type) => (
              <motion.button
                key={type}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFeedType(type)}
                className="relative flex flex-1 items-center justify-center rounded-[16px] text-[13px] transition-all duration-200"
                style={
                  feedType === type
                    ? {
                        background: 'white',
                        boxShadow: '0px 2px 6px rgba(0,0,0,0.05)',
                        color: '#221122',
                        fontWeight: 600,
                      }
                    : {
                        background: 'transparent',
                        color: '#999497',
                        fontWeight: 400,
                      }
                }
              >
                {feedTypeLabels[type]}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Amount (not for 亲喂) */}
        {feedType !== '亲喂' && (
          <div
            className="rounded-[18px] bg-white p-4"
            style={{ boxShadow: CARD_SHADOW }}
          >
            <p
              className="mb-3 text-[15px] font-semibold"
              style={{ color: '#221122' }}
            >
              {t('feedingRecord.amount', { unit })}
            </p>
            <div
              className="flex h-[48px] items-center justify-between rounded-[14px] px-2"
              style={{ background: '#F5F5F5' }}
            >
              <motion.button
                whileTap={amount > AMOUNT_MIN ? { scale: 0.9 } : {}}
                onClick={() => {
                  commitDisplayedAmount(
                    Math.max(amountMin, displayAmount(amount) - amountStep),
                  );
                }}
                disabled={amount <= AMOUNT_MIN}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
              >
                <Minus className="h-5 w-5" style={{ color: '#221122' }} />
              </motion.button>
              <input
                type="number"
                inputMode="decimal"
                value={amountInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const raw = e.target.value;
                  setAmountInput(raw);
                  const parsed = Number(raw);
                  if (
                    !isNaN(parsed) &&
                    parsed >= amountMin &&
                    parsed <= amountMax
                  ) {
                    setAmount(unit === 'ml' ? parsed : parsed * ML_PER_OZ);
                  }
                }}
                onBlur={() => {
                  const parsed = Number(amountInput);
                  commitDisplayedAmount(isNaN(parsed) ? amountMin : parsed);
                }}
                className="w-20 bg-transparent text-center text-[17px] font-bold outline-none"
                style={{ color: '#221122' }}
              />
              <span className="text-[13px]" style={{ color: '#999497' }}>
                {unit}
              </span>
              <motion.button
                whileTap={amount < AMOUNT_MAX ? { scale: 0.9 } : {}}
                onClick={() => {
                  commitDisplayedAmount(
                    Math.min(amountMax, displayAmount(amount) + amountStep),
                  );
                }}
                disabled={amount >= AMOUNT_MAX}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full disabled:opacity-40"
              >
                <Plus className="h-5 w-5" style={{ color: '#221122' }} />
              </motion.button>
            </div>
          </div>
        )}

        {/* Time Picker */}
        <div
          className="rounded-[18px] bg-white p-4"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <p
            className="mb-3 text-[15px] font-semibold"
            style={{ color: '#221122' }}
          >
            {t('feedingRecord.time')}
          </p>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex h-[44px] flex-1 justify-start rounded-[14px] text-[14px] font-normal"
                  style={{ background: '#F5F5F5', borderColor: 'transparent' }}
                >
                  <CalendarIcon
                    className="mr-2 h-4 w-4"
                    style={{ color: '#999497' }}
                  />
                  <span style={{ color: '#221122' }}>
                    {selectedDate
                      ? format(selectedDate, 'yyyy/MM/dd')
                      : t('feedingRecord.selectDate')}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date: Date | undefined) =>
                    date && setSelectedDate(date)
                  }
                  locale={zhCN}
                  disabled={{ after: new Date() }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {feedType === '亲喂' ? (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-[12px]" style={{ color: '#999497' }}>
                  {t('feedingRecord.startTime')}
                </span>
                <label
                  className="flex h-[40px] cursor-pointer items-center rounded-[12px] px-3"
                  style={{ background: '#F5F5F5' }}
                >
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setStartTime(e.target.value)
                    }
                    className="w-full bg-transparent text-[14px] outline-none"
                    style={{ color: '#221122' }}
                  />
                </label>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <span className="text-[12px]" style={{ color: '#999497' }}>
                  {t('feedingRecord.endTime')}
                </span>
                <label
                  className="flex h-[40px] cursor-pointer items-center rounded-[12px] px-3"
                  style={{ background: '#F5F5F5' }}
                >
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEndTime(e.target.value)
                    }
                    className="w-full bg-transparent text-[14px] outline-none"
                    style={{ color: '#221122' }}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-2">
              <label
                className="flex h-[44px] cursor-pointer items-center rounded-[14px] px-3"
                style={{ background: '#F5F5F5' }}
              >
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSelectedTime(e.target.value)
                  }
                  className="w-full bg-transparent text-[14px] outline-none"
                  style={{ color: '#221122' }}
                />
              </label>
              <div className="flex gap-1.5">
                {[
                  { label: t('feedingRecord.now'), hours: 0 },
                  { label: t('feedingRecord.hoursAgo1'), hours: 1 },
                  { label: t('feedingRecord.hoursAgo2'), hours: 2 },
                ].map((item) => {
                  return (
                    <motion.button
                      key={item.label}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const d = new Date();
                        d.setHours(d.getHours() - item.hours);
                        setSelectedDate(d);
                        setSelectedTime(format(d, 'HH:mm'));
                      }}
                      className="rounded-[10px] px-2.5 py-1 text-[12px]"
                      style={{ background: '#F0EFEE', color: '#666' }}
                    >
                      {item.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Feeder Role (not for 亲喂) */}
        {feedType !== '亲喂' && (
          <div
            className="rounded-[18px] bg-white p-4"
            style={{ boxShadow: CARD_SHADOW }}
          >
            <p
              className="mb-3 text-[15px] font-semibold"
              style={{ color: '#221122' }}
            >
              {t('feedingRecord.feederRole')}
            </p>
            <div className="flex flex-wrap gap-2">
              {FEEDER_OPTIONS.map((role: string) => (
                <motion.button
                  key={role}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFeeder(role)}
                  className="rounded-[14px] px-4 py-2 text-[13px] font-medium transition-all duration-200"
                  style={
                    feeder === role
                      ? { background: '#8B4A1B', color: '#fff' }
                      : { background: '#F0EFEE', color: '#666' }
                  }
                >
                  {feederLabels[role]}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Remark */}
        <div
          className="rounded-[18px] bg-white p-4"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <p
            className="mb-3 text-[15px] font-semibold"
            style={{ color: '#221122' }}
          >
            {t('feedingRecord.remark')}
          </p>
          <Textarea
            placeholder={t('feedingRecord.remarkPlaceholder')}
            value={remark}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setRemark(e.target.value)
            }
            className="min-h-[80px] resize-none rounded-[14px] text-[13px]"
            style={{ background: '#F5F5F5', borderColor: 'transparent' }}
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="relative z-10 px-5 pb-6 pt-2">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={submitted}
          className="flex h-[52px] w-full items-center justify-center rounded-[26px] text-[16px] font-semibold text-white transition-all duration-200"
          style={{
            backgroundColor: submitted ? '#5DB97E' : '#8B4A1B',
            boxShadow: '0px 6px 16px rgba(125,60,15,0.3)',
          }}
        >
          {submitted ? t('feedingRecord.saved') : t('feedingRecord.saveRecord')}
        </motion.button>
      </div>

      {/* Success Toast */}
      {submitted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-2xl bg-[#5DB97E] px-6 py-3 text-[14px] font-medium text-white"
          style={{ boxShadow: '0 4px 16px rgba(93,185,126,0.3)' }}
        >
          {t('feedingRecord.saveSuccess')}
        </motion.div>
      )}
    </>
  );
};

export default FeedingRecordForm;
