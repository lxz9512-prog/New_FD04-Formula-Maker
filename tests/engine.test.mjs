import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ScenarioEngine } from '../client/src/demo/engine.ts';
import { scenes, stages } from '../client/src/demo/catalog.ts';
const operation = (scene) => scene.operations[0] || 'devices.load';
function setup(t, scene) {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
  const engine = new ScenarioEngine();
  let commits = 0,
    cancellations = 0;
  const request = {
    operation: operation(scene),
    stage: scene.stage === 'global' ? 'devices' : scene.stage,
    label: 'test',
    delay: 25,
    success: () => commits++,
    cancel: () => cancellations++,
  };
  return {
    engine,
    request,
    commitCount: () => commits,
    cancelCount: () => cancellations,
  };
}
test('all scenarios have unique IDs, valid stages and complete contracts', () => {
  assert.equal(new Set(scenes.map((s) => s.id)).size, scenes.length);
  for (const scene of scenes) {
    assert.ok(stages[scene.stage]);
    for (const field of [
      'id',
      'name',
      'prerequisite',
      'process',
      'message',
      'recovery',
    ])
      assert.ok(scene[field], `${scene.id}.${field}`);
    assert.ok(scene.delay > 0);
    if (scene.stage !== 'global') assert.ok(scene.operations.length);
  }
});
for (const scene of scenes) {
  test(`${scene.id}: next operation waits, fails without commit, consumes once, retry succeeds`, (t) => {
    const x = setup(t, scene);
    x.engine.arm(scene.id);
    assert.ok(x.engine.getSnapshot().injections[scene.stage]);
    x.engine.run(x.request);
    assert.equal(x.engine.getSnapshot().active.status, 'loading');
    assert.equal(x.commitCount(), 0);
    assert.equal(x.engine.getSnapshot().injections[scene.stage], undefined);
    t.mock.timers.tick(scene.delay + 1);
    if (scene.outcome === 'loading') {
      x.engine.cancel();
      assert.equal(x.commitCount(), 0);
    } else if (scene.outcome === 'slow') assert.equal(x.commitCount(), 1);
    else {
      assert.equal(x.commitCount(), 0);
      assert.equal(
        x.engine.getSnapshot().active.status,
        scene.outcome === 'empty' ? 'empty' : 'error',
      );
      x.engine.retry();
      t.mock.timers.tick(30);
      assert.equal(x.commitCount(), 1);
    }
    x.engine.cancel();
  });
  test(`${scene.id}: direct preview is non-committing and repeatable after reset`, (t) => {
    const x = setup(t, scene);
    x.engine.run(x.request, { previewId: scene.id });
    assert.equal(x.commitCount(), 0);
    assert.equal(x.engine.getSnapshot().active.preview, true);
    t.mock.timers.tick(12000);
    assert.equal(x.commitCount(), 0);
    x.engine.reset();
    t.mock.timers.tick(10000);
    assert.equal(x.commitCount(), 0);
    x.engine.run(x.request, { previewId: scene.id });
    assert.ok(x.engine.getSnapshot().active);
    x.engine.cancel();
  });
}
test('persistent failure policy fails on retry but clear restores normal without replay', (t) => {
  const scene = scenes.find((s) => s.id === 'formula.save');
  const x = setup(t, scene);
  x.engine.arm(scene.id, 'persistent', 'failure');
  x.engine.run(x.request);
  t.mock.timers.tick(1500);
  x.engine.retry();
  t.mock.timers.tick(1500);
  assert.equal(x.commitCount(), 0);
  assert.ok(x.engine.getSnapshot().injections.formula);
  x.engine.normal();
  t.mock.timers.tick(5000);
  assert.equal(x.commitCount(), 0);
  x.engine.run(x.request);
  t.mock.timers.tick(30);
  assert.equal(x.commitCount(), 1);
});
test('retry-success override does not disarm persistent scenario for future new operations', (t) => {
  const scene = scenes.find((s) => s.id === 'sync.failure');
  const x = setup(t, scene);
  x.engine.arm(scene.id, 'persistent', 'success');
  x.engine.run(x.request);
  t.mock.timers.tick(1500);
  x.engine.retry();
  t.mock.timers.tick(30);
  assert.equal(x.commitCount(), 1);
  assert.ok(x.engine.getSnapshot().injections.sync);
  x.engine.run(x.request);
  t.mock.timers.tick(1500);
  assert.equal(x.commitCount(), 1);
  assert.equal(x.engine.getSnapshot().active.status, 'error');
  x.engine.cancel();
});
test('route changes/reset/cancel invalidate in-flight completion and timers', (t) => {
  const x = setup(t, scenes[0]);
  for (const cancel of [
    x.engine.routeChanged,
    () => x.engine.reset('devices'),
    x.engine.cancel,
    x.engine.normal,
  ]) {
    x.engine.run(x.request);
    cancel();
    t.mock.timers.tick(10000);
    assert.equal(x.commitCount(), 0);
    assert.equal(x.engine.getSnapshot().active, null);
  }
});
test('unrelated actions and ineligible business states do not consume scene', (t) => {
  const scene = scenes.find((s) => s.id === 'preparation.powder');
  const x = setup(t, scene);
  x.engine.arm(scene.id);
  x.engine.run({ ...x.request, eligible: () => false });
  t.mock.timers.tick(30);
  assert.equal(x.commitCount(), 1);
  assert.ok(x.engine.getSnapshot().injections.preparation);
  x.engine.run({ ...x.request, operation: 'formula.save', stage: 'formula' });
  t.mock.timers.tick(30);
  assert.ok(x.engine.getSnapshot().injections.preparation);
});
test('global environment replaces locals, prevents conflict, and only once is consumed', (t) => {
  const x = setup(t, scenes[0]);
  x.engine.arm('formula.save');
  x.engine.arm('global.offline');
  x.engine.arm('sync.failure');
  assert.deepEqual(Object.keys(x.engine.getSnapshot().injections), ['global']);
  x.engine.run(x.request);
  t.mock.timers.tick(1500);
  assert.equal(x.commitCount(), 0);
  assert.deepEqual(x.engine.getSnapshot().injections, {});
  x.engine.cancel();
});
test('double-submit cannot bypass a pending transaction', (t) => {
  const x = setup(t, scenes[0]);
  x.engine.run(x.request);
  assert.equal(x.engine.run(x.request), false);
  t.mock.timers.tick(30);
  assert.equal(x.commitCount(), 1);
});

test('retrying direct preview explicitly commits prepared business state once', (t) => {
  const scene = scenes.find((s) => s.id === 'formula.save');
  const x = setup(t, scene);
  x.engine.run(x.request, { previewId: scene.id });
  t.mock.timers.tick(10000);
  assert.equal(x.commitCount(), 0);
  x.engine.retry();
  t.mock.timers.tick(30);
  assert.equal(x.commitCount(), 1);
  x.engine.retry();
  t.mock.timers.tick(30);
  assert.equal(x.commitCount(), 1);
});

test('current-stage reset does not clear other stages or persistent global environment', (t) => {
  const x = setup(t, scenes[0]);
  x.engine.arm('formula.save');
  x.engine.arm('sync.failure');
  x.engine.reset('formula');
  assert.equal(x.engine.getSnapshot().injections.formula, undefined);
  assert.ok(x.engine.getSnapshot().injections.sync);
  x.engine.arm('global.offline', 'persistent');
  x.engine.reset('devices');
  assert.ok(x.engine.getSnapshot().injections.global);
});
