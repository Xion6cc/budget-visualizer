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

export const LineChart: React.FC<LineChartProps> = ({ data }) => {
  const formatCurrency = (value: number) => {
    return `£${value.toFixed(2)}`;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      {data.length > 0 ? (
        <RechartsLineChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timePeriod" />
          <YAxis tickFormatter={formatCurrency} />
          <Tooltip 
            formatter={(value: number) => [formatCurrency(value), 'Amount']}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
          />
        </RechartsLineChart>
      ) : (
        <Typography variant="body1" align="center">
          No data available
        </Typography>
      )}
    </ResponsiveContainer>
  );
}; 