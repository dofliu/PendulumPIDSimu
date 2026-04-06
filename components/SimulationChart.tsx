
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
    return <div className="text-center text-gray-500 p-4">無模擬數據。請執行模擬或新增比較運行以查看圖表。</div>;
  }
  
  // Combine all data to find overall domain for Y-axis, if needed, or let Recharts handle 'auto'
  // For X-axis, it should dynamically adjust based on the longest dataset if SIMULATION_MAX_TIME varies per run (though it's constant now)

  return (
    <div className="p-4 bg-white rounded-lg shadow h-96">
       <h3 className="text-lg font-semibold text-gray-800 mb-4">角度 vs. 時間</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            type="number" 
            label={{ value: '時間 (s)', position: 'insideBottomRight', offset: -10 }}
            domain={['dataMin', 'dataMax']}
            allowDuplicatedCategory={false} // Important if multiple datasets have same time points
          />
          <YAxis 
            label={{ value: '角度 (rad)', angle: -90, position: 'insideLeft' }}
            domain={['auto', 'auto']} // Let recharts determine or calculate min/max across all data
            allowDataOverflow={true}
          />
          <Tooltip formatter={(value: number, name: string, entry: any) => {
              const valStr = value.toFixed(4);
              // If entry.payload.desiredAngle exists and this is the 'angle' line, show desired too
              if (name.startsWith("期望角度")) return valStr; // Only show value for desired
              
              let tooltipText = [`${valStr} rad (${name})`];
              if(entry.payload.desiredAngle !== undefined && !name.includes("期望")) {
                 // This might be too verbose if many lines are present.
                 // Consider if this is needed for comparison runs.
                 // tooltipText.push(`期望: ${entry.payload.desiredAngle.toFixed(4)} rad`);
              }
              return tooltipText;
            }} 
            itemSorter={(item) => { // Sort "期望角度" to be last in tooltip
                if (item.name && item.name.startsWith("期望角度")) return 1;
                return -1;
            }}
          />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ overflowY: 'auto', maxHeight: '60px' }}/>
          
          {/* Desired Angle Line (common for all, using first available dataset's desiredAngle points) */}
          { (liveSimulationData.length > 0 || (comparisonRuns[0] && comparisonRuns[0].data.length > 0)) && (
            <Line 
              type="monotone" 
              dataKey="desiredAngle" 
              data={(liveSimulationData.length > 0 ? liveSimulationData : comparisonRuns[0].data)}
              stroke={DESIRED_ANGLE_COLOR}
              strokeWidth={2} 
              dot={false} 
              name="期望角度 (θ_desired)" 
              key="desired-angle-common"
              connectNulls={true}
            />
          )}

          {/* Live Simulation Data */}
          {liveSimulationData.length > 1 && (
            <Line 
              type="monotone" 
              dataKey="angle" 
              data={liveSimulationData} 
              stroke={LIVE_SIM_COLOR} 
              strokeWidth={isRunning ? 3 : 2} // Thicker if running
              dot={false} 
              name={`目前模擬${isRunning ? " (執行中)" : ""}`}
              key="live-simulation"
              connectNulls={true}
            />
          )}

          {/* Comparison Runs Data */}
          {comparisonRuns.map((run, index) => (
            <Line 
              key={run.id}
              type="monotone" 
              dataKey="angle" 
              data={run.data} 
              stroke={COLORS[index % COLORS.length]} // Cycle through predefined colors
              strokeWidth={2} 
              dot={false} 
              name={run.name}
              connectNulls={true}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SimulationChart;