export interface SystemParams {
  m: number; // mass (kg)
  l: number; // length (m)
  b: number; // damping (Nms/rad)
}

export interface PidParams {
  kp: number; // Proportional gain
  ki: number; // Integral gain
  kd: number; // Derivative gain
}

export interface SimulationPoint {
  time: number;
  angle: number; // Pendulum angle in radians
  desiredAngle?: number; // Desired angle for tracking
}

export type DisturbanceType = 'none' | 'pulse' | 'step' | 'random' | 'continuous_sinusoid';

export interface DisturbanceParams {
  type: DisturbanceType;
  triggerTime: number; // seconds
  // For 'pulse'
  pulseMagnitude: number; // Nm
  // For 'step'
  stepMagnitude: number; // Nm
  // For 'random' (continuous random noise after triggerTime)
  randomMagnitude: number; // Nm (scale for continuous random noise)
  // For 'continuous_sinusoid'
  sinusoidTorqueAmplitude: number; // Nm
  sinusoidTorqueFrequencyHz: number; // Hz
  sinusoidTorquePhaseRad: number; // rad
}

export type ReferenceInputType = 'setpoint' | 'sinusoid';

export interface SinusoidParams {
  amplitude: number; // rad (for reference input angle)
  frequencyHz: number; // Hz (for reference input angle)
  phaseRad: number; // rad (for reference input angle)
}

export interface SimulationControl {
  initialTheta: number; // Initial angle in radians
  disturbance: DisturbanceParams;
  referenceInputType: ReferenceInputType;
  sinusoidParams: SinusoidParams; // For reference input angle
}

export interface ComplexRoot {
  real: number;
  imag: number;
}

export interface Equations {
  timeDomain: string;
  plantTransferFunction: string;
  controllerTransferFunction: string;
  closedLoopTransferFunction: string;
  openLoopWn?: number; // Characteristic natural frequency (rad/s)
  openLoopZeta?: number; // Characteristic damping ratio
  openLoopRoots?: ComplexRoot[];
  closedLoopRoots?: ComplexRoot[];
  desiredRoots?: ComplexRoot[];
  activePid: PidParams;
}

export interface PerformanceMetrics {
  tr: number | null; // Rise Time
  tp: number | null; // Peak Time
  ts: number | null; // Settling Time
  peakValue: number | null; // Value at Peak Time
}
// Note: For time-varying reference inputs like sinusoids,
// these metrics are calculated relative to the reference's value at t=0.

export interface PidContributions {
  p: number; // Proportional term contribution (Kp * error)
  i: number; // Integral term contribution (Ki * integralError)
  d: number; // Derivative term contribution (Kd * derivativeError)
  total: number; // Total PID torque (p + i + d)
}

export type PidSourceType = 'manual' | 'zn' | 'pole';

export type ControlMode = 'unit_feedback' | 'zeta_wn' | 'performance' | 'pid';

export interface PerformanceDesignParams {
  tr: number;
  ts: number;
  mp: number;
}

export interface ZetaWnParams {
  zeta: number;
  wn: number;
}

export interface ComparisonRun {
  id: string; // Unique ID for the run, e.g., timestamp or uuid
  name: string; // Display name for the legend, e.g., "ZN (Kp:10, Ki:5, Kd:1)"
  data: SimulationPoint[];
  pidParams: PidParams;
  systemParams: SystemParams; // Store to ensure context if system params change later
  simulationControl: SimulationControl; // Store for full context
}