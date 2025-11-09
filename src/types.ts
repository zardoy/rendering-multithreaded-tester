export type RenderStrategy = 'raf' | 'event' | 'timeout';

export interface WorkerMessage {
  type: 'init' | 'setStrategy' | 'setComplexity' | 'setSpeed' | 'triggerRender' | 'stop' | 'pointerMove';
  canvas?: OffscreenCanvas;
  strategy?: RenderStrategy;
  complexity?: number;
  speed?: number;
  x?: number;
  y?: number;
}

export interface WorkerResponse {
  type: 'stats' | 'ready';
  fps?: number;
  renderTime?: number;
  avgRenderTime?: number;
  maxRenderTime?: number;
  framesRendered?: number;
}

export interface PerformanceStats {
  mainFPS: number;
  rafCalls: number;
  maxFrameTime: number;
  actualFPS: number;
  frameDrops: number;
  avgFrameGap: number;
}

export interface WorkerStats {
  workerFPS: number;
  renderTime: number;
  avgRenderTime: number;
  maxRenderTime: number;
  framesRendered: number;
}
