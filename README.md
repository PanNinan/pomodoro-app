# 🍅 Pomodoro — 番茄时钟

一款简洁高效的番茄工作法计时器，支持 Web 浏览器和桌面端（Windows / macOS / Linux）。

![Vue 3](https://img.shields.io/badge/Vue-3-42b883)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tauri v2](https://img.shields.io/badge/Tauri-v2-ffc131)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ 功能特性

- ⏱️ **番茄计时器** — 25 分钟专注 + 5/15 分钟休息循环，支持自定义时长
- ✅ **任务管理** — 创建、编辑、删除任务，与番茄关联，完成后自动标记
- 📊 **数据统计** — 专注趋势图、本周/本月统计、打卡日历热力图、标签分布饼图
- 🔔 **智能通知** — 番茄完成提醒，任务完成时显示任务名称
- ⌨️ **全局快捷键** — `Ctrl+Shift+P` 开始/暂停，`Ctrl+Shift+R` 重置
- 🖥️ **系统托盘** — 最小化到托盘，右键菜单快捷操作
- 🌙 **深色/浅色主题** — 跟随系统或手动切换
- 💾 **双存储引擎** — IndexedDB（Web）/ SQLite（桌面端），StorageAdapter 统一抽象
- 🎯 **标签系统** — 任务标签自动关联番茄记录，统计维度分析

---

## 🛠️ 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Vue 3 + Composition API + TypeScript |
| 构建 | Vite 6 |
| UI | Naive UI（按需引入） |
| 状态 | Pinia |
| 图表 | ECharts (vue-echarts) |
| 存储 | Dexie.js (IndexedDB) / @tauri-apps/plugin-sql (SQLite) |
| 桌面 | Tauri v2 (Rust) |
| 测试 | Vitest + happy-dom |
| Lint | ESLint 9 + typescript-eslint + eslint-plugin-vue |

---

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- Rust >= 1.77（桌面端构建需要）
- Windows: WebView2（Win10/11 自带）

### 安装

```bash
git clone https://github.com/PanNinan/pomodoro-app.git
cd pomodoro-app
npm install
```

### 开发

```bash
# Web 开发模式
npm run dev            # http://localhost:3000

# 桌面端开发模式（需要 Rust 环境）
npx tauri dev
```

### 构建

```bash
# Web 生产构建
npm run build

# 桌面端构建（生成安装包）
npx tauri build
```

桌面端构建产物位于 `src-tauri/target/release/bundle/`：

| 格式 | 文件 |
|------|------|
| MSI | `msi/Pomodoro_x.x.x_x64_en-US.msi` |
| NSIS | `nsis/Pomodoro_x.x.x_x64-setup.exe` |

### 测试

```bash
npm run test:unit      # 运行单元测试
npx vitest run         # 同上（单次运行）
```

---

## 📁 项目结构

```
pomodoro-app/
├── src/
│   ├── composables/             # 组合式函数（核心业务逻辑）
│   │   ├── useTimer.ts              计时器状态机（模块级单例 computed）
│   │   ├── usePomodoroComplete.ts   番茄完成回调（记录 + 任务关联 + 通知）
│   │   ├── useNotification.ts       系统通知（浏览器 / Tauri 自适应）
│   │   ├── useGlobalShortcut.ts     全局快捷键
│   │   └── useTheme.ts              主题管理（深色 / 浅色 / 跟随系统）
│   ├── stores/                  # Pinia Store
│   │   ├── task.ts                  任务 CRUD + 番茄关联 + 自动完成
│   │   └── stats.ts                 番茄记录 + 统计（趋势/周/月/标签/热力图）
│   ├── storage/                 # 数据持久化层
│   │   ├── adapter.ts               StorageAdapter 接口
│   │   ├── index.ts                 平台自动切换（Proxy 懒代理）
│   │   ├── indexeddb.ts             IndexedDB 实现（Dexie.js）
│   │   └── sqlite.ts                SQLite 实现（Tauri Plugin）
│   ├── components/
│   │   ├── timer/                   计时器组件（Ring / Display / Controls）
│   │   ├── tasks/                   任务组件（Item / Form）
│   │   ├── stats/                   统计组件（Summary / Trend / Monthly / Calendar / TagPie）
│   │   └── common/                  通用组件（AppLayout / SideNav / EmptyChart）
│   ├── views/                   # 页面视图
│   │   ├── TimerView.vue            主计时器
│   │   ├── TaskView.vue             任务管理（折叠分组 + 编辑）
│   │   ├── StatsView.vue            数据统计（4 维度 Tab + 打卡日历）
│   │   └── SettingsView.vue         设置（时长 / 自动化 / 主题 / 通知 / 数据管理）
│   ├── __tests__/               # 单元测试
│   │   ├── time.test.ts             时间格式化
│   │   ├── uuid.test.ts             UUID 生成
│   │   ├── date.test.ts             日期工具
│   │   └── storage.test.ts          StorageAdapter 接口契约
│   ├── types/index.ts           # TypeScript 类型定义
│   ├── utils/                   # 工具函数
│   └── constants/defaults.ts    # 默认配置
├── src-tauri/                   # Tauri 桌面端
│   ├── src/lib.rs                   Rust 入口（托盘 / 菜单 / 插件注册）
│   ├── capabilities/                权限配置
│   ├── tauri.conf.json              Tauri 配置
│   └── Cargo.toml                   Rust 依赖
├── .github/workflows/
│   ├── ci.yml                       PR / Push 检查（Lint + TypeCheck + 测试）
│   └── release.yml                  Tag 推送自动构建（Windows / macOS / Linux）
└── docs/
    └── 番茄时钟_架构设计与实施计划.md
```

---

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+Shift+P` | 开始 / 暂停计时 |
| `Ctrl+Shift+R` | 重置计时器 |

---

## 🏗️ 架构设计

```
+---------------------------------------------------+
|              Presentation Layer                    |
|  TimerView / TaskView / StatsView / SettingsView  |
|                       |                            |
|            Composables Layer                      |
|  useTimer / usePomodoroComplete / useTheme        |
+-----------------------+---------------------------+
                        |
+-----------------------+---------------------------+
|          Business Logic (Pinia Stores)            |
|               taskStore / statsStore              |
+-----------------------+---------------------------+
                        |
+-----------------------+---------------------------+
|         StorageAdapter (统一接口)                  |
|   +-------------------+---------------------+    |
|   | IndexedDB (浏览器) | SQLite (Tauri桌面)   |    |
|   +-------------------+---------------------+    |
+---------------------------------------------------+
```

**数据流：** 组件 → Composable → Pinia Store → StorageAdapter → IndexedDB / SQLite

---

## 📄 License

[MIT](./LICENSE)
