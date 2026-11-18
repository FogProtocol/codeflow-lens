# ⚡ CodeFlow Lens

<div align="center">

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Netlify](https://img.shields.io/badge/Netlify-Deploy_Ready-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://www.netlify.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Understand the actual flow, meaning, and architectural cause of any codebase — line-by-line, across resizable side-by-side frames.**

[Features](#-key-features) • [How It Works](#-how-it-works) • [Project Structure](#-project-structure) • [Quick Start](#-quick-start) • [Deployment](#-deployment-to-netlify) • [License](#-license)

</div>

---

## 📌 Overview

> *"Do not commit a single line of code before understanding its actual flow, meaning, and architectural cause."*

When navigating complex open-source repositories (such as `cve-bin-tool`, `FastAPI`, `React`, or systems codebases), maintainers reject PRs when contributors change code without understanding **why the original maintainers structured it in that specific way**.

**CodeFlow Lens** is an active comprehension workbench built specifically for developers, open-source contributors, and auditors. It takes any code file (or up to 3 files simultaneously), parses its execution flow, and pairs each statement with its plain-English meaning and architectural rationale — without generic boilerplate or walls of disconnected chat text.

---

## 🚀 Key Features

* **Exact Line-by-Line Flow & Meaning:**
  Maps every statement directly to what it executes under the hood, detailing specific variables, string methods (`.lower()`, `.strip()`, `.startswith()`, `.isdigit()`), and built-ins (`len()`).
* **Architectural Rationale ("Why Built in Such Way?"):**
  Explains why specific language constructs were chosen over alternatives (e.g. why `yield from` generators instead of returning a list, why `while True:` with `break`, why `with Extractor(...)` context managers, why Pathlib instead of `os.path`).
* **Resizable Multi-File Split Canvas (1 to 3 Panes):**
  Open up to 3 files side-by-side with draggable horizontal dividers. Resize column widths on the fly to inspect wide functions or compare callers and handlers simultaneously.
* **Bi-Directional Synchronized Hover & Centered Scrolling:**
  Hovering over line 63 in the code smoothly centers the matching explanation card in the middle of the explanation frame. Hovering an explanation card centers the code block on the left.
* **3-Tier Dynamic Persona Engine:**
  * 🌱 **Beginner:** Plain-spoken conversational terms and relatable metaphors.
  * 🚀 **Intermediate:** Practical software engineering language covering data flow, APIs, and state.
  * ⚡ **Senior / Architect:** Systems engineering analysis covering invariants, memory bounds ($O(1)$ RAM), RAII lifecycles, and concurrency safety.
* **In-Card Interactive Inquiry Box:**
  Every file contains an interactive query box at the bottom allowing you to ask specific questions about any line, loop, or imported library with instant direct answers.
* **Zero-Cost Netlify Hosting Ready:**
  100% client-side single page application (SPA). Deploys to Netlify with zero server hosting bills.

---

## 🔍 How It Works

```
┌───────────────────────────────────────────────────────────────────────────┐
│                    CodeFlow Lens Multi-Pane Workspace                     │
├──────────────────────────────────────┬────────────────────────────────────┤
│ Pane 1: File A (e.g. scanner.py)     │ Pane 2: File B (e.g. extractor.py) │
│ ┌───────────────┬──────────────────┐ │ ┌───────────────┬────────────────┐ │
│ │ Code Stream   │ Line-by-Line     │ │ │ Code Stream   │ Line-by-Line   │ │
│ │ L384 with ... │ Extractor setup  │─┼─► L45 def ...   │ ...            │ │
│ │ L388 yield ...│ Stream generator │ │ │               │                │ │
│ └───────────────┴──────────────────┘ │ └───────────────┴────────────────┘ │
│ 💡 ARCHITECTURAL RATIONALE           │ 💡 ARCHITECTURAL RATIONALE         │
│ • Why yield from instead of list?    │ • Why context manager cleanup?     │
└──────────────────────────────────────┴────────────────────────────────────┘
```

1. **Paste or Upload:** Drop any `.py`, `.ts`, `.js`, `.c`, `.cpp`, `.cs`, `.java`, `.go`, `.rs`, or `.yaml` file into the canvas.
2. **Instant Auto-Analysis:** The code is immediately parsed line-by-line without requiring an analyze button.
3. **Inspect & Compare:** Trace functions across files with synchronized hover highlights and resizable frame widths.

---

## 📂 Project Structure

```
codeflow-lens/
├── index.html                   # HTML entry point with Inter & Fira Code typography
├── netlify.toml                 # Netlify deployment configuration & SPA routing
├── package.json                 # Project dependencies and build scripts
├── postcss.config.js            # PostCSS configuration for Tailwind
├── tailwind.config.js           # Tailwind theme configuration
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite build configuration
└── src/
    ├── main.tsx                 # React application root mount
    ├── index.css                # Global styles, scrollbars, and syntax themes
    ├── App.tsx                  # Main workspace state & multi-pane resizer
    ├── types/
    │   └── index.ts             # Data models for explanations and rationales
    ├── services/
    │   ├── gemini.ts            # Line parser & Gemini API integration
    │   └── samples.ts           # Pre-configured open source walkthroughs
    └── components/
        ├── Header.tsx           # Navigation bar & difficulty level switcher
        ├── FilePane.tsx         # Individual file split container
        ├── DualStreamView.tsx   # Aligned code & centered narrative stream
        ├── CrossFileTrace.tsx   # Inter-file symbol link visualizer
        └── SettingsModal.tsx    # API key configuration & Netlify guide
```

---

## 🛠️ Quick Start

### Prerequisites
* **Node.js** (v18 or higher)
* **npm** or **pnpm**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/FogProtocol/codeflow-lens.git
   cd codeflow-lens
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Build for production:**
   ```bash
   npm run build
   ```
   The compiled static assets will be output to the `dist/` directory.

---

## 🌐 Deployment to Netlify

### Option 1: Instant Drag & Drop (Zero Git Required)
1. Run `npm run build` locally to generate the `dist/` directory.
2. Navigate to **[app.netlify.com/drop](https://app.netlify.com/drop)** in your browser.
3. Drag and drop the `dist` folder into the dropzone.
4. Your application will be live immediately with free HTTPS and global CDN.

### Option 2: Continuous Deployment via GitHub
1. Push this repository to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/FogProtocol/codeflow-lens.git
   git push -u origin main
   ```
2. Log in to [Netlify](https://www.netlify.com), click **"Add new site" → "Import an existing project"**, and select your GitHub repository.
3. Netlify will automatically detect `netlify.toml` and configure the build command (`npm run build`) and publish directory (`dist`).
4. Click **Deploy Site**. Every subsequent `git push` will trigger an automated build.

---

## 📄 License

This project is open-source and available under the **[MIT License](LICENSE)**.

---

<div align="center">
  <sub>Maintained by <strong><a href="https://github.com/FogProtocol">FogProtocol</a></strong></sub>
</div>
