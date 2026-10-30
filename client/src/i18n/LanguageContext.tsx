import { demoLocal } from '@/demo/storage';
import React, { useEffect, createContext, useState, useCallback } from 'react';

export type Language = 'zh' | 'en';

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const STORAGE_KEY = 'app_language';

function getInitialLanguage(): Language {
  try {
    const stored = demoLocal.getItem(STORAGE_KEY);
    if (stored === 'zh' || stored === 'en') return stored;
  } catch {
    // ignore
  }
  return 'zh';
}

export const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

const translations: Record<string, Record<Language, string>> = {
  'common.back': { zh: '返回', en: 'Back' },
  'common.cancel': { zh: '取消', en: 'Cancel' },
  'common.save': { zh: '保存', en: 'Save' },
  'common.confirm': { zh: '确认', en: 'Confirm' },
  'common.continue': { zh: '继续', en: 'Continue' },
  'common.done': { zh: '完成', en: 'Done' },
  'common.close': { zh: '关闭', en: 'Close' },
  'common.today': { zh: '今天', en: 'Today' },

  'deviceDetail.title': { zh: '设备详情', en: 'Device Details' },
  'deviceDetail.deviceName': { zh: '设备名称', en: 'Device Name' },
  'deviceDetail.macAddress': { zh: 'MAC 地址', en: 'MAC Address' },
  'deviceDetail.serialNumber': { zh: 'SN 序列号', en: 'Serial Number' },
  'deviceDetail.editDeviceName': { zh: '修改设备名称', en: 'Edit Device Name' },
  'deviceDetail.namePlaceholder': {
    zh: '请输入设备名称',
    en: 'Enter device name',
  },

  'deviceSettings.title': { zh: '设备设置', en: 'Device Settings' },
  'deviceSettings.deviceFunctions': { zh: '设备功能', en: 'Device Functions' },
  'deviceSettings.formulaRatio': { zh: '粉水配比', en: 'Formula Ratio' },
  'deviceSettings.powderWater': { zh: '粉水量', en: 'Powder & Water' },
  'deviceSettings.tubeCleaning': { zh: '管路清洁', en: 'Tube Cleaning' },
  'deviceSettings.waterCalibration': {
    zh: '水量校准',
    en: 'Water Calibration',
  },
  'deviceSettings.nightLightAuto': {
    zh: '夜灯自动感应',
    en: 'Auto Night Light',
  },
  'deviceSettings.nightLightDesc': {
    zh: '开启后，每次冲奶时自动亮起夜灯，持续照明1分钟',
    en: 'When enabled, night light turns on automatically during formula making for 1 minute',
  },
  'deviceSettings.generalSettings': { zh: '通用设置', en: 'General Settings' },
  'deviceSettings.smartAssistant': {
    zh: '智能设备助手',
    en: 'Smart Assistant',
  },
  'deviceSettings.notificationSettings': {
    zh: '消息提醒',
    en: 'Notifications',
  },
  'deviceSettings.firmwareUpdate': { zh: '固件升级', en: 'Firmware Update' },
  'deviceSettings.shareDevice': { zh: '分享设备', en: 'Share Device' },
  'deviceSettings.restartDevice': { zh: '重启设备', en: 'Restart Device' },
  'deviceSettings.deleteDevice': { zh: '删除设备', en: 'Delete Device' },

  'maker.title': { zh: '智能调奶器', en: 'Baby Formula Maker' },
  'maker.waterLow': {
    zh: '水量不足，请加水后继续使用',
    en: 'Water level is low. Please refill to continue.',
  },
  'maker.powderError': {
    zh: '出粉异常，请检查并补充奶粉',
    en: 'Powder dispenser error. Please check and refill.',
  },
  'maker.troubleShooting': { zh: '故障排查', en: 'Trouble shooting' },
  'maker.cleanReminder': {
    zh: '为了宝宝健康，请尽快清洗混合仓',
    en: "For baby's health, please clean the mixing chamber soon.",
  },
  'maker.mixingChamber': { zh: '混合仓', en: 'Mixing Chamber' },
  'maker.useCount': { zh: '使用次数', en: 'Use Count' },
  'maker.nightWaterLow': {
    zh: '水量可能不够夜间3次冲奶，建议加水',
    en: 'Water may not last for 3 nighttime feedings. Consider refilling.',
  },
  'maker.cleanDue': {
    zh: '请清洁混合仓后再使用',
    en: 'Please clean the mixing chamber before use.',
  },
  'maker.waterCalibrationReminder': {
    zh: '为了保障出奶的准确度，建议您进行一次水量校准',
    en: 'For accurate milk preparation, please perform water calibration.',
  },
  'maker.tubeCleanReminder': {
    zh: '你已经调奶251杯了，为了宝宝健康，请尽快对设备进行一次水路清洁',
    en: "You've made 251 bottles. For your baby's health, please clean the device's water lines as soon as possible.",
  },
  'maker.tubeCleanGo': { zh: '去清洁', en: 'Clean Now' },
  'maker.powderHopper': { zh: '粉仓', en: 'Powder Hopper' },
  'maker.formulaCan': { zh: '奶粉罐', en: 'Formula Can' },
  'maker.powderCupsRemaining': {
    zh: '约{cups}杯（{grams}g）',
    en: 'About {cups} cups ({grams} g)',
  },
  'maker.powderAverageBasis': {
    zh: '近7日平均{grams}g/杯计算',
    en: '7-day avg. {grams} g/cup',
  },
  'maker.remaining': { zh: '剩余', en: 'Remaining' },
  'maker.lastRefill': { zh: '上次补充', en: 'Last Refill' },
  'maker.waterTank': { zh: '水箱', en: 'Water Tank' },
  'maker.waterQualityTds': { zh: '水质（TDS）', en: 'Water Quality (TDS)' },
  'maker.waterQualityExcellent': { zh: '优', en: 'Perfect' },
  'maker.waterQualityGood': { zh: '良', en: 'Good' },
  'maker.waterQualityPoor': { zh: '差', en: 'Poor' },
  'maker.waterStale': {
    zh: '水已存放超过24小时，建议更换',
    en: 'Water stored over 24h, please replace',
  },
  'maker.lastFeed': { zh: '上次冲奶', en: 'Last Feed' },
  'maker.milk': { zh: '冲奶', en: 'Milk' },
  'maker.water': { zh: '出水', en: 'Water' },
  'maker.formulaBrand': { zh: '佳贝艾特', en: 'Kabrita' },
  'maker.formulaRatioDesc': {
    zh: '每2oz水配1勺(8.8g)奶粉',
    en: '1 scoop (8.8 g) per 2 oz of water',
  },
  'maker.formulaRatioConfigured': {
    zh: '每{water}水配1勺（{powder}g）奶粉',
    en: '1 scoop ({powder} g) per {water} of water',
  },
  'maker.firstUseFormulaTitle': {
    zh: '首次使用请确认宝宝的奶粉配比信息',
    en: 'Confirm your baby formula ratio before first use',
  },
  'maker.firstUseFormulaDesc': {
    zh: '请根据奶粉罐说明完成配置，完成后即可调节水量与温度',
    en: 'Set the ratio from the formula label to unlock water and temperature controls',
  },
  'maker.addFormulaInfo': { zh: '添加配方信息', en: 'Add formula details' },
  'maker.configureFormulaFirst': {
    zh: '添加粉水配比',
    en: 'Add Formula Ratio',
  },
  'maker.waterForFormula': { zh: '冲奶水量', en: 'Water for Formula' },
  'maker.waterAmount': { zh: '水量', en: 'Water Amount' },
  'maker.mixWith': {
    zh: '配{amount}g奶粉（1勺/2oz）',
    en: 'Mix with {amount}g powder (1 scoop / 2oz)',
  },
  'maker.mixWithConfigured': {
    zh: '配{amount}g奶粉（1勺/{water}）',
    en: 'Mix with {amount}g powder (1 scoop / {water})',
  },
  'maker.waterTemp': { zh: '水温', en: 'Water Temp' },
  'maker.roomTemp': { zh: '常温', en: 'Ambient' },
  'maker.highTempWarning': {
    zh: '水温较高，注意防烫',
    en: 'High water temperature, please be careful of scalding',
  },
  'maker.childLock': { zh: '童锁', en: 'Child lock' },
  'maker.nightLight': { zh: '夜灯', en: 'Night light' },
  'maker.nightLightBrightness': { zh: '亮度', en: 'Brightness' },
  'maker.feedingStats': { zh: '喂养统计', en: 'Feeding Stats' },
  'maker.feedingStatsDesc': {
    zh: '查看喂养数据和图表',
    en: 'View feeding data & charts',
  },
  'maker.stop': { zh: '停止', en: 'Stop' },
  'maker.makeFormula': { zh: '开始冲奶', en: 'Make Formula' },
  'maker.dispenseWater': { zh: '出水', en: 'Dispense Water' },
  'maker.milkReady': {
    zh: '冲奶完成 · 已记录',
    en: 'Milk ready · Saved to feeding log',
  },
  'maker.waterReady': { zh: '出水完成', en: 'Water ready' },
  'maker.cleanIncompleteTitle': {
    zh: '自清洁未完成',
    en: 'Self-Cleaning Incomplete',
  },
  'maker.cleanIncompleteDesc': {
    zh: '设备管路自清洁未完成，请继续',
    en: 'Tube self-cleaning was not completed. Please continue.',
  },
  'maker.formulaToast': {
    zh: '配方详情页待开发',
    en: 'Formula details page coming soon',
  },

  'result.title': { zh: '调奶完成', en: 'Formula Complete' },
  'result.noData': { zh: '暂无结果数据', en: 'No result data available' },
  'result.backToControl': { zh: '返回', en: 'Back' },
  'result.accuracy': { zh: '准确度', en: 'Accuracy' },
  'result.allTargetsMet': { zh: '全部达标', en: 'All Targets Met' },
  'result.someTargetsMissed': { zh: '部分未达标', en: 'Some Targets Missed' },
  'result.itemsPassed': {
    zh: '{count}/4 项通过',
    en: '{count}/4 items passed',
  },
  'result.dailySummary': { zh: '每日摘要', en: 'Daily Summary' },
  'result.todayCup': {
    zh: '第{count}杯 · 共{total}',
    en: 'Cup #{count} · {total} total',
  },
  'result.lastFeeding': { zh: '上次喂养', en: 'Last Feeding' },
  'result.waterOutput': { zh: '出水量', en: 'Water Output' },
  'result.powderOutput': { zh: '出粉量', en: 'Powder Output' },
  'result.waterTempLabel': { zh: '水温', en: 'Water Temp' },
  'result.totalMilk': { zh: '总奶量', en: 'Total Milk' },
  'result.target': { zh: '目标', en: 'Target' },
  'result.actual': { zh: '实际', en: 'Actual' },
  'result.makeAnother': { zh: '再冲一杯', en: 'Make Another Formula' },

  'deviceList.familyTitle': { zh: 'Clara的家庭', en: "Clara's Family" },
  'deviceList.babyMonitor': {
    zh: 'Clara的婴儿监护器 01',
    en: "Clara's Baby Monitor 01",
  },
  'deviceList.tabHome': { zh: '首页', en: 'Home' },
  'deviceList.tabDevice': { zh: '设备', en: 'Device' },
  'deviceList.tabCommunity': { zh: '社区', en: 'Community' },
  'deviceList.tabMe': { zh: '我的', en: 'Me' },

  'powderOutputError.title': {
    zh: '调奶器出粉异常',
    en: 'Powder Output Error',
  },
  'powderOutputError.step1Title': {
    zh: '检查粉仓余量',
    en: 'Check Powder Level',
  },
  'powderOutputError.step1Desc': {
    zh: '请确认粉仓内奶粉量是否高于最低刻度线（MIN线），奶粉不足会导致出粉异常。',
    en: 'Please check if the powder level is above the MIN line. Low powder may cause dispensing issues.',
  },
  'powderOutputError.step1Caption': {
    zh: '粉仓内部 MAX/MIN 粉量刻度线',
    en: 'Powder hopper MAX/MIN level lines',
  },
  'powderOutputError.step2Title': {
    zh: '检查粉仓是否安装正确',
    en: 'Check Installation',
  },
  'powderOutputError.step2Desc': {
    zh: '请确认粉仓已正确安装到位，听到咔嗒声表示安装完成。',
    en: 'Make sure the powder hopper is properly installed. A click sound indicates correct installation.',
  },
  'powderOutputError.step2Caption': {
    zh: '点击播放粉仓安装指引',
    en: 'Tap to play installation guide',
  },
  'powderOutputError.videoLabel': {
    zh: '安装指引视频',
    en: 'Installation Guide',
  },
  'powderOutputError.step3Title': {
    zh: '检查出粉口是否堵塞',
    en: 'Check for Blockage',
  },
  'powderOutputError.step3Desc': {
    zh: '如粉仓余量充足且安装正确，请检查出粉口和混合仓上盖是否有奶粉结块堵塞，及时清洁。',
    en: 'If powder level is sufficient and installation is correct, check for clumps blocking the outlet or mixing chamber lid.',
  },
  'powderOutputError.cleanOutlet': {
    zh: '清洗粉仓出粉口',
    en: 'Clean Powder Outlet',
  },
  'powderOutputError.cleanLid': {
    zh: '清洗混合仓上盖',
    en: 'Clean Mixing Lid',
  },
  'powderOutputError.contactSupport': { zh: '联系客服', en: 'Contact Support' },

  'cleaning.title': { zh: '管路清洁', en: 'Tube Cleaning' },
  'cleaning.dailyCleaning': { zh: '日常冲洗', en: 'Daily Rinse' },
  'cleaning.descaling': { zh: '深度除垢模式', en: 'Deep Descaling Mode' },
  'cleaning.lastCleaned': { zh: '上次清洁', en: 'Last Cleaned' },
  'cleaning.startClean': { zh: '开始清洁', en: 'Start Cleaning' },
  'cleaning.buyDescaling': {
    zh: '购买柠檬酸除垢剂',
    en: 'Shop Citric Acid Descaler',
  },
  'cleaning.sinceLastClean': {
    zh: '距离上次清洁后',
    en: 'Since the last cleaning',
  },
  'cleaning.bottlesMade': {
    zh: '已调奶{count}杯',
    en: '{count} bottles prepared',
  },
  'cleaning.selectMode': { zh: '选择清洁模式', en: 'Select a Cleaning Mode' },
  'cleaning.descalingDesc': {
    zh: '使用柠檬酸溶液去除管路水垢',
    en: 'Use a citric acid solution to remove limescale from the tubing.',
  },
  'cleaning.sterilizationMode': {
    zh: '高温杀菌模式',
    en: 'High-Temperature Sanitizing Mode',
  },
  'cleaning.sterilizationDesc': {
    zh: '70°C高温杀灭管路细菌',
    en: 'Uses water at 70°C to kill bacteria in the tubing.',
  },
  'cleaning.tips': { zh: '清洁建议', en: 'Cleaning Recommendations' },
  'cleaning.tip1': {
    zh: '建议每调奶300杯之后进行一次除垢清洁',
    en: 'Descale after every 300 bottles prepared.',
  },
  'cleaning.tip2': {
    zh: '建议每周进行一次高温杀菌',
    en: 'Run the high-temperature sanitizing cycle once a week.',
  },
  'cleaning.tip3': {
    zh: '清洁过程中请不要断开电源',
    en: 'Keep the device connected to power throughout the cleaning cycle.',
  },
  'cleaning.descalingModeLabel': { zh: '除垢模式', en: 'Descaling Mode' },
  'cleaning.sterilizationModeLabel': {
    zh: '高温杀菌模式',
    en: 'Sterilization Mode',
  },
  'cleaning.prepareSteps': {
    zh: '{mode} - 准备步骤',
    en: '{mode} - Preparation',
  },
  'cleaning.stepDescaling1': {
    zh: '准备除垢溶液',
    en: 'Prepare Descaling Solution',
  },
  'cleaning.stepDescaling1Desc': {
    zh: '向水箱加入不少于600mL清水，并加入≤30g食品级柠檬酸（浓度3%-5%）',
    en: 'Add at least 600mL water and ≤30g food-grade citric acid (3%-5%) to the tank',
  },
  'cleaning.stepPlaceContainer': {
    zh: '放置接水容器',
    en: 'Place Water Container',
  },
  'cleaning.stepPlaceContainerDesc': {
    zh: '在接水盘位置放置容器，容器容量必须大于400mL',
    en: 'Place a container at the drip tray, capacity must exceed 400mL',
  },
  'cleaning.stepStartDescaling': { zh: '启动除垢模式', en: 'Start Descaling' },
  'cleaning.stepStartDescalingDesc': {
    zh: '点击下方「开始除垢」按钮，水温将加热至50°C开始清洁',
    en: 'Tap Start Descaling below, water heats to 50°C',
  },
  'cleaning.stepAddWater': { zh: '添加清水', en: 'Add Water' },
  'cleaning.stepAddWaterDesc': {
    zh: '向水箱加入不低于600mL的清水（Min水位线）',
    en: 'Add at least 600mL clean water to the tank (Min level)',
  },
  'cleaning.stepPlaceContainer2Desc': {
    zh: '在接水盘位置放置容器（不小于400mL），准备接收出水',
    en: 'Place a container (≥400mL) at the drip tray to collect water',
  },
  'cleaning.stepStartSterilization': {
    zh: '启动高温杀菌',
    en: 'Start Sterilization',
  },
  'cleaning.stepStartSterilizationDesc': {
    zh: '点击下方「开始杀菌」按钮，设备将加热至70°C进行杀菌',
    en: 'Tap Start Sterilization below, device heats to 70°C',
  },
  'cleaning.statusHeating': { zh: '正在加热...', en: 'Heating...' },
  'cleaning.statusPumping': { zh: '正在出水...', en: 'Pumping...' },
  'cleaning.statusHolding': { zh: '高温维持中...', en: 'Holding Temp...' },
  'cleaning.statusCooling': { zh: '正在降温...', en: 'Cooling...' },
  'cleaning.statusRinsing': { zh: '正在冲洗...', en: 'Rinsing...' },
  'cleaning.statusStandby': { zh: '等待操作...', en: 'Standby...' },
  'cleaning.statusComplete': { zh: '清洁完成', en: 'Cleaning Complete' },
  'cleaning.statusWaiting': { zh: '等待操作', en: 'Waiting' },
  'cleaning.tubeExcellent': { zh: '优', en: 'Excellent' },
  'cleaning.tubeGood': { zh: '良好', en: 'Good' },
  'cleaning.tubeFair': { zh: '一般', en: 'Fair' },
  'cleaning.runningPhase2': {
    zh: '第二阶段：清水冲洗',
    en: 'Phase 2: Clean Water Rinse',
  },
  'cleaning.runningInProgress': {
    zh: '清洁进行中',
    en: 'Cleaning In Progress',
  },
  'cleaning.powerFlash': { zh: 'Power 闪烁', en: 'Power Flashing' },
  'cleaning.currentStatus': { zh: '当前状态', en: 'Current Status' },
  'cleaning.waterTemp': { zh: '水温', en: 'Water Temp' },
  'cleaning.waterOutput': { zh: '出水量', en: 'Water Output' },
  'cleaning.cycles': { zh: '循环次数', en: 'Cycles' },
  'cleaning.cycleUnit': { zh: '次', en: '' },
  'cleaning.countdown': { zh: '高温维持倒计时', en: 'High-Temp Countdown' },
  'cleaning.phase1Tip': {
    zh: '第一阶段完成后，请清空水箱并装入干净的清水（不低于600mL），然后点击继续',
    en: 'After Phase 1, empty the tank and refill with clean water (≥600mL), then tap Continue',
  },
  'cleaning.pausePreparePhase2': { zh: '准备第二阶段', en: 'Prepare Phase 2' },
  'cleaning.pauseTitle': { zh: '清洁暂停', en: 'Cleaning Paused' },
  'cleaning.pausePhase2Desc': {
    zh: '请清洁水箱，并重新装入干净的清水（不低于600mL）',
    en: 'Clean the tank and refill with clean water (≥600mL)',
  },
  'cleaning.pauseDesc': { zh: '清洁程序已暂停', en: 'Cleaning program paused' },
  'cleaning.continueClean': { zh: '继续清洁', en: 'Continue Cleaning' },
  'cleaning.completeTitle': { zh: '清洁完成', en: 'Cleaning Complete' },
  'cleaning.completeDescaling': {
    zh: '除垢清洁已完成，管路已恢复最佳状态',
    en: 'Descaling complete, tubes restored to best condition',
  },
  'cleaning.completeSterilization': {
    zh: '高温杀菌已完成，管路已彻底消毒',
    en: 'Sterilization complete, tubes fully sanitized',
  },
  'cleaning.backToSettings': { zh: '返回设置', en: 'Back to Settings' },
  'cleaning.backToHome': { zh: '返回首页', en: 'Back to Home' },
  'cleaning.startDescalingTitle': {
    zh: '开始深度除垢？',
    en: 'Start Deep Descaling?',
  },
  'cleaning.startDescalingNotice': {
    zh: '深度清洁大约需要 15 分钟。开始后不能中止清洁，但仍可以使用 App 的其他功能。',
    en: 'Deep cleaning takes about 15 minutes. Once started it cannot be stopped, but you can still use other app features.',
  },
  'cleaning.exitTitle': { zh: '退出清洁？', en: 'Exit Cleaning?' },
  'cleaning.exitDesc': {
    zh: '退出后将返回设备设置页面，当前清洁进度不会保留。',
    en: 'You will return to device settings and the current progress will be lost.',
  },
  'cleaning.exitConfirm': { zh: '退出', en: 'Exit' },

  'cleaningIncomplete.title': {
    zh: '管路自清洁未完成',
    en: 'Tube Cleaning Incomplete',
  },
  'cleaningIncomplete.desc': {
    zh: '上次管路自清洁未完成，建议继续完成清洁以确保卫生。',
    en: 'The last tube self-cleaning was not completed. Please continue to ensure hygiene.',
  },
  'cleaningIncomplete.later': { zh: '稍后再说', en: 'Later' },
  'cleaningIncomplete.continueClean': {
    zh: '继续清洁',
    en: 'Continue Cleaning',
  },

  // PowderWater
  'powderWater.title': { zh: '粉水量', en: 'Powder & Water' },
  'powderWater.powderTank': { zh: '奶粉罐', en: 'Powder Tank' },
  'powderWater.currentPowder': { zh: '当前粉量', en: 'Current Powder' },
  'powderWater.powderRange': {
    zh: '范围：0 ~ {capacity}g',
    en: 'Range: 0 ~ {capacity}g',
  },
  'powderWater.waterTank': { zh: '水箱', en: 'Water Tank' },
  'powderWater.currentWater': { zh: '当前水量', en: 'Current Water' },
  'powderWater.waterRange': {
    zh: '范围：0 ~ {capacity} {unit}',
    en: 'Range: 0 ~ {capacity} {unit}',
  },
  'powderWater.saved': { zh: '已保存', en: 'Saved' },
  'powderWater.dataUpdated': {
    zh: '控制页面数据已更新',
    en: 'Control page data has been updated',
  },

  // DeviceAssistant
  'deviceAssistant.title': { zh: '智能设备助手', en: 'Smart Device Assistant' },
  'deviceAssistant.guide': { zh: '新手指引', en: "Beginner's Guide" },
  'deviceAssistant.guideDesc': {
    zh: '快速了解设备使用方法',
    en: 'Quick guide on how to use the device',
  },
  'deviceAssistant.faq': { zh: '常见问题', en: 'FAQ' },
  'deviceAssistant.faqDesc': {
    zh: '查看常见使用问题及解答',
    en: 'View common questions and answers',
  },
  'deviceAssistant.manual': { zh: '电子说明书', en: 'User Manual' },
  'deviceAssistant.manualDesc': {
    zh: '查看完整产品使用说明',
    en: 'View full product instructions',
  },
  'deviceAssistant.contactSupport': { zh: '联系客服', en: 'Contact Support' },
  'deviceAssistant.contactSupportDesc': {
    zh: '在线咨询或电话联系客服',
    en: 'Online chat or phone support',
  },
  'deviceAssistant.accessories': { zh: '配件购买', en: 'Accessories' },
  'deviceAssistant.accessoriesDesc': {
    zh: '前往Momcozy官网选购配件',
    en: 'Visit Momcozy website for accessories',
  },

  // NotificationSettings
  'notificationSettings.title': { zh: '消息提醒', en: 'Notifications' },
  'notificationSettings.tip': {
    zh: '关闭对应提示后，手机将无法收到系统推送',
    en: 'Disabling a toggle will stop push notifications for that item',
  },
  'notificationSettings.lowWater': { zh: '缺水提醒', en: 'Low Water Alert' },
  'notificationSettings.lowPowder': { zh: '缺粉提醒', en: 'Low Powder Alert' },
  'notificationSettings.powderClean': {
    zh: '粉仓清洁提醒',
    en: 'Powder Hopper Cleaning Reminder',
  },
  'notificationSettings.tubeClean': {
    zh: '管路清洁提醒',
    en: 'Tube Cleaning Reminder',
  },
  'notificationSettings.waterCalibration': {
    zh: '水量校准提醒',
    en: 'Water Calibration Reminder',
  },

  // FAQList
  'faqList.title': { zh: '常见问题', en: 'FAQ' },
  'faqList.mixingChamberCleaning': {
    zh: '如何清洗混合仓',
    en: 'How to Clean the Mixing Chamber',
  },
  'faqList.powderOutputError': {
    zh: '调奶器出粉异常',
    en: 'Powder Output Error',
  },

  // WaterCalibration
  'waterCalibration.title': { zh: '水量校准', en: 'Water Calibration' },
  'waterCalibration.prepare': { zh: '准备', en: 'Prepare' },
  'waterCalibration.calibrate': { zh: '校准', en: 'Calibrate' },
  'waterCalibration.step1': { zh: '步骤 1', en: 'Step 1' },
  'waterCalibration.preparation': { zh: '准备工作', en: 'Preparation' },
  'waterCalibration.placeBottleBefore': {
    zh: '请放置一个容量大于',
    en: 'Please place a bottle with capacity greater than',
  },
  'waterCalibration.placeBottleAfter': { zh: '的奶瓶', en: '' },
  'waterCalibration.ensureWaterBefore': {
    zh: '确保水箱水量大于',
    en: 'Ensure water tank has more than',
  },
  'waterCalibration.ensureWaterAfter': {
    zh: '，如果不够请先补充水箱',
    en: ', refill if needed',
  },
  'waterCalibration.next': { zh: '已准备好', en: 'Ready' },
  'waterCalibration.step2': { zh: '步骤 2', en: 'Step 2' },
  'waterCalibration.startTitle': {
    zh: '开始水量校准',
    en: 'Start Water Calibration',
  },
  'waterCalibration.calibrationInfoBefore': {
    zh: '设备即将进行水量校准，会出水',
    en: 'The device will perform water calibration, dispensing',
  },
  'waterCalibration.calibrationInfoAfter': {
    zh: '，请确保奶瓶已正确放置。',
    en: '. Please ensure the bottle is properly placed.',
  },
  'waterCalibration.previous': { zh: '上一步', en: 'Previous' },
  'waterCalibration.startCalibrating': {
    zh: '开始校准',
    en: 'Start Calibration',
  },
  'waterCalibration.calibrating': { zh: '水量校准中...', en: 'Calibrating...' },
  'waterCalibration.calibratingDesc': {
    zh: '设备正在出水，请稍候',
    en: 'Device is dispensing water, please wait',
  },
  'waterCalibration.complete': {
    zh: '水量校准完成',
    en: 'Calibration Complete',
  },
  'waterCalibration.completeDesc': {
    zh: '设备水量已校准完毕，可正常使用',
    en: 'Water calibration is complete. Device is ready to use.',
  },

  // FeedingStats
  'feedingStats.title': { zh: '喂养统计', en: 'Feeding Stats' },
  'feedingStats.today': { zh: '今天', en: 'Today' },
  'feedingStats.mlTotal': { zh: '{unit} 总量', en: '{unit} total' },
  'feedingStats.feedings': { zh: '喂奶次数', en: 'Feedings' },
  'feedingStats.times': { zh: '次', en: 'times' },
  'feedingStats.average': { zh: '平均', en: 'Average' },
  'feedingStats.mlPerFeed': { zh: '{unit}/次', en: '{unit} / feed' },
  'feedingStats.tab.daily': { zh: '每日', en: 'Daily' },
  'feedingStats.tab.weekly': { zh: '每周', en: 'Weekly' },
  'feedingStats.tab.monthly': { zh: '每月', en: 'Monthly' },
  'feedingStats.weekday.mon': { zh: '周一', en: 'Mon' },
  'feedingStats.weekday.tue': { zh: '周二', en: 'Tue' },
  'feedingStats.weekday.wed': { zh: '周三', en: 'Wed' },
  'feedingStats.weekday.thu': { zh: '周四', en: 'Thu' },
  'feedingStats.weekday.fri': { zh: '周五', en: 'Fri' },
  'feedingStats.weekday.sat': { zh: '周六', en: 'Sat' },
  'feedingStats.weekday.sun': { zh: '周日', en: 'Sun' },
  'feedingStats.month.jan': { zh: '1月', en: 'Jan' },
  'feedingStats.month.feb': { zh: '2月', en: 'Feb' },
  'feedingStats.month.mar': { zh: '3月', en: 'Mar' },
  'feedingStats.month.apr': { zh: '4月', en: 'Apr' },
  'feedingStats.month.may': { zh: '5月', en: 'May' },
  'feedingStats.month.jun': { zh: '6月', en: 'Jun' },
  'feedingStats.month.jul': { zh: '7月', en: 'Jul' },
  'feedingStats.chart.dailyTitle': {
    zh: '每小时喂奶量',
    en: 'Feeding Volume by Hour',
  },
  'feedingStats.chart.weeklyTitle': {
    zh: '本周每日总量',
    en: 'Daily Total This Week',
  },
  'feedingStats.chart.monthlyTitle': { zh: '每月总量', en: 'Monthly Total' },
  'feedingStats.guideTitle': { zh: '喂养科学指南', en: 'Feeding Guide' },
  'feedingStats.guideDesc': {
    zh: '各年龄段喂养参考与科学建议',
    en: 'Age-based feeding references and scientific advice',
  },
  'feedingStats.recordsTitle': { zh: '喂养记录', en: 'Feeding Records' },
  'feedingStats.add': { zh: '添加', en: 'Add' },
  'feedingStats.addRecord': { zh: '添加喂养记录', en: 'Add Feeding Record' },
  'feedingStats.minutes': { zh: '{count}分钟', en: '{count} min' },

  // FeedingGuide
  'feedingGuide.title': { zh: '喂养科学指南', en: 'Feeding Guide' },
  'feedingGuide.ageSectionTitle': {
    zh: '各年龄段喂养参考',
    en: 'Age-based Feeding Reference',
  },
  'feedingGuide.ageSectionDesc': {
    zh: '以下数据基于WHO和中国营养学会的喂养建议',
    en: 'Based on WHO and Chinese Nutrition Society recommendations',
  },
  'feedingGuide.singleAmount': { zh: '单次奶量', en: 'Single Amount' },
  'feedingGuide.frequency': { zh: '每日次数', en: 'Daily Frequency' },
  'feedingGuide.dailyTotal': { zh: '每日总量', en: 'Daily Total' },
  'feedingGuide.ageRange1': { zh: '0-7天', en: '0-7 days' },
  'feedingGuide.ageTip1': {
    zh: '按需喂养，间隔2-3小时',
    en: 'Feed on demand, 2-3 hour intervals',
  },
  'feedingGuide.ageFreq1': { zh: '6-8次', en: '6-8 times' },
  'feedingGuide.ageRange2': { zh: '8-30天', en: '8-30 days' },
  'feedingGuide.ageTip2': {
    zh: '逐渐建立规律喂养节奏',
    en: 'Gradually establish a regular feeding rhythm',
  },
  'feedingGuide.ageFreq2': { zh: '8次', en: '8 times' },
  'feedingGuide.ageRange3': { zh: '1-4个月', en: '1-4 months' },
  'feedingGuide.ageTip3': {
    zh: '夜间可减少一次喂养',
    en: 'Can reduce one nighttime feeding',
  },
  'feedingGuide.ageFreq3': { zh: '4-5次', en: '4-5 times' },
  'feedingGuide.ageRange4': { zh: '4-6个月', en: '4-6 months' },
  'feedingGuide.ageTip4': {
    zh: '可开始尝试添加辅食',
    en: 'Can start introducing solid foods',
  },
  'feedingGuide.ageFreq4': { zh: '4-5次', en: '4-5 times' },
  'feedingGuide.ageRange5': { zh: '7-9个月', en: '7-9 months' },
  'feedingGuide.ageTip5': {
    zh: '辅食占比逐渐增加',
    en: 'Solid food proportion gradually increases',
  },
  'feedingGuide.ageFreq5': { zh: '4次', en: '4 times' },
  'feedingGuide.ageRange6': { zh: '10-12个月', en: '10-12 months' },
  'feedingGuide.ageTip6': {
    zh: '以辅食为主，奶为辅',
    en: 'Solids as main, milk as supplement',
  },
  'feedingGuide.ageFreq6': { zh: '4次', en: '4 times' },
  'feedingGuide.ageRange7': { zh: '1-2岁', en: '1-2 years' },
  'feedingGuide.ageTip7': {
    zh: '逐步过渡到日常饮食',
    en: 'Gradually transition to daily meals',
  },
  'feedingGuide.ageFreq7': { zh: '2-4次', en: '2-4 times' },
  'feedingGuide.ageRange8': { zh: '2-3岁', en: '2-3 years' },
  'feedingGuide.ageTip8': {
    zh: '保证营养均衡的日常饮食',
    en: 'Ensure nutritionally balanced daily diet',
  },
  'feedingGuide.ageFreq8': { zh: '2-4次', en: '2-4 times' },
  'feedingGuide.tipsTitle': { zh: '喂养小贴士', en: 'Feeding Tips' },
  'feedingGuide.tip1': {
    zh: '新生儿期（0-28天）建议按需喂养，不要刻意叫醒熟睡的宝宝喂奶，但间隔不宜超过4小时。',
    en: "During the newborn period (0-28 days), feed on demand. Don't wake a sleeping baby to feed, but intervals should not exceed 4 hours.",
  },
  'feedingGuide.tip2': {
    zh: '每次喂奶后建议竖抱拍嗝5-10分钟，减少溢奶和肠胀气。',
    en: 'Hold the baby upright and burp for 5-10 minutes after each feeding to reduce spit-up and gas.',
  },
  'feedingGuide.tip3': {
    zh: '奶粉冲调温度建议40-45度，过热会破坏营养成分，过冷可能导致溶解不充分。',
    en: 'Formula preparation temperature should be 40-45C. Too hot destroys nutrients, too cold may cause incomplete dissolution.',
  },
  'feedingGuide.tip4': {
    zh: '观察宝宝的饥饿信号：转头寻乳、吮吸手指、烦躁不安等，及时响应有助于建立安全感。',
    en: 'Watch for hunger cues: turning head to seek, sucking fingers, fussiness. Prompt response helps build a sense of security.',
  },
  'feedingGuide.tip5': {
    zh: '6个月后开始添加辅食，从高铁米粉开始，逐步引入蔬菜泥、水果泥、肉泥。',
    en: 'Start introducing solids after 6 months. Begin with iron-fortified rice cereal, then gradually add vegetable, fruit, and meat purees.',
  },
  'feedingGuide.warningsTitle': { zh: '注意事项', en: 'Precautions' },
  'feedingGuide.warningsDesc': {
    zh: '以下情况请及时咨询儿科医生',
    en: 'Please consult a pediatrician if any of the following occur',
  },
  'feedingGuide.warning1': {
    zh: '持续拒奶或食欲明显下降',
    en: 'Persistent refusal to feed or significant appetite decrease',
  },
  'feedingGuide.warning2': {
    zh: '体重增长缓慢或不增长',
    en: 'Slow or no weight gain',
  },
  'feedingGuide.warning3': {
    zh: '频繁吐奶、呕吐或腹泻',
    en: 'Frequent spit-up, vomiting, or diarrhea',
  },
  'feedingGuide.warning4': {
    zh: '对奶粉过敏（皮疹、湿疹加重）',
    en: 'Formula allergy (rash, worsening eczema)',
  },

  // FeedingRecord
  'addFeedingRecord.title': { zh: '添加喂养记录', en: 'Add Feeding Record' },
  'feedingRecord.feedType': { zh: '喂养方式', en: 'Feeding Method' },
  'feedingRecord.type.breastfeed': { zh: '亲喂', en: 'Breastfeed' },
  'feedingRecord.type.bottle': { zh: '瓶喂', en: 'Bottle' },
  'feedingRecord.type.formula': { zh: '奶粉', en: 'Formula' },
  'feedingRecord.amount': { zh: '奶量 ({unit})', en: 'Amount ({unit})' },
  'feedingRecord.time': { zh: '喂养时间', en: 'Feeding Time' },
  'feedingRecord.selectDate': { zh: '选择日期', en: 'Select date' },
  'feedingRecord.startTime': { zh: '开始时间', en: 'Start time' },
  'feedingRecord.endTime': { zh: '结束时间', en: 'End time' },
  'feedingRecord.now': { zh: '现在', en: 'Now' },
  'feedingRecord.hoursAgo1': { zh: '1小时前', en: '1 hour ago' },
  'feedingRecord.hoursAgo2': { zh: '2小时前', en: '2 hours ago' },
  'feedingRecord.feederRole': { zh: '喂养角色', en: 'Feeder Role' },
  'feedingRecord.feeder.mom': { zh: '妈妈', en: 'Mom' },
  'feedingRecord.feeder.dad': { zh: '爸爸', en: 'Dad' },
  'feedingRecord.feeder.grandparents': { zh: '祖父母', en: 'Grandparents' },
  'feedingRecord.feeder.relatives': { zh: '亲友', en: 'Relatives' },
  'feedingRecord.remark': { zh: '备注', en: 'Remarks' },
  'feedingRecord.remarkPlaceholder': {
    zh: '记录宝宝的喂养情况...',
    en: "Record baby's feeding details...",
  },
  'feedingRecord.saveRecord': { zh: '保存记录', en: 'Save Record' },
  'feedingRecord.saved': { zh: '已保存', en: 'Saved' },
  'feedingRecord.saveSuccess': {
    zh: '记录保存成功',
    en: 'Record saved successfully',
  },

  // Demo - FormulaRatio
  'demo.formulaRatio.title': { zh: '配比列表', en: 'Formula List' },
  'demo.formulaRatio.active': { zh: '当前使用', en: 'Active' },
  'demo.formulaRatio.edit': { zh: '编辑', en: 'Edit' },
  'demo.formulaRatio.scoopInfo': {
    zh: '1勺({scoopGrams}g)配{water}水',
    en: '1 scoop ({scoopGrams} g) per {water} of water',
  },
  // Demo - FormulaRatioSync
  'demo.formulaRatioSync.title': { zh: '配比同步', en: 'Ratio Sync' },
  'demo.formulaRatioSync.replay': { zh: '重新演示', en: 'Replay' },
  'demo.formulaRatioSync.alertTitle': {
    zh: '机器端配比已变更',
    en: 'Ratio Changed on Device',
  },
  'demo.formulaRatioSync.alertDesc': {
    zh: '检测到机器上已将粉水配比修改为',
    en: 'The powder-water ratio on the device was changed to',
  },
  'demo.formulaRatioSync.alertQuestion': {
    zh: '是否同步到 App 的粉水配比中？',
    en: 'Sync it into a formula ratio in the app?',
  },
  'demo.formulaRatioSync.deviceLabel': {
    zh: '机器端配比',
    en: 'Device Ratio',
  },
  'demo.formulaRatioSync.pickAndSync': {
    zh: '选择配比同步',
    en: 'Choose a Ratio',
  },
  'demo.formulaRatioSync.ignore': {
    zh: '忽略',
    en: 'Ignore',
  },
  'demo.formulaRatioSync.pickTitle': {
    zh: '选择要同步的配比',
    en: 'Choose a Ratio to Sync',
  },
  'demo.formulaRatioSync.pickDesc': {
    zh: '机器端配比将写入所选配比',
    en: 'The device ratio will overwrite the selected ratio',
  },
  'demo.formulaRatioSync.confirmSync': {
    zh: '确认同步',
    en: 'Confirm Sync',
  },
  'demo.formulaRatioSync.addNew': {
    zh: '新增',
    en: 'Add',
  },
  'demo.formulaRatioSync.syncedCurrent': {
    zh: '已同步到当前配比',
    en: 'Synced to the current ratio',
  },
  'demo.formulaRatioSync.syncedOther': {
    zh: '已同步到 {brand}',
    en: 'Synced to {brand}',
  },
  'demo.formulaEdit.title': {
    zh: '识别结果确认',
    en: 'Confirm Recognition',
  },
  'demo.formulaEdit.addTitle': {
    zh: '手动填写配方',
    en: 'Enter Formula Manually',
  },
  'demo.formulaEdit.addHeading': {
    zh: '填写奶粉配比',
    en: 'Enter Formula Ratio',
  },
  'demo.formulaEdit.addDescription': {
    zh: '请根据奶粉罐包装填写以下信息，填写完成后确认配比准确。',
    en: 'Enter the details from the formula label, then confirm the ratio is accurate.',
  },
  'demo.formulaEdit.editTitle': {
    zh: '编辑配比信息',
    en: 'Edit Formula Ratio',
  },
  'demo.formulaEdit.editHeading': {
    zh: '编辑已有配比',
    en: 'Edit Saved Ratio',
  },
  'demo.formulaEdit.editDescription': {
    zh: '正在编辑已保存的配比信息，请修改后确认内容准确。',
    en: 'You are editing a saved ratio. Update the details and confirm they are accurate.',
  },
  'demo.formulaEdit.saveChanges': { zh: '保存修改', en: 'Save Changes' },
  'demo.formulaEdit.analyzedTitle': {
    zh: '确认识别信息',
    en: 'Confirm Recognized Details',
  },
  'demo.formulaEdit.analyzedDescription': {
    zh: '已根据照片识别出以下配比信息，请核对并确认与奶粉罐包装一致。',
    en: 'Review the details recognized from the photos and confirm they match the formula label.',
  },
  'demo.formulaEdit.confirmRecognition': {
    zh: '确认识别信息',
    en: 'Confirm Details',
  },
  'demo.formulaEdit.confirmManual': {
    zh: '确认并保存',
    en: 'Confirm and Save',
  },
  'demo.formulaEdit.brand': { zh: '品牌', en: 'Brand' },
  'demo.formulaEdit.brandPlaceholder': {
    zh: '请输入奶粉品牌',
    en: 'Enter formula brand',
  },
  'demo.formulaEdit.productLine': { zh: '产品线', en: 'Product Line' },
  'demo.formulaEdit.ageRange': { zh: '适用年龄段', en: 'Age Range' },
  'demo.formulaEdit.powderPerScoop': {
    zh: '每勺奶粉量',
    en: 'Powder per Scoop',
  },
  'demo.formulaEdit.waterPerScoop': { zh: '每勺水量', en: 'Water per Scoop' },
  'demo.formulaEdit.mixingRatio': { zh: '混合比例', en: 'Mixing Ratio' },
  'demo.formulaEdit.mixingRatioDetail': {
    zh: '{powder}g奶粉配{water}{unit}水',
    en: '{powder} g of powder per {water} {unit} of water',
  },
  'demo.formulaEdit.ratioOutOfRange': {
    zh: '粉水配比超过正常范围',
    en: 'The powder-to-water ratio exceeds the normal range',
  },
  'demo.captureFormulaFront.title': {
    zh: '添加配方信息',
    en: 'Add Formula Info',
  },
  'demo.captureFormulaFront.canAlt': { zh: '奶粉罐', en: 'Baby Formula Can' },
  'demo.captureFormulaFront.heading': {
    zh: '拍摄奶粉罐正面',
    en: 'Capture the front of the can',
  },
  'demo.captureFormulaFront.description': {
    zh: '确保品牌和配方系列清晰可见，避免反光和阴影。',
    en: 'Make sure the brand and formula line are clearly visible. Avoid glare and shadows.',
  },
  'demo.captureFormulaFront.startCapturing': {
    zh: '开始拍摄',
    en: 'Start Capturing',
  },
  'demo.captureFormulaFront.stepLabel': { zh: '第（1/2）步', en: 'Step (1/2)' },
  'demo.captureFormulaFront.enterManually': {
    zh: '手动输入',
    en: 'Enter Manually',
  },
  'demo.captureFormulaBackSide.title': {
    zh: '添加配方信息',
    en: 'Add Formula Info',
  },
  'demo.captureFormulaBackSide.canAlt': {
    zh: '奶粉罐侧面或背面',
    en: 'Formula Can Side or Back',
  },
  'demo.captureFormulaBackSide.stepLabel': {
    zh: '第（2/2）步',
    en: 'Step (2/2)',
  },
  'demo.captureFormulaBackSide.heading': {
    zh: '拍摄侧面或背面',
    en: 'Capture the side or back',
  },
  'demo.captureFormulaBackSide.description': {
    zh: '确保冲泡说明清晰可见，避免反光和阴影。',
    en: 'Make sure the mixing instructions are clearly visible. Avoid glare and shadows.',
  },
  'demo.captureFormulaBackSide.startCapturing': {
    zh: '开始拍摄',
    en: 'Start Capturing',
  },
  'demo.captureFormula.title': {
    zh: '第1步：拍摄正面',
    en: 'Step 1: Capture The Front',
  },
  'demo.captureFormula.uploading': {
    zh: '正在上传图片... {progress}%',
    en: 'Uploading image... {progress}%',
  },
  'demo.captureFormula.successToast': {
    zh: '正面照片上传成功',
    en: 'Front photo uploaded successfully',
  },
  'demo.captureFormulaStep2.title': {
    zh: '第2步：拍摄侧面或背面',
    en: 'Step 2: Capture The Side or Back',
  },
  'demo.captureFormulaStep2.uploading': {
    zh: '正在上传图片... {progress}%',
    en: 'Uploading image... {progress}%',
  },
  'demo.captureFormulaStep2.successToast': {
    zh: '背面/侧面照片上传成功',
    en: 'Back/side photo uploaded successfully',
  },
  'demo.captureFormulaStep2.recognizing': {
    zh: '正在识别图片... {progress}%',
    en: 'Recognizing image... {progress}%',
  },
  'demo.captureFormulaStep2.uploadFailedTitle': {
    zh: '照片上传失败',
    en: 'Photo Upload Failed',
  },
  'demo.captureFormulaStep2.uploadFailedDescription': {
    zh: '请检查网络通讯是否正常。',
    en: 'Please check whether the network connection is working properly.',
  },
  'demo.captureFormulaStep2.recognitionFailedTitle': {
    zh: '照片识别失败',
    en: 'Photo Recognition Failed',
  },
  'demo.captureFormulaStep2.recognitionFailedDescription': {
    zh: '请调整拍摄角度并保持照片中粉水配比信息清晰可见。',
    en: 'Adjust the angle and make sure the formula mixing ratio is clearly visible in the photo.',
  },
  'demo.captureFormulaStep2.retry': { zh: '重试', en: 'Try Again' },
  'demo.captureFormulaStep2.retake': { zh: '重拍', en: 'Retake' },
  'demo.captureFormulaStep2.enterManually': {
    zh: '手动输入',
    en: 'Enter Manually',
  },
};

function resolveTemplate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    return params[key] !== undefined ? String(params[key]) : `{${key}}`;
  });
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    const reset = () => setLanguageState(getInitialLanguage());
    window.addEventListener('demo-data-reset', reset);
    return () => window.removeEventListener('demo-data-reset', reset);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      demoLocal.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const entry = translations[key];
      if (!entry) return key;
      const template = entry[language] || entry.en || key;
      return resolveTemplate(template, params);
    },
    [language],
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
