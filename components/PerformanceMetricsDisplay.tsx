
import React from 'react';
import { PerformanceMetrics } from '../types';

interface PerformanceMetricsDisplayProps {
  metrics: PerformanceMetrics | null;
}

const PerformanceMetricsDisplay: React.FC<PerformanceMetricsDisplayProps> = ({ metrics }) => {
  if (!metrics) {
    return null; // Don't display if no metrics are available
  }

  const formatTime = (time: number | null) => {
    return time !== null ? `${time.toFixed(2)} s` : 'N/A';
  };

  const formatValue = (value: number | null, unit: string = '') => {
    return value !== null ? `${value.toFixed(3)}${unit}` : 'N/A';
  }

  // Check if any metric has a valid (non-null) value
  const hasValidMetrics = metrics.tr !== null || metrics.tp !== null || metrics.ts !== null || metrics.peakValue !== null;

  return (
    <div className={`p-4 bg-white rounded-lg shadow mt-6 border-2 ${hasValidMetrics ? 'border-blue-300' : 'border-transparent'}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-3">模擬性能指標</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="font-medium text-gray-600">上升時間 (Tr): </span>
          <span className="text-gray-800">{formatTime(metrics.tr)}</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">峰值時間 (Tp): </span>
          <span className="text-gray-800">{formatTime(metrics.tp)}</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">峰值 (於 Tp): </span>
          <span className="text-gray-800">{formatValue(metrics.peakValue, ' rad')}</span>
        </div>
        <div>
          <span className="font-medium text-gray-600">安定時間 (Ts, ±0.02 rad): </span>
          <span className="text-gray-800">{formatTime(metrics.ts)}</span>
        </div>
      </div>
       <p className="text-xs text-gray-500 mt-3">
        註: Tr 為首次穿越 0 的時間。Tp 為最大絕對偏差時間。Ts 為進入並保持在 ±0.02 rad 範圍內的時間。模擬停止後顯示。
      </p>
    </div>
  );
};

export default PerformanceMetricsDisplay;
