# OpenCaption

A translucent, always-on-top overlay that helps you learn English while watching shows. Capture subtitles from any video player, get AI-powered line-by-line explanations and difficult word breakdowns — all without leaving your screen.

## Features

- **Always-on-top overlay** — floats above any player, including full-screen
- **Subtitle capture** — select a screen region once, then capture subtitles anytime with one click or `⌘⇧D`
- **AI-powered analysis** — sends the subtitle screenshot to OpenAI's vision model, returns:
  - Full transcription of the subtitle
  - Line-by-line meaning explanation (tone, subtext, cultural references, slang)
  - Difficult word list with native-language definitions and example sentences
- **Built-in notes** — jot down thoughts, quotes, plot points, or vocab with timestamps
- **Watch timer** — track how far into the episode you are; timestamps auto-attach to notes
- **Export to Markdown** — save all your notes as a `.md` file
- **Adjustable opacity** — tune the overlay transparency in real time

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- An OpenAI API key (`sk-...`)

### Install & Run

```bash
git clone https://github.com/JudyZhu45/open-caption.git
cd open-caption
npm install
npm start
```

### Download

You can also download the pre-built macOS app from [Releases](https://github.com/JudyZhu45/open-caption/releases).

### First-time Setup

1. Click **⚙** (top right) → enter your **OpenAI API Key**. It is stored locally on your machine only — never uploaded.
2. Click **"框选字幕区域"** → drag a rectangle over where subtitles appear on screen. This only needs to be done once.
3. On macOS, grant **Screen Recording** permission: System Settings → Privacy & Security → Screen Recording → enable Electron, then restart the app.

## Usage

| Action | How |
|---|---|
| Capture & analyze subtitle | Click **📸 抓字幕识别难词** or press `⌘⇧D` (Win/Linux: `Ctrl+Shift+D`) |
| Save analyzed words to notes | Click **＋ 把这些词存进笔记** |
| Quick note | Type in the text box, pick a type, press `⌘Enter` |
| Start/pause timer | Click ▶ / ⏸ next to the timer |
| Adjust transparency | Drag the opacity slider |
| Export notes | Click **导出全部笔记 (.md)** at the bottom |

## Tech Stack

- **Electron** — cross-platform desktop shell
- **OpenAI Vision API** (`gpt-4o-mini` / `gpt-4o`) — subtitle OCR + language analysis
- Vanilla HTML/CSS/JS — no framework, minimal dependencies

## Limitations

- **No real-time audio transcription.** This app captures subtitle images, not audio. If your video has no subtitles, it won't help.
- **Each capture calls the OpenAI API** and costs a small amount. `gpt-4o-mini` is cheap but not free.
- **Notes are in-memory only** — they are lost when the app closes.

## License

MIT

---

# OpenCaption（中文说明）

看剧学英语的半透明置顶悬浮窗。框选字幕区域后一键截图，AI 自动分析台词含义、提取难词释义，笔记随手记。

## 功能

- **半透明置顶悬浮窗** — 浮在任何播放器上方，包括全屏模式
- **字幕截取** — 框选一次字幕区域，之后一键截图或按 `⌘⇧D` 快速截取
- **AI 智能分析** — 截图发送至 OpenAI 视觉模型，返回：
  - 字幕原文转写
  - 整句台词的中文含义解析（语气、潜台词、文化背景、俚语等）
  - 难词列表，附中文释义和例句
- **内置笔记** — 支持随手记、金句、剧情、生词四种类型，自动带时间戳
- **看剧计时器** — 记录观看进度，笔记自动关联时间点
- **导出 Markdown** — 一键导出全部笔记为 `.md` 文件
- **透明度可调** — 实时拖动滑条调整窗口透明度

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org) 18+
- OpenAI API Key（`sk-...` 开头）

### 安装运行

```bash
git clone https://github.com/JudyZhu45/open-caption.git
cd open-caption
npm install
npm start
```

### 直接下载

也可以从 [Releases](https://github.com/JudyZhu45/open-caption/releases) 页面下载打包好的 macOS 应用。

### 首次使用

1. 点右上角 **⚙** → 填入你的 **OpenAI API Key**。Key 仅保存在本机，绝不上传。
2. 点 **「框选字幕区域」** → 在弹出的全屏遮罩上拖框选定字幕位置（只需一次）。
3. macOS 需授权 **屏幕录制** 权限：系统设置 → 隐私与安全性 → 屏幕录制 → 勾选 Electron，然后重启应用。

## 使用方法

| 操作 | 方式 |
|---|---|
| 抓字幕分析 | 点击 **📸 抓字幕识别难词** 或按 `⌘⇧D`（Win/Linux: `Ctrl+Shift+D`） |
| 存入笔记 | 点击 **＋ 把这些词存进笔记** |
| 随手记 | 输入框写内容，选类型，按 `⌘回车` 保存 |
| 计时器 | 点 ▶ 开始 / ⏸ 暂停 |
| 调透明度 | 拖动顶部滑条 |
| 导出笔记 | 点击底部 **导出全部笔记 (.md)** |

## 技术栈

- **Electron** — 跨平台桌面框架
- **OpenAI Vision API**（`gpt-4o-mini` / `gpt-4o`）— 字幕 OCR + 语言分析
- 原生 HTML/CSS/JS — 无框架依赖，极简实现

## 已知限制

- **没有实时音频转录。** 依赖画面中的字幕截图，无字幕的视频无法使用。
- **每次识别调用 OpenAI API**，按量计费。`gpt-4o-mini` 很便宜但不免费。
- **笔记仅存在内存中**，关闭应用后丢失。

## 许可证

MIT
