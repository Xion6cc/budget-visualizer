import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PieChartProps {
  data: { name: string; value: number }[];
  onPieClick?: (category: string) => void;
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#14b8a6', '#f97316', '#ef4444', '#84cc16',
];

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: 12,
  fontFamily: '"Plus Jakarta Sans", sans-serif',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

export const PieChart: React.FC<PieChartProps> = ({ data, onPieClick }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const percentageData = data
    .map(item => ({
      ...item,
      value: total > 0 ? Number(((item.value / total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const handlePieClick = (data: any) => {
    if (onPieClick && data.name) {
      onPieClick(data.name);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div style={{ ...TOOLTIP_STYLE, backgroundColor: 'white', padding: '10px 14px' }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#0f172a' }}>
            {item.name}
          </p>
          <p style={{ margin: '4px 0 0', color: '#64748b' }}>{item.value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsPieChart>
        <Pie
          data={percentageData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ name, value }) => `${name}: ${value}%`}
          labelLine={{ stroke: '#e2e8f0' }}
          onClick={handlePieClick}
          style={{ cursor: 'pointer' }}
        >
          {percentageData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, fontFamily: '"Plus Jakarta Sans", sans-serif' }}
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
};
