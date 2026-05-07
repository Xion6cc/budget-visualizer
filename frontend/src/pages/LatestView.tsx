import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Switch, FormControlLabel, Select, MenuItem } from '@mui/material';
import { BarChart } from '../components/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { ExpenseTable } from '../components/ExpenseTable';
import { useExpenseDataContext } from '../context/ExpenseDataContext';
import { Controls } from '../components/Controls';

type BarChartDataItem = { category: string; amount: number; timePeriod: string; [key: string]: any };
type PieChartDataItem = { name: string; value: number };

const fetchBudgetConfig = async (): Promise<Record<string, number>> => {
  const response = await fetch('/config/budget.json');
  return response.json();
};

const getLatestMonth = (data: { barChartData: BarChartDataItem[] } | undefined): string | null => {
  if (!data || !data.barChartData || data.barChartData.length === 0) return null;
  return data.barChartData[data.barChartData.length - 1].timePeriod;
};

const getLatestMonthCategoryData = (data: { barChartData: BarChartDataItem[] } | undefined, latestMonth: string | null): BarChartDataItem[] => {
  if (!data || !data.barChartData || !latestMonth) return [];
  return data.barChartData.filter((item: BarChartDataItem) => item.timePeriod === latestMonth);
};

const getPieChartData = (categoryData: BarChartDataItem[]): PieChartDataItem[] => {
  return categoryData.map((item: BarChartDataItem) => ({ name: item.category, value: item.amount }));
};

const getHistoricalAverages = (data: { barChartData: BarChartDataItem[] } | undefined, months: number): Record<string, number> => {
  if (!data || !data.barChartData) return {};
  const uniqueCategories = Array.from(new Set(data.barChartData.map(item => item.category)));
  const lastN = data.barChartData.slice(-months * uniqueCategories.length);
  const sums: Record<string, number> = {};
  const counts: Record<string, number> = {};
  lastN.forEach((item: BarChartDataItem) => {
    sums[item.category] = (sums[item.category] || 0) + item.amount;
    counts[item.category] = (counts[item.category] || 0) + 1;
  });
  const averages: Record<string, number> = {};
  uniqueCategories.forEach(cat => {
    averages[cat] = counts[cat] ? Number((sums[cat] / counts[cat]).toFixed(2)) : 0;
  });
  return averages;
};

const LatestView: React.FC = () => {
  const [showBudget, setShowBudget] = useState(true);
  const [showAverage, setShowAverage] = useState(false);
  const [averagePeriod, setAveragePeriod] = useState(3);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [budget, setBudget] = useState<Record<string, number>>({});

  const { data, fetchExpenseDetails, selectedDetail, filters, updateFilters, handleFileUpload, availableCategories, availableYears, loading } = useExpenseDataContext();

  useEffect(() => {
    fetchBudgetConfig().then(setBudget);
  }, []);

  const latestMonth = data ? getLatestMonth(data) : null;
  const categoryData = (data && latestMonth) ? getLatestMonthCategoryData(data, latestMonth) : [];
  const historicalAverages: Record<string, number> = data ? getHistoricalAverages(data, averagePeriod) : {};

  const timePeriodLabel = filters.timePeriod ? filters.timePeriod.charAt(0).toUpperCase() + filters.timePeriod.slice(1) : 'Period';
  const chartTitle = `${timePeriodLabel} - Bar Chart`;
  const pieTitle = `${timePeriodLabel} - Pie Chart`;

  const overlaySource = showBudget ? budget : historicalAverages;
  const overlayData: BarChartDataItem[] = categoryData
    .map((item) => ({ ...item, overlay: overlaySource[item.category] || 0 }))
    .sort((a, b) => b.amount - a.amount);
  const pieData = getPieChartData(categoryData);

  const handleBarClick = (category: string) => {
    setSelectedCategory(category);
    if (latestMonth) {
      fetchExpenseDetails(category, latestMonth);
    }
  };

  const handlePieClick = (category: string) => {
    setSelectedCategory(category);
    if (latestMonth) {
      fetchExpenseDetails(category, latestMonth);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Controls
        filters={filters}
        onFilterChange={updateFilters}
        onFileUpload={handleFileUpload}
        loading={loading}
        availableCategories={availableCategories}
        availableYears={availableYears}
        hideYear
      />
      <Box sx={{ flexGrow: 1, p: '28px', ml: '220px' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{chartTitle}</Typography>
              <BarChart
                data={overlayData}
                onBarClick={handleBarClick}
                overlayLabel={showBudget ? 'Budget' : 'Historical Avg'}
              />
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showBudget}
                      onChange={() => { setShowBudget(true); setShowAverage(false); }}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#6366f1' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#6366f1' } }}
                    />
                  }
                  label={<Typography sx={{ fontSize: 13 }}>Show Budget Overlay</Typography>}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={showAverage}
                      onChange={() => { setShowAverage(true); setShowBudget(false); }}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#10b981' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#10b981' } }}
                    />
                  }
                  label={<Typography sx={{ fontSize: 13 }}>Show Historical Average</Typography>}
                />
                {showAverage && (
                  <Select
                    value={averagePeriod}
                    onChange={e => setAveragePeriod(Number(e.target.value))}
                    size="small"
                    sx={{ ml: 2 }}
                  >
                    <MenuItem value={3}>Last 3 months</MenuItem>
                    <MenuItem value={6}>Last 6 months</MenuItem>
                    <MenuItem value={12}>Last 12 months</MenuItem>
                  </Select>
                )}
              </Box>
              {selectedCategory && selectedDetail && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1">
                    Details for {selectedCategory} (clicked from {selectedCategory === selectedDetail[0]?.category ? 'bar' : 'pie'})
                  </Typography>
                  <ExpenseTable data={selectedDetail} />
                </Box>
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{pieTitle}</Typography>
              <PieChart data={pieData} onPieClick={handlePieClick} />
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default LatestView;
