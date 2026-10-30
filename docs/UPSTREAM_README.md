# FD06 Formula Maker Demo

> **接手 / 部署请先看 [HANDOVER.md](./HANDOVER.md)**：仓库分支拓扑、构建部署四步、本轮改动记录、已知限制与踩坑清单都在里面。
> 注意：本仓库 `main` 为源码、`gh-pages` 为构建产物并作为 GitHub Pages 源；线上演示地址 <https://lxz9512-prog.github.io/FD04-Formula-Maker/>。

## 项目简介

FD06 Formula Maker Demo 是一套智能调奶器前端交互原型，用于产品方案演示、页面评审和交互流程验证。

项目使用浏览器本地数据模拟业务状态，不依赖真实设备或正式服务端接口。

## Demo 内容

本项目包含设备控制、粉水配比、拍摄识别、喂养统计、设备设置及异常状态等演示页面。

完整页面与路由以 `client/src/app.tsx` 和 `client/src/pages/` 为准。

## 页面框架

桌面端采用三栏结构：

| 区域 | 说明 |
| --- | --- |
| 左侧 | Demo 页面目录 |
| 中间 | 手机设备模拟区域 |
| 右侧 | 当前页面的交互说明 |

中间区域使用固定尺寸手机框展示 App 页面。左右侧栏支持收起，并包含基础响应式处理，保证平板和小屏设备可以查看。

## 视觉风格

- 暖白、浅米色和淡黄色背景
- 棕色作为主要品牌色
- 白色大圆角卡片
- 柔和阴影和轻量新拟态效果
- 使用状态色区分设备、提醒、异常及完成状态
- 默认使用系统圆体和中文系统字体

主题配置集中在：

```text
client/src/tailwind-theme.css
```

## 全局 Demo 能力

手机模拟框右侧提供以下全局控制：

- 中英文切换
- `ml / oz` 单位切换
- Demo 状态重置
- 交互说明连接线开关

语言、单位和部分 Demo 状态保存在浏览器本地。Reset 用于恢复首次使用状态及部分设备演示数据，不会重置语言和单位设置。

右侧交互说明区域会根据当前页面展示相应说明。连接线仅用于产品演示，不属于正式产品功能。

## 状态与数据

Demo 使用 `localStorage` 保存语言、单位、设备模拟数据、配方信息、喂养记录及页面演示状态。

这些数据仅保存在当前浏览器中，不会同步到服务端。接入正式项目时，应替换为目标项目的接口或状态管理方案。

## 技术结构

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS 4
- Framer Motion
- Lucide React
- ECharts
- localStorage

项目使用 HashRouter，方便部署到静态服务器或 GitHub Pages。

## 运行方式

环境要求：

```text
Node.js >= 22
npm >= 10
```

安装依赖：

```bash
npm install
```

启动前端：

```bash
npm run dev:client
```

生产构建：

```bash
npm run build:client
```

## 导入其他项目

建议迁移以下前端目录：

```text
client/src/pages/
client/src/components/
client/src/contexts/
client/src/hooks/
client/src/i18n/
client/src/assets/
client/src/tailwind-theme.css
client/src/index.css
```

导入时注意：

1. 保留语言和单位的全局 Provider。
2. 保留 HashRouter，或根据目标项目调整路由方式。
3. 保持路径别名，或统一替换为目标项目的路径结构。
4. 同步迁移主题变量和手机框组件。
5. 将本地模拟数据替换为目标项目的接口或状态管理方案。
6. 产品图片已经本地化，部分外部占位资源可根据需要继续本地化。
7. 仅迁移前端代码，服务端和原始迁移包不属于 Demo 必需内容。
