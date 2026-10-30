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
  pageForPath,
  scenesForOperations,
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
  return useCallback(() => demoEngine.run({ ...latest.current }), []);
}
export function useLoadOperation(
  operation: 'devices.load' | 'feeding.load' | 'formula.load',
  stage: Stage,
) {
  const [loaded, setLoaded] = useState(false);
  const run = useOperation(
    {
      operation,
      stage,
      label:
        stage === 'devices'
          ? '加载设备列表'
          : stage === 'formula'
            ? '加载配比列表'
            : '加载喂养记录',
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
export function ScenarioConsole() {
  const snapshot = useDemo();
  const location = useLocation();
  useSyncExternalStore(subscribeRegistry, () => registryVersion);
  const page = pageForPath(location.pathname);
  const current = page.stage;
  const [open, setOpen] = useState(() => window.innerWidth >= 1200);
  const [collapsed, setCollapsed] = useState(false);
  const [environment, setEnvironment] = useState(false);
  const [selected, setSelected] = useState('');
  const [policy, setPolicy] = useState<Policy>('once');
  const [retry, setRetry] = useState<Retry>('success');
  const titleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setEnvironment(false);
    setSelected('');
  }, [location.pathname]);
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
  const list = environment
    ? scenes.filter((s) => s.stage === 'global')
    : scenesForOperations(operations);
  const scene = list.find((s) => s.id === selected) ?? list[0];
  const globalActive = snapshot.injections.global;
  const matchedOperation =
    scene &&
    (scene.stage === 'global'
      ? operations.find((op) => registry.has(op))
      : operations.find(
          (op) => scene.operations.includes(op) && registry.has(op),
        ));
  function apply(mode: 'next' | 'preview') {
    if (!scene || (globalActive && !environment)) return;
    if (mode === 'next') {
      pendingPreview = undefined;
      demoEngine.arm(scene.id, policy, retry);
    } else if (matchedOperation) {
      demoEngine.normal();
      pendingPreview = scene.id;
      previewRetry = retry;
      activatePreview(matchedOperation);
    }
  }
  const armed = Object.values(snapshot.injections).filter(Boolean);
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
                <small>DEMO · 演示设置</small>
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
              <OperationStatus />
              {!collapsed && (
                <div className="scene-settings">
                  <div className="scene-page-context">
                    <small>随当前页面自动匹配</small>
                    <h3>
                      {page.title}
                      {location.pathname === '/feeding-stats' &&
                      registry.has('feeding.save')
                        ? ' · 新增记录'
                        : ''}
                    </h3>
                    <p>
                      {operations.includes('feeding.save')
                        ? '填写记录并点击“保存记录”'
                        : page.action}
                    </p>
                  </div>
                  <div className="scene-tabs" aria-label="场景范围">
                    <button
                      aria-pressed={!environment}
                      onClick={() => {
                        setEnvironment(false);
                        setSelected('');
                      }}
                    >
                      本页异常
                    </button>
                    <button
                      aria-pressed={environment}
                      onClick={() => {
                        setEnvironment(true);
                        setSelected('');
                      }}
                    >
                      全局环境
                    </button>
                  </div>
                  {list.length > 0 ? (
                    <>
                      <label>
                        选择要演示的情况
                        <select
                          aria-label="本页异常"
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
                          <p>页面效果：{scene.message}</p>
                          <p>恢复路径：{scene.recovery}</p>
                        </div>
                      )}
                      <div className="scene-actions">
                        <button
                          className="scene-primary"
                          onClick={() => apply('preview')}
                          disabled={
                            !matchedOperation ||
                            (!!globalActive && !environment)
                          }
                        >
                          立即展示
                        </button>
                        <button
                          className="scene-secondary"
                          onClick={() => apply('next')}
                          disabled={
                            (!!globalActive && !environment) ||
                            (!environment && !matchedOperation)
                          }
                        >
                          操作后触发
                        </button>
                      </div>
                      <p className="scene-hint">
                        立即展示：留在本页，不提交数据。
                        <br />
                        操作后触发：设置后，在 App 内
                        {environment ? '进行下一次支持的操作' : page.action}
                        ，经过等待后出现异常。
                      </p>
                      {!matchedOperation && (
                        <p className="scene-warning">
                          本页没有可执行的模拟请求。全局环境可先设置，进入业务页后触发；不会把说明页伪装成请求失败。
                        </p>
                      )}
                      {globalActive && !environment && (
                        <p className="scene-warning">
                          全局环境正在生效，请先“恢复正常”再演示本页异常。
                        </p>
                      )}
                      <details className="scene-advanced">
                        <summary>
                          高级设置 · {policy === 'once' ? '仅一次' : '持续生效'}{' '}
                          · {retry === 'success' ? '重试成功' : '重试继续失败'}
                        </summary>
                        <div className="scene-two">
                          <label>
                            触发次数
                            <select
                              aria-label="触发次数"
                              value={policy}
                              onChange={(e) =>
                                setPolicy(e.target.value as Policy)
                              }
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
                              onChange={(e) =>
                                setRetry(e.target.value as Retry)
                              }
                            >
                              <option value="success">重试后成功</option>
                              <option value="failure">重试后继续失败</option>
                            </select>
                          </label>
                        </div>
                        <p className="scene-hint">
                          次数用于“操作后触发”；立即展示不消耗业务次数，不自动提交。
                        </p>
                      </details>
                    </>
                  ) : (
                    <div className="scene-description">
                      <strong>沿用本页原有流程</strong>
                      <p>{page.note ?? '本页没有额外的失败操作。'}</p>
                      <p>{page.action}</p>
                    </div>
                  )}
                  {page.note && list.length > 0 && !environment && (
                    <p className="scene-hint">{page.note}</p>
                  )}
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
                    <button
                      onClick={() =>
                        resetDemo(current, location.pathname + location.search)
                      }
                    >
                      重置当前环节
                    </button>
                    <button onClick={() => resetDemo()}>重置整个 Demo</button>
                  </div>
                  <p className="scene-hint">
                    恢复正常仅移除注入并停止等待，不重放操作。重置会清除对应模拟数据。所有权限、网络和设备故障均为模拟；刷新默认无异常注入。
                  </p>
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
    <section
      className="scene-operation"
      data-testid="operation-status"
      aria-label="当前模拟结果"
      aria-live="polite"
    >
      <div className="scene-operation-label">
        当前运行结果
        <span>
          {loading ? '处理中' : status === 'empty' ? '空数据' : '未完成'}
        </span>
      </div>
      <span
        className={`scene-operation-symbol ${loading ? 'is-loading' : ''}`}
        aria-hidden="true"
      >
        {loading ? '◌' : status === 'empty' ? '○' : '!'}
      </span>
      <small>
        模拟{scene?.stage === 'global' ? '环境' : '交互'}
        {active.preview ? ' · 直接预览' : ''}
      </small>
      <h3>
        {loading
          ? (scene?.process ?? `正在${request.label}…`)
          : (scene?.name ?? '操作未完成')}
      </h3>
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
          <p className="scene-recovery">{scene?.recovery}</p>
          <button className="scene-retry" onClick={demoEngine.retry}>
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
        className="scene-back"
        onClick={() => {
          demoEngine.cancel();
          navigate(request.stage === 'devices' ? '/' : '/device');
        }}
      >
        返回{request.stage === 'devices' ? '设备列表' : '设备控制'}
      </button>
    </section>
  );
}

/** Native-sized status at the business surface; diagnostic wording stays in the console. */
export function PageOperationState({
  operations,
  emptyText,
  retry,
}: {
  operations: Operation[];
  emptyText?: string;
  retry?: () => void;
}) {
  const { active } = useDemo();
  if (!active || !operations.includes(active.request.operation)) return null;
  const loading = active.status === 'loading';
  const empty = active.status === 'empty';
  return (
    <div
      className={empty ? 'mock-content-state' : 'mock-inline-state'}
      role="status"
      data-testid="page-operation-state"
    >
      <span>
        {loading
          ? '正在处理…'
          : empty
            ? (emptyText ?? '暂无数据')
            : (active.scene?.name.replace('（模拟）', '') ??
              '暂未完成，请重试')}
      </span>
      {!loading && (
        <button
          onClick={retry ?? demoEngine.retry}
          style={{ marginLeft: 10, textDecoration: 'underline' }}
        >
          重试
        </button>
      )}
      {loading && (
        <button onClick={demoEngine.cancel} style={{ marginLeft: 10 }}>
          取消
        </button>
      )}
    </div>
  );
}
