export type Stage =
  | 'devices'
  | 'preparation'
  | 'capture'
  | 'formula'
  | 'sync'
  | 'cleaning'
  | 'feeding'
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
  | 'feeding.save';
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
  retryLabel?: string;
  editLabel?: string;
}
export const stages: Record<
  Stage,
  { name: string; path: string; trigger: string }
> = {
  devices: { name: '设备列表', path: '/', trigger: '进入页面或点击重新加载' },
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
  global: {
    name: '全局环境',
    path: '/',
    trigger: '下一次支持的模拟服务 / 设备操作；不改变浏览器真实网络或账号',
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
    '取消等待后可重新加载。',
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
    { retryLabel: '已补水，重新开始' },
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
    ['capture.front', 'capture.analyze'],
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
    '返回修改输入；再次保存按触发次数执行。重试成功表示模拟校验已通过。',
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
    '可添加第一条记录，或重新加载恢复初始样例。',
    { retryLabel: '重新加载', editLabel: '添加第一条记录' },
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
  if (path === '/') return 'devices';
  if (path.startsWith('/feeding')) return 'feeding';
  if (path === '/device-cleaning') return 'cleaning';
  if (path === '/formula-ratio-sync') return 'sync';
  if (path === '/formula-edit' || path === '/formula-ratio') return 'formula';
  if (path.includes('capture-formula') || path === '/scan-formula')
    return 'capture';
  return 'preparation';
}
export const getScene = (id: string) => scenes.find((s) => s.id === id);
