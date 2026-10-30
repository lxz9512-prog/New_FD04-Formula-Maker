import { DemoBoundary, ScenarioConsole } from '@/demo/react';
import { demoLocal } from '@/demo/storage';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Home,
  List,
  Beaker,
  BarChart3,
  Camera,
  FileText,
  Plus,
  Settings,
  Info,
  Droplets,
  AlertTriangle,
  CheckCircle,
  Sun,
} from 'lucide-react';

interface PageItem {
  path: string;
  label: string;
  icon?: React.ReactNode;
}

interface SubMenu {
  label: string;
  icon?: React.ReactNode;
  children: PageItem[];
}

type NavItem = PageItem | SubMenu;

const isSubMenu = (item: NavItem): item is SubMenu => 'children' in item;

const navItems: NavItem[] = [
  { path: '/', label: '设备列表', icon: <List className="h-4 w-4" /> },
  {
    label: '设备控制',
    icon: <Home className="h-4 w-4" />,
    children: [
      {
        path: '/device',
        label: '设备控制',
        icon: <Home className="h-3.5 w-3.5" />,
      },
      {
        path: '/water-low-error',
        label: '水量不足异常',
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
      },
      {
        path: '/powder-error',
        label: '出粉异常',
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
      },
      {
        path: '/water-quality-error',
        label: '水质异常',
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
      },
      {
        path: '/powder-clean-reminder',
        label: '混合仓清洁提醒',
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
      },
      {
        path: '/powder-clean-due',
        label: '混合仓清洁到期',
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
      },
      {
        path: '/night-water-low',
        label: '夜间水量提示',
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
      },
      {
        path: '/cleaning-incomplete',
        label: '管路自清洁未完成',
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
      },
      {
        path: '/tube-clean-reminder',
        label: '管路清洁提醒',
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
      },
      {
        path: '/formula-ratio-sync',
        label: '配比同步异常',
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
      },
    ],
  },
  {
    path: '/formula-result',
    label: '调奶完成',
    icon: <CheckCircle className="h-4 w-4" />,
  },
  {
    path: '/device-settings',
    label: '设备设置',
    icon: <Settings className="h-4 w-4" />,
  },
  {
    label: '粉水配比',
    icon: <Beaker className="h-4 w-4" />,
    children: [
      {
        path: '/formula-ratio',
        label: '配比列表',
        icon: <List className="h-3.5 w-3.5" />,
      },
      {
        path: '/scan-formula',
        label: '拍摄粉罐正面',
        icon: <Camera className="h-3.5 w-3.5" />,
      },
      {
        path: '/capture-formula',
        label: '第一步拍摄过程',
        icon: <Camera className="h-3.5 w-3.5" />,
      },
      {
        path: '/capture-formula-back-side',
        label: '拍摄粉罐背面/侧面',
        icon: <Camera className="h-3.5 w-3.5" />,
      },
      {
        path: '/capture-formula-step2',
        label: '第二步拍摄过程',
        icon: <Camera className="h-3.5 w-3.5" />,
      },
      {
        path: '/capture-formula-step2/upload-failed',
        label: '照片上传失败',
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
      },
      {
        path: '/capture-formula-step2/recognition-failed',
        label: '照片识别失败',
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
      },
      {
        path: '/formula-edit?mode=recognition',
        label: '拍照识别确认',
        icon: <Camera className="h-3.5 w-3.5" />,
      },
      {
        path: '/formula-edit?mode=manual',
        label: '手动填写配比',
        icon: <FileText className="h-3.5 w-3.5" />,
      },
      {
        path: '/formula-edit?mode=edit',
        label: '二次编辑配比',
        icon: <Settings className="h-3.5 w-3.5" />,
      },
    ],
  },
  {
    label: '喂养统计',
    icon: <BarChart3 className="h-4 w-4" />,
    children: [
      {
        path: '/feeding-stats',
        label: '统计图表',
        icon: <BarChart3 className="h-3.5 w-3.5" />,
      },
      {
        path: '/feeding-stats/add-record',
        label: '新增喂养记录',
        icon: <Plus className="h-3.5 w-3.5" />,
      },
    ],
  },
];

interface InteractionSection {
  title: string;
  icon: React.ReactNode;
  color: string;
  connector: string;
  items: string[];
}

const DEVICE_LIST_INTERACTION_SECTIONS: InteractionSection[] = [
  {
    title: '设备能力与状态展示',
    icon: <List className="h-4 w-4" />,
    color: '#8B4A1B',
    connector: 'device-list-status',
    items: [
      '沿用原子化的能力和状态',
      '差异点：空闲状态下（在线，但未工作），展示最近一次调奶的记录时间和调奶量',
      '距上次调奶时间（x）＜60分钟：显示“n分钟前”，如“23分钟前”（英文：23 m ago）',
      '60分钟≤距上次调奶时间（x）＜24小时：显示“n小时m分钟前”；m=0时省略分钟，如“1小时45分钟前”或“2小时前”（英文：1 h 45 m ago / 2 h ago）',
      '24小时≤距上次调奶时间（x）≤3天：显示“n天前”，如“2天前”（英文：2 days ago）',
      '距上次调奶时间（x）＞3天：同年显示“月-日”，如“03-12”；跨年显示“年-月-日”，如“2025-10-01”',
    ],
  },
];

const DEVICE_INTERACTION_SECTIONS: InteractionSection[] = [
  {
    title: '首次使用 · 配方配置',
    icon: <Beaker className="h-4 w-4" />,
    color: '#8B4A1B',
    connector: 'formula-first-use',
    items: [
      '首次进入出奶模式，仅展示粉水配比引导',
      '完成配方信息后，显示水量与温度调节',
      '出水模式不受首次配方配置影响',
    ],
  },
  {
    title: '出奶模式 · 水量控制',
    icon: <Beaker className="h-4 w-4" />,
    color: '#F97316',
    connector: 'water-stepper',
    items: [
      '初始水量：60mL / 2oz',
      '可设范围：30-330mL / 1-11oz',
      '步进值：10mL / 1oz',
    ],
  },
  {
    title: '出奶模式 · 温度控制',
    icon: <Info className="h-4 w-4" />,
    color: '#E67E22',
    connector: 'water-stepper',
    items: [
      '默认温度：104°F / 40℃',
      '可选：80°F/26℃、100°F/37℃、104°F/40℃',
      '可选：113°F/45℃、122°F/50℃、158°F/70℃',
      '选择50℃或70℃时提示注意防烫',
      '选择70℃时童锁自动开启',
    ],
  },
  {
    title: '出水模式 · 水量控制',
    icon: <Droplets className="h-4 w-4" />,
    color: '#3B82F6',
    connector: 'water-stepper',
    items: [
      '初始水量：150mL / 5oz',
      '可设范围：30-300mL / 1-10oz',
      '步进值：10mL / 1oz',
    ],
  },
  {
    title: '交互规则',
    icon: <Info className="h-4 w-4" />,
    color: '#8B5CF6',
    connector: 'water-stepper',
    items: [
      '切换模式时水量自动重置为该模式默认值',
      '出奶模式与出水模式最小均为1oz',
      '出奶模式最大11oz（330mL），出水模式最大10oz（300mL）',
    ],
  },
  {
    title: '夜灯 · 开关',
    icon: <Sun className="h-4 w-4" />,
    color: '#D97706',
    connector: 'night-light',
    items: ['夜灯支持手动开启与关闭'],
  },
];

type FormulaEditMode = 'recognition' | 'manual' | 'edit';

const FORMULA_EDIT_FIELD_RULES = [
  '每勺奶粉量（必填）：仅数字，可手动调整；范围3-45g，步进0.1g',
  '每勺奶粉适配水量（必填）：仅数字，可手动调整',
  '水量单位为mL时：范围10-300mL，步进10mL',
  '水量单位为oz时：范围1-10oz，步进1oz',
  'mL与oz单位换算精确到小数点后一位',
  '粉水配比根据每勺奶粉量与每勺适配水量自动计算',
  '配比超过7:1（oz单位下）时，提示“粉水配比超过正常范围”，并禁止保存',
];

const FORMULA_EDIT_INTERACTION_SECTIONS: Record<
  FormulaEditMode,
  InteractionSection[]
> = {
  recognition: [
    {
      title: '粉水配比确认',
      icon: <Camera className="h-4 w-4" />,
      color: '#8B4A1B',
      connector: 'formula-recognition-rules',
      items: FORMULA_EDIT_FIELD_RULES,
    },
  ],
  manual: [
    {
      title: '手动输入粉水配比',
      icon: <FileText className="h-4 w-4" />,
      color: '#8B4A1B',
      connector: 'manual-formula-rules',
      items: ['每勺奶粉量默认值：8.7g', ...FORMULA_EDIT_FIELD_RULES],
    },
  ],
  edit: [
    {
      title: '编辑粉水配比',
      icon: <Settings className="h-4 w-4" />,
      color: '#8B4A1B',
      connector: 'formula-edit-rules',
      items: FORMULA_EDIT_FIELD_RULES,
    },
  ],
};
const SubMenuGroup: React.FC<{
  item: SubMenu;
  currentPath: string;
  defaultOpen: boolean;
  onNavigate: (path: string) => void;
}> = ({ item, currentPath, defaultOpen, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between rounded-[16px] px-4 py-3 text-left transition-all hover:bg-gray-50`}
      >
        <div className="flex items-center gap-3">
          {item.icon && <span style={{ color: '#666' }}>{item.icon}</span>}
          <span
            className="text-[13px]"
            style={{
              color: '#222',
              fontWeight: 400,
            }}
          >
            {item.label}
          </span>
        </div>
        <ChevronDown
          className="h-4 w-4 transition-transform"
          style={{
            color: '#999',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      {isOpen && (
        <div
          className="ml-4 mt-1 space-y-1 border-l-2 pl-3"
          style={{ borderColor: 'hsl(39, 20%, 90%)' }}
        >
          {item.children.map((child) => (
            <button
              key={child.path}
              onClick={() => onNavigate(child.path)}
              className={`flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-left transition-all ${
                currentPath === child.path
                  ? 'bg-[hsl(24_67%_32%/0.1)]'
                  : 'hover:bg-gray-50'
              }`}
            >
              {child.icon && (
                <span
                  style={{
                    color: currentPath === child.path ? '#8B4A1B' : '#999',
                  }}
                >
                  {child.icon}
                </span>
              )}
              <span
                className="text-[12px]"
                style={{
                  color: currentPath === child.path ? '#8B4A1B' : '#222',
                  fontWeight: 400,
                }}
              >
                {child.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const InteractionSectionItem: React.FC<{
  section: InteractionSection;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ section, isOpen, onToggle }) => (
  <div>
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-[16px] px-4 py-3 text-left transition-all hover:bg-gray-50"
    >
      <div className="flex items-center gap-3">
        <span style={{ color: section.color }}>{section.icon}</span>
        <span className="text-[14px] font-medium" style={{ color: '#333' }}>
          {section.title}
        </span>
      </div>
      <ChevronDown
        className="h-4 w-4 transition-transform"
        style={{
          color: '#999',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
      />
    </button>
    {isOpen && (
      <div
        className="ml-4 mt-1 space-y-1.5 border-l-2 pl-3"
        style={{ borderColor: `${section.color}30` }}
      >
        {section.items.map((item: string, idx: number) => (
          <div key={idx} className="flex items-start gap-2 px-3 py-1.5">
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ background: section.color }}
            />
            <span
              className="text-[13px] leading-relaxed"
              style={{ color: '#555' }}
            >
              {item}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const isDesktopViewport = () =>
  typeof window === 'undefined' ||
  window.matchMedia('(min-width: 1280px)').matches;

const getCurrentNavPath = (pathname: string, search: string) => {
  if (pathname !== '/formula-edit') return pathname;

  const params = new URLSearchParams(search);
  const requestedMode = params.get('mode');
  const mode =
    requestedMode === 'recognition' ||
    requestedMode === 'manual' ||
    requestedMode === 'edit'
      ? requestedMode
      : params.get('source') === 'list'
        ? 'edit'
        : params.get('source') === 'first-use'
          ? 'manual'
          : 'recognition';

  return `${pathname}?mode=${mode}`;
};

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(isDesktopViewport);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(isDesktopViewport);
  const [showInteractionLines, setShowInteractionLines] = useState(
    () => demoLocal.getItem('show_interaction_lines') !== 'false',
  );
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({
    0: true,
    5: true,
  });
  const [svgLines, setSvgLines] = useState<
    Array<{
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      color: string;
    }>
  >([]);
  const navigate = useNavigate();
  const location = useLocation();
  const currentNavPath = getCurrentNavPath(location.pathname, location.search);
  const svgRef = useRef<SVGSVGElement>(null);
  const isDeviceListPage = location.pathname === '/';
  const isDevicePage = location.pathname === '/device';
  const formulaEditMode = currentNavPath.startsWith('/formula-edit?mode=')
    ? (currentNavPath.split('=')[1] as FormulaEditMode)
    : null;
  const interactionSections = isDeviceListPage
    ? DEVICE_LIST_INTERACTION_SECTIONS
    : isDevicePage
      ? DEVICE_INTERACTION_SECTIONS
      : formulaEditMode
        ? FORMULA_EDIT_INTERACTION_SECTIONS[formulaEditMode]
        : [];

  useEffect(() => {
    const handleVisibilityChange = () => {
      setShowInteractionLines(
        demoLocal.getItem('show_interaction_lines') !== 'false',
      );
    };

    window.addEventListener(
      'interactionLinesVisibilityChange',
      handleVisibilityChange,
    );
    return () =>
      window.removeEventListener(
        'interactionLinesVisibilityChange',
        handleVisibilityChange,
      );
  }, []);

  const handlePageClick = (path: string) => {
    navigate(path);
  };

  const toggleSection = (index: number) => {
    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const calculateSvgLines = () => {
    if (!isInfoPanelOpen || !isDevicePage || !showInteractionLines) {
      setSvgLines([]);
      return;
    }
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svgRect = svgEl.getBoundingClientRect();
    const lines: Array<{
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      color: string;
    }> = [];

    const panelEls = document.querySelectorAll('[data-panel-connector]');
    const seenConnectors = new Set<string>();

    panelEls.forEach((panelEl: Element) => {
      const connectorId = panelEl.getAttribute('data-panel-connector');
      if (!connectorId || seenConnectors.has(connectorId)) return;
      seenConnectors.add(connectorId);

      const phoneEl = document.querySelector(
        `[data-connector="${connectorId}"]`,
      );
      if (!phoneEl) return;

      const phoneRect = phoneEl.getBoundingClientRect();
      const panelRect = panelEl.getBoundingClientRect();

      const startX = phoneRect.right - svgRect.left;
      const startY = phoneRect.top + phoneRect.height / 2 - svgRect.top;
      const endX = panelRect.left - svgRect.left;
      const endY = panelRect.top + panelRect.height / 2 - svgRect.top;

      const section = DEVICE_INTERACTION_SECTIONS.find(
        (s: InteractionSection) => s.connector === connectorId,
      );

      lines.push({
        startX,
        startY,
        endX,
        endY,
        color: section?.color || '#8B4A1B',
      });
    });

    setSvgLines(lines);
  };

  useEffect(() => {
    if (!isDevicePage) {
      setSvgLines([]);
      return;
    }
    const timer = setTimeout(calculateSvgLines, 350);
    return () => clearTimeout(timer);
  }, [
    isInfoPanelOpen,
    openSections,
    isDevicePage,
    showInteractionLines,
    isSidebarOpen,
  ]);

  useEffect(() => {
    const handleResize = () => calculateSvgLines();
    window.addEventListener('resize', handleResize);
    const observer = new ResizeObserver(handleResize);
    const product = document.querySelector('.scene-product-content');
    if (product) observer.observe(product);
    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [
    isInfoPanelOpen,
    isDevicePage,
    showInteractionLines,
    openSections,
    location.pathname,
  ]);

  return (
    <div
      className={`demo-workspace ${isSidebarOpen ? 'has-directory' : ''} ${isInfoPanelOpen ? 'has-info' : ''} relative flex min-h-screen bg-gradient-to-b from-[hsl(39_50%_95%)] to-[hsl(39_30%_97%)]`}
    >
      {/* Left Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="打开或收起演示目录"
        className="scene-directory-toggle absolute left-2 top-1/2 z-50 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-all hover:scale-110"
        style={{
          boxShadow:
            '4px 4px 12px rgba(0,0,0,0.08), -4px -4px 12px rgba(255,255,255,0.9)',
        }}
      >
        {isSidebarOpen ? (
          <ChevronLeft className="h-5 w-5" style={{ color: '#8B4A1B' }} />
        ) : (
          <ChevronRight className="h-5 w-5" style={{ color: '#8B4A1B' }} />
        )}
      </button>

      {/* Left Sidebar */}
      <div
        className={`scene-directory fixed left-0 top-0 z-40 h-full bg-white transition-all duration-300 ${
          isSidebarOpen ? 'w-full sm:w-64' : 'w-0'
        }`}
        style={{
          boxShadow: isSidebarOpen ? '4px 0 24px rgba(0,0,0,0.08)' : 'none',
          overflow: 'hidden',
        }}
      >
        <div className="flex h-full w-screen flex-col p-6 sm:w-64">
          <h2
            className="mb-6 text-[18px] font-semibold"
            style={{ color: '#8B4A1B' }}
          >
            Demo 目录
          </h2>
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              if (isSubMenu(item)) {
                const isChildActive = item.children.some(
                  (c) => currentNavPath === c.path,
                );
                return (
                  <SubMenuGroup
                    key={item.label}
                    item={item}
                    currentPath={currentNavPath}
                    defaultOpen={isChildActive}
                    onNavigate={handlePageClick}
                  />
                );
              }
              return (
                <button
                  key={item.path}
                  onClick={() => handlePageClick(item.path)}
                  className={`flex w-full items-center gap-3 rounded-[16px] px-4 py-3 text-left transition-all ${
                    location.pathname === item.path
                      ? 'bg-[hsl(24_67%_32%/0.1)]'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {item.icon && (
                    <span
                      style={{
                        color:
                          location.pathname === item.path ? '#8B4A1B' : '#666',
                      }}
                    >
                      {item.icon}
                    </span>
                  )}
                  <span
                    className="text-[13px]"
                    style={{
                      color:
                        location.pathname === item.path ? '#8B4A1B' : '#222',
                      fontWeight: 400,
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <ScenarioConsole />

      {/* Main Content */}
      <div
        className={[
          'scene-product-content flex min-w-0 flex-1 items-center justify-center overflow-auto transition-all duration-300',
          isSidebarOpen ? 'xl:ml-64' : '',
          '',
        ].join(' ')}
      >
        <DemoBoundary>
          <Outlet />
        </DemoBoundary>
      </div>

      {/* Right Panel Toggle */}
      <button
        aria-label="打开或收起交互说明"
        onClick={() => setIsInfoPanelOpen(!isInfoPanelOpen)}
        className="scene-old-info-toggle absolute right-2 top-1/2 z-50 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-lg transition-all hover:scale-110"
        style={{
          boxShadow:
            '4px 4px 12px rgba(0,0,0,0.08), -4px -4px 12px rgba(255,255,255,0.9)',
        }}
      >
        {isInfoPanelOpen ? (
          <ChevronRight className="h-5 w-5" style={{ color: '#8B4A1B' }} />
        ) : (
          <Info className="h-5 w-5" style={{ color: '#8B4A1B' }} />
        )}
      </button>

      {/* Right Info Panel */}
      <aside
        aria-label="交互说明"
        className={`scene-old-info fixed right-0 top-0 z-40 h-full bg-white transition-all duration-300 ${
          isInfoPanelOpen ? 'w-full sm:w-[420px] xl:w-[550px]' : 'w-0'
        }`}
        style={{
          boxShadow: isInfoPanelOpen ? '-4px 0 24px rgba(0,0,0,0.08)' : 'none',
          overflow: 'hidden',
        }}
      >
        <div className="flex h-full w-screen flex-col p-6 sm:w-[420px] xl:w-[550px]">
          <h2
            className="mb-6 text-[18px] font-semibold"
            style={{ color: '#8B4A1B' }}
          >
            交互说明
          </h2>
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {interactionSections.map((section, index) => (
              <div key={index} data-panel-connector={section.connector}>
                <InteractionSectionItem
                  section={section}
                  isOpen={!!openSections[index]}
                  onToggle={() => toggleSection(index)}
                />
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* SVG Connector Overlay */}
      {isInfoPanelOpen && isDevicePage && showInteractionLines && (
        <svg
          ref={svgRef}
          className="pointer-events-none fixed inset-0 z-50 hidden h-screen w-screen xl:block"
        >
          {svgLines.map((line, i) => {
            const midX = (line.startX + line.endX) / 2;
            return (
              <g key={i}>
                <path
                  d={`M ${line.startX} ${line.startY} C ${midX} ${line.startY}, ${midX} ${line.endY}, ${line.endX} ${line.endY}`}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  opacity={0.5}
                />
                <circle
                  cx={line.startX}
                  cy={line.startY}
                  r={4}
                  fill={line.color}
                  opacity={0.7}
                />
                <circle
                  cx={line.endX}
                  cy={line.endY}
                  r={4}
                  fill={line.color}
                  opacity={0.7}
                />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};

export default Layout;
