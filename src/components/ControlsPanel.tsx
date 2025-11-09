import React, { useState } from 'react';
import { RenderStrategy } from '../types';

interface ControlsPanelProps {
  currentStrategy: RenderStrategy;
  onStrategyChange: (strategy: RenderStrategy) => void;
  onComplexityChange: (complexity: number) => void;
  onSpeedChange: (speed: number) => void;
  onMainThreadFreeze: () => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  currentStrategy,
  onStrategyChange,
  onComplexityChange,
  onSpeedChange,
  onMainThreadFreeze
}) => {
  const [complexity, setComplexity] = useState(10);
  const [speed, setSpeed] = useState(3);
  const [mainLoad, setMainLoad] = useState(0);

  const handleComplexityChange = (value: number) => {
    setComplexity(value);
    onComplexityChange(value);
  };

  const handleSpeedChange = (value: number) => {
    setSpeed(value);
    onSpeedChange(value);
  };

  const handleMainLoadChange = (value: number) => {
    setMainLoad(value);
    // Simulate main thread load
    if (value > 0) {
      const work = () => {
        const start = performance.now();
        // Block for a percentage of the frame time
        const blockTime = (value / 100) * 16; // Up to 16ms per frame
        while (performance.now() - start < blockTime) {
          Math.sqrt(Math.random() * 1000);
        }
        requestAnimationFrame(work);
      };
      work();
    }
  };

  return (
    <div className="controls-panel">
      <h2>Rendering Strategy Tester</h2>

      <div className="control-section">
        <h3>Rendering Strategy</h3>
        <div className="button-group">
          <button
            className={`strategy-btn ${currentStrategy === 'raf' ? 'active' : ''}`}
            onClick={() => onStrategyChange('raf')}
          >
            RAF Worker
          </button>
          <button
            className={`strategy-btn ${currentStrategy === 'event' ? 'active' : ''}`}
            onClick={() => onStrategyChange('event')}
          >
            Event Driven
          </button>
          <button
            className={`strategy-btn ${currentStrategy === 'timeout' ? 'active' : ''}`}
            onClick={() => onStrategyChange('timeout')}
          >
            Timeout Limited
          </button>
        </div>
      </div>

      <div className="control-section">
        <h3>Main Thread Stress</h3>
        <button className="action-btn danger" onClick={onMainThreadFreeze}>
          Freeze Main Thread (2s)
        </button>
        <div className="slider-control">
          <label>Main Thread Load:</label>
          <input
            type="range"
            min="0"
            max="100"
            value={mainLoad}
            onChange={(e) => handleMainLoadChange(Number(e.target.value))}
          />
          <span className="slider-value">{mainLoad}%</span>
        </div>
      </div>

      <div className="control-section">
        <h3>Worker Render Stress</h3>
        <div className="slider-control">
          <label>Render Complexity:</label>
          <input
            type="range"
            min="0"
            max="100"
            value={complexity}
            onChange={(e) => handleComplexityChange(Number(e.target.value))}
          />
          <span className="slider-value">{complexity}</span>
        </div>
      </div>

      <div className="control-section">
        <h3>Animation Settings</h3>
        <div className="slider-control">
          <label>Animation Speed:</label>
          <input
            type="range"
            min="1"
            max="10"
            value={speed}
            onChange={(e) => handleSpeedChange(Number(e.target.value))}
          />
          <span className="slider-value">{speed}x</span>
        </div>
      </div>

      <div className="info-section">
        <h4>Strategy Info:</h4>
        <ul>
          <li><strong>RAF Worker:</strong> Uses requestAnimationFrame in worker thread</li>
          <li><strong>Event Driven:</strong> Renders triggered by main thread events</li>
          <li><strong>Timeout Limited:</strong> Uses setTimeout capped at ~60fps</li>
        </ul>
      </div>
    </div>
  );
};
