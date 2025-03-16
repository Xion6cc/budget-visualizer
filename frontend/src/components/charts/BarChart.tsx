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
} from 'recharts';
import { Typography } from '@mui/material';
import { ChartData } from '../../types';

interface BarChartProps {
  data?: ChartData[];
  onBarClick?: (data: any) => void;
}

const COLORS = [
  '#3498DB',
  '#2ECC71',
  '#E74C3C',
  '#F1C40F',
  '#9B59B6',
  '#1ABC9C',
  '#E67E22',
  '#34495E',
];

export const BarChart: React.FC<BarChartProps> = ({ data, onBarClick }) => {
  if (!data || data.length === 0) {
    return <Typography>No data available</Typography>;
  }

  // Group data by category
  const categories = Array.from(new Set(data.map(item => item.Category).filter(Boolean)));

  return (
    <ResponsiveContainer width="100%" height={600}>
      <RechartsBarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        onClick={(data) => onBarClick?.(data)}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="Time_Period" />
        <YAxis />
        <Tooltip />
        <Legend />
        {categories.map((category, index) => (
          <Bar
            key={category}
            dataKey="Amount"
            name={category}
            stackId="a"
            fill={COLORS[index % COLORS.length]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}; 