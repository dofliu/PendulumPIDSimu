
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { SystemParams, PidParams, SimulationControl, Equations, DisturbanceParams, PerformanceMetrics, ComplexRoot, ReferenceInputType, SinusoidParams, ComparisonRun, PidSourceType } from './types';
import { GRAVITY, DEFAULT_DISTURBANCE_PARAMS, DEFAULT_SINUSOID_PARAMS, DEFAULT_DESIRED_ZETA, DEFAULT_DESIRED_TS, POLE_PLACEMENT_THIRD_POLE_ALPHA, SIMULATION_MAX_TIME, ZN_C1_KU, ZN_C2_TU } from './constants';
import ControlPanel from './components/ControlPanel';
import SystemInfoDisplay from './components/SystemInfoDisplay';
import SimulationChart from './components/SimulationChart';
import PendulumAnimation from './components/PendulumAnimation';
import PerformanceMetricsDisplay from './components/PerformanceMetricsDisplay';
import { usePendulumSimulation } from './hooks/usePendulumSimulation';
import { calculatePerformanceMetrics } from './utils/calculatePerformanceMetrics';
import { solveQuadratic, solveCubic } from './utils/polynomialRoots';
import { generateSimulationData } from './utils/runFullSimulation';

const App: React.FC = () => {
  const [systemParams, setSystemParams] = useState<SystemParams>({ m: 1, l: 0.5, b: 0.05 });
  const [pidParams, setPidParams] = useState<PidParams>({ kp: 100, ki: 20, kd: 10 });
  const [simulationControl, setSimulationControl] = useState<SimulationControl>({ 
    initialTheta: 0.1, // radians
    disturbance: DEFAULT_DISTURBANCE_PARAMS,
    referenceInputType: 'setpoint',
    sinusoidParams: DEFAULT_SINUSOID_PARAMS,
  });
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);

  const [desiredZeta, setDesiredZeta] = useState<number>(DEFAULT_DESIRED_ZETA);
  const [desiredTs, setDesiredTs] = useState<number>(DEFAULT_DESIRED_TS);

  const [lastPidSource, setLastPidSource] = useState<PidSourceType>('manual');
  const [comparisonRuns, setComparisonRuns] = useState<ComparisonRun[]>([]);

  const handleSystemParamChange = useCallback(<K extends keyof SystemParams,>(param: K, value: SystemParams[K]) => {
    setSystemParams(prev => ({ ...prev, [param]: value }));
    setIsRunning(false); 
  }, []);

  const handlePidParamChange = useCallback(<K extends keyof PidParams,>(param: K, value: PidParams[K]) => {
    setPidParams(prev => ({ ...prev, [param]: value }));
    setLastPidSource('manual'); // User manually changed PID
    setIsRunning(false); 
  }, []);
  
  const handleSimulationControlChange = useCallback(<K extends keyof Omit<SimulationControl, 'disturbance' | 'sinusoidParams' | 'referenceInputType' >>(param: K, value: SimulationControl[K]) => {
     setSimulationControl(prev => ({ ...prev, [param]: value }));
     setIsRunning(false);
  }, []);

  const handleReferenceInputChange = useCallback(<K extends keyof Pick<SimulationControl, 'referenceInputType' | 'sinusoidParams'>>(
    param: K, 
    value: SimulationControl[K]
  ) => {
    setSimulationControl(prev => ({ ...prev, [param]: value }));
    setIsRunning(false);
  }, []);

  const handleDisturbanceParamChange = useCallback(<K extends keyof DisturbanceParams>(param: K, value: DisturbanceParams[K]) => {
    setSimulationControl(prev => ({
      ...prev,
      disturbance: {
        ...prev.disturbance,
        [param]: value,
      }
    }));
    setIsRunning(false);
  }, []);

  const handleDesiredParamChange = useCallback((param: 'zeta' | 'ts', value: number) => {
    if (param === 'zeta') {
      setDesiredZeta(value);
    } else {
      setDesiredTs(value);
    }
  }, []);

  const clampPidParams = (kp: number, ki: number, kd: number): PidParams => {
    return {
      kp: Math.max(-5000, Math.min(5000, kp)),
      ki: Math.max(-5000, Math.min(5000, ki)),
      kd: Math.max(-1000, Math.min(1000, kd)),
    };
  };

  const handleDesignPidForPerformance = useCallback(() => {
    const { m, l, b } = systemParams;

    if (m <= 0 || l <= 0) {
      alert("質量 (m) 和擺長 (l) 必須大於零。");
      return;
    }
    if (desiredTs <= 0) {
      alert("期望安定時間 (Ts) 必須大於零。");
      return;
    }
    if (desiredZeta <= 0 || desiredZeta > 1.0) { 
      alert("期望阻尼比 (ζ) 應介於 (0, 1]。");
      return;
    }

    const I = m * l * l;
    const mgl = m * GRAVITY * l;

    const sigma = 4.0 / desiredTs; 
    const wn_desired = sigma / desiredZeta; 

    const A2_desired = (POLE_PLACEMENT_THIRD_POLE_ALPHA + 2) * sigma;
    const A1_desired = (2 * POLE_PLACEMENT_THIRD_POLE_ALPHA * sigma * sigma) + (wn_desired * wn_desired);
    const A0_desired = POLE_PLACEMENT_THIRD_POLE_ALPHA * sigma * (wn_desired * wn_desired);
    
    let rawKp = A1_desired * I + mgl;
    let rawKi = A0_desired * I;
    let rawKd = A2_desired * I - b;
    
    if (isNaN(rawKp) || isNaN(rawKi) || isNaN(rawKd)) {
        alert("計算 PID 參數時發生錯誤 (可能由於無效的輸入值)。請檢查系統參數與期望性能指標。");
        return;
    }
    const newPid = clampPidParams(rawKp, rawKi, rawKd);
    setPidParams(newPid);
    setLastPidSource('pole');
    setIsRunning(false); 
    alert(`PID 參數已依性能指標設計 (並已限制範圍):\nKp: ${newPid.kp.toFixed(2)}\nKi: ${newPid.ki.toFixed(2)}\nKd: ${newPid.kd.toFixed(2)}\n期望主導極點實部: -${sigma.toFixed(2)}, 期望自然頻率 ωn: ${wn_desired.toFixed(2)} rad/s\n第三個極點位置約為: -${(POLE_PLACEMENT_THIRD_POLE_ALPHA * sigma).toFixed(2)}\n請測試並視情況微調。`);
  }, [systemParams, desiredZeta, desiredTs, setPidParams, setIsRunning]);


  const handleAutoTunePid = useCallback(() => {
    const { m, l } = systemParams;
    if (m <= 0 || l <= 0) {
      alert("質量 (m) 和擺長 (l) 必須大於零才能進行 ZN 估算。");
      return;
    }

    // Heuristic estimation for Ku and Tu for an inverted pendulum (simplified)
    const Ku_heuristic = ZN_C1_KU * m * GRAVITY * l; 
    const Tu_heuristic = ZN_C2_TU * (2 * Math.PI * Math.sqrt(l / GRAVITY));

    if (Tu_heuristic === 0) {
        alert("估算的終極週期 Tu 為零，無法計算 ZN PID 參數。請檢查系統參數。");
        return;
    }
    
    // Classic ZN PID tuning rules
    let rawKp = 0.6 * Ku_heuristic;
    let rawKi = 1.2 * Ku_heuristic / Tu_heuristic; // Or (0.6 * Ku_heuristic) * (2 / Tu_heuristic)
    let rawKd = 0.075 * Ku_heuristic * Tu_heuristic; // Or (0.6 * Ku_heuristic) * (Tu_heuristic / 8)

    if (isNaN(rawKp) || isNaN(rawKi) || isNaN(rawKd)) {
        alert("ZN 自動調整計算 PID 參數時發生錯誤。");
        return;
    }

    const newPid = clampPidParams(rawKp, rawKi, rawKd);
    setPidParams(newPid);
    setLastPidSource('zn');
    setIsRunning(false);
    alert(`ZN 自動調整 PID (實驗性，基於啟發式 Ku, Tu 並已限制範圍):\nKp: ${newPid.kp.toFixed(2)}\nKi: ${newPid.ki.toFixed(2)}\nKd: ${newPid.kd.toFixed(2)}\n(估算 Ku: ${Ku_heuristic.toFixed(2)}, Tu: ${Tu_heuristic.toFixed(2)})\n請測試並視情況微調。`);
  }, [systemParams, setPidParams, setIsRunning]);

  const handleAddComparisonRun = useCallback(() => {
    const simData = generateSimulationData(systemParams, pidParams, simulationControl);
    let namePrefix = "手動";
    if (lastPidSource === 'zn') namePrefix = "ZN";
    else if (lastPidSource === 'pole') namePrefix = "指標";

    const runName = `${namePrefix} (Kp:${pidParams.kp.toFixed(1)}, Ki:${pidParams.ki.toFixed(1)}, Kd:${pidParams.kd.toFixed(1)})`;
    
    setComparisonRuns(prev => [
      ...prev,
      {
        id: Date.now().toString(), // Simple unique ID
        name: runName,
        data: simData,
        pidParams: { ...pidParams }, // Store a copy
        systemParams: { ...systemParams },
        simulationControl: { ...simulationControl }
      }
    ]);
  }, [systemParams, pidParams, simulationControl, lastPidSource]);

  const handleClearComparisonRuns = useCallback(() => {
    setComparisonRuns([]);
  }, []);

  const { simulationData: liveSimulationData, currentAngle, resetSimulationState, currentPidContributions } = usePendulumSimulation({
    systemParams,
    pidParams,
    simulationControl,
    isRunning,
    setIsRunning, 
  });

  useEffect(() => {
    if (!isRunning && liveSimulationData.length > 1) {
      let targetValueForMetrics = 0;
      if (simulationControl.referenceInputType === 'sinusoid') {
        const { amplitude, phaseRad } = simulationControl.sinusoidParams; // Use params at the time of simulation start
        targetValueForMetrics = amplitude * Math.sin(phaseRad);
      } else {
        targetValueForMetrics = 0; // Setpoint is 0
      }
      const metrics = calculatePerformanceMetrics(liveSimulationData, simulationControl.initialTheta, targetValueForMetrics);
      setPerformanceMetrics(metrics);
    } else if (isRunning || liveSimulationData.length <= 1) {
      setPerformanceMetrics(null);
    }
  }, [isRunning, liveSimulationData, simulationControl]);

  const handleStart = () => {
    setPerformanceMetrics(null); 
    // Reset simulation state before starting a new live run to ensure it uses current params
    resetSimulationState();
    setIsRunning(true);
  }
  const handleStop = () => setIsRunning(false); 
  
  const handleReset = () => {
    setIsRunning(false);
    resetSimulationState(); 
    setPerformanceMetrics(null); 
  };
  
  const equations = useMemo<Equations>(() => {
    const { m, l, b } = systemParams;
    const { kp, ki, kd } = pidParams;
    
    const m_val = Math.max(0.001, m); 
    const l_val = Math.max(0.001, l);
    const b_val = Math.max(0, b);

    const I_val = m_val * l_val * l_val;
    const I_str = `${m_val.toFixed(2)}*${l_val.toFixed(2)}²`;
    const mgl_val = m_val * GRAVITY * l_val;

    const timeDomain = `${I_str} θ''(t) + ${b_val.toFixed(3)} θ'(t) - ${mgl_val.toFixed(3)} θ(t) = τ_control(t)`;
    
    const plantDenominator = `${I_val.toFixed(3)}s² + ${b_val.toFixed(3)}s - ${mgl_val.toFixed(3)}`;
    const plantTransferFunction = `1 / (${plantDenominator})`;

    const controllerTransferFunctionNumerator = `${kd.toFixed(3)}s² + ${kp.toFixed(3)}s + ${ki.toFixed(3)}`;
    const controllerTransferFunction = `(${controllerTransferFunctionNumerator}) / s`;
    
    const clNumerator = controllerTransferFunctionNumerator; 
    const clDenominatorP1 = `${I_val.toFixed(3)}s³`; 
    const clDenominatorP2 = `${(b_val + kd).toFixed(3)}s²`; 
    const clDenominatorP3 = `${(kp - mgl_val).toFixed(3)}s`; 
    const clDenominatorP4 = `${ki.toFixed(3)}`;
    const closedLoopTransferFunction = `${clNumerator} / (${clDenominatorP1} + ${clDenominatorP2} + ${clDenominatorP3} + ${clDenominatorP4})`;
    
    let openLoopWn_val: number | undefined = undefined;
    let openLoopZeta_val: number | undefined = undefined;

    if (l_val > 0 && GRAVITY > 0 && mgl_val > 0) { // mgl_val > 0 condition to avoid sqrt of negative
        openLoopWn_val = Math.sqrt(mgl_val / I_val); // Corrected formula based on Gp(s) form: I s^2 + b s - mgl. For char eq I s^2 + b s - mgl = 0
                                                   // If Gp(s) is 1/(Is^2+bs-mgl), roots are (-b +/- sqrt(b^2+4Imgl))/(2I)
                                                   // This implies the "natural frequency" if it were stable is complex.
                                                   // The definition of wn and zeta is typically for stable 2nd order systems.
                                                   // For 1/(s^2 + 2zwns + wn^2), wn=sqrt(k/m), z=b/(2sqrt(km))
                                                   // Here, it's unstable. Let's use sqrt(abs(mgl/I)) as a characteristic frequency magnitude.
        openLoopWn_val = Math.sqrt(Math.abs(mgl_val / I_val));
        if (m_val > 0 && openLoopWn_val > 0 && I_val > 0 ) {
            openLoopZeta_val = b_val / (2 * I_val * openLoopWn_val); // b / (2 * I * wn)
            if (mgl_val < 0) openLoopZeta_val = -openLoopZeta_val; // To indicate instability if "spring" term is negative
            if (isNaN(openLoopZeta_val)) openLoopZeta_val = undefined;
        }
    } else {
      openLoopWn_val = undefined;
      openLoopZeta_val = undefined;
    }


    const openLoopRoots_val: ComplexRoot[] = solveQuadratic(I_val, b_val, -mgl_val);
    const closedLoopRoots_val: ComplexRoot[] = solveCubic(
      I_val,
      b_val + kd,
      kp - mgl_val,
      ki
    );
    
    return { 
      timeDomain, 
      plantTransferFunction, 
      controllerTransferFunction,
      closedLoopTransferFunction,
      openLoopWn: openLoopWn_val,
      openLoopZeta: openLoopZeta_val,
      openLoopRoots: openLoopRoots_val,
      closedLoopRoots: closedLoopRoots_val,
    };
  }, [systemParams, pidParams]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">倒單擺 PID 控制模擬器</h1>
        <p className="text-md text-gray-600 mt-1">探索 PID 控制在二階倒單擺系統上的應用、追蹤不同參考輸入，並觀察外部干擾的影響。</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3">
          <ControlPanel
            systemParams={systemParams}
            pidParams={pidParams}
            simulationControl={simulationControl}
            onSystemParamChange={handleSystemParamChange}
            onPidParamChange={handlePidParamChange}
            onSimulationControlChange={handleSimulationControlChange}
            onReferenceInputChange={handleReferenceInputChange}
            onDisturbanceParamChange={handleDisturbanceParamChange}
            onAutoTunePid={handleAutoTunePid}
            onStart={handleStart}
            onStop={handleStop}
            onReset={handleReset}
            isRunning={isRunning}
            desiredZeta={desiredZeta}
            desiredTs={desiredTs}
            onDesiredParamChange={handleDesiredParamChange}
            onDesignPidForPerformance={handleDesignPidForPerformance}
            onAddComparisonRun={handleAddComparisonRun}
            onClearComparisonRuns={handleClearComparisonRuns}
            comparisonRunCount={comparisonRuns.length}
            maxSimulationTime={SIMULATION_MAX_TIME}
          />
        </div>

        <div className="lg:w-2/3 space-y-6">
          <SystemInfoDisplay equations={equations} />
          <SimulationChart 
            liveSimulationData={liveSimulationData} 
            comparisonRuns={comparisonRuns}
            isRunning={isRunning}
          />
          <PerformanceMetricsDisplay metrics={performanceMetrics} />
          <PendulumAnimation angle={currentAngle} pidContributions={currentPidContributions} />
        </div>
      </div>
      <footer className="text-center mt-12 py-4 text-sm text-gray-500 border-t border-gray-300">
        <p>國立勤益科技大學 智慧自動化工程系 劉瑞弘老師研究室 -- 倒單擺模擬器 &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;