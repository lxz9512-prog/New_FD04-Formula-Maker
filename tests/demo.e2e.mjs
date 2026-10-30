const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || 'playwright'
);
import fs from 'node:fs';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 1000 } });
const errors = [],
  passes = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route('https://**/*', (route) => route.abort());
const url = process.env.DEMO_URL || 'http://127.0.0.1:4174/';
const consoleUI = page.getByRole('complementary', { name: '场景控制台' });
const phone = page.locator('[data-device-screen]');
const result = page.getByTestId('operation-status');
fs.mkdirSync('test-results', { recursive: true });
async function go(path) {
  await page.evaluate((p) => (location.hash = p), path);
  await page.waitForTimeout(250);
}
async function open() {
  if (!(await consoleUI.isVisible()))
    await page.getByRole('button', { name: '打开场景控制台' }).click();
}
async function choose(id) {
  await open();
  await consoleUI
    .getByRole('button', {
      name: id.startsWith('global.') ? '全局环境' : '本页异常',
      exact: true,
    })
    .click();
  await consoleUI.getByLabel('本页异常', { exact: true }).selectOption(id);
  await result.waitFor();
}
async function normal() {
  await open();
  await consoleUI
    .getByRole('button', { name: '恢复正常', exact: true })
    .click();
}
async function reset() {
  await open();
  await consoleUI
    .getByRole('button', { name: '重置整个 Demo', exact: true })
    .click();
  await page.waitForTimeout(300);
}
async function storage(key) {
  return page.evaluate(
    (k) => localStorage.getItem('New_FD04_demo_v1:' + k),
    key,
  );
}
async function check(name, fn) {
  await fn();
  passes.push(name);
  console.log('PASS', name);
}
try {
  await page.goto(url);
  await phone.getByText('FD04', { exact: true }).waitFor();
  await check(
    'normal lists are immediate; no added reload controls or trigger modes',
    async () => {
      assert.equal(await result.count(), 0);
      assert.equal(
        await page
          .getByRole('button', {
            name: /立即展示|立即演示|操作后触发|稍后触发|重新加载设备/,
          })
          .count(),
        0,
      );
      assert.equal(await consoleUI.getByLabel('触发次数').count(), 0);
      for (const path of ['/formula-ratio', '/feeding-stats']) {
        await go(path);
        assert.equal(
          await phone.getByRole('button', { name: /重新加载/ }).count(),
          0,
        );
        assert.equal(
          await phone.getByTestId('page-operation-state').count(),
          0,
        );
      }
      await go('/');
    },
  );
  await check(
    'left console layout and original right interaction notes remain',
    async () => {
      for (const width of [1200, 1280, 1512]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.waitForTimeout(600);
        const directory = await page.locator('.scene-directory').boundingBox(),
          control = await consoleUI.boundingBox(),
          device = await page.locator('[data-device-frame]').boundingBox(),
          info = await page
            .getByRole('complementary', { name: '交互说明', exact: true })
            .boundingBox();
        assert.ok(directory.x + directory.width <= control.x);
        assert.ok(control.x + control.width <= device.x);
        assert.ok(device.x + device.width <= info.x);
        assert.ok(info.x + info.width <= width + 1);
      }
    },
  );
  await check(
    'selection instantly changes list and survives hiding; normal restores without loading',
    async () => {
      await choose('devices.failure');
      assert.ok(
        await phone.getByText('设备列表加载失败', { exact: true }).isVisible(),
      );
      assert.equal(await phone.getByRole('alertdialog').count(), 0);
      await consoleUI.getByRole('button', { name: '隐藏控制台' }).click();
      assert.ok(
        await phone.getByText('设备列表加载失败', { exact: true }).isVisible(),
      );
      await open();
      await consoleUI.getByLabel('本页异常', { exact: true }).selectOption('');
      assert.ok(await phone.getByText('FD04', { exact: true }).isVisible());
      assert.equal(await result.count(), 0);
      await choose('devices.loading');
      assert.ok(await phone.getByText('加载中…', { exact: true }).isVisible());
      await normal();
      assert.ok(await phone.getByText('FD04', { exact: true }).isVisible());
    },
  );
  await check(
    'all 37 rules select in place without writing data or extra product status widgets',
    async () => {
      const groups = [
        ['/', ['devices.loading', 'devices.empty', 'devices.failure']],
        [
          '/device',
          [
            'preparation.water',
            'preparation.powder',
            'preparation.timeout',
            'preparation.quality',
            'preparation.chamber',
            'preparation.chamber-reminder',
            'preparation.night-water',
            'preparation.cleaning-incomplete',
            'preparation.tube-reminder',
          ],
        ],
        [
          '/capture-formula-step2',
          [
            'capture.permission',
            'capture.upload',
            'capture.recognition',
            'capture.loading',
          ],
        ],
        [
          '/formula-edit?mode=recognition',
          ['formula.save', 'formula.validation'],
        ],
        ['/formula-ratio', ['formula.load', 'formula.empty', 'formula.select']],
        ['/formula-ratio-sync', ['sync.failure', 'sync.timeout']],
        ['/device-cleaning', ['cleaning.interrupt', 'cleaning.timeout']],
        ['/feeding-stats', ['feeding.empty', 'feeding.load']],
        ['/feeding-stats/add-record', ['feeding.save']],
        ['/device-detail', ['settings.rename']],
        ['/device-settings', ['settings.light']],
        [
          '/notification-settings',
          ['settings.notifications', 'settings.permission'],
        ],
        ['/powder-water', ['settings.resources']],
        ['/add-baby', ['baby.save', 'baby.validation']],
        ['/', ['global.offline', 'global.weak']],
      ];
      let count = 0;
      for (const [path, ids] of groups) {
        await go(path);
        for (const id of ids) {
          const before = page.url(),
            data = await page.evaluate(() =>
              JSON.stringify({ ...localStorage }),
            );
          await choose(id);
          count++;
          assert.equal(page.url(), before, id);
          assert.equal(
            await page.evaluate(() => JSON.stringify({ ...localStorage })),
            data,
            id + ' must not save',
          );
          assert.equal(await phone.getByTestId('operation-status').count(), 0);
          assert.equal(
            await page
              .locator('.mock-inline-state, .mock-operation-overlay')
              .count(),
            0,
          );
          await normal();
        }
      }
      assert.equal(count, 37);
    },
  );
  await check(
    'eight original device exception designs are projected onto normal control page',
    async () => {
      await go('/device');
      const originalPaths = {
        water: '/water-low-error',
        powder: '/powder-error',
        quality: '/water-quality-error',
        chamber: '/powder-clean-due',
        'chamber-reminder': '/powder-clean-reminder',
        'night-water': '/night-water-low',
        'cleaning-incomplete': '/cleaning-incomplete',
        'tube-reminder': '/tube-clean-reminder',
      };
      for (const [key, path] of Object.entries(originalPaths)) {
        await go(path);
        // Native control alert and cleaning-incomplete dialog match original route text.
        const original = await phone
          .locator('.control-alert-overlay')
          .allTextContents();
        await go('/device');
        await choose('preparation.' + key);
        const projected = await phone
          .locator('.control-alert-overlay')
          .allTextContents();
        assert.deepEqual(projected, original, key);
        if (key === 'cleaning-incomplete') {
          await phone
            .getByRole('button', { name: '继续', exact: true })
            .waitFor();
        }
        if (key === 'water')
          await page.screenshot({ path: 'test-results/water-error.png' });
        if (key === 'tube-reminder') {
          await phone.locator('.control-alert-action').click();
          await page.waitForURL('**/#/device-cleaning');
        } else await normal();
      }
    },
  );
  await check(
    'front and back use original capture failure dialog and working retry / retake',
    async () => {
      for (const [path, target] of [
        ['/capture-formula', '/capture-formula-back-side'],
        ['/capture-formula-step2', '/formula-edit?mode=recognition'],
      ]) {
        await go(path);
        await choose('capture.upload');
        const native = phone.getByRole('alertdialog');
        await native.waitFor();
        await native.getByRole('button', { name: '重试', exact: true }).click();
        await page.waitForURL('**/#' + target);
      }
      await go('/capture-formula-step2');
      await choose('capture.recognition');
      await phone
        .getByRole('alertdialog')
        .getByRole('button', { name: '重拍' })
        .click();
      await page.waitForURL('**/#/scan-formula');
      await go('/capture-formula-step2');
      await choose('capture.recognition');
      await phone
        .getByRole('alertdialog')
        .getByRole('button', { name: /手动/ })
        .click();
      await page.waitForURL('**/#/formula-edit?mode=manual');
    },
  );
  await check(
    'retry policy applies to original App action, preserves draft and commits only on success',
    async () => {
      await reset();
      await go('/formula-edit?mode=recognition');
      const brand = phone.locator('input').first();
      await brand.fill('Test Brand');
      await choose('formula.save');
      await consoleUI.getByLabel('重试策略').selectOption('failure');
      await phone
        .getByRole('button', { name: /确认|保存|配比保存失败/ })
        .last()
        .click();
      await result
        .getByRole('heading', { name: '配比保存失败', exact: true })
        .waitFor();
      assert.equal(await storage('formula_profile'), null);
      assert.equal(await brand.inputValue(), 'Test Brand');
      await consoleUI.getByLabel('重试策略').selectOption('success');
      await phone
        .getByRole('button', { name: /确认|保存|配比保存失败/ })
        .last()
        .click();
      await page.waitForURL('**/#/formula-ratio');
      assert.equal(
        JSON.parse(await storage('formula_profile')).brand,
        'Test Brand',
      );
    },
  );
  await check(
    'recovery, reset and navigation never replay pending writes',
    async () => {
      await go('/feeding-stats/add-record');
      await phone.locator('textarea').fill('kept draft');
      const before = await storage('feeding_records');
      await choose('feeding.save');
      await normal();
      assert.equal(await phone.locator('textarea').inputValue(), 'kept draft');
      await page.waitForTimeout(1600);
      assert.equal(await storage('feeding_records'), before);
      await choose('global.weak');
      await consoleUI.getByRole('button', { name: '重置当前环节' }).click();
      await page.waitForTimeout(5300);
      assert.equal(await storage('feeding_records'), null);
      await go('/formula-edit?mode=recognition');
      await phone
        .getByRole('button', { name: /确认|保存|配比保存失败/ })
        .last()
        .click();
      await go('/');
      await page.waitForTimeout(1800);
      assert.ok(page.url().endsWith('#/'));
    },
  );
  await check(
    'normal first-use camera, save and preparation still complete end to end',
    async () => {
      await reset();
      await go('/device');
      await phone
        .getByRole('button', { name: '添加粉水配比', exact: true })
        .click();
      await page.waitForURL('**/#/scan-formula?source=first-use');
      await phone
        .getByRole('button', { name: '开始拍摄', exact: true })
        .click();
      await phone
        .getByRole('button', { name: '拍摄照片', exact: true })
        .click();
      await page.waitForURL('**/#/capture-formula-back-side?source=first-use');
      await phone
        .getByRole('button', { name: '开始拍摄', exact: true })
        .click();
      await phone
        .getByRole('button', { name: '拍摄照片', exact: true })
        .click();
      await page.waitForURL(
        '**/#/formula-edit?mode=recognition&source=first-use',
      );
      await phone
        .getByRole('button', { name: /确认|保存|配比保存失败/ })
        .last()
        .click();
      await page.waitForURL('**/#/device');
      await phone
        .getByRole('button', { name: '开始', exact: true })
        .first()
        .click();
      await page.waitForURL('**/#/formula-result');
      assert.equal(JSON.parse(await storage('feeding_history')).length, 1);
    },
  );
  await check(
    'cleaning selection stops old timer and reset remains stable',
    async () => {
      await go('/device-cleaning');
      await choose('cleaning.interrupt');
      await result.getByRole('button', { name: '重新检查并开始' }).click();
      await result.waitFor({ state: 'hidden' });
      await page.waitForTimeout(300);
      await choose('cleaning.timeout');
      await page.waitForTimeout(7400);
      assert.equal(
        await phone.getByText('清洁完成', { exact: true }).count(),
        0,
      );
      await consoleUI.getByRole('button', { name: '重置当前环节' }).click();
      await phone.getByRole('button', { name: /除垢/ }).first().waitFor();
    },
  );
  await reset();
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
  await check(
    'mobile drawer hidden selection stays visible; reload starts normal and storage is isolated',
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.reload();
      await phone.getByText('FD04', { exact: true }).waitFor();
      assert.equal(await consoleUI.isVisible(), false);
      await choose('devices.empty');
      await page.screenshot({ path: 'test-results/mobile-drawer.png' });
      await consoleUI.getByRole('button', { name: '隐藏控制台' }).click();
      await phone.getByText('还没有可用设备', { exact: true }).waitFor();
      await page.screenshot({ path: 'test-results/mobile-error.png' });
      await page.evaluate(() =>
        localStorage.setItem('formula_profile', 'original-sentinel'),
      );
      await page.reload();
      await phone.getByText('FD04', { exact: true }).waitFor();
      assert.equal(await result.count(), 0);
      await reset();
      assert.equal(
        await page.evaluate(() => localStorage.getItem('formula_profile')),
        'original-sentinel',
      );
    },
  );
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    'test-results/e2e.json',
    JSON.stringify({ passes, errors }, null, 2),
  );
  console.log(`All ${passes.length} browser checks passed.`);
} catch (e) {
  await page.screenshot({ path: 'test-results/failure.png', fullPage: true });
  console.log('ERRORS', errors);
  console.log((await page.locator('body').innerText()).slice(-5000));
  throw e;
} finally {
  await browser.close();
}
