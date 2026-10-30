export type Stage =
  | 'devices'
  | 'preparation'
  | 'capture'
  | 'formula'
  | 'sync'
  | 'cleaning'
  | 'feeding'
  | 'settings'
  | 'baby'
  | 'global';
export type Operation =
  | 'devices.load'
  | 'preparation.start'
  | 'capture.front'
  | 'capture.analyze'
  | 'formula.save'
  | 'sync.apply'
  | 'cleaning.start'
  | 'feeding.load'
  | 'feeding.save'
  | 'camera.open'
  | 'formula.load'
  | 'formula.select'
  | 'device.rename'
  | 'settings.light'
  | 'settings.notifications'
  | 'resources.save'
  | 'baby.save';
export type Outcome =
  | 'success'
  | 'error'
  | 'timeout'
  | 'denied'
  | 'interrupted'
  | 'validation'
  | 'empty'
  | 'loading'
  | 'slow';
export interface Scene {
  id: string;
  stage: Stage;
  name: string;
  prerequisite: string;
  operations: Operation[];
  outcome: Outcome;
  delay: number;
  process: string;
  message: string;
  recovery: string;
  presentation?:
    | 'water'
    | 'powder'
    | 'quality'
    | 'chamber'
    | 'chamber-reminder'
    | 'night-water'
    | 'cleaning-incomplete'
    | 'tube-reminder';
  retryLabel?: string;
  editLabel?: string;
}
export const stages: Record<
  Stage,
  { name: string; path: string; trigger: string }
> = {
  devices: { name: '设备列表', path: '/', trigger: '在控制台选择设备列表场景' },
  preparation: {
    name: '设备调奶 / 出水',
    path: '/device',
    trigger: '在 App 内点击开始调奶 / 出水；奶粉模式须先配置配比',
  },
  capture: {
    name: '拍摄上传 / 配比识别',
    path: '/capture-formula-step2',
    trigger: '在 App 内点击快门；正面拍摄仅适用上传 / 权限 / 等待场景',
  },
  formula: {
    name: '配比编辑 / 保存',
    path: '/formula-edit?mode=recognition',
    trigger: '填入有效配比，点击确认或保存',
  },
  sync: {
    name: '设备配比同步',
    path: '/formula-ratio-sync',
    trigger: '打开配比列表，选择一项并确认同步',
  },
  cleaning: {
    name: '管路清洁',
    path: '/device-cleaning',
    trigger: '选择清洁模式、完成准备，再点击开始清洁',
  },
  feeding: {
    name: '喂养记录',
    path: '/feeding-stats',
    trigger: '进入统计页加载，或在新增记录表单点击保存',
  },
  settings: {
    name: '设备设置',
    path: '/device-settings',
    trigger: '修改本页设置并确认',
  },
  baby: {
    name: '宝宝档案',
    path: '/add-baby',
    trigger: '填写有效昵称与出生日期后点击保存',
  },
  global: {
    name: '全局环境',
    path: '/',
    trigger: '选择后作用于本页支持的模拟操作；不改变浏览器真实网络或账号',
  },
};
const create = (
  stage: Stage,
  suffix: string,
  name: string,
  operations: Operation[],
  outcome: Outcome,
  message: string,
  recovery: string,
  extra: Partial<Scene> = {},
): Scene => ({
  id: `${stage}.${suffix}`,
  stage,
  name,
  operations,
  outcome,
  delay: outcome === 'timeout' ? 4500 : 1400,
  prerequisite: stages[stage].trigger,
  process: '正在处理，请稍候…',
  message,
  recovery,
  ...extra,
});
export const scenes: Scene[] = [
  create(
    'devices',
    'loading',
    '持续加载中',
    ['devices.load'],
    'loading',
    '正在查找演示设备',
    '取消等待后恢复初始设备列表。',
  ),
  create(
    'devices',
    'empty',
    '没有可用设备',
    ['devices.load'],
    'empty',
    '还没有可用的调奶器',
    '重新查找恢复演示设备，不会绑定真实设备。',
    { retryLabel: '重新查找' },
  ),
  create(
    'devices',
    'failure',
    '设备列表加载失败',
    ['devices.load'],
    'error',
    '暂时无法获取设备列表，请稍后重试。',
    '重试成功后显示设备列表。',
  ),
  create(
    'preparation',
    'water',
    '水量不足',
    ['preparation.start'],
    'validation',
    '水箱水量不足，本次未出水、未生成调奶或喂养记录。',
    '模拟补水并重试，保留水量和温度设置。',
    { retryLabel: '已补水，重新开始', presentation: 'water' },
  ),
  create(
    'preparation',
    'powder',
    '出粉异常',
    ['preparation.start'],
    'interrupted',
    '出粉检查未通过，调奶已中止。演示模型未扣减原料，也未记录成功。',
    '检查粉仓后重新开始；不自动继续出奶。',
    {
      retryLabel: '已检查，重新开始',
      presentation: 'powder',
      prerequisite: '奶粉模式且已配置配比；点击开始调奶',
    },
  ),
  create(
    'preparation',
    'timeout',
    '设备响应超时',
    ['preparation.start'],
    'timeout',
    '设备未确认执行，已停止本次操作，未生成成功记录。',
    '确认设备状态后重试，或取消回到控制页。',
  ),
  create(
    'capture',
    'permission',
    '相机权限拒绝（模拟）',
    ['camera.open', 'capture.front', 'capture.analyze'],
    'denied',
    '未获得相机权限，无法使用演示取景器。此状态为模拟，不会更改系统权限。',
    '模拟授权后重试，或改为手动输入。',
    { retryLabel: '模拟允许并重试', editLabel: '改为手动输入' },
  ),
  create(
    'capture',
    'upload',
    '照片上传失败',
    ['capture.front', 'capture.analyze'],
    'error',
    '照片上传失败，模拟照片已保留，尚未提交配比。',
    '重试使用同一模拟照片；也可手动输入。',
    { editLabel: '改为手动输入', process: '正在上传模拟照片…' },
  ),
  create(
    'capture',
    'recognition',
    '配比识别失败',
    ['capture.analyze'],
    'error',
    '照片已上传，但未识别出可靠配比，请重新拍摄或手动填写。',
    '重试重新识别；手动填写后仍须确认保存。',
    { editLabel: '手动填写配比', process: '模拟照片已上传，正在识别配比…' },
  ),
  create(
    'capture',
    'loading',
    '上传持续等待',
    ['capture.front', 'capture.analyze'],
    'loading',
    '正在上传模拟照片…',
    '取消后仍可重新拍摄，不保存未识别配比。',
  ),
  create(
    'formula',
    'save',
    '配比保存失败',
    ['formula.save'],
    'error',
    '配比未保存，已输入内容仍保留在当前表单。',
    '重试成功后才写入配比；修改输入或返回均可。',
    { editLabel: '返回修改输入' },
  ),
  create(
    'formula',
    'validation',
    '配比业务校验失败',
    ['formula.save'],
    'validation',
    '模拟校验服务拒绝该配比，请核对粉量和水量，尚未保存。',
    '返回修改输入或重试。重试成功表示模拟校验已通过。',
    { editLabel: '修改配比' },
  ),
  create(
    'sync',
    'failure',
    '配比同步失败',
    ['sync.apply'],
    'error',
    '设备未确认同步，App 与设备配比尚未被覆盖。',
    '重试成功后才同步所选配比，取消保留原配比。',
  ),
  create(
    'sync',
    'timeout',
    '同步响应超时',
    ['sync.apply'],
    'timeout',
    '设备同步超时，所选配比已保留，未写入设备。',
    '重试同步，或取消返回选择列表。',
  ),
  create(
    'cleaning',
    'interrupt',
    '清洁操作中断（模拟）',
    ['cleaning.start'],
    'interrupted',
    '模拟设备连接中断，清洁未完成，不能标记为已清洁。',
    '重新检查准备条件后从头开始，不恢复到已完成状态。',
    { retryLabel: '重新检查并开始', process: '模拟设备清洁中，正在检查连接…' },
  ),
  create(
    'cleaning',
    'timeout',
    '清洁启动超时',
    ['cleaning.start'],
    'timeout',
    '设备未确认启动，本轮清洁未完成。',
    '重试从当前准备步骤重新启动，或退出。',
  ),
  create(
    'feeding',
    'empty',
    '暂无喂养记录',
    ['feeding.load'],
    'empty',
    '还没有喂养记录',
    '可添加第一条记录，或恢复正常以显示初始样例。',
    { retryLabel: '恢复记录', editLabel: '添加第一条记录' },
  ),
  create(
    'feeding',
    'load',
    '喂养记录加载失败',
    ['feeding.load'],
    'error',
    '暂时无法获取喂养记录，未覆盖本地演示记录。',
    '重试恢复记录列表，或返回设备页。',
  ),
  create(
    'feeding',
    'save',
    '喂养记录保存失败',
    ['feeding.save'],
    'error',
    '喂养记录未保存，奶量、时间、喂养人及备注均保留。',
    '重试后只新增一次；取消错误可继续编辑表单。',
    { editLabel: '返回修改输入' },
  ),
  create(
    'preparation',
    'quality',
    '水质异常',
    ['preparation.start'],
    'validation',
    '水质检查未通过，本次未出水、未保存记录。',
    '模拟换水后重试，或按原提示处理。',
    { presentation: 'quality', retryLabel: '已换水，重新开始' },
  ),
  create(
    'preparation',
    'chamber',
    '混合仓清洁到期',
    ['preparation.start'],
    'validation',
    '混合仓已达清洁次数，本次未执行调奶。',
    '清洁后重新开始；不自动生成成功记录。',
    { presentation: 'chamber', retryLabel: '模拟已清洁并重试' },
  ),
  create(
    'formula',
    'load',
    '配比列表加载失败',
    ['formula.load'],
    'error',
    '暂时无法读取配比列表，原配比未被修改。',
    '恢复正常以显示列表，或返回设备。',
  ),
  create(
    'formula',
    'empty',
    '暂无配比',
    ['formula.load'],
    'empty',
    '还没有可用配比。',
    '扫描添加或手动录入；重试恢复样例。',
  ),
  create(
    'formula',
    'select',
    '切换配比失败',
    ['formula.select'],
    'error',
    '配比切换未确认，仍使用原来的配比。',
    '重试后才切换，或取消保留原配比。',
  ),
  create(
    'settings',
    'rename',
    '设备名称保存失败',
    ['device.rename'],
    'error',
    '名称未修改，编辑内容仍保留。',
    '修改输入或重试保存；取消不修改设备名称。',
    { editLabel: '返回修改输入' },
  ),
  create(
    'settings',
    'light',
    '夜灯设置失败（模拟）',
    ['settings.light'],
    'error',
    '设备未确认设置，夜灯开关保持原状态。',
    '重试后应用设置，或取消。',
  ),
  create(
    'settings',
    'notifications',
    '提醒设置保存失败',
    ['settings.notifications'],
    'error',
    '提醒开关未修改，保留原设置。',
    '重试后更新所选开关。',
  ),
  create(
    'settings',
    'permission',
    '通知权限未开启（模拟）',
    ['settings.notifications'],
    'denied',
    '模拟系统通知权限未开启，提醒设置未提交。',
    '模拟允许后重试；不会请求或更改系统权限。',
    { retryLabel: '模拟允许并重试' },
  ),
  create(
    'settings',
    'resources',
    '粉水数据保存失败',
    ['resources.save'],
    'error',
    '本次补充量未写入，输入值保留，补充时间未更新。',
    '核对输入并重试，或返回不保存。',
    { editLabel: '返回修改输入' },
  ),
  create(
    'baby',
    'save',
    '宝宝档案保存失败',
    ['baby.save'],
    'error',
    '宝宝信息未保存，昵称、生日与性别保留。',
    '重试后保存，或修改输入。',
    { editLabel: '返回修改输入' },
  ),
  create(
    'baby',
    'validation',
    '宝宝信息校验不通过',
    ['baby.save'],
    'validation',
    '模拟档案校验未通过，尚未保存。',
    '修改昵称 / 日期后再保存，或重试模拟校验通过。',
    { editLabel: '返回修改输入' },
  ),
  create(
    'preparation',
    'chamber-reminder',
    '混合仓清洁提醒',
    ['preparation.start'],
    'validation',
    '混合仓使用达到提醒次数，复用原有可关闭提醒。',
    '关闭提醒可继续；到期前可按指引清洁。',
    { presentation: 'chamber-reminder' },
  ),
  create(
    'preparation',
    'night-water',
    '夜间水量不足提醒',
    ['preparation.start'],
    'validation',
    '复用原夜间缺水预提醒，不伪造已断水。',
    '补水或关闭本场景后正常操作。',
    { presentation: 'night-water' },
  ),
  create(
    'preparation',
    'cleaning-incomplete',
    '清洁未完成',
    ['preparation.start'],
    'validation',
    '复用原清洁未完成提示。',
    '继续进入除垢准备流程，或返回设备列表。',
    { presentation: 'cleaning-incomplete' },
  ),
  create(
    'preparation',
    'tube-reminder',
    '管路清洁提醒',
    ['preparation.start'],
    'validation',
    '复用原管路清洁提醒及去清洁入口。',
    '关闭提醒继续使用，或进入管路清洁。',
    { presentation: 'tube-reminder' },
  ),
  create(
    'global',
    'offline',
    '断网（模拟）',
    [],
    'error',
    '模拟网络不可用，本次操作未提交。',
    '模拟重新连接并重试；或在控制台恢复正常。',
    { retryLabel: '模拟重连并重试' },
  ),
  create(
    'global',
    'weak',
    '弱网（模拟）',
    [],
    'slow',
    '模拟网络较慢，请稍候。',
    '延迟 5 秒后正常完成，可随时取消。',
    { delay: 5000 },
  ),
];
export function stageForPath(path: string): Stage {
  return pageForPath(path).stage;
}
export const getScene = (id: string) => scenes.find((s) => s.id === id);

/** Exact page contracts: navigation/help screens never inherit an unrelated request. */
export interface DemoPage {
  title: string;
  stage: Stage;
  operations: Operation[];
  action: string;
  note?: string;
}
const page = (
  title: string,
  stage: Stage,
  operations: Operation[],
  action: string,
  note?: string,
): DemoPage => ({ title, stage, operations, action, note });
export const pages: Record<string, DemoPage> = {
  '/': page(
    '设备列表',
    'devices',
    ['devices.load'],
    '选择场景查看设备列表状态，点击设备进入控制',
  ),
  '/device': page(
    '调奶 / 出水控制',
    'preparation',
    ['preparation.start'],
    '选择模式、奶量和温度，点击“开始”',
  ),
  '/formula-ratio': page(
    '配比列表',
    'formula',
    ['formula.load', 'formula.select'],
    '选择场景查看列表状态，或点击配比卡片切换使用',
  ),
  '/formula-edit': page(
    '配比编辑',
    'formula',
    ['formula.save'],
    '填写配比并点击“确认 / 保存”',
  ),
  '/formula-ratio-sync': page(
    '配比同步',
    'sync',
    ['sync.apply'],
    '选择配比并点击“确认同步”',
  ),
  '/scan-formula': page(
    '拍摄正面 · 准备',
    'capture',
    ['camera.open'],
    '点击“开始拍摄”打开相机',
  ),
  '/capture-formula-front': page(
    '拍摄正面 · 准备',
    'capture',
    ['camera.open'],
    '点击“开始拍摄”打开相机',
  ),
  '/capture-formula': page(
    '正面拍摄',
    'capture',
    ['capture.front'],
    '点击快门上传正面照片',
  ),
  '/capture-formula-back-side': page(
    '拍摄背面 · 准备',
    'capture',
    ['camera.open'],
    '点击“开始拍摄”打开相机',
  ),
  '/capture-formula-step2': page(
    '背面拍摄 / 识别',
    'capture',
    ['capture.analyze'],
    '点击快门上传并识别配比',
  ),
  '/capture-formula-step2/upload-failed': page(
    '上传失败示例',
    'capture',
    ['capture.analyze'],
    '选择本页对应场景，沿用原页面操作',
  ),
  '/capture-formula-step2/recognition-failed': page(
    '识别失败示例',
    'capture',
    ['capture.analyze'],
    '点击“重新拍摄”，或改为手动填写',
  ),
  '/device-cleaning': page(
    '管路清洁',
    'cleaning',
    ['cleaning.start'],
    '选择模式、完成准备后点击“开始清洁”',
  ),
  '/feeding-stats': page(
    '喂养统计',
    'feeding',
    ['feeding.load'],
    '查看喂养记录；打开新增表单后自动匹配保存异常',
  ),
  '/feeding-stats/add-record': page(
    '新增喂养记录',
    'feeding',
    ['feeding.save'],
    '填写记录并点击“保存记录”',
  ),
  '/feeding-stats/guide': page(
    '喂养指南',
    'feeding',
    [],
    '返回统计页可演示记录加载 / 保存',
    '本页是本地指南，没有请求、保存或系统权限，不虚构加载失败。',
  ),
  '/device-settings': page(
    '设备设置',
    'settings',
    ['settings.light'],
    '切换“夜灯自动开启”',
  ),
  '/device-detail': page(
    '设备详情 / 名称编辑',
    'settings',
    ['device.rename'],
    '点击设备名称，编辑后确认',
  ),
  '/notification-settings': page(
    '通知设置',
    'settings',
    ['settings.notifications'],
    '切换任意提醒开关',
  ),
  '/powder-water': page(
    '粉量 / 水量维护',
    'settings',
    ['resources.save'],
    '修改粉量或水量后点击“保存”',
  ),
  '/add-baby': page(
    '添加宝宝',
    'baby',
    ['baby.save'],
    '填写昵称与有效生日后点击“保存”',
  ),
  '/no-baby': page(
    '缺少宝宝档案',
    'baby',
    [],
    '点击“添加宝宝”补全档案，或“忽略”返回设备',
    '当前已是原生业务前置条件异常；不额外叠加错误。',
  ),
  '/formula-result': page(
    '调奶结果',
    'preparation',
    [],
    '确认后：无宝宝则补全档案，有宝宝则返回设备',
    '本次调奶已完成；不在成功结果页伪造“未出奶”或回滚已完成记录。',
  ),
  '/formula-result1': page(
    '调奶结果',
    'preparation',
    [],
    '确认结果并返回设备',
    '调奶已完成，本页不发起新的设备请求。',
  ),
  '/device-assistant': page(
    '设备助手',
    'settings',
    [],
    '选择故障排查或 FAQ',
    '本地帮助入口；外部链接不注入假网络错误。',
  ),
  '/faq': page(
    '常见问题',
    'settings',
    [],
    '选择具体问题查看解决方式',
    '本地说明列表，无服务请求。',
  ),
  '/faq/mixing-chamber-cleaning': page(
    '混合仓清洁指南',
    'cleaning',
    [],
    '按原指引清洁，完成后返回',
    '本地说明页，不伪造设备清洁执行结果。',
  ),
  '/faq/powder-output-error': page(
    '出粉异常排查',
    'preparation',
    [],
    '按原步骤排查后返回设备',
    '排查说明不等同于设备已修复；返回后可重新开始。',
  ),
  '/water-calibration': page(
    '校准入口（旧版重定向）',
    'settings',
    [],
    '自动返回设备设置',
    '当前 Demo 未实现水量校准，不伪造校准异常。',
  ),
  '/water-calibration-reminder': page(
    '校准提醒（旧版重定向）',
    'preparation',
    [],
    '自动返回设备控制',
    '当前版本未实现水量校准。',
  ),
};
for (const [path, title] of Object.entries({
  '/water-low-error': '水量不足',
  '/powder-error': '出粉异常',
  '/water-quality-error': '水质异常',
  '/powder-clean-reminder': '混合仓清洁提醒',
  '/powder-clean-due': '混合仓清洁到期',
  '/night-water-low': '夜间缺水',
  '/cleaning-incomplete': '清洁未完成',
  '/tube-clean-reminder': '管路清洁提醒',
}))
  pages[path] = page(
    title + ' · 原生示例',
    'preparation',
    [],
    '先按原页面提示补水、排查或清洁，再重新开始',
    '保留原生异常与退出路径；控制台不覆盖当前页面自带的前置条件。',
  );
export function pageForPath(path: string): DemoPage {
  return (
    pages[path] ??
    page(
      '未找到页面',
      'devices',
      [],
      '通过页面目录返回设备列表',
      '无可模拟业务操作。',
    )
  );
}
export function scenesForOperations(operations: readonly Operation[]) {
  return scenes.filter(
    (s) =>
      s.stage !== 'global' &&
      s.operations.some((op) => operations.includes(op)),
  );
}
