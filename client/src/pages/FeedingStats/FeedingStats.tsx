import { demoLocal } from '@/demo/storage';
import { useLoadOperation } from '@/demo/react';
import { PageBackIcon } from '@/components/PageNavigation';
import React, { useState, useMemo } from "react";
import './feeding-stats.css';
import { useTranslation } from "@client/src/hooks/useTranslation";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ChevronLeft, ChevronRight, ChevronDown, Check, BookOpen } from "lucide-react";
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import dayjs from "dayjs";
import IPhoneFrame from "@client/src/components/IPhoneFrame";
import FeedingRecordForm from "@client/src/pages/AddFeedingRecord/FeedingRecordForm";
import {
  ML_PER_OZ,
  formatVolumeFromMl,
  roundVolume,
  useVolumeUnit,
  type VolumeUnit,
} from "@client/src/contexts/VolumeUnitContext";

type TimeTab = "Daily" | "Weekly" | "Monthly";

const TABS: TimeTab[] = ["Daily", "Weekly", "Monthly"];

const DAILY_DATA = [30, 60, 120, 90, 150, 120, 180];
const DAILY_LABELS = ["0:00", "6:00", "9:00", "12:00", "15:00", "18:00", "21:00"];

const WEEKLY_DATA = [480, 540, 600, 510, 570, 630, 480];

const TODAY_TOTAL = 720;
const TODAY_COUNT = 6;

function buildLineOption(
  labels: string[],
  data: number[],
  unit: VolumeUnit | 'min' | '分钟',
  seriesLabel: string,
): EChartsOption {
  const isDateAxis = labels.length > 0 && labels.every(label => /^\d{2}\/\d{2}$/.test(label));
  const option: EChartsOption = {
    // Keep all dates available, but lock the viewport to at most six days.
    dataZoom: isDateAxis && labels.length > 6 ? [{
      type: 'inside',
      xAxisIndex: 0,
      startValue: 0,
      endValue: 5,
      minValueSpan: 5,
      maxValueSpan: 5,
      zoomLock: true,
      zoomOnMouseWheel: false,
      moveOnMouseWheel: false,
      moveOnMouseMove: true,
      preventDefaultMouseMove: true,
      filterMode: 'filter',
    }] : [],
    tooltip: {
      trigger: "axis",
      confine: true,
      backgroundColor: "#48200F",
      borderWidth: 0,
      padding: [12, 14],
      extraCssText: 'border-radius:14px;box-shadow:none;',
      formatter: `{a}: {c} ${unit}`,
      axisPointer: { type: 'line', lineStyle: { color: '#593420', width: 1, type: 'solid' } },
      textStyle: {
        color: "#FFFFFF",
        fontSize: 12,
      },
    },
    grid: {
      left: 36,
      right: 22,
      top: 65,
      bottom: 30,
      containLabel: false,
    },
    xAxis: {
      type: "category",
      data: labels,
      boundaryGap: false,
      axisLine: { show: true, lineStyle: { color: "#E8E8E8" } },
      axisTick: { show: false },
      splitLine: { show: true, lineStyle: { color: '#DDD9D9', type: 'dotted' } },
      axisLabel: {
        color: "#999497",
        fontSize: 11,
        interval: isDateAxis ? 0 : 'auto',
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      name: unit,
      nameLocation: "end",
      nameTextStyle: {
        color: "#999497",
        fontSize: 11,
        padding: [0, 0, 0, -20],
      },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: {
          color: "#F0EFEE",
          type: "solid",
        },
      },
      axisLabel: {
        color: "#999497",
        fontSize: 11,
      },
    },
    series: [
      {
        name: seriesLabel,
        type: "line",
        data,
        smooth: true,
        symbol: "circle",
        symbolSize: 5,
        lineStyle: {
          color: "#34212D",
          width: 1.5,
        },
        itemStyle: {
          color: "#34212D",
          borderColor: "#FFFFFF",
          borderWidth: 1,
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "#34212D16" },
              { offset: 1, color: "#34212D00" },
            ],
          },
        },
      },
    ],
  };
  return option;
}

interface FeedRecord {
  id: string;
  type: "亲喂" | "瓶喂" | "奶粉";
  amount?: number;
  durationMinutes?: number;
  time: string;
  feeder: string;
}

const MOCK_RECORDS: FeedRecord[] = [
  { id: "1", type: "奶粉", amount: 30, time: "07/05 21:09", feeder: "祖父母" },
  { id: "2", type: "亲喂", durationMinutes: 18, time: "07/05 18:30", feeder: "妈妈" },
  { id: "3", type: "瓶喂", amount: 45, time: "07/05 15:20", feeder: "爸爸" },
  { id: "4", type: "奶粉", amount: 20, time: "07/05 12:00", feeder: "亲友" },
];

const FeedingStats: React.FC = () => {
  const navigate = useNavigate();
  const { loaded, reload } = useLoadOperation('feeding.load', 'feeding');
  const [recordRevision, refreshRecords] = React.useReducer(n => n + 1, 0);
  React.useEffect(() => { window.addEventListener('feedingRecordsChanged', refreshRecords); return () => window.removeEventListener('feedingRecordsChanged', refreshRecords); }, []);
  let savedRecords: FeedRecord[] = [];
  try { savedRecords = JSON.parse(demoLocal.getItem('feeding_records') || '[]'); } catch {}
  let deviceRecords: FeedRecord[] = [];
  try { deviceRecords = JSON.parse(demoLocal.getItem('feeding_history') || '[]').map((record: { ml: number; time: string }, index: number) => ({ id: `device-${index}`, type: '奶粉', amount: record.ml, time: dayjs(record.time).format('MM/DD HH:mm'), feeder: '调奶器' })); } catch {}
  const allRecords = [...savedRecords, ...deviceRecords, ...MOCK_RECORDS];
  const { t, language } = useTranslation();
  const zh = language === 'zh';
  const { unit } = useVolumeUnit();
  const [activeTab, setActiveTab] = useState<TimeTab>("Daily");
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedWeekStart, setSelectedWeekStart] = useState(dayjs().startOf("week"));
  const [selectedMonth, setSelectedMonth] = useState(dayjs().startOf("month"));
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [feedingType, setFeedingType] = useState<FeedRecord['type'] | 'all'>('all');
  const feedingOptions = [
    { value: 'all', label: t('feedingStats.title') },
    { value: '亲喂', label: zh ? '亲喂' : 'Breastfeeding' },
    { value: '瓶喂', label: zh ? '瓶喂' : 'Bottle Feeding' },
    { value: '奶粉', label: zh ? '奶粉喂' : 'Formula Feeding' },
  ] as const;
  const filteredRecords = feedingType === 'all' ? allRecords : allRecords.filter(record => record.type === feedingType);
  const isBreastfeeding = feedingType === '亲喂';
  const selectedTotal = filteredRecords.reduce((total, record) => total + (isBreastfeeding ? record.durationMinutes || 0 : record.amount || 0), 0);

  const tabLabels: Record<TimeTab, string> = {
    Daily: zh ? '日' : 'D',
    Weekly: zh ? '周' : 'W',
    Monthly: zh ? '月' : 'M',
  };

  const feedTypeLabels: Record<string, string> = {
    "亲喂": t("feedingRecord.type.breastfeed"),
    "瓶喂": t("feedingRecord.type.bottle"),
    "奶粉": t("feedingRecord.type.formula"),
  };

  const weeklyLabels = Array.from({ length: 7 }, (_, index) => selectedWeekStart.add(index, 'day').format('MM/DD'));
  const monthlyLabels = Array.from({ length: selectedMonth.daysInMonth() }, (_, index) => selectedMonth.startOf('month').add(index, 'day').format('MM/DD'));

  const handleBack = () => {
    navigate("/device");
  };

  const isAtMax = useMemo(() => {
    const now = dayjs();
    if (activeTab === "Daily") return selectedDate.isSame(now, "day");
    if (activeTab === "Weekly") return selectedWeekStart.isSame(now.startOf("week"), "day");
    return selectedMonth.isSame(now.startOf("month"), "month");
  }, [activeTab, selectedDate, selectedWeekStart, selectedMonth]);

  const dateLabel = useMemo(() => {
    if (activeTab === "Daily") {
      if (selectedDate.isSame(dayjs(), "day")) return t("feedingStats.today");
      return selectedDate.format("MMM D, YYYY");
    }
    if (activeTab === "Weekly") {
      const end = selectedWeekStart.add(6, "day");
      return `${selectedWeekStart.format("MMM D")} - ${end.format("MMM D")}`;
    }
    return selectedMonth.format("MMM YYYY");
  }, [activeTab, selectedDate, selectedWeekStart, selectedMonth, t]);

  const handlePrev = () => {
    if (activeTab === "Daily") setSelectedDate((d) => d.subtract(1, "day"));
    else if (activeTab === "Weekly") setSelectedWeekStart((d) => d.subtract(1, "week"));
    else setSelectedMonth((d) => d.subtract(1, "month"));
  };

  const handleNext = () => {
    if (activeTab === "Daily") setSelectedDate((d) => d.add(1, "day"));
    else if (activeTab === "Weekly") setSelectedWeekStart((d) => d.add(1, "week"));
    else setSelectedMonth((d) => d.add(1, "month"));
  };

  const getChartOption = (): EChartsOption => {
    if (feedingType !== 'all') {
      const records = [...filteredRecords].reverse();
      const valueOf = (record: FeedRecord) => isBreastfeeding ? record.durationMinutes || 0 : record.amount || 0;
      const labels = activeTab === 'Weekly' ? weeklyLabels : activeTab === 'Monthly' ? monthlyLabels : records.map(record => record.time);
      const values = activeTab === 'Daily' ? records.map(valueOf) : labels.map(date => records.filter(record => record.time.slice(0, 5) === date).reduce((total, record) => total + valueOf(record), 0));
      return buildLineOption(
        labels,
        values.map(value => isBreastfeeding || unit === 'ml' ? value : roundVolume(value / ML_PER_OZ)),
        isBreastfeeding ? (zh ? '分钟' : 'min') : unit,
        isBreastfeeding ? (zh ? '亲喂时长' : 'Nursing duration') : (zh ? '喂养量' : 'Milk Output'),
      );
    }
    const convertData = (data: number[]) =>
      unit === "ml" ? data : data.map((value) => roundVolume(value / ML_PER_OZ));
    if (activeTab === "Daily") {
      return buildLineOption(DAILY_LABELS, convertData(DAILY_DATA), unit, zh ? '喂养量' : 'Milk Output');
    }
    if (activeTab === "Weekly") {
      return buildLineOption(weeklyLabels, convertData(WEEKLY_DATA), unit, zh ? '喂养量' : 'Milk Output');
    }
    // Prototype daily totals; keep one point per date in the selected month.
    const monthlyData = monthlyLabels.map((_, index) => WEEKLY_DATA[index % WEEKLY_DATA.length]);
    return buildLineOption(monthlyLabels, convertData(monthlyData), unit, zh ? '喂养量' : 'Milk Output');
  };

  return (
    <IPhoneFrame background="#FFFFFF"><div className="h-full flex flex-col"><button className="mock-list-reload" onClick={reload}>重新加载记录</button><div className="min-h-0 flex-1" style={{ visibility: loaded ? 'visible' : 'hidden' }}>
      <div className="feeding-stats-page">
        <header className="fd06-page-nav">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleBack}
            className="fd06-page-back"
            aria-label={t('common.back')}
          >
            <PageBackIcon />
          </motion.button>
          <div className="feeding-type-picker">
            <DropdownMenu.Root modal={false}>
              <h1>
                <DropdownMenu.Trigger className="feeding-type-trigger">
                  <span>{feedingOptions.find(option => option.value === feedingType)?.label}</span>
                  <ChevronDown size={16} aria-hidden="true" />
                </DropdownMenu.Trigger>
              </h1>
              <DropdownMenu.Content className="feeding-type-menu" align="center" sideOffset={8} collisionPadding={16} aria-label={zh ? '喂养类型' : 'Feeding type'}>
                <DropdownMenu.RadioGroup value={feedingType} onValueChange={value => setFeedingType(value as FeedRecord['type'] | 'all')}>
                  {feedingOptions.map(option => (
                    <DropdownMenu.RadioItem className="feeding-type-option" key={option.value} value={option.value}>
                      <span>{option.label}</span>
                      <DropdownMenu.ItemIndicator><Check size={16} aria-hidden="true" /></DropdownMenu.ItemIndicator>
                    </DropdownMenu.RadioItem>
                  ))}
                </DropdownMenu.RadioGroup>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </div>
        </header>

        <main className="feeding-stats-scroll">
          <div className="feeding-period-controls">
            <button className="feeding-round-button" onClick={handlePrev} aria-label={zh ? '上一周期' : 'Previous period'}><ChevronLeft size={20} /></button>
            <div className="feeding-period-tabs" role="group" aria-label={zh ? '统计周期' : 'Time range'}>
            {TABS.map((tab) => (
              <motion.button
                key={tab}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab)}
                aria-pressed={activeTab === tab}
                aria-label={t(`feedingStats.tab.${tab.toLowerCase()}`)}
                >
                {tabLabels[tab]}
              </motion.button>
            ))}
            </div>
            <button className="feeding-round-button" onClick={handleNext} disabled={isAtMax} aria-label={zh ? '下一周期' : 'Next period'}><ChevronRight size={20} /></button>
          </div>
          <p className="feeding-period-label" aria-live="polite">{dateLabel}</p>
          <section className="feeding-trend" aria-label={zh ? '喂养量趋势图' : 'Feeding volume chart'}>
            <ReactECharts
              option={getChartOption()}
              notMerge
              style={{ height: 248, width: '100%' }}
              opts={{ renderer: "svg" }}
            />
          </section>
          <section className="feeding-outline-card feeding-overall">
            <h2>{zh ? '概览' : 'Overall'}</h2>
            <div className="feeding-overall-grid">
              <div><p>{feedingType === 'all' ? (zh ? '今日总量' : 'Today Total') : isBreastfeeding ? (zh ? '总时长' : 'Total Duration') : (zh ? '总喂养量' : 'Total Volume')}</p><strong>{feedingType === 'all' ? (unit === 'ml' ? (TODAY_TOTAL + savedRecords.reduce((sum, r) => sum + (r.amount || 0), 0)) : roundVolume((TODAY_TOTAL + savedRecords.reduce((sum, r) => sum + (r.amount || 0), 0)) / ML_PER_OZ)) : isBreastfeeding || unit === 'ml' ? selectedTotal : roundVolume(selectedTotal / ML_PER_OZ)} <small>{isBreastfeeding ? (zh ? '分钟' : 'min') : unit}</small></strong></div>
              <div><p>{zh ? '喂养次数' : 'Feeding Times'}</p><strong>{feedingType === 'all' ? TODAY_COUNT + savedRecords.length : filteredRecords.length}</strong></div>
            </div>
          </section>

          {/* Feeding Guide Entry */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/feeding-stats/guide")}
            className="feeding-guide-banner"
          >
            <BookOpen size={22} fill="#AA702D" strokeWidth={1.3} />
            <span><strong>{zh ? '科学喂养指南' : 'Feeding Science Guide'}</strong><small>{zh ? '你已经做得很棒了。' : "You're doing amazing."}</small></span>
            <ChevronRight size={21} strokeWidth={1.5} />
          </motion.button>

          {/* Feeding Records */}
          <section className="feeding-outline-card feeding-records">
            <h2>{zh ? '记录' : 'Records'}</h2>
            {filteredRecords.map((record) => (
              <article key={record.id} className="feeding-record">
                <h3>{record.time}</h3>
                <div className="feeding-record-line"><span>{zh ? '类型' : 'Type'}</span><i aria-hidden="true" /><span>{feedTypeLabels[record.type]}</span></div>
                <div className="feeding-record-line"><span>{record.type === '亲喂' ? (zh ? '时长' : 'Duration') : (zh ? '喂养量' : 'Feeding Amount')}</span><i aria-hidden="true" /><span>{record.type === '亲喂' ? t('feedingStats.minutes', { count: record.durationMinutes || 0 }) : `${zh ? '共 ' : 'Total '}${formatVolumeFromMl(record.amount || 0, unit)}`}</span></div>
              </article>
            ))}
          </section>
        </main>
        <motion.button whileTap={{ scale: 0.96 }} className="feeding-add-record" onClick={() => setShowAddSheet(true)} aria-label={t('feedingStats.addRecord')}>
          <Plus size={21} strokeWidth={1.7} />{zh ? '记录' : 'Record'}
        </motion.button>

        {/* Bottom Sheet - Add Feeding Record */}
        <AnimatePresence>
          {showAddSheet && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-30"
                style={{ background: "rgba(0,0,0,0.3)" }}
                onClick={() => setShowAddSheet(false)}
              />
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                role="dialog"
                aria-modal="true"
                aria-label={t('feedingStats.addRecord')}
                className="absolute bottom-0 left-0 right-0 z-40 flex max-h-[88%] flex-col rounded-t-[24px]"
                style={{ background: "linear-gradient(to bottom, hsl(39, 50%, 95%), hsl(39, 30%, 97%))" }}
              >
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                  <h2 className="text-[18px] font-semibold" style={{ color: "#221122" }}>
                    {t("feedingStats.addRecord")}
                  </h2>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddSheet(false)}
                    aria-label={zh ? '关闭' : 'Close'}
                    className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-white"
                    style={{ boxShadow: "0px 2px 6px rgba(0,0,0,0.06)" }}
                  >
                    <Plus className="h-4 w-4 rotate-45" style={{ color: "#221122" }} />
                  </motion.button>
                </div>
                <FeedingRecordForm onClose={() => setShowAddSheet(false)} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div></div></IPhoneFrame>
  );
};

export default FeedingStats;
