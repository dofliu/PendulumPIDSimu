
import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Line } from 'recharts';
import { ComplexRoot } from '../types';

interface PoleZeroPlotProps {
  openLoopRoots?: ComplexRoot[];
  closedLoopRoots?: ComplexRoot[];
  desiredRoots?: ComplexRoot[];
  zeta?: number;
}

const PoleZeroPlot: React.FC<PoleZeroPlotProps> = ({ openLoopRoots, closedLoopRoots, desiredRoots, zeta }) => {
  const data = useMemo(() => {
    const olData = (openLoopRoots || []).map(r => ({ x: r.real, y: r.imag, type: '開迴路極點 (OL)', symbol: 'cross' }));
    const clData = (closedLoopRoots || []).map(r => ({ x: r.real, y: r.imag, type: '閉迴路極點 (CL)', symbol: 'circle' }));
    const dData = (desiredRoots || []).map(r => ({ x: r.real, y: r.imag, type: '期望主導極點', symbol: 'star' }));
    return { olData, clData, dData };
  }, [openLoopRoots, closedLoopRoots, desiredRoots]);

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
    const steps = [5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
    const scale = steps.find(s => s >= maxAbs * 1.1) || steps[steps.length - 1];
    
    return {
      x: [-scale, scale],
      y: [-scale, scale]
    };
  }, [allPoints]);

  const formatTick = (value: number) => {
    if (value === 0) return '0';
    if (Math.abs(value) >= 1000) return value.toExponential(1);
    if (Math.abs(value) < 0.1) return value.toExponential(1);
    return value.toFixed(1).replace(/\.0$/, '');
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
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-6 bg-purple-600 rounded-full"></div>
          <h3 className="text-lg font-bold text-gray-800">S-平面 (極點分佈圖)</h3>
        </div>
        {zeta !== undefined && (
          <div className="text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100">
            期望阻尼比 ζ: {zeta.toFixed(2)}
          </div>
        )}
      </div>
      
      <div className="flex-grow min-h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="實部" 
              domain={domain.x}
              tick={{ fontSize: 10 }}
              tickFormatter={formatTick}
              stroke="#999"
              allowDataOverflow={false}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="虛部" 
              domain={domain.y}
              tick={{ fontSize: 10 }}
              tickFormatter={formatTick}
              stroke="#999"
              allowDataOverflow={false}
            />
            <ZAxis type="number" range={[60, 60]} />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }} 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload;
                  if (p.type) {
                    return (
                      <div className="bg-white p-2 border border-gray-200 shadow-md rounded text-[10px]">
                        <p className="font-bold text-gray-700">{p.type}</p>
                        <p>s = {p.x.toFixed(3)} {p.y >= 0 ? '+' : '-'} {Math.abs(p.y).toFixed(3)}j</p>
                      </div>
                    );
                  }
                }
                return null;
              }}
            />
            <Legend verticalAlign="top" height={40} iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '5px' }}/>
            
            <ReferenceLine x={0} stroke="#333" strokeWidth={1.5} />
            <ReferenceLine y={0} stroke="#333" strokeWidth={1.5} />

            {/* Damping lines */}
            {zetaLineData.length > 0 && (
              <Scatter name="期望阻尼線" data={[zetaLineData[1], zetaLineData[0], zetaLineData[2]]} line={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '5 5' }} shape={() => null} />
            )}

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
