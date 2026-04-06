
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
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">控制面板</h2>

      <section className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-3 border-b pb-2">系統參數</h3>
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
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-3 border-b pb-2">PID 控制器參數</h3>
        <ParameterInput
          label="比例增益 (Kp)"
          id="kp"
          value={pidParams.kp}
          onChange={(v) => onPidParamChange('kp', v)}
          min={-5000} max={5000} step={1} 
        />
        <ParameterInput
          label="積分增益 (Ki)"
          id="ki"
          value={pidParams.ki}
          onChange={(v) => onPidParamChange('ki', v)}
          min={-5000} max={5000} step={1} 
        />
        <ParameterInput
          label="微分增益 (Kd)"
          id="kd"
          value={pidParams.kd}
          onChange={(v) => onPidParamChange('kd', v)}
          min={-1000} max={1000} step={0.5} 
        />
      </section>
      
      <section className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-3 border-b pb-2">PID 自動設計工具</h3>
         <button
          onClick={onAutoTunePid}
          className="mb-3 w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2 px-4 rounded-md shadow text-sm"
          aria-label="使用ZN法則自動調整PID參數 (實驗性)"
        >
          ZN 自動調整 PID (實驗性)
        </button>
        <p className="text-xs text-gray-500 mb-3 mt-3 pt-3 border-t">
          性能指標設計法：此方法基於線性化模型，並假設閉迴路系統可由一對主導極點和一個較遠的第三極點來近似。結果可能需要微調。
        </p>
        <ParameterInput
          label="期望阻尼比 (ζ)"
          id="desiredZeta"
          value={desiredZeta}
          onChange={(v) => onDesiredParamChange('zeta', v)}
          min={0.05} max={1.0} step={0.001}
        />
        <ParameterInput
          label="期望安定時間 (Ts, ±2%)"
          id="desiredTs"
          value={desiredTs}
          onChange={(v) => onDesiredParamChange('ts', v)}
          min={0.1} max={maxSimulationTime} step={0.05} unit="s"
        />
        <button
          onClick={onDesignPidForPerformance}
          className="mt-3 w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-md shadow text-sm"
          aria-label="根據指定的阻尼比和安定時間計算PID參數"
        >
          依性能指標設計 PID
        </button>
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-3 border-b pb-2">模擬設定</h3>
        <div className="mb-4">
          <label htmlFor="referenceInputType" className="block text-sm font-medium text-gray-700 mb-1">
            參考輸入類型
          </label>
          <select
            id="referenceInputType"
            name="referenceInputType"
            value={referenceInputType}
            onChange={(e) => onReferenceInputChange('referenceInputType', e.target.value as ReferenceInputType)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            {referenceInputTypeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {referenceInputType === 'sinusoid' && (
          <>
            <ParameterInput
              label="正弦波角度振幅"
              id="sinAmplitude"
              value={sinusoidParams.amplitude}
              onChange={(v) => handleSinusoidParamChange('amplitude', v)}
              min={0} max={Math.PI / 2} step={0.01} unit="rad"
            />
            <ParameterInput
              label="正弦波角度頻率"
              id="sinFrequency"
              value={sinusoidParams.frequencyHz}
              onChange={(v) => handleSinusoidParamChange('frequencyHz', v)}
              min={0.01} max={2} step={0.01} unit="Hz"
            />
            <ParameterInput
              label="正弦波角度相位"
              id="sinPhase"
              value={sinusoidParams.phaseRad}
              onChange={(v) => handleSinusoidParamChange('phaseRad', v)}
              min={0} max={2 * Math.PI} step={0.01} unit="rad"
            />
          </>
        )}

        <ParameterInput
          label="初始角度 (θ₀)"
          id="initialTheta"
          value={simulationControl.initialTheta}
          onChange={(v) => onSimulationControlChange('initialTheta', v)}
          min={-0.5 * Math.PI} max={0.5 * Math.PI} step={0.01} unit="rad"
        />
      </section>

      <section className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-3 border-b pb-2">干擾設定</h3>
        <div className="mb-4">
          <label htmlFor="disturbanceType" className="block text-sm font-medium text-gray-700 mb-1">
            干擾類型
          </label>
          <select
            id="disturbanceType"
            name="disturbanceType"
            value={disturbance.type}
            onChange={(e) => onDisturbanceParamChange('type', e.target.value as DisturbanceType)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            {disturbanceTypeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {disturbance.type !== 'none' && (
          <ParameterInput
            label="干擾觸發時間"
            id="triggerTime"
            value={disturbance.triggerTime}
            onChange={(v) => onDisturbanceParamChange('triggerTime', v)}
            min={0} max={maxSimulationTime} step={0.1} unit="s"
          />
        )}

        {disturbance.type === 'pulse' && (
          <ParameterInput
            label="脈衝干擾大小"
            id="pulseMagnitude"
            value={disturbance.pulseMagnitude}
            onChange={(v) => onDisturbanceParamChange('pulseMagnitude', v)}
            min={-20} max={20} step={0.1} unit="Nm"
          />
        )}

        {disturbance.type === 'step' && (
          <ParameterInput
            label="階梯干擾大小"
            id="stepMagnitude"
            value={disturbance.stepMagnitude}
            onChange={(v) => onDisturbanceParamChange('stepMagnitude', v)}
            min={-5} max={5} step={0.05} unit="Nm"
          />
        )}

        {disturbance.type === 'random' && (
          <ParameterInput
            label="隨機干擾最大絕對值"
            id="randomMagnitude"
            value={disturbance.randomMagnitude}
            onChange={(v) => onDisturbanceParamChange('randomMagnitude', v)}
            min={0} max={5} step={0.01} unit="Nm" 
          />
        )}
        {disturbance.type === 'continuous_sinusoid' && (
          <>
            <ParameterInput
              label="正弦干擾力矩振幅"
              id="sinTorqueAmplitude"
              value={disturbance.sinusoidTorqueAmplitude}
              onChange={(v) => onDisturbanceParamChange('sinusoidTorqueAmplitude', v)}
              min={0} max={5} step={0.05} unit="Nm"
            />
            <ParameterInput
              label="正弦干擾力矩頻率"
              id="sinTorqueFrequency"
              value={disturbance.sinusoidTorqueFrequencyHz}
              onChange={(v) => onDisturbanceParamChange('sinusoidTorqueFrequencyHz', v)}
              min={0.01} max={2} step={0.01} unit="Hz"
            />
            <ParameterInput
              label="正弦干擾力矩相位"
              id="sinTorquePhase"
              value={disturbance.sinusoidTorquePhaseRad}
              onChange={(v) => onDisturbanceParamChange('sinusoidTorquePhaseRad', v)}
              min={0} max={2 * Math.PI} step={0.01} unit="rad"
            />
          </>
        )}
      </section>

      <div className="flex space-x-3 mb-4">
        <button
          onClick={onStart}
          disabled={isRunning}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-md shadow disabled:bg-green-300 disabled:cursor-not-allowed"
          aria-label="開始模擬"
        >
          開始
        </button>
        <button
          onClick={onStop}
          disabled={!isRunning}
          className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-md shadow disabled:bg-red-300 disabled:cursor-not-allowed"
          aria-label="停止模擬"
        >
          停止
        </button>
        <button
          onClick={onReset}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow"
          aria-label="重置模擬"
        >
          重置
        </button>
      </div>
      <div className="flex space-x-3">
         <button
          onClick={onAddComparisonRun}
          className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md shadow text-sm"
          aria-label="新增目前設定至比較圖表"
        >
          新增至比較圖表 ({comparisonRunCount})
        </button>
        <button
          onClick={onClearComparisonRuns}
          disabled={comparisonRunCount === 0}
          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-md shadow text-sm disabled:bg-yellow-300 disabled:cursor-not-allowed"
          aria-label="清除比較圖表中的所有曲線"
        >
          清除比較圖表
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;