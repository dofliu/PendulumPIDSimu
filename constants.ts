export const GRAVITY = 9.81; // m/s^2
export const SIMULATION_DT = 0.01; // Simulation time step (seconds)
export const SIMULATION_MAX_TIME = 10; // Max simulation time (seconds)
export const PENDULUM_ANIMATION_LENGTH = 200; // pixels for animation rod length

export const DEFAULT_DISTURBANCE_PARAMS: import('./types').DisturbanceParams = {
  type: 'none' as const,
  triggerTime: 5, // seconds
  pulseMagnitude: 8, // Nm
  stepMagnitude: 0.8, // Nm
  randomMagnitude: 0.3, // Nm (scale for continuous random noise)
  sinusoidTorqueAmplitude: 0.5, // Nm
  sinusoidTorqueFrequencyHz: 0.5, // Hz
  sinusoidTorquePhaseRad: 0, // rad
};

export const DEFAULT_SINUSOID_PARAMS: import('./types').SinusoidParams = {
  amplitude: 0.2, // radians (for reference input angle)
  frequencyHz: 0.25, // Hz (for reference input angle)
  phaseRad: 0, // radians (for reference input angle)
};

export const DEFAULT_DESIRED_ZETA = 0.707;
export const DEFAULT_DESIRED_TS = 1.0; // seconds, for +/- 2% settling time
export const POLE_PLACEMENT_THIRD_POLE_ALPHA = 5; // Factor for third pole placement (s3 = -alpha * sigma)

// Heuristic constants for ZN method (can be tuned)
export const ZN_C1_KU = 3.0; // Heuristic factor for estimating Ku
export const ZN_C2_TU = 0.75; // Heuristic factor for estimating Tu