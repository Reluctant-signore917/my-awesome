# my-awesome

A desktop application for visually building and composing UI components on an interactive canvas. Drag components from the sidebar, connect them, preview live HTML/CSS output, and export or generate code.

Version: 1.0.0

## Why This App

> This app is built for developers and designers who want to quickly assemble UI layouts using pre-built components. Instead of writing boilerplate code or switching between multiple tools, you can drag components onto a canvas, see live previews, connect them, and generate clean HTML/CSS output. It includes built-in tools for creating color palettes, text gradients, mesh gradients, and a UI component studio.

---

## How It Works

```text
+------------------+
|   Sidebar Panel  |
|  (Components +   |
|   Tools + Import)|
+--------+---------+
         |
  drag & drop / click
         |
+--------v---------+
|                  |
|    Canvas Area   |
|  (nodes, zoom,   |
|   pan, connect)  |
|                  |
+--------+---------+
         |
 connections link
 nodes together
         |
+--------v---------+
|                  |
|  Generate Window |
| (HTML/CSS output |
|  syntax highlight)|
+------------------+
```

The application has four main sections:

- Sidebar: Contains categorized components (20 categories, 200 components), a Tools section (Color Palette, Text Gradient, Mesh Gradient, UI Component Studio), and My Imports for saved imports.
- Canvas: The main workspace where components are placed, positioned, scaled with zoom/pan, and connected with visual links.
- Tools: Built-in generators accessible from the sidebar that can send output directly to the canvas.
- Generate Window: Produces the combined HTML/CSS code of all connected nodes in your canvas.

![my2](assets/my2.png)

| Image | Image |
|---|---|
| ![my1](assets/my1.png) | ![my2](assets/my2.png) |
| ![mypage](assets/mypage.png) | ![mypage1](assets/mypage1.png) |
| ![mypage2](assets/mypage2.png) | ![pager](assets/pager.png) |

## Components

200 pre-built components across 20 categories:

- backgrounds (10)
- bars (10)
- buttons (10)
- cards (10)
- code (10)
- colors (10)
- dashboard (10)
- data (10)
- feedback (10)
- glass (10)
- grids (10)
- inputs (10)
- layout (10)
- media (10)
- navigation (10)
- skeletons (10)
- status (10)
- switches (10)
- tabs (10)
- typography (10)
- your saved import

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| F7 | Generate output from connected nodes |
| Ctrl+Z | Undo last canvas action |
| Ctrl+Y | Redo last undone action |
| Tab | Switch between Source and Designer mode |
| Delete | Remove selected canvas element |

Tab is blocked globally except inside the Generate Window where normal Tab behavior is preserved.

---

## Installation

### Download

Download the latest installer from the releases section:

My Awesome Setup 1.0.0.exe

Run the installer and follow the setup wizard. The application will be installed and a desktop shortcut will be created.

### Build from Source

Requirements:
- Node.js 18+
- npm

```bash
git clone https://github.com/YASSER-27/my-awesome.git
cd my-awesome
npm install
npm run build
```

The installer will be generated at release/My Awesome Setup 1.0.0.exe.

---

## Usage

1. Add components: Click a component in the sidebar to add it to the canvas, or drag and drop.
2. Connect nodes: Components are automatically connected in order as you add them.
3. Navigate canvas: Click and drag empty space to pan. Use Ctrl+Scroll to zoom.
4. Select and delete: Click a node to select it, press Delete to remove it.
5. Undo/Redo: Use Ctrl+Z and Ctrl+Y to step through canvas changes.
6. Generate output: Press F7 to open the Generate Window and produce HTML/CSS from connected nodes.
7. Use tools: Open a tool from the Tools section in the sidebar. Modify settings and click "Send to Canvas" to add the result.
8. Import designs: Use the Import Design button to load HTML files or paste code. Saved imports appear under My Imports for reuse.

---

## License

[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](#)

Copyright (c) 2025 Yasser-27

## Author

[Yasser-27](https://github.com/YASSER-27)
