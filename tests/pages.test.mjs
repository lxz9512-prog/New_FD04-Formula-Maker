import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  pages,
  pageForPath,
  scenesForOperations,
  scenes,
  scenesForPage,
  nativeScenarioRoutes,
} from '../client/src/demo/catalog.ts';
test('every declared demo route has an explicit page contract', () => {
  const source = fs.readFileSync(
    new URL('../client/src/app.tsx', import.meta.url),
    'utf8',
  );
  for (const [, route] of source.matchAll(/path="([^"*]+)"/g)) {
    assert.ok(pages['/' + route], `missing page contract ${route}`);
  }
  assert.ok(pages['/']);
});
test('static information pages do not inherit preparation errors', () => {
  for (const path of [
    '/faq',
    '/device-assistant',
    '/feeding-stats/guide',
    '/formula-result',
    '/no-baby',
  ]) {
    assert.deepEqual(scenesForOperations(pageForPath(path).operations), []);
    assert.ok(pageForPath(path).note);
  }
});
test('step-specific scenes never mix load/save or front/back recognition', () => {
  const ids = (path) =>
    scenesForOperations(pageForPath(path).operations).map((s) => s.id);
  assert.ok(!ids('/formula-ratio').includes('formula.save'));
  assert.ok(ids('/formula-ratio').includes('formula.select'));
  assert.ok(!ids('/capture-formula').includes('capture.recognition'));
  assert.deepEqual(ids('/scan-formula'), ['capture.permission']);
  assert.deepEqual(ids('/feeding-stats/add-record'), ['feeding.save']);
  assert.ok(!ids('/device-detail').includes('preparation.timeout'));
});
test('all local scenarios are reachable from at least one page contract', () => {
  for (const scene of scenes.filter((s) => s.stage !== 'global')) {
    assert.ok(
      Object.values(pages).some((p) =>
        scenesForOperations(p.operations).includes(scene),
      ),
      scene.id,
    );
  }
});

test('one page picker includes applicable local and network cases without static-page faults', () => {
  const ids = (path) =>
    scenesForPage(pageForPath(path).operations).map((scene) => scene.id);
  assert.ok(ids('/device').includes('sync.mismatch'));
  assert.ok(ids('/device').includes('preparation.water'));
  assert.ok(ids('/device').includes('global.offline'));
  assert.ok(!ids('/device').includes('capture.upload'));
  assert.ok(!ids('/formula-edit').includes('formula.load'));
  assert.deepEqual(ids('/formula-result'), []);
});
test('every legacy exception belongs to an applicable normal-page picker, not the directory', () => {
  const layout = fs.readFileSync(
    new URL('../client/src/components/Layout.tsx', import.meta.url),
    'utf8',
  );
  for (const [legacy, { path, sceneId }] of Object.entries(
    nativeScenarioRoutes,
  )) {
    assert.ok(
      scenesForPage(pageForPath(path).operations).some(
        (scene) => scene.id === sceneId,
      ),
    );
    assert.ok(!layout.includes("path: '" + legacy + "'"), legacy);
  }
  assert.ok(!layout.includes("path: '/formula-ratio-sync'"));
});
