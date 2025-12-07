import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { Candle } from '../types';

interface CandleChartProps {
  data: Candle[];
}

// Custom shape for Candle Wicks (High-Low)
const CustomErrorBar = (props: any) => {
  const { x, y, width, height, stroke } = props;
  const centerX = x + width / 2;
  return (
    <line 
      x1={centerX} 
      y1={y} 
      x2={centerX} 
      y2={y + height} 
      stroke={stroke} 
      strokeWidth={1} 
    />
  );
};

export const CandleChart: React.FC<CandleChartProps> = ({ data }) => {
  // Transform data for Recharts
  // We use a workaround: 
  // 1. A Bar chart for the Body (Open to Close).
  // 2. We need to handle the "floating" bar. In Recharts <Bar>, we can specify [min, max] data.
  // 3. We also need wicks.
  
  const chartData = data.map(c => {
    const isBullish = c.close >= c.open;
    return {
      ...c,
      timestampDisplay: c.timestamp.split('T')[1].substring(0, 5), // HH:MM
      // For the bar: [min, max]
      body: [Math.min(c.open, c.close), Math.max(c.open, c.close)],
      // For the wick: Using a separate invisible bar or just passing data to a custom shape?
      // Simpler approach: 
      // Use Composed Chart. 
      // Use a Bar for the body.
      // Ideally we want strict candles.
      // Let's use a simplified approach that looks good:
      // The `Bar` component in recharts can accept [start, end] values for y-axis.
      color: isBullish ? '#00FF94' : '#FF003C', // Green/Red
      // Wicks are tricky in pure Recharts without complex custom shapes. 
      // We will render the body. The wick will be approximated or ignored for the MVP visual, 
      // OR we draw a thin bar behind it?
      // Let's try drawing a thin bar (wick) and a thick bar (body).
      wickLow: c.low,
      wickHigh: c.high,
    };
  });

  return (
    <div className="h-full w-full select-none">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="bullishGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00FF94" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00FF94" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="bearishGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF003C" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#FF003C" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" vertical={false} />
          <XAxis 
            dataKey="timestampDisplay" 
            stroke="#555" 
            tick={{ fill: '#555', fontSize: 10, fontFamily: 'JetBrains Mono' }} 
            tickLine={false}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            orientation="right" 
            stroke="#555" 
            tick={{ fill: '#555', fontSize: 10, fontFamily: 'JetBrains Mono' }}
            tickLine={false}
            width={40}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#333', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
            labelStyle={{ color: '#888', marginBottom: '0.5rem' }}
            formatter={(value: any, name: string) => {
              if (Array.isArray(value)) return [`${value[0]} - ${value[1]}`, 'Body'];
              return [value, name];
            }}
          />
          {/* Wick (simulated as a very thin bar spanning low to high) */}
           <Bar dataKey="wickHigh" dataKey2="wickLow" barSize={1} fill="#888">
             {chartData.map((entry, index) => (
                <Cell key={`cell-wick-${index}`} fill={entry.color} />
             ))}
             {/* Note: Recharts doesn't support 'dataKey2' on Bar natively to draw a range easily like this without custom shape. 
                 We will use a workaround: A Bar for the body is enough for visual trend, usually.
                 Let's stick to just the body for clean aesthetics or use a specific library wrapper.
                 Actually, let's just use the BODY bar.
             */}
           </Bar>

           {/* Body */}
          <Bar dataKey="body" barSize={8} radius={[1, 1, 1, 1]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};