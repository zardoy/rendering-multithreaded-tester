# Offthread Rendering Tester

A modern web application built with React, TypeScript, and Vite to test and compare different offscreen canvas rendering strategies with detailed performance monitoring.

## Features

- **Multiple Rendering Strategies:**
  - RAF Worker: Uses requestAnimationFrame in worker thread
  - Event Driven: Renders triggered by main thread events
  - Timeout Limited: Uses setTimeout capped at ~60fps

- **Performance Monitoring:**
  - Main thread FPS tracking
  - Worker thread render performance
  - Frame drop detection
  - Maximum frame time analysis
  - Theoretical vs actual FPS comparison

- **Stress Testing:**
  - Main thread freeze simulation
  - Adjustable main thread load
  - Configurable render complexity
  - Variable animation speed

- **Real-time Visualization:**
  - Smooth animation with moving elements
  - Particles with physics
  - Easy freeze detection

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open your browser to the URL shown in the terminal (typically http://localhost:5173)

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Select a Rendering Strategy:** Choose between RAF Worker, Event Driven, or Timeout Limited
2. **Adjust Settings:** Use sliders to control animation speed and render complexity
3. **Stress Test:** Click "Freeze Main Thread" or adjust main thread load to see how rendering performs under stress
4. **Monitor Performance:** Watch the real-time stats to understand how different strategies perform

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **OffscreenCanvas** - Offthread rendering
- **Web Workers** - Background thread execution

## Browser Support

Requires browsers with OffscreenCanvas support:
- Chrome 69+
- Edge 79+
- Firefox 105+
- Safari 16.4+

## License

MIT

