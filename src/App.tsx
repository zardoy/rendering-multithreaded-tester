import { useRef, useEffect, useState } from 'react';
import { StatsPanel } from './components/StatsPanel';
import { ControlsPanel } from './components/ControlsPanel';
import { RenderStrategy } from './types';
import './App.css';

// Global state
let worker: Worker | null = null;
let rafId: number | undefined;
let transferred = false;

const mainStats = {
  mainFPS: 60,
  rafCalls: 60,
  maxFrameTime: 16.67,
  actualFPS: 60,
  frameDrops: 0,
  avgFrameGap: 16.67
};

const workerStats = {
  workerFPS: 60,
  renderTime: 1,
  avgRenderTime: 1,
  maxRenderTime: 1,
  framesRendered: 60
};

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setUpdateTrigger] = useState(0);
  const [strategy, setStrategy] = useState<RenderStrategy>('raf');

  const triggerUpdate = () => {
    setUpdateTrigger(prev => prev + 1);
  };

  useEffect(() => {
    if (transferred) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size BEFORE transferring control
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;

    // Initialize worker
    worker = new Worker(new URL('./render.worker.ts', import.meta.url), { type: 'module' });

    worker.onmessage = (e) => {
      const { type, fps, renderTime, avgRenderTime, maxRenderTime, framesRendered } = e.data;

      if (type === 'stats') {
        workerStats.workerFPS = fps ?? 60;
        workerStats.renderTime = renderTime ?? 1;
        workerStats.avgRenderTime = avgRenderTime ?? 1;
        workerStats.maxRenderTime = maxRenderTime ?? 1;
        workerStats.framesRendered = framesRendered ?? 60;
        triggerUpdate();
      }
    };

    // Transfer control to worker
    const offscreen = canvas.transferControlToOffscreen();
    transferred = true;
    worker.postMessage({ type: 'init', canvas: offscreen }, [offscreen]);

    // Track pointer movement and send to worker
    const handlePointerMove = (e: PointerEvent) => {
      if (worker) {
        const rect = canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
        const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
        worker.postMessage({ type: 'pointerMove', x, y });
      }
    };

    window.addEventListener('pointermove', handlePointerMove);

    const cleanup = () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };

    // Start main thread performance monitoring
    const frameTimes: number[] = [];
    let maxFrameTime = 0;
    let rafCount = 0;
    let lastTime = performance.now();
    let lastSecond = performance.now();

    const measure = () => {
      const now = performance.now();
      const delta = now - lastTime;

      frameTimes.push(delta);
      maxFrameTime = Math.max(maxFrameTime, delta);
      rafCount++;

      while (frameTimes.length > 0 && frameTimes.reduce((a, b) => a + b, 0) > 1000) {
        frameTimes.shift();
      }

      if (now - lastSecond >= 1000) {
        const elapsed = (now - lastSecond) / 1000;
        const actualFPS = rafCount / elapsed;
        const avgFrameGap = frameTimes.length > 0
          ? frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
          : 16.67;

        mainStats.mainFPS = Math.round(actualFPS * 10) / 10;
        mainStats.rafCalls = rafCount;
        mainStats.maxFrameTime = Math.round(maxFrameTime * 100) / 100;
        mainStats.actualFPS = Math.round(actualFPS * 10) / 10;
        mainStats.frameDrops = Math.max(0, Math.round(60 * elapsed - rafCount));
        mainStats.avgFrameGap = Math.round(avgFrameGap * 100) / 100;

        triggerUpdate();

        rafCount = 0;
        lastSecond = now;
        maxFrameTime = 0;
      }

      lastTime = now;
      rafId = requestAnimationFrame(measure);
    };

    rafId = requestAnimationFrame(measure);

    return () => {
      cleanup();
      if (rafId) cancelAnimationFrame(rafId);
      if (worker) {
        worker.postMessage({ type: 'stop' });
        worker.terminate();
        worker = null;
      }
    };
  }, []);

  const handleStrategyChange = (newStrategy: RenderStrategy) => {
    setStrategy(newStrategy);

    if (worker) {
      worker.postMessage({ type: 'setStrategy', strategy: newStrategy });
    }
  };

  const handleComplexityChange = (complexity: number) => {
    if (worker) {
      worker.postMessage({ type: 'setComplexity', complexity });
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (worker) {
      worker.postMessage({ type: 'setSpeed', speed });
    }
  };

  const handleMainThreadFreeze = () => {
    const start = performance.now();
    while (performance.now() - start < 2000) {
      Math.sqrt(Math.random() * 1000);
    }
  };

  return (
    <div className="app">
      <canvas ref={canvasRef} className="render-canvas" />

      {/* Essential info overlay - always on top */}
      <div className="essential-info">
        <div className="essential-stat">
          <span className="essential-label">Main:</span>
          <span className="essential-value">{mainStats.mainFPS} FPS</span>
        </div>
        <div className="essential-stat">
          <span className="essential-label">Worker:</span>
          <span className="essential-value">{workerStats.workerFPS} FPS</span>
        </div>
      </div>

      <ControlsPanel
        currentStrategy={strategy}
        onStrategyChange={handleStrategyChange}
        onComplexityChange={handleComplexityChange}
        onSpeedChange={handleSpeedChange}
        onMainThreadFreeze={handleMainThreadFreeze}
      />

      <StatsPanel
        mainStats={mainStats}
        workerStats={workerStats}
        currentStrategy={strategy}
      />
    </div>
  );
}

export default App;
