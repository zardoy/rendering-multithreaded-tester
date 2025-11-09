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
const renderTimes: number[] = [];
let maxRenderTime = 0;

// Frame timing tracking (for visualization)
const frameTimings: Array<{ start: number; end: number }> = [];

// Animation state
let offset = 0;
const particles: Array<{ x: number; y: number; vx: number; vy: number; color: string }> = [];

// Pointer tracking
let pointerX = 0;
let pointerY = 0;
let hasPointer = false;

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

function drawFrameTimingBar(width: number, _height: number): void {
  if (!ctx) return;

  const barHeight = 20;
  const now = performance.now();

  // Draw background bar
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, width, barHeight);

  // Draw frame timing bars
  frameTimings.forEach(timing => {
    if (!ctx) return;
    const age = now - timing.end;
    if (age > 1000) return; // Only show last second

    // Position on timeline (right = most recent, left = 1 second ago)
    const x = width - (age / 1000) * width;
    const duration = timing.end - timing.start;
    const barWidth = Math.max(2, (duration / 1000) * width); // At least 2px wide

    // Color based on duration
    let color = '#FF0000'; // Red for frames
    if (duration < 16.67) {
      color = '#00FF00'; // Green for good frames (<16.67ms)
    } else if (duration < 33.33) {
      color = '#FFAA00'; // Orange for slow frames
    }

    ctx.fillStyle = color;
    ctx.fillRect(x - barWidth, 0, barWidth, barHeight);
  });

  // Draw timeline markers
  if (!ctx) return;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 10; i++) {
    if (!ctx) return;
    const x = (i / 10) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, barHeight);
    ctx.stroke();
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

  // Draw frame timing visualization bar at the top
  drawFrameTimingBar(width, height);

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
    if (!ctx) return;
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

  // Draw pointer ball (slightly below actual pointer)
  if (hasPointer) {
    const ballY = pointerY + 30; // 30 pixels below pointer
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(pointerX, ballY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Add glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#FFD700';
    ctx.beginPath();
    ctx.arc(pointerX, ballY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Add artificial complexity (junk work)
  // At max complexity (1000), this will do 10 million operations
  for (let i = 0; i < renderComplexity * 10000; i++) {
    Math.sqrt(Math.random() * 1000);
  }

  // Track performance
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  renderTimes.push(renderTime);
  if (renderTimes.length > 60) renderTimes.shift();
  maxRenderTime = Math.max(maxRenderTime, renderTime);
  frameCount++;

  // Track frame timing for visualization
  frameTimings.push({ start: startTime, end: endTime });
  // Keep only last second
  while (frameTimings.length > 0 && endTime - frameTimings[0].end > 1000) {
    frameTimings.shift();
  }

  // Send stats every 100ms
  if (endTime - lastStatsTime >= 100) {
    const elapsed = (endTime - lastStatsTime) / 1000;
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
    lastStatsTime = endTime;
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
  const { type, canvas: newCanvas, strategy, complexity, speed, x, y } = e.data;

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
          // For 'event' strategy, we wait for pointerMove messages

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
        // For 'event' strategy, rendering happens on pointerMove
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

    case 'pointerMove':
      if (x !== undefined && y !== undefined) {
        pointerX = x;
        pointerY = y;
        hasPointer = true;

        // In event-driven mode, render on every pointer move
        if (currentStrategy === 'event') {
          render();
        }
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
