import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PieChartProps {
  data: { name: string; value: number }[];
  onPieClick?: (category: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28CFF', '#FF6699', '#FFB347', '#B0E57C'];

export const PieChart: React.FC<PieChartProps> = ({ data, onPieClick }) => {
  // Calculate total for percentage conversion
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Convert values to percentages
  const percentageData = data.map(item => ({
    ...item,
    value: total > 0 ? Number(((item.value / total) * 100).toFixed(1)) : 0
  }));

  // Sort by percentage in descending order
  const sortedPercentageData = percentageData.sort((a, b) => b.value - a.value);

  const handlePieClick = (data: any) => {
    if (onPieClick && data.name) {
      onPieClick(data.name);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc' }}>
          <p>{`${data.name}: ${data.value}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsPieChart>
        <Pie
          data={sortedPercentageData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          fill="#8884d8"
          label={({ name, value }) => `${name}: ${value}%`}
          onClick={handlePieClick}
        >
          {sortedPercentageData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}; 