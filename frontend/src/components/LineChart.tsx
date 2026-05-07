import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Typography } from '@mui/material';
import { ChartDataPoint } from '../api/client';

interface LineChartProps {
  data: ChartDataPoint[];
}

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: 12,
  fontFamily: '"Plus Jakarta Sans", sans-serif',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

const AXIS_TICK = { fill: '#94a3b8', fontSize: 11 };

export const LineChart: React.FC<LineChartProps> = ({ data }) => {
  const formatCurrency = (value: number) => `£${value.toFixed(2)}`;

  return (
    <ResponsiveContainer width="100%" height={400}>
      {data.length > 0 ? (
        <RechartsLineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="timePeriod" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={formatCurrency} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value), 'Amount']}
            contentStyle={TOOLTIP_STYLE}
          />
          <Legend wrapperStyle={{ fontSize: 12, fontFamily: '"Plus Jakarta Sans", sans-serif' }} />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ fill: '#6366f1', r: 4 }}
            activeDot={{ r: 6, fill: '#4338ca' }}
          />
        </RechartsLineChart>
      ) : (
        <Typography variant="body1" align="center" color="text.secondary">
          No data available
        </Typography>
      )}
    </ResponsiveContainer>
  );
};
