
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Line } from 'recharts';
import { ComplexRoot } from '../types';

interface PoleZeroPlotProps {
  openLoopRoots?: ComplexRoot[];
  closedLoopRoots?: ComplexRoot[];
  desiredRoots?: ComplexRoot[];
  zeta?: number;
}

const PoleZeroPlot: React.FC<PoleZeroPlotProps> = ({ openLoopRoots, closedLoopRoots, desiredRoots, zeta }) => {
  // Track history of closed loop roots for trajectory
  const [clHistory, setClHistory] = useState<{ x: number, y: number, id: number }[][]>([]);
  const historyLimit = 15;

  useEffect(() => {
    if (closedLoopRoots && closedLoopRoots.length > 0) {
      setClHistory(prev => {
        const newEntry = closedLoopRoots.map((r, i) => ({ x: r.real, y: r.imag, id: i }));
        const updated = [newEntry, ...prev].slice(0, historyLimit);
        return updated;
      });
    }
  }, [closedLoopRoots]);

  const data = useMemo(() => {
    const olData = (openLoopRoots || []).map(r => ({ x: r.real, y: r.imag, type: '開迴路極點 (OL)', symbol: 'cross' }));
    const clData = (closedLoopRoots || []).map(r => ({ x: r.real, y: r.imag, type: '閉迴路極點 (CL)', symbol: 'circle' }));
    const dData = (desiredRoots || []).map(r => ({ x: r.real, y: r.imag, type: '期望主導極點', symbol: 'star' }));
    
    // Flatten history for rendering
    const historyData = clHistory.flatMap((roots, timeIdx) => 
      roots.map(r => ({ 
        x: r.x, 
        y: r.y, 
        opacity: 1 - (timeIdx / historyLimit),
        size: 20 - (timeIdx),
        id: r.id
      }))
    );

    return { olData, clData, dData, historyData };
  }, [openLoopRoots, closedLoopRoots, desiredRoots, clHistory]);

  const allPoints = [...data.olData, ...data.clData, ...data.dData];
  
  const domain = useMemo(() => {
    if (allPoints.length === 0) return { x: [-10, 10], y: [-10, 10] };
    
    const minX = Math.min(...allPoints.map(p => p.x), -1);
    const maxX = Math.max(...allPoints.map(p => p.x), 1);
    const minY = Math.min(...allPoints.map(p => p.y), -1);
    const maxY = Math.max(...allPoints.map(p => p.y), 1);
    
    const maxAbs = Math.max(
      Math.abs(minX), Math.abs(maxX),
      Math.abs(minY), Math.abs(maxY),
      5 // Minimum scale
    );

    // Pick a stable scale from predefined steps
    // We use a larger margin (1.25) to prevent frequent jumping
    const steps = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];
    const scale = steps.find(s => s >= maxAbs * 1.25) || steps[steps.length - 1];
    
    return {
      x: [-scale, scale],
      y: [-scale, scale]
    };
  }, [allPoints]);

  const formatTick = (value: number) => {
    if (value === 0) return '0';
    if (Math.abs(value) >= 1000) return value.toExponential(0);
    return value.toString();
  };

  // Constant damping line (zeta line)
  const zetaLineData = useMemo(() => {
    if (!zeta || zeta <= 0 || zeta >= 1) return [];
    const angle = Math.acos(zeta);
    const slope = Math.tan(angle);
    const xMin = domain.x[0];
    return [
      { x: 0, y: 0 },
      { x: xMin, y: -xMin * slope },
      { x: xMin, y: xMin * slope }
    ];
  }, [zeta, domain.x]);

  return (
    <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-purple-600 rounded-full"></div>
          <h3 className="text-sm font-bold text-gray-800">S-平面 (極點分佈圖)</h3>
        </div>
        {zeta !== undefined && (
          <div className="text-[9px] text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
            ζ: {zeta.toFixed(2)}
          </div>
        )}
      </div>
      
      <div className="flex-grow min-h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="實部" 
              domain={domain.x}
              tick={{ fontSize: 9 }}
              tickFormatter={formatTick}
              stroke="#ccc"
              allowDataOverflow={false}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="虛部" 
              domain={domain.y}
              tick={{ fontSize: 9 }}
              tickFormatter={formatTick}
              stroke="#ccc"
              allowDataOverflow={false}
            />
            <ZAxis type="number" range={[40, 40]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }} 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload;
                  if (p.type) {
                    return (
                      <div className="bg-white p-1.5 border border-gray-200 shadow-sm rounded text-[9px]">
                        <p className="font-bold text-gray-700">{p.type}</p>
                        <p>s = {p.x.toFixed(2)} {p.y >= 0 ? '+' : '-'} {Math.abs(p.y).toFixed(2)}j</p>
                      </div>
                    );
                  }
                }
                return null;
              }}
            />
            <Legend verticalAlign="top" height={30} iconSize={6} wrapperStyle={{ fontSize: '9px' }}/>
            
            <ReferenceLine x={0} stroke="#666" strokeWidth={1} />
            <ReferenceLine y={0} stroke="#666" strokeWidth={1} />

            {/* Damping lines */}
            {zetaLineData.length > 0 && (
              <Scatter name="期望阻尼線" data={[zetaLineData[1], zetaLineData[0], zetaLineData[2]]} line={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '5 5' }} shape={() => null} />
            )}

            {/* Trajectory History */}
            <Scatter 
              name="軌跡" 
              data={data.historyData} 
              fill="#3b82f6" 
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                return <circle cx={cx} cy={cy} r={payload.size / 10} fill="#3b82f6" fillOpacity={payload.opacity * 0.3} />;
              }} 
            />

            <Scatter name="開迴路極點" data={data.olData} fill="#ef4444" shape="cross" />
            <Scatter name="閉迴路極點" data={data.clData} fill="#3b82f6" shape="circle" />
            <Scatter name="期望主導極點" data={data.dData} fill="#10b981" shape="star" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PoleZeroPlot;
