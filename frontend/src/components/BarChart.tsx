import React from 'react';
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
  Cell,
} from 'recharts';
import { Typography } from '@mui/material';
import { ChartDataPoint } from '../api/client';

interface BarChartProps {
  data: ChartDataPoint[];
  onBarClick?: (category: string, timePeriod: string) => void;
  overlayLabel?: string;
  mode?: 'latest' | 'trend';
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#14b8a6', '#f97316', '#ef4444', '#84cc16',
  '#06b6d4', '#a855f7', '#e879f9', '#34d399', '#fbbf24',
  '#60a5fa', '#f472b6',
];

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: 12,
  fontFamily: '"Plus Jakarta Sans", sans-serif',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

const AXIS_TICK = { fill: '#94a3b8', fontSize: 11 };

// Custom bar component that knows which category it represents
const CustomBar = (props: any) => {
  const { x, y, width, height, fill, onClick, dataKey, ...rest } = props;
  return (
    <Rectangle
      {...rest}
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    />
  );
};

export const BarChart: React.FC<BarChartProps> = ({ data, onBarClick, overlayLabel, mode }) => {
  let chartMode: 'latest' | 'trend' = mode || 'latest';
  const uniquePeriods = Array.from(new Set(data.map(d => d.timePeriod)));
  if (!mode && uniquePeriods.length > 1) chartMode = 'trend';

  if (chartMode === 'trend') {
    const periods = uniquePeriods.sort();
    const categories = Array.from(new Set(data.map(d => d.category)));
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
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="timePeriod" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: '"Plus Jakarta Sans", sans-serif' }} />
          {categories.map((cat, idx) => (
            <Bar
              key={cat}
              dataKey={cat}
              name={cat}
              stackId="a"
              fill={COLORS[idx % COLORS.length]}
              radius={idx === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              onClick={bar => onBarClick && onBarClick(cat, bar.timePeriod)}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    );
  }

  // Latest mode: one bar per category with individual colors
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="category" tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 12, fontFamily: '"Plus Jakarta Sans", sans-serif' }} />
        <Bar
          dataKey="amount"
          name="Actual"
          radius={[4, 4, 0, 0]}
          onClick={bar => onBarClick && onBarClick(bar.category, bar.timePeriod)}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
        {overlayLabel && (
          <Bar
            dataKey="overlay"
            name={overlayLabel}
            radius={[4, 4, 0, 0]}
            fill={overlayLabel === 'Budget' ? '#6366f1' : '#10b981'}
            opacity={0.35}
          />
        )}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};
