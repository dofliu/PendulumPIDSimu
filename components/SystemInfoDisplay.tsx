
import React from 'react';
import { Equations, ComplexRoot } from '../types';

interface SystemInfoDisplayProps {
  equations: Equations;
}

const formatEquation = (label: string, equation: string) => {
  const formatted = equation
    .replace(/\*s\^2/g, 's²')
    .replace(/\*s\^3/g, 's³')
    .replace(/\*s/g, 's')
    .replace(/\*l\^2/g, 'l²')
    .replace(/\*g/g, 'g');
  return (
    <div className="mb-3 p-3 bg-gray-50 rounded-md shadow-sm">
      <h4 className="text-md font-semibold text-gray-700 mb-1">{label}:</h4>
      <p className="text-sm text-gray-600 font-mono break-all" aria-label={`數學方程式: ${label}`}>{formatted}</p>
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
      <div className="mb-2">
        <h4 className="text-md font-semibold text-gray-700 mb-1">{label}:</h4>
        <p className="text-sm text-gray-600">N/A</p>
      </div>
    );
  }
  return (
    <div className="mb-2">
      <h4 className="text-md font-semibold text-gray-700 mb-1">{label}:</h4>
      <ul className="list-disc list-inside text-sm text-gray-600">
        {roots.map((root, index) => (
          <li key={index} className="font-mono">{formatRoot(root)}</li>
        ))}
      </ul>
    </div>
  );
}

const SystemInfoDisplay: React.FC<SystemInfoDisplayProps> = ({ equations }) => {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">系統模型</h3>
      {formatEquation("時域模型 (開迴路, 線性化)", equations.timeDomain)}
      {formatEquation("受控體轉移函數 Gp(s) = Θ(s)/Τ(s)", equations.plantTransferFunction)}
      {formatEquation("控制器轉移函數 Gc(s)", equations.controllerTransferFunction)}
      {formatEquation("閉迴路轉移函數 T(s) = Θ(s)/Θ_desired(s)", equations.closedLoopTransferFunction)}
      
      <div className="mt-4 pt-4 border-t">
        <h4 className="text-md font-semibold text-gray-700 mb-2">特性參數與根 (基於線性化模型):</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">
              特徵自然頻率 (ωn_char): {equations.openLoopWn !== undefined ? equations.openLoopWn.toFixed(3) : 'N/A'} rad/s
            </p>
            {equations.openLoopZeta !== undefined && (
              <p className="text-sm text-gray-600 mb-2">
                特徵阻尼比 (ζ_char): {equations.openLoopZeta.toFixed(3)}
                {equations.openLoopZeta < 0 && " (不穩定系統的特徵值)"}
              </p>
            )}
            {formatRoots("開迴路特性根 (Gp(s) 極點)", equations.openLoopRoots)}
          </div>
          <div>
            {formatRoots("閉迴路特性根 (T(s) 極點)", equations.closedLoopRoots)}
             <p className="text-xs text-gray-500 mt-3">
                註: 一個穩定的系統，其所有閉迴路特性根的實部應為負 (位於S平面的左半邊)。
            </p>
          </div>
        </div>
         <p className="text-xs text-gray-500 mt-3">
          註: 上述參數與根是基於線性化倒單擺模型 (sin(θ) ≈ θ) 推導得出。開迴路倒單擺本身是不穩定的。
        </p>
      </div>
    </div>
  );
};

export default SystemInfoDisplay;