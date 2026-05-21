# OpenCaption

A translucent, always-on-top overlay that helps you learn English while watching shows. Capture subtitles from any video player, get AI-powered line-by-line explanations and difficult word breakdowns — all without leaving your screen.

看剧学英语的半透明置顶悬浮窗。框选字幕区域后一键截图，AI 自动分析台词含义、提取难词释义，笔记随手记。

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

### First-time Setup

1. Click **⚙** (top right) → enter your **OpenAI API Key**. It is stored locally on your machine only — never uploaded.
2. Click **"框选字幕区域"** → drag a rectangle over where subtitles appear on screen. This only needs to be done once.
3. On macOS, grant **Screen Recording** permission: System Settings → Privacy & Security → Screen Recording → enable Electron, then restart the app.

## Usage

| Action | How |
|---|---|
| Capture & analyze subtitle | Click **📸 抓字幕识别难词** or press `⌘⇧D` (Windows/Linux: `Ctrl+Shift+D`) |
| Save analyzed words to notes | Click **"＋ 把这些词存进笔记"** |
| Quick note | Type in the text box, pick a type (随手记 / 金句 / 剧情 / 生词), press `⌘Enter` |
| Start/pause timer | Click ▶ / ⏸ next to the timer |
| Adjust transparency | Drag the opacity slider |
| Export notes | Click **"导出全部笔记 (.md)"** at the bottom |

## Tech Stack

- **Electron** — cross-platform desktop shell
- **OpenAI Vision API** (`gpt-4o-mini` / `gpt-4o`) — subtitle OCR + language analysis
- Vanilla HTML/CSS/JS — no framework, minimal dependencies

## Limitations

- **No real-time audio transcription.** This app captures subtitle images, not audio. If your video has no subtitles, it won't help.
- **Each capture calls the OpenAI API** and costs a small amount. `gpt-4o-mini` is cheap but not free.
- **Notes are in-memory only** — they are lost when the app closes. Persistence can be added (see below).

## Adding Note Persistence

Add two IPC handlers in `main.js` to read/write a `notes.json` file under `app.getPath('userData')`, mirroring the existing `loadSettings` / `saveSettings` pattern. Then call save after each note add/delete and load on init in `renderer.js`.

## License

MIT
