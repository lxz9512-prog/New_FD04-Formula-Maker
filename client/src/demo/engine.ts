import { getScene, type Scene, type Stage, type Operation } from './catalog.ts';
export type Policy = 'once' | 'persistent';
export type Retry = 'success' | 'failure';
export interface Injection {
  sceneId: string;
  policy: Policy;
  retry: Retry;
}
export interface Request {
  operation: Operation;
  stage: Stage;
  label: string;
  delay?: number;
  success: () => void;
  cancel?: () => void;
  edit?: () => void;
  eligible?: (scene: Scene) => boolean;
}
export interface Active {
  id: number;
  request: Request;
  scene?: Scene;
  injection?: Injection;
  status: 'loading' | 'error' | 'empty';
  preview: boolean;
  progress: number;
}
export interface Snapshot {
  injections: Partial<Record<Stage, Injection>>;
  active: Active | null;
  revision: number;
  routeRevision: number;
  lastEvent: string;
}
/** A single mock interaction boundary. No real network, account, permission, or device calls. */
export class ScenarioEngine {
  private state: Snapshot = {
    injections: {},
    active: null,
    revision: 0,
    routeRevision: 0,
    lastEvent: '正常模式',
  };
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private progressTimer: ReturnType<typeof setInterval> | undefined;
  private token = 0;
  getSnapshot = () => this.state;
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  private publish(patch: Partial<Snapshot>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((fn) => fn());
  }
  private clearTimers() {
    clearTimeout(this.timer);
    clearInterval(this.progressTimer);
    this.timer = undefined;
    this.progressTimer = undefined;
  }
  cancel = () => {
    ++this.token;
    this.clearTimers();
    const previous = this.state.active;
    this.publish({ active: null });
    previous?.request.cancel?.();
  };
  arm(sceneId: string, policy: Policy = 'once', retry: Retry = 'success') {
    const scene = getScene(sceneId);
    if (!scene) return;
    this.cancel();
    // Environment is exclusive: it supersedes and clears local injections instead of silently stacking them.
    const injections =
      scene.stage === 'global' ? {} : { ...this.state.injections };
    if (scene.stage !== 'global' && injections.global) return;
    injections[scene.stage] = { sceneId, policy, retry };
    this.publish({
      injections,
      lastEvent: `待触发：${scene.name}（${policy === 'once' ? '仅一次' : '持续生效'}）`,
    });
  }
  clearStage(stage: Stage) {
    this.cancel();
    const injections = { ...this.state.injections };
    delete injections[stage];
    this.publish({ injections, lastEvent: '本环节已恢复正常；未重放业务操作' });
  }
  normal = () => {
    this.cancel();
    this.publish({
      injections: {},
      lastEvent: '异常注入已清除；未提交或重放任何操作',
    });
  };
  routeChanged = () => {
    this.cancel();
    this.publish({ routeRevision: this.state.routeRevision + 1 });
  };
  reset = (stage?: Stage) => {
    this.cancel();
    if (stage) this.clearStage(stage);
    this.publish({
      injections: stage ? this.state.injections : {},
      revision: this.state.revision + 1,
      lastEvent: stage ? '当前环节已重置' : '整个 Demo 已重置',
    });
  };
  run(
    request: Request,
    options: {
      previewId?: string;
      retry?: boolean;
      forceScene?: Scene;
      injection?: Injection;
      preview?: boolean;
    } = {},
  ) {
    if (this.state.active?.status === 'loading') return false;
    this.cancel();
    const configured =
      this.state.injections.global ?? this.state.injections[request.stage];
    const candidate =
      options.forceScene ??
      (options.previewId
        ? getScene(options.previewId)
        : configured && getScene(configured.sceneId));
    const scene =
      candidate &&
      (candidate.stage === 'global' ||
        candidate.operations.includes(request.operation)) &&
      (!request.eligible || request.eligible(candidate))
        ? candidate
        : undefined;
    const injection =
      options.injection ??
      (scene && configured?.sceneId === scene.id
        ? configured
        : scene
          ? {
              sceneId: scene.id,
              policy: 'once' as const,
              retry: 'success' as const,
            }
          : undefined);
    if (
      scene &&
      configured &&
      configured.policy === 'once' &&
      !options.previewId &&
      !options.retry
    ) {
      const injections = { ...this.state.injections };
      delete injections[scene.stage];
      this.publish({ injections });
    }
    const id = ++this.token;
    const active: Active = {
      id,
      request,
      scene,
      injection,
      status: 'loading',
      progress: 0,
      preview: !!options.previewId || !!options.preview,
    };
    const duration = scene?.delay ?? request.delay ?? 900;
    if (
      options.previewId &&
      scene &&
      scene.outcome !== 'loading' &&
      scene.outcome !== 'slow'
    ) {
      this.publish({
        active: {
          ...active,
          status: scene.outcome === 'empty' ? 'empty' : 'error',
          progress: 100,
        },
        lastEvent: `直接预览：${scene.name}（未提交数据）`,
      });
      return true;
    }
    this.publish({
      active,
      lastEvent: scene ? `执行中：${scene.name}` : `正常执行：${request.label}`,
    });
    const started = Date.now();
    this.progressTimer = setInterval(() => {
      if (id !== this.token || !this.state.active) return;
      this.publish({
        active: {
          ...this.state.active,
          progress: Math.min(
            94,
            Math.floor(((Date.now() - started) / duration) * 94),
          ),
        },
      });
    }, 100);
    // Preview is visual-only, including slow success: no automatic business write.
    if (
      scene?.outcome === 'loading' ||
      (options.previewId && scene?.outcome === 'slow')
    )
      return true;
    this.timer = setTimeout(() => {
      if (id !== this.token) return;
      this.clearTimers();
      if (scene && scene.outcome !== 'success' && scene.outcome !== 'slow') {
        this.publish({
          active: {
            ...active,
            progress: 100,
            status: scene.outcome === 'empty' ? 'empty' : 'error',
          },
          lastEvent: `${scene.name}；未执行成功写入`,
        });
        return;
      }
      this.publish({ active: null, lastEvent: `${request.label}成功` });
      try {
        request.success();
      } catch {
        const failure: Scene = {
          id: 'storage.error',
          stage: request.stage,
          name: '演示数据写入失败',
          prerequisite: '',
          operations: [request.operation],
          outcome: 'error',
          delay: 800,
          process: '正在保存…',
          message: '浏览器未能保存演示数据，请检查存储权限后重试。',
          recovery: '输入仍保留，可重试或取消。',
        };
        this.publish({
          active: { ...active, scene: failure, status: 'error' },
          lastEvent: '写入失败',
        });
      }
    }, duration);
    return true;
  }
  retry = () => {
    const current = this.state.active;
    if (!current || current.status === 'loading') return;
    const { request, scene, injection } = current;
    const failAgain = injection?.retry === 'failure';
    // A retry policy overrides this attempt only; persistent scenarios remain armed for later new operations.
    if (failAgain)
      this.run(request, { retry: true, forceScene: scene, injection });
    else {
      const saved = this.state.injections;
      this.state = { ...this.state, injections: {} };
      this.run(request, { retry: true });
      this.publish({ injections: saved });
    }
  };
}
export const demoEngine = new ScenarioEngine();
