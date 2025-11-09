import { WorkerMessage, WorkerResponse, RenderStrategy } from './types';

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let animationId: number | null = null;
let currentStrategy: RenderStrategy = 'raf';
let renderComplexity = 10;
let animationSpeed = 3;
let isRunning = false;

// Performance tracking
let frameCount = 0;
let lastStatsTime = performance.now();
let renderTimes: number[] = [];
let maxRenderTime = 0;

// Animation state
let offset = 0;
const particles: Array<{ x: number; y: number; vx: number; vy: number; color: string }> = [];

function initParticles(width: number, height: number): void {
  particles.length = 0;
  const count = 50;
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      color: colors[Math.floor(Math.random() * colors.length)]
    });
  }
}

function render(): void {
  if (!ctx || !canvas) return;

  const startTime = performance.now();

  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, width, height);

  // Update and draw moving bar (to easily spot freezes)
  offset += animationSpeed;
  if (offset > width + 100) offset = -100;

  const gradient = ctx.createLinearGradient(offset, 0, offset + 100, 0);
  gradient.addColorStop(0, '#FF6B6B');
  gradient.addColorStop(0.5, '#4ECDC4');
  gradient.addColorStop(1, '#45B7D1');

  ctx.fillStyle = gradient;
  ctx.fillRect(offset, height / 2 - 25, 100, 50);

  // Draw moving particles
  particles.forEach(particle => {
    particle.x += particle.vx * animationSpeed;
    particle.y += particle.vy * animationSpeed;

    // Bounce off walls
    if (particle.x < 0 || particle.x > width) particle.vx *= -1;
    if (particle.y < 0 || particle.y > height) particle.vy *= -1;

    // Keep in bounds
    particle.x = Math.max(0, Math.min(width, particle.x));
    particle.y = Math.max(0, Math.min(height, particle.y));

    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Add artificial complexity (junk work)
  for (let i = 0; i < renderComplexity * 1000; i++) {
    Math.sqrt(Math.random() * 1000);
  }

  // Track performance
  const renderTime = performance.now() - startTime;
  renderTimes.push(renderTime);
  if (renderTimes.length > 60) renderTimes.shift();
  maxRenderTime = Math.max(maxRenderTime, renderTime);
  frameCount++;

  // Send stats every 100ms
  const now = performance.now();
  if (now - lastStatsTime >= 100) {
    const elapsed = (now - lastStatsTime) / 1000;
    const fps = frameCount / elapsed;
    const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;

    const response: WorkerResponse = {
      type: 'stats',
      fps: Math.round(fps * 10) / 10,
      renderTime: Math.round(renderTime * 100) / 100,
      avgRenderTime: Math.round(avgRenderTime * 100) / 100,
      maxRenderTime: Math.round(maxRenderTime * 100) / 100,
      framesRendered: frameCount
    };

    self.postMessage(response);

    frameCount = 0;
    lastStatsTime = now;
    maxRenderTime = 0;
  }
}

function startRAF(): void {
  if (!isRunning) return;
  render();
  animationId = self.requestAnimationFrame(startRAF);
}

function startTimeout(): void {
  if (!isRunning) return;
  render();
  // Limit to ~60fps (16.67ms)
  animationId = self.setTimeout(startTimeout, 16.67) as unknown as number;
}

function stopRendering(): void {
  isRunning = false;
  if (animationId !== null) {
    if (currentStrategy === 'timeout') {
      self.clearTimeout(animationId);
    } else {
      self.cancelAnimationFrame(animationId);
    }
    animationId = null;
  }
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, canvas: newCanvas, strategy, complexity, speed } = e.data;

  switch (type) {
    case 'init':
      if (newCanvas) {
        canvas = newCanvas;
        ctx = canvas.getContext('2d');
        if (ctx) {
          initParticles(canvas.width, canvas.height);
          isRunning = true;

          if (currentStrategy === 'raf') {
            startRAF();
          } else if (currentStrategy === 'timeout') {
            startTimeout();
          }
          // For 'event' strategy, we wait for triggerRender messages

          self.postMessage({ type: 'ready' });
        }
      }
      break;

    case 'setStrategy':
      if (strategy) {
        stopRendering();
        currentStrategy = strategy;
        isRunning = true;

        if (strategy === 'raf') {
          startRAF();
        } else if (strategy === 'timeout') {
          startTimeout();
        }
        // For 'event' strategy, rendering happens on triggerRender
      }
      break;

    case 'setComplexity':
      if (complexity !== undefined) {
        renderComplexity = complexity;
      }
      break;

    case 'setSpeed':
      if (speed !== undefined) {
        animationSpeed = speed;
      }
      break;

    case 'triggerRender':
      if (currentStrategy === 'event') {
        render();
      }
      break;

    case 'stop':
      stopRendering();
      break;
  }
};
