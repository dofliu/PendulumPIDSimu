
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SimulationPoint, ComparisonRun } from '../types';

interface SimulationChartProps {
  liveSimulationData: SimulationPoint[];
  comparisonRuns: ComparisonRun[];
  isRunning: boolean;
}

const COLORS = ["#e6194B", "#3cb44b", "#ffe119", "#4363d8", "#f58231", "#911eb4", "#42d4f4", "#f032e6", "#bfef45", "#fabed4", "#469990", "#dcbeff", "#9A6324", "#fffac8", "#800000", "#aaffc3", "#808000", "#ffd8b1", "#000075"];
const DESIRED_ANGLE_COLOR = "#000000"; // Black for desired angle
const LIVE_SIM_COLOR = "#FF5733"; // A distinct color for live simulation

const SimulationChart: React.FC<SimulationChartProps> = ({ liveSimulationData, comparisonRuns, isRunning }) => {
  const noData = liveSimulationData.length === 0 && comparisonRuns.length === 0;

  if (noData) {
    return <div className="text-center text-gray-400 p-4 text-xs italic bg-white rounded-lg border border-dashed border-gray-200">無模擬數據</div>;
  }
  
  return (
    <div className="p-3 bg-white rounded-xl shadow-lg border border-gray-100 h-64 flex flex-col">
       <h3 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
         <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span> 角度 vs. 時間
       </h3>
      <div className="flex-grow min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
              type="number" 
              tick={{ fontSize: 10 }}
              domain={['dataMin', 'dataMax']}
              stroke="#999"
            />
            <YAxis 
              tick={{ fontSize: 10 }}
              domain={['auto', 'auto']}
              stroke="#999"
            />
            <Tooltip 
              contentStyle={{ fontSize: '10px', borderRadius: '8px', border: '1px solid #eee', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number, name: string) => [value.toFixed(3), name]}
            />
            <Legend verticalAlign="top" height={30} iconSize={8} wrapperStyle={{ fontSize: '9px', overflowY: 'auto', maxHeight: '40px' }}/>
            
            { (liveSimulationData.length > 0 || (comparisonRuns[0] && comparisonRuns[0].data.length > 0)) && (
              <Line 
                type="monotone" 
                dataKey="desiredAngle" 
                data={(liveSimulationData.length > 0 ? liveSimulationData : comparisonRuns[0].data)}
                stroke={DESIRED_ANGLE_COLOR}
                strokeWidth={1.5} 
                dot={false} 
                name="期望" 
                key="desired-angle-common"
                connectNulls={true}
              />
            )}

            {liveSimulationData.length > 1 && (
              <Line 
                type="monotone" 
                dataKey="angle" 
                data={liveSimulationData} 
                stroke={LIVE_SIM_COLOR} 
                strokeWidth={2}
                dot={false} 
                name="目前"
                key="live-simulation"
                connectNulls={true}
              />
            )}

            {comparisonRuns.map((run, index) => (
              <Line 
                key={run.id}
                type="monotone" 
                dataKey="angle" 
                data={run.data} 
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={1.5} 
                dot={false} 
                name={run.name}
                connectNulls={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SimulationChart;