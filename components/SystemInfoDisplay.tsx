
import React from 'react';
import { Equations, ComplexRoot } from '../types';
import 'katex/dist/katex.min.css';
import { BlockMath, InlineMath } from 'react-katex';

interface SystemInfoDisplayProps {
  equations: Equations;
}

const formatEquation = (label: string, equation: string) => {
  return (
    <div className="mb-2 p-3 bg-gray-50 rounded-lg border border-gray-100 shadow-sm transition-all hover:shadow-md">
      <h4 className="text-[10px] font-bold text-blue-700 mb-1 uppercase tracking-wider">{label}:</h4>
      <div className="overflow-x-auto py-0 text-xs sm:text-sm scale-95 origin-left">
        <BlockMath math={equation} />
      </div>
    </div>
  );
};

const formatRoot = (root: ComplexRoot): string => {
  const realStr = root.real.toFixed(3);
  const imagStr = Math.abs(root.imag).toFixed(3);
  if (Math.abs(root.imag) < 1e-6) { // Consider as real root
    return realStr;
  }
  return `${realStr} ${root.imag >= 0 ? '+' : '-'} ${imagStr}i`;
};

const formatRoots = (label: string, roots?: ComplexRoot[]) => {
  if (!roots || roots.length === 0) {
    return (
      <div className="mb-4">
        <h4 className="text-sm font-bold text-gray-700 mb-1 uppercase tracking-wider">{label}:</h4>
        <p className="text-sm text-gray-400 italic">N/A</p>
      </div>
    );
  }
  return (
    <div className="mb-4">
      <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">{label}:</h4>
      <div className="flex flex-wrap gap-2">
        {roots.map((root, index) => (
          <span key={index} className="px-2 py-1 bg-blue-50 text-blue-800 rounded text-sm font-mono border border-blue-100">
            <InlineMath math={formatRoot(root).replace('i', 'j')} />
          </span>
        ))}
      </div>
    </div>
  );
}

const SystemInfoDisplay: React.FC<SystemInfoDisplayProps> = ({ equations }) => {
  return (
    <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
        <h3 className="text-xl font-bold text-gray-800">系統數學模型</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {formatEquation("時域模型 (線性化)", equations.timeDomain)}
        {formatEquation("受控體轉移函數 Gp(s)", equations.plantTransferFunction)}
        {formatEquation("控制器轉移函數 Gc(s)", equations.controllerTransferFunction)}
        {formatEquation("閉迴路轉移函數 T(s)", equations.closedLoopTransferFunction)}
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-100">
        <h4 className="text-md font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="p-1 bg-gray-100 rounded">🔍</span> 特性參數與極點分析:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">自然頻率 <InlineMath math="\omega_n" />:</span>
                <span className="text-sm font-bold text-gray-800">{equations.openLoopWn !== undefined ? equations.openLoopWn.toFixed(3) : 'N/A'} rad/s</span>
              </div>
              {equations.openLoopZeta !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">阻尼比 <InlineMath math="\zeta" />:</span>
                  <span className={`text-sm font-bold ${equations.openLoopZeta < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                    {equations.openLoopZeta.toFixed(3)}
                    {equations.openLoopZeta < 0 && " (不穩定)"}
                  </span>
                </div>
              )}
            </div>
            {formatRoots("開迴路極點 (Open-Loop Poles)", equations.openLoopRoots)}
          </div>
          <div>
            {formatRoots("閉迴路極點 (Closed-Loop Poles)", equations.closedLoopRoots)}
             <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700 leading-relaxed">
                  💡 <strong>穩定性判斷:</strong> 若所有閉迴路極點的實部皆為負 (位於 S 平面左半部)，則系統為漸近穩定。
                </p>
            </div>
          </div>
        </div>
         <p className="text-xs text-gray-400 mt-6 italic text-center">
          * 以上模型基於線性化假設 (sin θ ≈ θ) 推導。開迴路倒單擺本質上為不穩定系統。
        </p>
      </div>
    </div>
  );
};

export default SystemInfoDisplay;