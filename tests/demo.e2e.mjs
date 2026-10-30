// PLAYWRIGHT_MODULE is optional for an existing local browser-tool cache.
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || 'playwright'
);
import fs from 'node:fs';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.route('https://**/*', (route) => route.abort());
const url = process.env.DEMO_URL || 'http://127.0.0.1:4174/';
fs.mkdirSync('test-results', { recursive: true });
const consoleUI = page.getByRole('complementary', { name: '场景控制台' });
const dialog = page.getByTestId('operation-overlay').getByRole('dialog');
const phone = page.locator('[data-device-screen]');
const passes = [];
async function check(name, fn) {
  if (process.env.CHECK_FILTER && !name.includes(process.env.CHECK_FILTER))
    return;
  await fn();
  passes.push(name);
  console.log('PASS', name);
}
async function go(path) {
  await page.evaluate((path) => {
    location.hash = path;
  }, path);
  await page.waitForTimeout(300);
}
async function consoleOpen() {
  if (!(await consoleUI.isVisible()))
    await page.getByRole('button', { name: '打开场景控制台' }).click();
}
async function select(
  scene,
  { mode = 'next', policy = 'once', retry = 'success' } = {},
) {
  await consoleOpen();
  await consoleUI
    .getByLabel('流程环节', { exact: true })
    .selectOption(scene.split('.')[0]);
  await consoleUI.getByLabel('触发方式').selectOption(mode);
  await consoleUI.getByLabel('本环节场景').selectOption(scene);
  if (mode === 'next')
    await consoleUI.getByLabel('触发次数').selectOption(policy);
  await consoleUI.getByLabel('重试策略').selectOption(retry);
  await consoleUI
    .getByRole('button', {
      name: mode === 'preview' ? '直接预览 · 不提交数据' : '设置下一次操作场景',
      exact: true,
    })
    .click();
}
async function resetAll() {
  await consoleOpen();
  await consoleUI
    .getByRole('button', { name: '重置整个 Demo', exact: true })
    .click();
  await page.waitForTimeout(1300);
}
async function storage(key) {
  return page.evaluate(
    (key) => localStorage.getItem('New_FD04_demo_v1:' + key),
    key,
  );
}
async function failVisible(name) {
  await dialog.getByRole('heading', { name, exact: true }).waitFor();
}
async function dismiss() {
  if (await dialog.isVisible())
    await dialog
      .getByRole('button', { name: '取消，返回当前页面', exact: true })
      .click();
}
try {
  await page.goto(url);
  await page.waitForTimeout(1800);
  await check('normal device list boots without injected errors', async () => {
    assert.ok(await phone.getByText('FD04', { exact: true }).isVisible());
    assert.equal(await dialog.count(), 0);
  });
  await check(
    'one-shot failure waits and remains active while console hidden; retry recovers',
    async () => {
      await select('devices.failure');
      await consoleUI.getByRole('button', { name: '隐藏控制台' }).click();
      await phone.getByRole('button', { name: '重新加载设备' }).click();
      await dialog.getByRole('progressbar').waitFor();
      assert.equal(
        await phone.getByText('FD04', { exact: true }).isVisible(),
        false,
      );
      await failVisible('设备列表加载失败');
      await consoleOpen();
      assert.ok(
        await consoleUI.getByText('无待触发场景 · 当前场景已触发').isVisible(),
      );
      await dialog.getByRole('button', { name: '重试', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
      assert.ok(await phone.getByText('FD04', { exact: true }).isVisible());
    },
  );
  await check(
    'every local scene supports non-committing direct preview',
    async () => {
      const cases = [
        'devices.loading',
        'devices.empty',
        'devices.failure',
        'preparation.water',
        'preparation.powder',
        'preparation.timeout',
        'capture.permission',
        'capture.upload',
        'capture.recognition',
        'capture.loading',
        'formula.save',
        'formula.validation',
        'sync.failure',
        'sync.timeout',
        'cleaning.interrupt',
        'cleaning.timeout',
        'feeding.empty',
        'feeding.load',
        'feeding.save',
      ];
      for (const scene of cases) {
        await select(scene, { mode: 'preview' });
        await dialog.waitFor();
        assert.equal(await storage('feeding_history'), null);
        assert.equal(await storage('feeding_records'), null);
        if (scene === 'preparation.water')
          await page.screenshot({ path: 'test-results/water-error.png' });
        await consoleUI
          .getByRole('button', { name: '恢复正常', exact: true })
          .click();
        assert.equal(await dialog.count(), 0);
      }
    },
  );
  await resetAll();
  await check(
    'formula save failure keeps draft, retries can continue failing, then succeeds once',
    async () => {
      await go('/formula-edit?mode=manual');
      const brand = phone.locator('input').first();
      await brand.fill('Test Brand');
      await select('formula.save', { retry: 'failure' });
      await phone
        .getByRole('button', { name: /确认|保存/ })
        .last()
        .click();
      await failVisible('配比保存失败');
      assert.equal(await storage('formula_profile'), null);
      await dialog.getByRole('button', { name: '重试', exact: true }).click();
      await failVisible('配比保存失败');
      assert.equal(await storage('formula_profile'), null);
      await dialog
        .getByRole('button', { name: '返回修改输入', exact: true })
        .click();
      assert.equal(await brand.inputValue(), 'Test Brand');
      await consoleUI
        .getByRole('button', { name: '恢复正常', exact: true })
        .click();
      await phone
        .getByRole('button', { name: /确认|保存/ })
        .last()
        .click();
      await page.waitForURL('**/#/formula-ratio');
      assert.equal(
        JSON.parse(await storage('formula_profile')).brand,
        'Test Brand',
      );
      assert.ok(
        await phone
          .getByText(/Test Brand/)
          .first()
          .isVisible(),
      );
    },
  );
  await check(
    'preparation failure creates no successful result; retry commits once and preserves selection',
    async () => {
      await go('/device');
      await select('preparation.water');
      const start = phone.getByRole('button', { name: '开始', exact: true });
      await start.first().click();
      await failVisible('水量不足');
      assert.equal(await storage('feeding_history'), null);
      assert.equal(await storage('mixing_chamber_count'), null);
      await dialog
        .getByRole('button', { name: '已补水，重新开始', exact: true })
        .click();
      await page.waitForURL('**/#/formula-result');
      assert.equal(JSON.parse(await storage('feeding_history')).length, 1);
      assert.equal(await storage('mixing_chamber_count'), '1');
    },
  );
  await check(
    'missing baby prompt and profile creation remain usable',
    async () => {
      await phone
        .getByRole('button', { name: /知道了|记录|确认/ })
        .first()
        .click();
      await page.waitForURL('**/#/no-baby');
      await phone
        .getByRole('button', { name: '添加宝宝', exact: true })
        .click();
      await page.waitForURL('**/#/add-baby');
      await phone.getByLabel('宝宝昵称').fill('Demo Baby');
      await phone.getByLabel('出生日期').fill('2026-01-01');
      await phone.getByRole('button', { name: '保存', exact: true }).click();
      await page.waitForURL('**/#/device');
      assert.ok(await storage('fd04_baby_profile'));
    },
  );
  await check(
    'camera permission and upload failure stop navigation; recover via manual or retry',
    async () => {
      await go('/capture-formula-step2');
      await select('capture.permission');
      await phone
        .getByRole('button', { name: /拍摄|拍照/ })
        .last()
        .click();
      await failVisible('相机权限拒绝（模拟）');
      await dialog.getByRole('button', { name: '改为手动输入' }).click();
      await page.waitForURL('**/#/formula-edit?mode=manual');
      await go('/capture-formula-step2');
      await select('capture.upload');
      await phone
        .getByRole('button', { name: /拍摄|拍照/ })
        .last()
        .click();
      await failVisible('照片上传失败');
      await dialog.getByRole('button', { name: '重试', exact: true }).click();
      await page.waitForURL('**/#/formula-edit?mode=recognition');
    },
  );
  await check(
    'feeding save failure keeps remarks and saves exactly one record after retry',
    async () => {
      await go('/feeding-stats/add-record');
      await phone.locator('textarea').fill('preserved remark');
      await select('feeding.save');
      await phone.getByRole('button', { name: /保存记录/ }).click();
      await failVisible('喂养记录保存失败');
      assert.equal(await storage('feeding_records'), null);
      await dialog.getByRole('button', { name: '返回修改输入' }).click();
      assert.equal(
        await phone.locator('textarea').inputValue(),
        'preserved remark',
      );
      await phone.getByRole('button', { name: /保存记录/ }).click();
      await page.waitForURL('**/#/feeding-stats');
      await page.waitForTimeout(1200);
      assert.equal(JSON.parse(await storage('feeding_records')).length, 1);
    },
  );
  await check(
    'inline feeding sheet exposes save scenes and preserves draft on failure',
    async () => {
      await go('/feeding-stats');
      await page.waitForTimeout(1200);
      await phone
        .getByRole('button', { name: '添加喂养记录', exact: true })
        .click();
      await phone.locator('textarea').fill('inline draft');
      await select('feeding.save');
      const before = await storage('feeding_records');
      await phone
        .getByRole('button', { name: '保存记录', exact: true })
        .click();
      await failVisible('喂养记录保存失败');
      assert.equal(await storage('feeding_records'), before);
      await dialog
        .getByRole('button', { name: '返回修改输入', exact: true })
        .click();
      assert.equal(
        await phone.locator('textarea').inputValue(),
        'inline draft',
      );
    },
  );
  await check(
    'sync failure preserves selected ratio, retry commits and edit returns to drawer',
    async () => {
      await go('/formula-ratio-sync');
      await page
        .getByRole('button', { name: '选择配比同步', exact: true })
        .click();
      await page.getByRole('button', { name: /Kabrita/ }).click();
      const before = await storage('formula_profiles');
      await select('sync.failure');
      await page.getByRole('button', { name: '确认同步', exact: true }).click();
      await failVisible('配比同步失败');
      assert.equal(await storage('formula_profiles'), before);
      await page.screenshot({ path: 'test-results/sync-error.png' });
      await dialog.getByRole('button', { name: '重试', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
      await page.waitForTimeout(300);
      assert.equal(
        JSON.parse(await storage('formula_profiles')).find(
          (x) => x.id === 'kabrita',
        ).powderPerScoop,
        9.5,
      );
      await go('/');
      await page.waitForTimeout(1100);
      await go('/formula-ratio-sync');
      await page
        .getByRole('button', { name: '选择配比同步', exact: true })
        .click();
      await page.getByRole('button', { name: '新增', exact: true }).click();
      await page.waitForURL('**/#/formula-edit?mode=manual');
      await phone.getByRole('button').first().click();
      await page.waitForURL('**/#/formula-ratio-sync');
      await page.getByText('选择要同步的配比', { exact: true }).waitFor();
    },
  );
  await check(
    'cleaning interrupted start retries into original two-stage normal cleaning; reset stops timer',
    async () => {
      await go('/device-cleaning');
      await phone.getByRole('button', { name: /除垢/ }).first().click();
      await phone.getByRole('button', { name: '继续', exact: true }).click();
      await phone.getByText('准备除垢溶液', { exact: true }).waitFor();
      await page.waitForTimeout(350);
      await phone.getByRole('button', { name: '继续', exact: true }).click();
      await select('cleaning.interrupt');
      await phone
        .getByRole('button', { name: '开始清洁', exact: true })
        .click();
      await failVisible('清洁操作中断（模拟）');
      assert.equal(await storage('cleaning_complete'), null);
      await dialog
        .getByRole('button', { name: '重新检查并开始', exact: true })
        .click();
      await dialog.waitFor({ state: 'hidden' });
      await page.waitForTimeout(7300);
      await phone.getByRole('button', { name: '继续', exact: true }).click();
      await phone
        .getByRole('button', { name: '开始清洁', exact: true })
        .click();
      await page.waitForTimeout(5300);
      await phone.getByText('清洁完成', { exact: true }).first().waitFor();
      await consoleUI.getByRole('button', { name: '重置当前环节' }).click();
      await phone.getByRole('button', { name: /除垢/ }).first().click();
      await phone.getByRole('button', { name: '继续', exact: true }).click();
      await phone.getByText('准备除垢溶液', { exact: true }).waitFor();
      await page.waitForTimeout(350);
      await phone.getByRole('button', { name: '继续', exact: true }).click();
      await phone
        .getByRole('button', { name: '开始清洁', exact: true })
        .click();
      await dialog.waitFor({ state: 'hidden' });
      await consoleUI.getByRole('button', { name: '重置当前环节' }).click();
      await page.waitForTimeout(7400);
      await phone.getByRole('button', { name: /除垢/ }).first().waitFor();
    },
  );
  await check(
    'reset during preparation cancels pending writes and returns to initial stage',
    async () => {
      await go('/device');
      const before = await storage('feeding_history');
      await phone
        .getByRole('button', { name: '开始', exact: true })
        .first()
        .click();
      await dialog.waitFor();
      await consoleUI.getByRole('button', { name: '重置当前环节' }).click();
      await page.waitForTimeout(4800);
      assert.equal(await storage('feeding_history'), before);
      assert.equal(await storage('mixing_chamber_count'), null);
      assert.ok(page.url().endsWith('#/device'));
    },
  );
  await check(
    'global environment has priority and retry / restore does not auto-replay',
    async () => {
      await select('global.offline', {
        policy: 'persistent',
        retry: 'failure',
      });
      await consoleUI
        .getByLabel('流程环节', { exact: true })
        .selectOption('formula');
      assert.equal(
        await consoleUI
          .getByRole('button', { name: '设置下一次操作场景', exact: true })
          .isEnabled(),
        false,
      );
      await go('/feeding-stats/add-record');
      await phone.getByRole('button', { name: /保存记录/ }).click();
      await failVisible('断网（模拟）');
      const before = await storage('feeding_records');
      await consoleUI
        .getByRole('button', { name: '恢复正常', exact: true })
        .click();
      await page.waitForTimeout(2000);
      assert.equal(await storage('feeding_records'), before);
    },
  );
  await check(
    'global direct preview and weak-network wait can be cancelled without writes',
    async () => {
      await select('global.offline', { mode: 'preview' });
      await failVisible('断网（模拟）');
      await consoleUI
        .getByRole('button', { name: '恢复正常', exact: true })
        .click();
      await go('/feeding-stats/add-record');
      const before = await storage('feeding_records');
      await select('global.weak');
      await phone
        .getByRole('button', { name: '保存记录', exact: true })
        .click();
      await dialog.getByRole('progressbar').waitFor();
      await page.waitForTimeout(1000);
      assert.equal(await storage('feeding_records'), before);
      await dialog.getByRole('button', { name: '取消等待' }).click();
      await page.waitForTimeout(4500);
      assert.equal(await storage('feeding_records'), before);
    },
  );
  await check(
    'navigation invalidates old request; reload defaults normal; original storage is untouched',
    async () => {
      await go('/formula-edit?mode=recognition');
      await phone
        .getByRole('button', { name: /确认|保存/ })
        .last()
        .click();
      await go('/');
      await page.waitForTimeout(2000);
      assert.ok(page.url().endsWith('#/'));
      await page.evaluate(() =>
        localStorage.setItem('formula_profile', 'original-sentinel'),
      );
      await select('devices.failure', { policy: 'persistent' });
      await page.reload();
      await page.waitForTimeout(1800);
      assert.equal(
        await page.evaluate(() => localStorage.getItem('formula_profile')),
        'original-sentinel',
      );
      assert.ok(
        await consoleUI.getByText('无待触发场景 · 正常模式').isVisible(),
      );
      await resetAll();
      assert.equal(await storage('formula_profile'), null);
      assert.equal(
        await page.evaluate(() => localStorage.getItem('formula_profile')),
        'original-sentinel',
      );
    },
  );
  await check(
    'normal first-use photo setup and preparation complete end to end',
    async () => {
      await resetAll();
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
        .getByRole('button', { name: /确认|保存/ })
        .last()
        .click();
      await page.waitForURL('**/#/device');
      assert.equal(await storage('formula_profile_configured'), 'true');
      await phone
        .getByRole('button', { name: '开始', exact: true })
        .first()
        .click();
      await page.waitForURL('**/#/formula-result');
      assert.equal(JSON.parse(await storage('feeding_history')).length, 1);
      await resetAll();
    },
  );
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
  await check(
    'mobile floating entry, drawer and hidden armed scenario',
    async () => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.reload();
      await page.waitForTimeout(1500);
      assert.equal(await consoleUI.isVisible(), false);
      await consoleOpen();
      await select('devices.empty');
      await page.screenshot({ path: 'test-results/mobile-drawer.png' });
      await consoleUI.getByRole('button', { name: '隐藏控制台' }).click();
      await phone.getByRole('button', { name: '重新加载设备' }).click();
      await failVisible('没有可用设备');
      await page.screenshot({ path: 'test-results/mobile-error.png' });
      await dialog.getByRole('button', { name: '重新查找' }).click();
      await dialog.waitFor({ state: 'hidden' });
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
  console.log((await page.locator('body').innerText()).slice(-6500));
  throw e;
} finally {
  await browser.close();
}
