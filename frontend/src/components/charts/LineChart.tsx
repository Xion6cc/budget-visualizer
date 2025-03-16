import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Typography } from '@mui/material';
import { LineChartData } from '../../types';

interface LineChartProps {
  data?: LineChartData[];
}

export const LineChart: React.FC<LineChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <Typography>No data available</Typography>;
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <RechartsLineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="Time_Period" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="Amount"
          stroke="#3498DB"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 8 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}; 