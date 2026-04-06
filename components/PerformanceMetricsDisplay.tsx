
import React from 'react';
import { PerformanceMetrics } from '../types';

interface PerformanceMetricsDisplayProps {
  metrics: PerformanceMetrics | null;
}

const PerformanceMetricsDisplay: React.FC<PerformanceMetricsDisplayProps> = ({ metrics }) => {
  if (!metrics) {
    return null;
  }

  const formatTime = (time: number | null) => {
    return time !== null ? `${time.toFixed(2)} s` : 'N/A';
  };

  const formatValue = (value: number | null, unit: string = '') => {
    return value !== null ? `${value.toFixed(3)}${unit}` : 'N/A';
  }

  const hasValidMetrics = metrics.tr !== null || metrics.tp !== null || metrics.ts !== null || metrics.peakValue !== null;

  return (
    <div className={`p-3 bg-white rounded-xl shadow-lg border border-gray-100 ${hasValidMetrics ? 'ring-2 ring-blue-100' : ''}`}>
      <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
        <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span> 模擬性能指標
      </h3>
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">
          <p className="font-bold text-gray-500 uppercase tracking-tighter">上升時間 (Tr)</p>
          <p className="text-gray-800 font-mono text-xs">{formatTime(metrics.tr)}</p>
        </div>
        <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">
          <p className="font-bold text-gray-500 uppercase tracking-tighter">峰值時間 (Tp)</p>
          <p className="text-gray-800 font-mono text-xs">{formatTime(metrics.tp)}</p>
        </div>
        <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">
          <p className="font-bold text-gray-500 uppercase tracking-tighter">峰值 (Tp)</p>
          <p className="text-gray-800 font-mono text-xs">{formatValue(metrics.peakValue, ' rad')}</p>
        </div>
        <div className="bg-gray-50 p-1.5 rounded-lg border border-gray-100">
          <p className="font-bold text-gray-500 uppercase tracking-tighter">安定時間 (Ts)</p>
          <p className="text-gray-800 font-mono text-xs">{formatTime(metrics.ts)}</p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetricsDisplay;
