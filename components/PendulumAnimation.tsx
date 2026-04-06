import React from 'react';
import { PENDULUM_ANIMATION_LENGTH } from '../constants';
import { PidContributions } from '../types';

interface PendulumAnimationProps {
  angle: number; // Angle in radians from upward vertical, positive CCW
  pidContributions: PidContributions;
}

const PendulumAnimation: React.FC<PendulumAnimationProps> = ({ angle, pidContributions }) => {
  const svgSize = 300;
  const pivotX = svgSize / 2;
  const pivotY = svgSize / 2; // Adjusted pivotY for better centering if rod length is not too large
  const rodLength = PENDULUM_ANIMATION_LENGTH * 0.6; // Scaled rod length for better fit in SVG
  const massRadius = 15;

  // Ensure angle is upward vertical at 0 radians
  const endX = pivotX + rodLength * Math.sin(angle);
  const endY = pivotY - rodLength * Math.cos(angle); 

  const { p, i, d, total } = pidContributions;
  const sumAbsContributions = Math.abs(p) + Math.abs(i) + Math.abs(d);

  const formatPercentage = (value: number, totalSumAbs: number) => {
    if (totalSumAbs === 0) return '0.0%';
    return ((Math.abs(value) / totalSumAbs) * 100).toFixed(1) + '%';
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow flex flex-col items-center justify-center h-auto min-h-[28rem]"> {/* Increased min-height */}
      <h3 className="text-lg font-semibold text-gray-800 mb-2">倒單擺動畫</h3>
      <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="border border-gray-300 rounded bg-gray-50" aria-label="倒單擺動畫">
        {/* Base/Pivot */}
        <line x1={pivotX - 30} y1={pivotY + rodLength * 0.75} x2={pivotX + 30} y2={pivotY + rodLength * 0.75} stroke="black" strokeWidth="4" />
        <circle cx={pivotX} cy={pivotY} r="5" fill="black" />
        
        {/* Pendulum Rod */}
        <line
          x1={pivotX}
          y1={pivotY}
          x2={endX}
          y2={endY}
          stroke="steelblue"
          strokeWidth="6"
          aria-hidden="true"
        />
        {/* Pendulum Mass */}
        <circle cx={endX} cy={endY} r={massRadius} fill="crimson" aria-hidden="true" />
      </svg>
      <p className="mt-2 text-sm text-gray-600" aria-live="polite">
        目前角度: {angle.toFixed(3)} rad ({(angle * 180 / Math.PI).toFixed(1)}°)
      </p>
      <div className="mt-3 pt-3 border-t w-full max-w-md text-xs text-gray-700">
        <h4 className="font-semibold mb-1 text-sm text-center">PID 各項貢獻 (力矩 Nm)</h4>
        <div className="grid grid-cols-3 gap-x-2 text-center mb-1">
            <div>P-項: {p.toFixed(2)}</div>
            <div>I-項: {i.toFixed(2)}</div>
            <div>D-項: {d.toFixed(2)}</div>
        </div>
        {sumAbsContributions > 0.001 && ( // Show percentage if contributions are significant
          <div className="grid grid-cols-3 gap-x-2 text-center text-gray-500">
            <div>({formatPercentage(p, sumAbsContributions)})</div>
            <div>({formatPercentage(i, sumAbsContributions)})</div>
            <div>({formatPercentage(d, sumAbsContributions)})</div>
          </div>
        )}
        <p className="text-center mt-2 text-sm">總 PID 力矩: {total.toFixed(2)} Nm</p>
      </div>
    </div>
  );
};

export default PendulumAnimation;