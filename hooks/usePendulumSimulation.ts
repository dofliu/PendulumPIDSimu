import { useState, useEffect, useCallback, useRef } from 'react';
import { SystemParams, PidParams, SimulationPoint, SimulationControl, PidContributions } from '../types';
import { GRAVITY, SIMULATION_DT, SIMULATION_MAX_TIME } from '../constants';

interface UsePendulumSimulationProps {
  systemParams: SystemParams;
  pidParams: PidParams;
  simulationControl: SimulationControl;
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
}

export const usePendulumSimulation = ({ systemParams, pidParams, simulationControl, isRunning, setIsRunning }: UsePendulumSimulationProps) => {
  const [simulationData, setSimulationData] = useState<SimulationPoint[]>([]);
  const [currentAngle, setCurrentAngle] = useState<number>(simulationControl.initialTheta);
  const [currentPidContributions, setCurrentPidContributions] = useState<PidContributions>({ p: 0, i: 0, d: 0, total: 0 });
  
  const thetaRef = useRef<number>(simulationControl.initialTheta);
  const thetaDotRef = useRef<number>(0); 
  const integralErrorRef = useRef<number>(0); 
  const timeRef = useRef<number>(0);
  const pulseAppliedRef = useRef<boolean>(false);
  const intervalIdRef = useRef<number | null>(null);

  const getDesiredAngle = useCallback((t: number): number => {
    if (simulationControl.referenceInputType === 'sinusoid') {
      const { amplitude, frequencyHz, phaseRad } = simulationControl.sinusoidParams;
      return amplitude * Math.sin(2 * Math.PI * frequencyHz * t + phaseRad);
    }
    return 0; // For 'setpoint', target is 0 (upright)
  }, [simulationControl.referenceInputType, simulationControl.sinusoidParams]);

  const resetSimulationState = useCallback(() => {
    thetaRef.current = simulationControl.initialTheta;
    thetaDotRef.current = 0;
    integralErrorRef.current = 0;
    timeRef.current = 0;
    pulseAppliedRef.current = false;
    setCurrentAngle(simulationControl.initialTheta);
    const initialDesiredAngle = getDesiredAngle(0);
    setSimulationData([{ time: 0, angle: simulationControl.initialTheta, desiredAngle: initialDesiredAngle }]);
    setCurrentPidContributions({ p: 0, i: 0, d: 0, total: 0 });
  }, [simulationControl.initialTheta, getDesiredAngle]);

  useEffect(() => {
    resetSimulationState();
  }, [systemParams, pidParams, simulationControl, resetSimulationState]); // simulationControl change will trigger reset

  useEffect(() => {
    if (isRunning) {
      if (intervalIdRef.current) {
        window.clearInterval(intervalIdRef.current);
      }

      intervalIdRef.current = window.setInterval(() => {
        if (timeRef.current >= SIMULATION_MAX_TIME) {
          setIsRunning(false); 
          return;
        }

        const { m, l, b } = systemParams;
        const { kp, ki, kd } = pidParams;
        const { disturbance } = simulationControl;

        if (m <= 0 || l <= 0) {
            setIsRunning(false);
            return;
        }

        const I = m * l * l; 

        const theta = thetaRef.current;
        const thetaDot = thetaDotRef.current;
        const integralError = integralErrorRef.current;

        const desiredTheta = getDesiredAngle(timeRef.current);
        const error = desiredTheta - theta; 
        
        const newIntegralError = integralError + error * SIMULATION_DT;
        
        let desiredThetaDot = 0;
        if (simulationControl.referenceInputType === 'sinusoid') {
            const { amplitude, frequencyHz, phaseRad } = simulationControl.sinusoidParams;
            desiredThetaDot = amplitude * 2 * Math.PI * frequencyHz * Math.cos(2 * Math.PI * frequencyHz * timeRef.current + phaseRad);
        }
        const derivativeError = desiredThetaDot - thetaDot;
        
        const p_term = kp * error;
        const i_term = ki * newIntegralError;
        const d_term = kd * derivativeError;
        const pidTorque = p_term + i_term + d_term;
        
        setCurrentPidContributions({p: p_term, i: i_term, d: d_term, total: pidTorque });

        let disturbanceTorque = 0;
        if (disturbance.type !== 'none' && timeRef.current >= disturbance.triggerTime) {
          switch (disturbance.type) {
            case 'pulse':
              if (!pulseAppliedRef.current) {
                disturbanceTorque = disturbance.pulseMagnitude;
                pulseAppliedRef.current = true; 
              }
              break;
            case 'step':
              disturbanceTorque = disturbance.stepMagnitude;
              break;
            case 'random': // This is continuous random noise after triggerTime
              disturbanceTorque = (Math.random() - 0.5) * 2 * disturbance.randomMagnitude;
              break;
            case 'continuous_sinusoid':
              {
                const t_eff_disturbance = timeRef.current - disturbance.triggerTime; // Time since disturbance trigger
                disturbanceTorque = disturbance.sinusoidTorqueAmplitude * 
                                  Math.sin(2 * Math.PI * disturbance.sinusoidTorqueFrequencyHz * t_eff_disturbance + disturbance.sinusoidTorquePhaseRad);
              }
              break;
          }
        }
        
        const totalTorque = pidTorque + disturbanceTorque;
        const angularAcceleration = (totalTorque - m * GRAVITY * l * Math.sin(theta) - b * thetaDot) / I;
        
        const newThetaDot = thetaDot + angularAcceleration * SIMULATION_DT;
        const newTheta = theta + newThetaDot * SIMULATION_DT; 

        thetaRef.current = newTheta;
        thetaDotRef.current = newThetaDot;
        integralErrorRef.current = newIntegralError; 
        timeRef.current += SIMULATION_DT;

        if (timeRef.current > SIMULATION_MAX_TIME) {
            timeRef.current = SIMULATION_MAX_TIME;
        }

        setCurrentAngle(newTheta);
        setSimulationData(prevData => [...prevData, { time: timeRef.current, angle: newTheta, desiredAngle: desiredTheta }]);

      }, SIMULATION_DT * 1000);
    } else {
      if (intervalIdRef.current) {
        window.clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    }

    return () => {
      if (intervalIdRef.current) {
        window.clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [isRunning, systemParams, pidParams, simulationControl, setIsRunning, getDesiredAngle]); 

  return { simulationData, currentAngle, resetSimulationState, currentPidContributions };
};