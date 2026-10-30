# 交付验证记录

## 验证环境

- 基于上游 `main`：`c8eaa6554fcade5b0b740771de2c630667cb66aa`。
- 本副本独立依赖安装；Node.js 22，npm 10，macOS arm64。
- 浏览器：独立无头 Chromium；桌面 1512×1000、移动端 390×844。
- 浏览器验收屏蔽 HTTPS 外部资源，验证主要本地流程不依赖真实后端或设备。

## 执行结果

| 检查 | 结果 |
| --- | --- |
| 独立目录 `npm ci --ignore-scripts` | 通过；重新安装验证锁文件完整性与原生构建依赖 |
| `npm run typecheck` | 通过 |
| `npm test` | 53 项通过，0 失败 |
| `npm run build` | 通过，相对路径静态产物 |
| `npm run test:e2e` | 17 组通过，0 页面运行异常 |
| `git diff --check` | 通过 |

浏览器覆盖：所有 19 个局部场景的无提交直接预览、2 个全局场景、隐藏控制台后真实操作触发、一次消费、持续失败、重试成功、草稿保留、成功只提交一次、配比同步返回上下文、两阶段清洁、请求 / 计时器取消、各级重置、刷新正常模式、原 Demo 存储隔离、移动抽屉及恢复按钮可点击。另验证首次配比配置 → 拍摄正面 → 拍摄背面 → 识别保存 → 调奶完成的正常链路，以及宝宝资料新增。

原生系统权限、设备及网络状态均为模拟；未执行真实硬件 / 真实 OCR 验证。更多边界见 [IMPLEMENTATION.md](IMPLEMENTATION.md)。

## 已知工程告警

- 上游依赖树保留了未启用的平台 / 后端模板；独立安装审计报告 92 项告警（19 low、52 moderate、20 high、1 critical）。本次没有使用 `audit fix --force` 扩大改造范围。请勿将该 Demo 当生产服务或对外后台。
- 保留原应用资源与依赖，生产 JS 包约 1.9 MB（gzip 约 618 KB），Vite 有大包告警；未在本次增加拆包工程。
- 部分原有奶粉照片为远端资源，真正离线时可能不可见；异常注入不依赖它们。

## 复验命令

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run preview
# 另一个终端
npx playwright install chromium
npm run test:e2e
```

浏览器报告与截图输出在本地 `test-results/`（不提交 Git）。本地 HTTP 预览以 README 为准；macOS 受限自动化环境下，浏览器应在具有桌面服务访问权限的执行上下文启动。
