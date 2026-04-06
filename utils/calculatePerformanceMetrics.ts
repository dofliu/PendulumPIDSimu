
import { SimulationPoint } from '../types';

const SETTLING_CRITERIA_ABSOLUTE_RADIANS = 0.02; 

export interface PerformanceMetricsData {
  tr: number | null;
  tp: number | null;
  ts: number | null;
  peakValue: number | null;
}

export function calculatePerformanceMetrics(
  data: SimulationPoint[],
  initialTheta: number,
  targetValue: number // The value to track (e.g., 0 for setpoint, or desiredAngle(0) for sinusoid)
): PerformanceMetricsData {
  if (data.length < 3) { 
    return { tr: null, tp: null, ts: null, peakValue: null };
  }

  let tr: number | null = null;
  let tp: number | null = null;
  let ts: number | null = null;
  let peakValue: number | null = null;

  // Rise Time (Tr): Time to first cross/reach targetValue from initialTheta.
  // Excludes t=0. Calculated only if initialTheta is different from targetValue.
  if (Math.abs(initialTheta - targetValue) > 1e-6) { // If not starting at target
    for (let i = 1; i < data.length; i++) {
      const prevAngle = (i === 1) ? initialTheta : data[i-1].angle;
      const currentAngle = data[i].angle;
      
      // Moving from initialTheta towards targetValue
      if ((initialTheta > targetValue && prevAngle > targetValue && currentAngle <= targetValue) ||
          (initialTheta < targetValue && prevAngle < targetValue && currentAngle >= targetValue)) {
        tr = data[i].time;
        break;
      }
    }
  } else { // Started at target
      tr = 0.0; // Or null, depending on definition if started at target. Let's use 0 for now.
  }


  // Peak Time (Tp) and Peak Value: Time of the first local extremum (peak or valley) after t=0.
  for (let i = 1; i < data.length - 1; i++) {
    const prevAngle = data[i-1].angle;
    const currentAngle = data[i].angle;
    const nextAngle = data[i+1].angle;

    if ((currentAngle > prevAngle && currentAngle > nextAngle) || // Local max
        (currentAngle < prevAngle && currentAngle < nextAngle)) { // Local min
      tp = data[i].time;
      peakValue = currentAngle;
      break; 
    }
  }
  
  // Settling Time (Ts): Time after which the response remains within ±SETTLING_CRITERIA_ABSOLUTE_RADIANS of the targetValue.
  let settledFromEnd = true;
  for (let i = data.length - 1; i >= 0; i--) {
    if (Math.abs(data[i].angle - targetValue) > SETTLING_CRITERIA_ABSOLUTE_RADIANS) {
      if (i === data.length - 1) {
        ts = null; 
      } else {
        ts = data[i + 1].time;
      }
      settledFromEnd = false;
      break;
    }
  }

  if (settledFromEnd && data.length > 0) {
    // All points are within settling band of targetValue.
    // If all are settled, ts is the time of the first point.
    ts = data[0].time; 
  }

  return { tr, tp, ts, peakValue };
}
