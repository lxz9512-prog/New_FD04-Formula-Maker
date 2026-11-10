import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { demoEngine, type Request, type Retry } from './engine';
import {
  getScene,
  stages,
  pageForPath,
  scenesForPage,
  nativeScenarioRoutes,
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
let linkedPreview: { path: string; sceneId: string } | undefined;
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
        if (
          demoEngine.getSnapshot().active?.request.operation ===
          request.operation
        )
          demoEngine.cancel();
        registry.delete(request.operation);
        registryChanged();
      }
    };
  }, [request.operation]);
  return useCallback(() => {
    const active = demoEngine.getSnapshot().active;
    // The original App action is also a recovery action for the selected rule.
    // Do not silently replace a selected failure with a successful transaction.
    if (
      active?.scene &&
      active.request.operation === latest.current.operation
    ) {
      if (active.status !== 'loading') demoEngine.retry();
      return;
    }
    demoEngine.run({ ...latest.current });
  }, []);
}
export function useLoadOperation(
  operation: 'devices.load' | 'feeding.load' | 'formula.load',
  stage: Stage,
) {
  const { active } = useDemo();
  useOperation({
    operation,
    stage,
    label:
      stage === 'devices'
        ? '加载设备列表'
        : stage === 'formula'
          ? '加载配比列表'
          : '加载喂养记录',
    success: () => {},
    edit:
      stage === 'feeding'
        ? () => {
            window.location.hash = '/feeding-stats/add-record';
          }
        : undefined,
  });
  // Local samples are ready immediately. Only an explicitly selected scenario replaces them.
  return { loaded: active?.request.operation !== operation };
}
/** Cancel page-owned simulations without resetting saved samples or replaying actions. */
export function clearPageScenario() {
  pendingPreview = undefined;
  demoEngine.normal();
}
export function DemoBoundary({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const state = useDemo();
  useLayoutEffect(() => {
    clearPageScenario();
    demoEngine.routeChanged();
  }, [location.pathname, location.search, location.key]);
  return (
    <React.Fragment
      key={`${location.pathname}${location.search}:${state.revision}`}
    >
      {children}
    </React.Fragment>
  );
}
export function resetDemo(stage?: Stage, path?: string) {
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
  window.location.hash = stage ? (path ?? stages[stage].path) : '/';
}
export function NativeScenarioLink() {
  const location = useLocation();
  const navigate = useNavigate();
  const target = nativeScenarioRoutes[location.pathname];
  useEffect(() => {
    if (target) {
      linkedPreview = target;
      navigate(target.path + location.search, { replace: true });
    }
  }, [target, location.search, navigate]);
  return null;
}
export function ScenarioConsole() {
  const snapshot = useDemo();
  const location = useLocation();
  useSyncExternalStore(subscribeRegistry, () => registryVersion);
  const page = pageForPath(location.pathname);
  const current = page.stage;
  const [open, setOpen] = useState(() => window.innerWidth >= 1200);
  const [collapsed, setCollapsed] = useState(false);
  const [retry, setRetry] = useState<Retry>('success');
  const titleRef = useRef<HTMLButtonElement>(null);
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
  // An inline add-record sheet is a distinct business step on the same route.
  const operations =
    location.pathname === '/feeding-stats' && registry.has('feeding.save')
      ? ['feeding.save' as Operation]
      : page.operations;
  const list = scenesForPage(operations);
  const selected = snapshot.active?.scene?.id ?? '';
  const scene = list.find((s) => s.id === selected);
  const available = operations.some((op) => registry.has(op));
  function choose(id: string) {
    pendingPreview = undefined;
    demoEngine.normal();
    if (!id) return;
    const next = getScene(id);
    if (!next) return;
    const operation = operations.find(
      (op) =>
        registry.has(op) &&
        (next.stage === 'global' || next.operations.includes(op)),
    );
    if (!operation) return;
    previewRetry = retry;
    pendingPreview = id;
    activatePreview(operation);
  }
  useEffect(() => {
    const link = linkedPreview;
    if (!link || link.path !== location.pathname || !available) return;
    linkedPreview = undefined;
    choose(link.sceneId);
  }, [location.key, available]);
  const operationKey = operations.join(',');
  useEffect(() => {
    const active = demoEngine.getSnapshot().active;
    if (active && !operations.includes(active.request.operation))
      clearPageScenario();
  }, [operationKey]);
  return (
    <div
      className={`scene-console-slot ${!open ? 'is-hidden' : collapsed ? 'is-collapsed' : ''}`}
    >
      {!open && (
        <button
          ref={titleRef}
          className="scene-launch"
          onClick={() => setOpen(true)}
          aria-label="打开场景控制台"
        >
          ◈ 场景控制台
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
                <small>DEMO</small>
                <h2>场景控制台</h2>
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
            <div className="scene-console-body">
              {!collapsed && (
                <div className="scene-settings">
                  <div className="scene-page-context">
                    <h3>
                      {page.title}
                      {location.pathname === '/feeding-stats' &&
                      registry.has('feeding.save')
                        ? ' · 新增记录'
                        : ''}
                    </h3>
                  </div>
                  {list.length > 0 ? (
                    <>
                      <label>
                        演示场景
                        <select
                          aria-label="页面异常"
                          value={
                            list.some((s) => s.id === selected) ? selected : ''
                          }
                          disabled={!available}
                          onChange={(e) => choose(e.target.value)}
                        >
                          <option value="">正常状态</option>
                          {list.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        重试结果
                        <select
                          aria-label="重试策略"
                          value={retry}
                          onChange={(e) => {
                            const value = e.target.value as Retry;
                            setRetry(value);
                            demoEngine.setRetry(value);
                          }}
                        >
                          <option value="success">重试后成功</option>
                          <option value="failure">重试后继续失败</option>
                        </select>
                      </label>
                    </>
                  ) : (
                    <p className="scene-empty">本页无需设置异常</p>
                  )}
                  <OperationStatus />
                  <div className="scene-resets">
                    <button
                      onClick={() => {
                        pendingPreview = undefined;
                        demoEngine.normal();
                      }}
                    >
                      恢复正常
                    </button>
                    <button
                      onClick={() =>
                        resetDemo(current, location.pathname + location.search)
                      }
                    >
                      重置当前环节
                    </button>
                    <button onClick={() => resetDemo()}>重置整个 Demo</button>
                  </div>
                  <details
                    className="scene-details"
                    key={`${location.pathname}${location.search}`}
                  >
                    <summary>演示说明</summary>
                    <div className="scene-details-content">
                      {scene && (
                        <>
                          <p>
                            <strong>页面效果</strong>
                            {scene.message}
                          </p>
                          <p>
                            <strong>恢复方式</strong>
                            {scene.recovery}
                          </p>
                        </>
                      )}
                      <p>
                        <strong>页面操作</strong>
                        {operations.includes('feeding.save')
                          ? '填写记录并点击“保存记录”'
                          : page.action}
                      </p>
                      {page.note && <p>{page.note}</p>}
                      <p>
                        选择场景立即展示，不会自动保存数据。权限、网络和设备异常均为模拟。
                      </p>
                      <p>
                        恢复正常只清除异常，不重放操作；重置会清除对应演示数据。刷新后默认正常。
                      </p>
                      <p className="scene-last">{snapshot.lastEvent}</p>
                    </div>
                  </details>
                </div>
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
export function OperationStatus() {
  const { active } = useDemo();
  const navigate = useNavigate();
  const location = useLocation();
  if (!active?.scene) return null;
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
    <section
      className="scene-operation"
      data-testid="operation-status"
      aria-label="当前模拟结果"
      aria-live="polite"
    >
      <div className="scene-operation-label">
        <h3>{loading ? scene.process : scene.name}</h3>
        <span>
          {loading ? '等待中' : status === 'empty' ? '空数据' : '已展示'}
        </span>
      </div>
      {loading && (
        <progress aria-label="模拟操作进度" max={100} value={active.progress} />
      )}
      <div className="scene-operation-actions">
        {!loading && (
          <>
            <button className="scene-retry" onClick={demoEngine.retry}>
              {scene.retryLabel ?? '重试'}
            </button>
            {scene.editLabel && (
              <button onClick={edit}>{scene.editLabel}</button>
            )}
          </>
        )}
        <button onClick={demoEngine.cancel}>
          {loading ? '取消等待' : '取消'}
        </button>
      </div>
    </section>
  );
}

/** Existing list surfaces use their normal card typography; other failures stay in the console.
 * Known device and camera faults render through their original business components. */
export function PageOperationState({
  operations,
  emptyText,
}: {
  operations: Operation[];
  emptyText?: string;
  retry?: () => void;
}) {
  const { active } = useDemo();
  if (
    !active?.scene ||
    !operations.includes(active.request.operation) ||
    !['devices.load', 'formula.load', 'feeding.load'].includes(
      active.request.operation,
    )
  )
    return null;
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center px-8 text-center"
      role="status"
      data-testid="page-operation-state"
    >
      <p className="text-[15px] font-medium" style={{ color: '#795238' }}>
        {active.status === 'loading'
          ? '加载中…'
          : active.status === 'empty'
            ? (emptyText ?? '暂无数据')
            : active.scene.name}
      </p>
    </div>
  );
}

/** Changes copy inside an existing product control, never adds a demo card or dialog. */
export function OperationLabel({
  operation,
  children,
}: {
  operation: Operation;
  children: React.ReactNode;
}) {
  const { active } = useDemo();
  if (!active?.scene || active.request.operation !== operation)
    return <>{children}</>;
  return (
    <>
      {active.status === 'loading'
        ? '处理中…'
        : `${active.scene.name.replace('（模拟）', '')} · 重试`}
    </>
  );
}
