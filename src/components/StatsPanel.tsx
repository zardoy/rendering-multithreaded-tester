import React from 'react';
import { PerformanceStats, WorkerStats, RenderStrategy } from '../types';

interface StatsPanelProps {
  mainStats: PerformanceStats;
  workerStats: WorkerStats;
  currentStrategy: RenderStrategy;
}

const strategyNames: Record<RenderStrategy, string> = {
  raf: 'RAF Worker',
  event: 'Event Driven',
  timeout: 'Timeout Limited'
};

export const StatsPanel: React.FC<StatsPanelProps> = ({ mainStats, workerStats, currentStrategy }) => {
  return (
    <div className="stats-panel">
      <div className="stats-section main-thread-stats">
        <h3>Main Thread Performance</h3>
        <div className="stat-item">
          <span className="stat-label">RAF FPS:</span>
          <span className="stat-value">{mainStats.mainFPS}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">RAF Calls (1s):</span>
          <span className="stat-value">{mainStats.rafCalls}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Max Frame Time:</span>
          <span className="stat-value">{mainStats.maxFrameTime.toFixed(2)}ms</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Theoretical FPS:</span>
          <span className="stat-value theoretical">60</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Actual FPS:</span>
          <span className="stat-value">{mainStats.actualFPS}</span>
        </div>
      </div>

      <div className="stats-section worker-stats">
        <h3>Worker Performance</h3>
        <div className="stat-item">
          <span className="stat-label">Render FPS:</span>
          <span className="stat-value">{workerStats.workerFPS}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Render Time:</span>
          <span className="stat-value">{workerStats.renderTime.toFixed(2)}ms</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg Render Time:</span>
          <span className="stat-value">{workerStats.avgRenderTime.toFixed(2)}ms</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Max Render Time:</span>
          <span className="stat-value">{workerStats.maxRenderTime.toFixed(2)}ms</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Frames Rendered (1s):</span>
          <span className="stat-value">{workerStats.framesRendered}</span>
        </div>
      </div>

      <div className="stats-section timing-stats">
        <h3>Timing Analysis</h3>
        <div className="stat-item">
          <span className="stat-label">Current Strategy:</span>
          <span className="stat-value">{strategyNames[currentStrategy]}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Frame Drops:</span>
          <span className="stat-value">{mainStats.frameDrops}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Avg Frame Gap:</span>
          <span className="stat-value">{mainStats.avgFrameGap.toFixed(2)}ms</span>
        </div>
      </div>
    </div>
  );
};
