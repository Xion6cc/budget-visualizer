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

export const BarChart: React.FC<BarChartProps> = ({ data, onBarClick }) => {
  // Group data by time period
  const timePeriodsSet = new Set(data.map(item => item.timePeriod));
  const timePeriods = Array.from(timePeriodsSet).sort();
  
  // Group data by category
  const categoriesSet = new Set(data.map(item => item.category));
  const categories = Array.from(categoriesSet);
  
  // Create data structure for stacked bar chart
  const chartData = timePeriods.map(period => {
    const periodData = data.filter(item => item.timePeriod === period);
    const result: any = { timePeriod: period };
    
    periodData.forEach(item => {
      result[item.category] = item.amount;
    });
    
    return result;
  });

  // Handle click on a specific category segment
  const handleCategoryClick = (category: string, payload: any) => {
    if (!onBarClick) return;
    
    const timePeriod = payload.timePeriod;
    console.log(`Clicked on category: ${category}, time period: ${timePeriod}, amount: ${payload[category]}`);
    
    onBarClick(category, timePeriod);
  };

  const formatCurrency = (value: number) => {
    return `£${value.toFixed(2)}`;
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      {data.length > 0 ? (
        <RechartsBarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timePeriod" />
          <YAxis tickFormatter={formatCurrency} />
          <Tooltip 
            formatter={(value: number, name: string) => [formatCurrency(value), name]}
            isAnimationActive={false}
          />
          <Legend 
            onClick={(e) => {
              // Handle legend click to filter by category
              if (onBarClick && e.dataKey) {
                console.log(`Legend clicked: ${e.dataKey}`);
                // We pass empty string as timePeriod to indicate this is a legend click
                onBarClick(e.dataKey as string, "");
              }
            }}
          />
          {categories.map((category, index) => (
            <Bar
              key={category}
              dataKey={category}
              stackId="a"
              fill={COLORS[index % COLORS.length]}
              shape={<CustomBar category={category} onClick={handleCategoryClick} />}
              isAnimationActive={false}
            />
          ))}
        </RechartsBarChart>
      ) : (
        <Typography variant="body1" align="center">
          No data available
        </Typography>
      )}
    </ResponsiveContainer>
  );
}; 