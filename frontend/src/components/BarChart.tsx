import React, { useState } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Rectangle,
} from 'recharts';
import { Typography } from '@mui/material';
import { ChartDataPoint } from '../api/client';

interface BarChartProps {
  data: ChartDataPoint[];
  onBarClick?: (category: string, timePeriod: string) => void;
  overlayLabel?: string;
  mode?: 'latest' | 'trend'; // optional, auto-detect if not provided
}

const COLORS = [
  '#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c',
  '#d0ed57', '#ffc658', '#ff8042', '#ff6361', '#bc5090',
  '#58508d', '#003f5c', '#444e86', '#955196', '#dd5182',
  '#ff6e54', '#ffa600'
];

// Custom bar component that knows which category it represents
const CustomBar = (props: any) => {
  const { x, y, width, height, fill, category, onClick, dataKey, index, ...rest } = props;
  
  const handleClick = () => {
    if (onClick) {
      onClick(dataKey, props.payload);
    }
  };
  
  return (
    <Rectangle
      {...rest}
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    />
  );
};

export const BarChart: React.FC<BarChartProps> = ({ data, onBarClick, overlayLabel, mode }) => {
  // Auto-detect mode if not provided
  let chartMode: 'latest' | 'trend' = mode || 'latest';
  // If there are multiple time periods, use trend mode
  const uniquePeriods = Array.from(new Set(data.map(d => d.timePeriod)));
  if (!mode && uniquePeriods.length > 1) chartMode = 'trend';

  if (chartMode === 'trend') {
    // Group data by time period, stack by category
    const periods = uniquePeriods.sort();
    const categories = Array.from(new Set(data.map(d => d.category)));
    // Build chartData: [{ timePeriod, [category]: amount, ... }]
    const chartData = periods.map(period => {
      const row: any = { timePeriod: period };
      categories.forEach(cat => {
        const found = data.find(d => d.timePeriod === period && d.category === cat);
        row[cat] = found ? found.amount : 0;
        if (overlayLabel) row[cat + '_overlay'] = found && 'overlay' in found ? found.overlay : 0;
      });
      return row;
    });
  return (
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <XAxis dataKey="timePeriod" />
          <YAxis />
          <Tooltip />
          <Legend />
          {categories.map((cat, idx) => (
            <Bar key={cat} dataKey={cat} name={cat} stackId="a" fill={COLORS[idx % COLORS.length]} onClick={bar => onBarClick && onBarClick(cat, bar.timePeriod)} />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    );
  }

  // If data is for a single period (Latest View), just render one bar per category
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <XAxis dataKey="category" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="amount" name="Actual" fill="#8884d8" onClick={bar => onBarClick && onBarClick(bar.category, bar.timePeriod)} />
        {overlayLabel && (
          <Bar dataKey="overlay" name={overlayLabel} fill="#FFBB28" opacity={0.5} />
      )}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}; 