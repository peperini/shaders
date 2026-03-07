# Shaders — Creative Experiments

A collection of interactive WebGL experiments exploring shaders, generative graphics, and visual effects, built with Three.js and OGL.

[See Live](https://peperini.github.io/shaders/)

## Experiments

### 01 — Galaxy Generator
A real-time, procedurally generated galaxy rendered with Three.js `Points` and `AdditiveBlending`. Particle positions are computed using logarithmic spiral math across configurable branches, with color interpolated from an inner to outer hue. An interactive dat.GUI panel exposes all parameters live — particle count, radius, spin, randomness, branch count, and colors.

**Stack:** Three.js · OrbitControls · dat.GUI

### 02 — Auto-Scroll Gallery
An infinite auto-scrolling image gallery using OGL (a minimal WebGL library). Images are rendered as GPU meshes synced to DOM positions, with a sine-wave vertex shader that applies a subtle bow/warp effect proportional to scroll velocity. Images are clipped with a polygon alpha mask passed as a texture uniform.

**Stack:** OGL · Custom GLSL (vertex + fragment)

### 03 — Bulge Distortion Effect
A mouse-driven full-screen image distortion effect. A GLSL fragment shader computes a bulge warp centered on the cursor position — UV coordinates are displaced radially based on distance and a tunable strength constant. Mouse enter/leave transitions are animated with GSAP. The scene renders via a full-screen triangle (not a quad) for efficiency.

**Stack:** OGL · GLSL · GSAP

## Tech

| Tool | Role |
|---|---|
| [Three.js](https://threejs.org/) | 3D rendering (experiment 01) |
| [OGL](https://github.com/oframe/ogl) | Lightweight WebGL (experiments 02–03) |
| [GSAP](https://gsap.com/) | Animation/transitions |
| [dat.GUI](https://github.com/dataarts/dat.gui) | Debug controls |
| Vanilla JS (ESM) | No build step — runs directly in browser via import maps |

## Structure

```
shaders/
├── index.html                    # Entry — links to all experiments
├── 01-galaxy-generator/          # Three.js particle galaxy
├── 02-auto-scroll-gallery/       # OGL infinite scroll with vertex warp
└── 03-bulg-distortion-effect/    # OGL mouse-bulge shader
```

## Running Locally

No build step required. Serve the repo root with any static server:

```bash
npx serve .
# or
python3 -m http.server
```

Then open `http://localhost:3000` (or the port shown).

> Direct `file://` access will not work due to ES module / cross-origin restrictions.

## Author

**José Félix** — Creative Technologist & Design Engineer
