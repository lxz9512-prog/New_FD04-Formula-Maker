import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { demoEngine, type Request, type Policy, type Retry } from './engine';
import {
  getScene,
  scenes,
  stages,
  stageForPath,
  type Stage,
  type Operation,
} from './catalog';
import { demoLocal, demoSession, resetStageData } from './storage';
import './scenarios.css';
export const useDemo = () =>
  useSyncExternalStore(demoEngine.subscribe, demoEngine.getSnapshot);
const registry = new Map<Operation, { request: Request; ready: () => void }>();
const registryListeners = new Set<() => void>();
let registryVersion = 0;
function registryChanged() {
  registryVersion++;
  registryListeners.forEach((fn) => fn());
}
const subscribeRegistry = (fn: () => void) => {
  registryListeners.add(fn);
  return () => {
    registryListeners.delete(fn);
  };
};
let pendingPreview: string | undefined;
let previewRetry: Retry = 'success';
function activatePreview(operation: Operation) {
  const scene = pendingPreview ? getScene(pendingPreview) : undefined,
    entry = registry.get(operation);
  if (
    scene &&
    (scene.stage === 'global' || scene.operations.includes(operation)) &&
    entry
  ) {
    pendingPreview = undefined;
    entry.ready();
    demoEngine.run(entry.request, {
      previewId: scene.id,
      injection: { sceneId: scene.id, policy: 'once', retry: previewRetry },
    });
  }
}
export function useOperation(request: Request, ready: () => void = () => {}) {
  const latest = useRef(request);
  latest.current = request;
  const readyRef = useRef(ready);
  readyRef.current = ready;
  useEffect(() => {
    const proxy: Request = {
      ...request,
      success: () => latest.current.success(),
      cancel: () => latest.current.cancel?.(),
      edit: () => latest.current.edit?.(),
      eligible: (s) => latest.current.eligible?.(s) ?? true,
    };
    const entry = { request: proxy, ready: () => readyRef.current() };
    registry.set(request.operation, entry);
    registryChanged();
    activatePreview(request.operation);
    return () => {
      if (registry.get(request.operation) === entry) {
        registry.delete(request.operation);
        registryChanged();
      }
    };
  }, [request.operation]);
  return useCallback(() => demoEngine.run({ ...latest.current }), []);
}
export function useLoadOperation(
  operation: 'devices.load' | 'feeding.load',
  stage: Stage,
) {
  const [loaded, setLoaded] = useState(false);
  const run = useOperation(
    {
      operation,
      stage,
      label: stage === 'devices' ? '加载设备列表' : '加载喂养记录',
      success: () => setLoaded(true),
      edit:
        stage === 'feeding'
          ? () => {
              location.hash = '/feeding-stats/add-record';
            }
          : undefined,
    },
    () => setLoaded(false),
  );
  useEffect(() => {
    if (!pendingPreview && !demoEngine.getSnapshot().active) run();
  }, [run]);
  return {
    loaded,
    reload: () => {
      setLoaded(false);
      run();
    },
  };
}
export function DemoBoundary({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const state = useDemo();
  useLayoutEffect(() => {
    demoEngine.routeChanged();
  }, [location.pathname, location.search]);
  return (
    <React.Fragment
      key={`${location.pathname}${location.search}:${state.revision}`}
    >
      {children}
    </React.Fragment>
  );
}
function prepare(stage: Stage) {
  if (
    stage === 'preparation' &&
    !demoLocal.getItem('formula_profile_configured')
  ) {
    demoLocal.setItem(
      'formula_profile',
      JSON.stringify({
        brand: 'Kabrita',
        productLine: 'Pro-Total Comfort',
        ageRange: '12+ months',
        powderPerScoop: 8.8,
        waterPerScoop: 2,
      }),
    );
    demoLocal.setItem('formula_profile_configured', 'true');
    window.dispatchEvent(new Event('formulaProfileUpdated'));
  }
}
export function resetDemo(stage?: Stage) {
  pendingPreview = undefined;
  demoEngine.cancel();
  if (stage) resetStageData(stage);
  else {
    demoLocal.clear();
    demoSession.clear();
    window.dispatchEvent(new Event('demo-data-reset'));
    window.dispatchEvent(new Event('interactionLinesVisibilityChange'));
  }
  demoEngine.reset(stage);
  window.location.hash = stage ? stages[stage].path : '/';
}
export function ScenarioConsole() {
  const snapshot = useDemo();
  const location = useLocation();
  const navigate = useNavigate();
  useSyncExternalStore(subscribeRegistry, () => registryVersion);
  const current = stageForPath(location.pathname);
  const [open, setOpen] = useState(() => window.innerWidth >= 1200);
  const [collapsed, setCollapsed] = useState(false);
  const [group, setGroup] = useState<Stage>(current);
  const [selected, setSelected] = useState('');
  const [mode, setMode] = useState<'next' | 'preview'>('next');
  const [policy, setPolicy] = useState<Policy>('once');
  const [retry, setRetry] = useState<Retry>('success');
  const titleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setGroup(current);
    setSelected('');
  }, [current]);
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        titleRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);
  const list = scenes.filter((s) => {
    if (s.stage !== group) return false;
    // Keep the local step meaningful; preview may intentionally navigate to another step.
    if (mode === 'preview' || group !== current) return true;
    if (group === 'capture' && location.pathname === '/capture-formula')
      return s.operations.includes('capture.front');
    if (group === 'feeding')
      return s.operations.includes(
        registry.has('feeding.save') ? 'feeding.save' : 'feeding.load',
      );
    return true;
  });
  const scene = list.find((s) => s.id === selected) ?? list[0];
  const globalActive = snapshot.injections.global;
  function apply() {
    if (!scene) return;
    if (mode === 'next') {
      demoEngine.arm(scene.id, policy, retry);
      return;
    }
    demoEngine.normal();
    pendingPreview = scene.id;
    previewRetry = retry;
    prepare(scene.stage);
    const target =
      scene.stage === 'global'
        ? '/'
        : scene.id === 'feeding.save'
          ? '/feeding-stats/add-record'
          : stages[scene.stage].path;
    if (`${location.pathname}${location.search}` !== target) navigate(target);
    else {
      demoEngine.cancel();
      activatePreview(
        scene.stage === 'global'
          ? 'devices.load'
          : (scene.operations.find((op) => registry.has(op)) ??
              scene.operations[0]),
      );
    }
  }
  const armed = Object.values(snapshot.injections).filter(Boolean);
  return (
    <>
      {!open && (
        <button
          ref={titleRef}
          className="scene-launch"
          onClick={() => setOpen(true)}
          aria-label="打开场景控制台"
        >
          ◈ 场景控制台{armed.length > 0 ? ` · ${armed.length} 待触发` : ''}
        </button>
      )}
      {open && (
        <>
          <button
            className="scene-backdrop"
            onClick={() => setOpen(false)}
            aria-label="关闭场景控制台背景"
          />
          <aside
            className={`scene-console ${collapsed ? 'is-collapsed' : ''}`}
            aria-label="场景控制台"
          >
            <header>
              <div>
                <small>DEMO LAB · 仅模拟</small>
                <h2>异常场景控制台</h2>
              </div>
              <div className="scene-header-actions">
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  aria-expanded={!collapsed}
                  aria-label={collapsed ? '展开控制台' : '收起控制台'}
                >
                  {collapsed ? '＋' : '−'}
                </button>
                <button onClick={() => setOpen(false)} aria-label="隐藏控制台">
                  ×
                </button>
              </div>
            </header>
            {!collapsed && (
              <div className="scene-console-body">
                <p className="scene-hint">
                  独立于产品界面 · 隐藏后场景仍生效
                  <br />
                  当前页面：{stages[current].name}
                </p>
                <label>
                  流程环节
                  <select
                    aria-label="流程环节"
                    value={group}
                    onChange={(e) => {
                      setGroup(e.target.value as Stage);
                      setSelected('');
                    }}
                  >
                    {Object.entries(stages).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.name}
                        {key === current ? ' · 当前' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                {group !== 'global' && (
                  <button
                    className="scene-link"
                    onClick={() => {
                      prepare(group);
                      navigate(stages[group].path);
                    }}
                  >
                    准备最小演示数据并进入此环节 →
                  </button>
                )}
                <label>
                  本环节场景
                  <select
                    aria-label="本环节场景"
                    value={scene?.id ?? ''}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    {list.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                {scene && (
                  <div className="scene-description">
                    <strong>{scene.name}</strong>
                    <p>前提 / 操作：{scene.prerequisite}</p>
                    <p>恢复：{scene.recovery}</p>
                  </div>
                )}
                <label>
                  触发方式
                  <select
                    aria-label="触发方式"
                    value={mode}
                    onChange={(e) =>
                      setMode(e.target.value as 'next' | 'preview')
                    }
                  >
                    <option value="next">下一次操作触发（默认）</option>
                    <option value="preview">直接预览当前状态</option>
                  </select>
                </label>
                <div className="scene-two">
                  <label>
                    触发次数
                    <select
                      aria-label="触发次数"
                      value={policy}
                      onChange={(e) => setPolicy(e.target.value as Policy)}
                      disabled={mode === 'preview'}
                    >
                      <option value="once">仅一次</option>
                      <option value="persistent">持续生效</option>
                    </select>
                  </label>
                  <label>
                    重试策略
                    <select
                      aria-label="重试策略"
                      value={retry}
                      onChange={(e) => setRetry(e.target.value as Retry)}
                    >
                      <option value="success">重试后成功</option>
                      <option value="failure">重试后继续失败</option>
                    </select>
                  </label>
                </div>
                {globalActive && group !== 'global' && (
                  <p role="status" className="scene-warning">
                    全局环境优先。请先恢复正常，再设置局部异常。
                  </p>
                )}
                <button
                  className="scene-primary"
                  onClick={apply}
                  disabled={!!globalActive && group !== 'global'}
                >
                  {mode === 'preview'
                    ? '直接预览 · 不提交数据'
                    : '设置下一次操作场景'}
                </button>
                <button
                  className="scene-link"
                  onClick={() => {
                    pendingPreview = undefined;
                    demoEngine.clearStage(group);
                  }}
                >
                  本环节：正常流程
                </button>
                <section className="scene-queue" aria-live="polite">
                  <h3>待触发场景</h3>
                  {armed.length === 0 ? (
                    <p>
                      {snapshot.active?.scene
                        ? '无待触发场景 · 当前场景已触发'
                        : '无待触发场景 · 正常模式'}
                    </p>
                  ) : (
                    armed.map((item) => {
                      const s = getScene(item!.sceneId);
                      return (
                        <p key={item!.sceneId}>
                          <b>{s?.name}</b>
                          <br />
                          {s?.prerequisite}
                          <br />
                          {item!.policy === 'once'
                            ? '仅一次 · 触发即清除'
                            : '持续生效'}{' '}
                          /{' '}
                          {item!.retry === 'success'
                            ? '重试成功'
                            : '重试继续失败'}
                        </p>
                      );
                    })
                  )}
                  {snapshot.active?.scene && (
                    <p>
                      <b>
                        当前{snapshot.active.preview ? '预览' : '执行'}：
                        {snapshot.active.scene.name}
                      </b>
                      <br />
                      {snapshot.active.status === 'loading'
                        ? '等待中 · 尚未提交'
                        : '已触发 · 尚未提交'}{' '}
                      /{' '}
                      {snapshot.active.injection?.retry === 'failure'
                        ? '重试继续失败'
                        : '重试后成功'}
                    </p>
                  )}
                  <p className="scene-last">{snapshot.lastEvent}</p>
                  {snapshot.active?.preview && (
                    <p>直接预览已生效；恢复按钮会执行本页真实的模拟操作。</p>
                  )}
                </section>
                <div className="scene-resets">
                  <button
                    onClick={() => {
                      pendingPreview = undefined;
                      demoEngine.normal();
                    }}
                  >
                    恢复正常
                  </button>
                  <button onClick={() => resetDemo(current)}>
                    重置当前环节
                  </button>
                  <button onClick={() => resetDemo()}>重置整个 Demo</button>
                </div>
                <p className="scene-hint">
                  恢复正常仅移除注入并停止等待，不重放操作。重置会清除对应模拟数据。所有权限、网络和设备故障均为模拟；刷新默认无异常注入。
                </p>
              </div>
            )}
          </aside>
        </>
      )}
    </>
  );
}
export function OperationOverlay() {
  const { active } = useDemo();
  const navigate = useNavigate();
  const location = useLocation();
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (active) ref.current?.focus();
  }, [active?.id, active?.status]);
  if (!active) return null;
  const { scene, request, status } = active;
  const loading = status === 'loading';
  function edit() {
    demoEngine.cancel();
    if (request.edit) request.edit();
    else if (request.stage === 'capture')
      navigate(
        '/formula-edit?mode=manual' +
          (location.search.includes('first-use') ? '&source=first-use' : ''),
      );
    else if (
      request.stage === 'feeding' &&
      request.operation === 'feeding.load'
    )
      navigate('/feeding-stats/add-record');
  }
  return (
    <div className="mock-operation-overlay" data-testid="operation-overlay">
      <section
        ref={ref}
        tabIndex={-1}
        className="mock-operation-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mock-operation-title"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.stopPropagation();
            demoEngine.cancel();
          }
          if (e.key === 'Tab') {
            const buttons = [...ref.current!.querySelectorAll('button')];
            const first = buttons[0],
              last = buttons.at(-1)!;
            if (
              e.shiftKey &&
              (document.activeElement === first ||
                document.activeElement === ref.current)
            ) {
              e.preventDefault();
              last.focus();
            } else if (
              !e.shiftKey &&
              (document.activeElement === last ||
                document.activeElement === ref.current)
            ) {
              e.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <span
          className={`mock-operation-symbol ${loading ? 'is-loading' : ''}`}
          aria-hidden="true"
        >
          {loading ? '◌' : status === 'empty' ? '○' : '!'}
        </span>
        <small>
          模拟{scene?.stage === 'global' ? '环境' : '交互'}
          {active.preview ? ' · 直接预览' : ''}
        </small>
        <h2 id="mock-operation-title">
          {loading
            ? (scene?.process ?? `正在${request.label}…`)
            : (scene?.name ?? '操作未完成')}
        </h2>
        {loading ? (
          <>
            <progress
              aria-label="模拟操作进度"
              max={100}
              value={active.progress}
            />
            <p>
              {active.preview ? '仅预览，不会自动提交。' : ''}正在等待模拟
              {request.stage === 'preparation' || request.stage === 'cleaning'
                ? '设备'
                : '服务'}
              响应，尚未提交结果。
            </p>
          </>
        ) : (
          <>
            <p>{scene?.message}</p>
            <p className="mock-recovery">{scene?.recovery}</p>
            <button className="mock-primary" onClick={demoEngine.retry}>
              {scene?.retryLabel ?? '重试'}
            </button>
            {scene?.editLabel && (
              <button onClick={edit}>{scene.editLabel}</button>
            )}
          </>
        )}
        <button onClick={demoEngine.cancel}>
          {loading ? '取消等待' : '取消，返回当前页面'}
        </button>
        <button
          className="mock-back"
          onClick={() => {
            demoEngine.cancel();
            navigate(request.stage === 'devices' ? '/' : '/device');
          }}
        >
          返回{request.stage === 'devices' ? '设备列表' : '设备控制'}
        </button>
      </section>
    </div>
  );
}
