import { SystemParams, PidParams, SimulationControl, SimulationPoint } from '../types';
import { GRAVITY, SIMULATION_DT, SIMULATION_MAX_TIME } from '../constants';

const getDesiredAngleInternal = (t: number, simCtrl: SimulationControl): number => {
  if (simCtrl.referenceInputType === 'sinusoid') {
    const { amplitude, frequencyHz, phaseRad } = simCtrl.sinusoidParams;
    return amplitude * Math.sin(2 * Math.PI * frequencyHz * t + phaseRad);
  }
  return 0; // For 'setpoint', target is 0 (upright)
};

export const generateSimulationData = (
  systemParams: SystemParams,
  pidParams: PidParams,
  simulationControl: SimulationControl
): SimulationPoint[] => {
  const data: SimulationPoint[] = [];
  let theta = simulationControl.initialTheta;
  let thetaDot = 0;
  let integralError = 0;
  let time = 0;
  let pulseApplied = false;

  const initialDesiredAngle = getDesiredAngleInternal(0, simulationControl);
  data.push({ time: 0, angle: theta, desiredAngle: initialDesiredAngle });

  const { m, l, b } = systemParams;
  const { kp, ki, kd } = pidParams;
  const { disturbance } = simulationControl;

  if (m <= 0 || l <= 0) {
    console.error("Mass and length must be positive for simulation.");
    // Return at least the initial point if params are invalid
    return [{ time: 0, angle: simulationControl.initialTheta, desiredAngle: initialDesiredAngle }];
  }
  const I = m * l * l;

  // Ensure simulation runs up to and includes SIMULATION_MAX_TIME
  while (time < SIMULATION_MAX_TIME) {
    // Increment time first
    const nextTime = Math.min(SIMULATION_MAX_TIME, time + SIMULATION_DT);
    const dt = nextTime - time; // Actual time step, important for the last step

    const desiredTheta = getDesiredAngleInternal(nextTime, simulationControl); // Use nextTime for desired
    const error = desiredTheta - theta; // Error based on current theta and future desiredTheta for feedforward-like behavior
    
    integralError += error * dt;

    let desiredThetaDot = 0;
    if (simulationControl.referenceInputType === 'sinusoid') {
        const { amplitude, frequencyHz, phaseRad } = simulationControl.sinusoidParams;
        desiredThetaDot = amplitude * 2 * Math.PI * frequencyHz * Math.cos(2 * Math.PI * frequencyHz * nextTime + phaseRad);
    }
    const derivativeError = desiredThetaDot - thetaDot; // Error in velocity

    const pidTorque = kp * error + ki * integralError + kd * derivativeError;

    let disturbanceTorque = 0;
    if (disturbance.type !== 'none' && nextTime >= disturbance.triggerTime) {
      switch (disturbance.type) {
        case 'pulse':
          if (!pulseApplied && time < disturbance.triggerTime) { // Apply only at the first step after/at trigger time
            disturbanceTorque = disturbance.pulseMagnitude;
            pulseApplied = true;
          } else if (pulseApplied && disturbance.type === 'pulse') {
            // Pulse is instantaneous, so no torque after application
             disturbanceTorque = 0;
          }
          break;
        case 'step':
          disturbanceTorque = disturbance.stepMagnitude;
          break;
        case 'random':
          disturbanceTorque = (Math.random() - 0.5) * 2 * disturbance.randomMagnitude;
          break;
        case 'continuous_sinusoid':
          {
            const t_eff_disturbance = nextTime - disturbance.triggerTime;
            disturbanceTorque = disturbance.sinusoidTorqueAmplitude *
                              Math.sin(2 * Math.PI * disturbance.sinusoidTorqueFrequencyHz * t_eff_disturbance + disturbance.sinusoidTorquePhaseRad);
          }
          break;
      }
    }
    // For pulse, ensure it's only applied once if trigger time is exactly on a step
    if (disturbance.type === 'pulse' && time >= disturbance.triggerTime && !pulseApplied) {
        disturbanceTorque = disturbance.pulseMagnitude;
        pulseApplied = true;
    } else if (disturbance.type === 'pulse' && pulseApplied && time > disturbance.triggerTime) {
        disturbanceTorque = 0; // ensure pulse torque is zero after application
    }


    const totalTorque = pidTorque + disturbanceTorque;
    
    // Using Math.sin(theta) for the non-linear model
    const angularAcceleration = (totalTorque - m * GRAVITY * l * Math.sin(theta) - b * thetaDot) / I;

    const newThetaDot = thetaDot + angularAcceleration * dt;
    const newTheta = theta + newThetaDot * dt; // More accurate to use newThetaDot for this step

    time = nextTime;
    theta = newTheta;
    thetaDot = newThetaDot;

    data.push({ time, angle: theta, desiredAngle: desiredTheta });

    if (time >= SIMULATION_MAX_TIME) break;
  }
  return data;
};