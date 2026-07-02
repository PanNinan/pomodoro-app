# 🍅 番茄时钟

一款简洁高效的番茄工作法计时器，支持 Web 浏览器和桌面端（Windows/macOS/Linux）。

## ✨ 功能特性

- ⏱️ **番茄计时器** — 25 分钟专注 + 5/15 分钟休息循环，支持自定义时长
- ✅ **任务管理** — 创建、编辑、删除任务，与番茄关联追踪进度
- 📊 **数据统计** — 专注趋势图、打卡日历、标签分布（ECharts）
- 🔔 **系统通知** — 浏览器 Notification / Tauri 原生通知
- ⌨️ **全局快捷键** — `Ctrl+Shift+P` 开始/暂停，`Ctrl+Shift+R` 重置
- 🖥️ **系统托盘** — 最小化到托盘，快速操作菜单
- 🌙 **深色/浅色主题** — 跟随系统或手动切换
- 💾 **本地持久化** — IndexedDB（Web）/ 数据随应用存储（桌面端）

## 🛠️ 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Vue 3 + Composition API + TypeScript |
| 构建 | Vite 6 |
| UI | Naive UI |
| 状态 | Pinia |
| 图表 | ECharts (vue-echarts) |
| 存储 | Dexie.js (IndexedDB) |
| 桌面 | Tauri v2 (Rust) |

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- Rust >= 1.77（桌面端构建需要）
- Windows: WebView2（Win10/11 自带）

### 开发

```bash
# 安装依赖
npm install

# Web 开发模式
npm run dev          # http://localhost:3000

# 桌面端开发模式
npx tauri dev
```

### 构建

```bash
# Web 生产构建
npm run build

# 桌面端构建（生成 .exe / .msi）
npx tauri build
```

构建产物位于 `src-tauri/target/release/`。

## 📁 项目结构

```
pomodoro-app/
├── src/
│   ├── composables/         # 核心逻辑
│   │   ├── useTimer.ts          计时器状态机
│   │   ├── useNotification.ts   通知（浏览器/Tauri 自适应）
│   │   ├── useGlobalShortcut.ts 全局快捷键
│   │   └── useTheme.ts          主题管理
│   ├── stores/              # Pinia 状态管理
│   │   ├── task.ts              任务 Store
│   │   └── stats.ts             统计 Store
│   ├── storage/             # 持久化层
│   │   ├── adapter.ts           接口定义
│   │   └── indexeddb.ts         IndexedDB 实现
│   ├── components/          # UI 组件
│   │   ├── timer/               计时器组件
│   │   └── common/              布局组件
│   ├── views/               # 页面视图
│   │   ├── TimerView.vue        主计时器
│   │   ├── TaskView.vue         任务管理
│   │   ├── StatsView.vue        数据统计
│   │   └── SettingsView.vue     设置
│   ├── types/               # TypeScript 类型
│   ├── utils/               # 工具函数
│   └── constants/           # 常量配置
├── src-tauri/               # Tauri 桌面端
│   ├── src/lib.rs               Rust 入口（托盘、菜单）
│   ├── capabilities/            权限配置
│   └── tauri.conf.json          Tauri 配置
└── package.json
```

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+P` | 开始/暂停计时 |
| `Ctrl+Shift+R` | 重置计时器 |

## 📄 License

MIT
