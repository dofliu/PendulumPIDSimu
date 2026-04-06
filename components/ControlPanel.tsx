
import React from 'react';
import { SystemParams, PidParams, SimulationControl, DisturbanceType, DisturbanceParams, ReferenceInputType, SinusoidParams } from '../types';
import ParameterInput from './ParameterInput';

interface ControlPanelProps {
  systemParams: SystemParams;
  pidParams: PidParams;
  simulationControl: SimulationControl;
  onSystemParamChange: <K extends keyof SystemParams>(param: K, value: SystemParams[K]) => void;
  onPidParamChange: <K extends keyof PidParams>(param: K, value: PidParams[K]) => void;
  onSimulationControlChange: <K extends keyof Pick<SimulationControl, 'initialTheta'>>(param: K, value: SimulationControl[K]) => void;
  onReferenceInputChange: <K extends keyof Pick<SimulationControl, 'referenceInputType' | 'sinusoidParams'>>(param: K, value: SimulationControl[K]) => void;
  onDisturbanceParamChange: <K extends keyof DisturbanceParams>(param: K, value: DisturbanceParams[K]) => void;
  onAutoTunePid: () => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  isRunning: boolean;
  desiredZeta: number;
  desiredTs: number;
  onDesiredParamChange: (param: 'zeta' | 'ts', value: number) => void;
  onDesignPidForPerformance: () => void;
  onAddComparisonRun: () => void;
  onClearComparisonRuns: () => void;
  comparisonRunCount: number;
  maxSimulationTime: number;
}

const disturbanceTypeOptions: { value: DisturbanceType; label: string }[] = [
  { value: 'none', label: '無干擾' },
  { value: 'pulse', label: '脈衝干擾' },
  { value: 'step', label: '階梯干擾' },
  { value: 'random', label: '持續隨機干擾' }, 
  { value: 'continuous_sinusoid', label: '持續正弦干擾 (力矩)' },
];

const referenceInputTypeOptions: { value: ReferenceInputType; label: string }[] = [
  { value: 'setpoint', label: '固定目標值 (0 rad)' },
  { value: 'sinusoid', label: '正弦波輸入 (角度)' },
];


const ControlPanel: React.FC<ControlPanelProps> = ({
  systemParams,
  pidParams,
  simulationControl,
  onSystemParamChange,
  onPidParamChange,
  onSimulationControlChange,
  onReferenceInputChange,
  onDisturbanceParamChange,
  onAutoTunePid,
  onStart,
  onStop,
  onReset,
  isRunning,
  desiredZeta,
  desiredTs,
  onDesiredParamChange,
  onDesignPidForPerformance,
  onAddComparisonRun,
  onClearComparisonRuns,
  comparisonRunCount,
  maxSimulationTime,
}) => {
  const { disturbance, referenceInputType, sinusoidParams } = simulationControl;

  const handleSinusoidParamChange = <K extends keyof SinusoidParams>(param: K, value: SinusoidParams[K]) => {
    onReferenceInputChange('sinusoidParams', { ...sinusoidParams, [param]: value });
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 overflow-y-auto max-h-[calc(100vh-120px)]">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span className="p-1 bg-blue-100 rounded text-blue-600">⚙️</span> 控制面板
      </h2>

      <section className="mb-4">
        <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider border-b pb-1">系統參數</h3>
        <div className="grid grid-cols-1 gap-2">
          <ParameterInput
            label="質量 (m)"
            id="mass"
            value={systemParams.m}
            onChange={(v) => onSystemParamChange('m', v)}
            min={0.1} max={100} step={0.1} unit="kg"
          />
          <ParameterInput
            label="擺長 (l)"
            id="length"
            value={systemParams.l}
            onChange={(v) => onSystemParamChange('l', v)}
            min={0.1} max={10} step={0.05} unit="m"
          />
          <ParameterInput
            label="阻尼 (b)"
            id="damping"
            value={systemParams.b}
            onChange={(v) => onSystemParamChange('b', v)}
            min={0} max={20} step={0.01} unit="Nms/rad"
          />
        </div>
      </section>

      <section className="mb-4">
        <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider border-b pb-1">PID 增益</h3>
        <div className="grid grid-cols-1 gap-2">
          <ParameterInput
            label="Kp"
            id="kp"
            value={pidParams.kp}
            onChange={(v) => onPidParamChange('kp', v)}
            min={-5000} max={5000} step={1} 
          />
          <ParameterInput
            label="Ki"
            id="ki"
            value={pidParams.ki}
            onChange={(v) => onPidParamChange('ki', v)}
            min={-5000} max={5000} step={1} 
          />
          <ParameterInput
            label="Kd"
            id="kd"
            value={pidParams.kd}
            onChange={(v) => onPidParamChange('kd', v)}
            min={-1000} max={1000} step={0.5} 
          />
        </div>
      </section>
      
      <section className="mb-4 p-2 bg-purple-50 rounded-md border border-purple-100">
        <h3 className="text-xs font-bold text-purple-700 mb-2 uppercase tracking-wider">自動設計</h3>
        <div className="space-y-2">
          <div className="space-y-1">
            <ParameterInput
              label="期望 ζ"
              id="desiredZeta"
              value={desiredZeta}
              onChange={(v) => onDesiredParamChange('zeta', v)}
              min={0.05} max={1.0} step={0.001}
            />
            <ParameterInput
              label="期望 Ts"
              id="desiredTs"
              value={desiredTs}
              onChange={(v) => onDesiredParamChange('ts', v)}
              min={0.1} max={maxSimulationTime} step={0.05} unit="s"
            />
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={onDesignPidForPerformance}
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-1.5 px-1 rounded text-[10px] shadow-sm transition-colors"
            >
              指標設計
            </button>
            <button
              onClick={onAutoTunePid}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-1.5 px-1 rounded text-[10px] shadow-sm transition-colors"
            >
              ZN 調整
            </button>
          </div>
        </div>
      </section>

      <section className="mb-4">
        <h3 className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider border-b pb-1">模擬與干擾</h3>
        <div className="space-y-2">
          <div className="space-y-2">
            <div>
              <label htmlFor="referenceInputType" className="block text-[10px] font-bold text-gray-600 mb-0.5">輸入類型</label>
              <select
                id="referenceInputType"
                value={referenceInputType}
                onChange={(e) => onReferenceInputChange('referenceInputType', e.target.value as ReferenceInputType)}
                className="w-full p-1 text-[10px] border border-gray-300 rounded bg-gray-50"
              >
                {referenceInputTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="disturbanceType" className="block text-[10px] font-bold text-gray-600 mb-0.5">干擾類型</label>
              <select
                id="disturbanceType"
                value={disturbance.type}
                onChange={(e) => onDisturbanceParamChange('type', e.target.value as DisturbanceType)}
                className="w-full p-1 text-[10px] border border-gray-300 rounded bg-gray-50"
              >
                {disturbanceTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <ParameterInput
              label="初始 θ₀"
              id="initialTheta"
              value={simulationControl.initialTheta}
              onChange={(v) => onSimulationControlChange('initialTheta', v)}
              min={-0.5 * Math.PI} max={0.5 * Math.PI} step={0.01} unit="rad"
            />
            {disturbance.type !== 'none' && (
              <ParameterInput
                label="干擾時間"
                id="triggerTime"
                value={disturbance.triggerTime}
                onChange={(v) => onDisturbanceParamChange('triggerTime', v)}
                min={0} max={maxSimulationTime} step={0.1} unit="s"
              />
            )}
          </div>
        </div>
      </section>

      <div className="sticky bottom-0 bg-white pt-3 border-t mt-auto">
        <div className="grid grid-cols-3 gap-2 mb-2">
          <button
            onClick={onStart}
            disabled={isRunning}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-1 rounded shadow-sm disabled:bg-gray-300 text-[10px] transition-colors"
          >
            開始
          </button>
          <button
            onClick={onStop}
            disabled={!isRunning}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-1 rounded shadow-sm disabled:bg-gray-300 text-[10px] transition-colors"
          >
            停止
          </button>
          <button
            onClick={onReset}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-1 rounded shadow-sm text-[10px] transition-colors"
          >
            重置
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onAddComparisonRun}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-1 rounded text-[10px] shadow-sm transition-colors"
          >
            比較 ({comparisonRunCount})
          </button>
          <button
            onClick={onClearComparisonRuns}
            disabled={comparisonRunCount === 0}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-1.5 px-1 rounded text-[10px] shadow-sm disabled:bg-gray-300 transition-colors"
          >
            清除比較
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;