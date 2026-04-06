import React from 'react';
import { PENDULUM_ANIMATION_LENGTH } from '../constants';
import { PidContributions } from '../types';

interface PendulumAnimationProps {
  angle: number; // Angle in radians from upward vertical, positive CCW
  pidContributions: PidContributions;
}

const PendulumAnimation: React.FC<PendulumAnimationProps> = ({ angle, pidContributions }) => {
  const svgSize = 180;
  const pivotX = svgSize / 2;
  const pivotY = svgSize / 2;
  const rodLength = svgSize * 0.35;
  const massRadius = 10;

  const endX = pivotX + rodLength * Math.sin(angle);
  const endY = pivotY - rodLength * Math.cos(angle); 

  const { p, i, d, total } = pidContributions;
  const sumAbsContributions = Math.abs(p) + Math.abs(i) + Math.abs(d);

  const formatPercentage = (value: number, totalSumAbs: number) => {
    if (totalSumAbs === 0) return '0.0%';
    return ((Math.abs(value) / totalSumAbs) * 100).toFixed(1) + '%';
  };

  return (
    <div className="p-3 bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col items-center h-full overflow-hidden">
      <h3 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-2">
        <span className="w-1 h-3 bg-red-500 rounded-full"></span> 倒單擺動畫
      </h3>
      
      <div className="relative flex-grow flex items-center justify-center w-full min-h-[180px]">
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="rounded-lg bg-gray-50 border border-gray-100" aria-label="倒單擺動畫">
          {/* Base/Pivot */}
          <line x1={pivotX - 15} y1={pivotY + 5} x2={pivotX + 15} y2={pivotY + 5} stroke="#333" strokeWidth="2" />
          <circle cx={pivotX} cy={pivotY} r="3" fill="#333" />
          
          {/* Pendulum Rod */}
          <line
            x1={pivotX}
            y1={pivotY}
            x2={endX}
            y2={endY}
            stroke="#4363d8"
            strokeWidth="4"
            strokeLinecap="round"
            aria-hidden="true"
          />
          {/* Pendulum Mass */}
          <circle cx={endX} cy={endY} r={massRadius} fill="#e6194B" aria-hidden="true" />
        </svg>
      </div>

      <div className="mt-2 w-full text-center">
        <p className="text-[10px] font-mono text-gray-600 bg-gray-50 py-0.5 px-1.5 rounded inline-block border border-gray-100">
          {angle.toFixed(3)} rad ({(angle * 180 / Math.PI).toFixed(1)}°)
        </p>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-100 w-full text-[9px] text-gray-700">
        <h4 className="font-bold mb-1 text-gray-400 uppercase tracking-tighter text-center">PID 貢獻 (Nm)</h4>
        <div className="grid grid-cols-3 gap-1 text-center">
          <div className="bg-gray-50 p-0.5 rounded border border-gray-100">
            <p className="text-gray-400">P</p>
            <p className="font-mono font-bold">{p.toFixed(2)}</p>
            {sumAbsContributions > 0.001 && <p className="text-[7px] text-gray-400">({formatPercentage(p, sumAbsContributions)})</p>}
          </div>
          <div className="bg-gray-50 p-0.5 rounded border border-gray-100">
            <p className="text-gray-400">I</p>
            <p className="font-mono font-bold">{i.toFixed(2)}</p>
            {sumAbsContributions > 0.001 && <p className="text-[7px] text-gray-400">({formatPercentage(i, sumAbsContributions)})</p>}
          </div>
          <div className="bg-gray-50 p-0.5 rounded border border-gray-100">
            <p className="text-gray-400">D</p>
            <p className="font-mono font-bold">{d.toFixed(2)}</p>
            {sumAbsContributions > 0.001 && <p className="text-[7px] text-gray-400">({formatPercentage(d, sumAbsContributions)})</p>}
          </div>
        </div>
        <div className="mt-2 text-center bg-blue-50 py-1 rounded-lg border border-blue-100">
          <span className="text-blue-600 font-bold">總力矩: {total.toFixed(2)} Nm</span>
        </div>
      </div>
    </div>
  );
};

export default PendulumAnimation;