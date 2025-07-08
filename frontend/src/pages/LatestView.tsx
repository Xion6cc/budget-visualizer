import React, { useState, useEffect } from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemText, Typography, Paper, Grid, Switch, FormControlLabel, Select, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { BarChart } from '../components/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { ExpenseTable } from '../components/ExpenseTable';
import { useExpenseDataContext } from '../context/ExpenseDataContext';
import { Controls } from '../components/Controls';

const categories = ["Groceries", "Dining", "Transport", "Utilities", "Entertainment"];

type BarChartDataItem = { category: string; amount: number; timePeriod: string; [key: string]: any };
type PieChartDataItem = { name: string; value: number };

const fetchBudgetConfig = async (): Promise<Record<string, number>> => {
  const response = await fetch('/config/budget.json');
  return response.json();
};

const getLatestMonth = (data: { barChartData: BarChartDataItem[] } | undefined): string | null => {
  if (!data || !data.barChartData || data.barChartData.length === 0) return null;
  // Assume barChartData is sorted by time, latest last
  return data.barChartData[data.barChartData.length - 1].timePeriod;
};

const getLatestMonthCategoryData = (data: { barChartData: BarChartDataItem[] } | undefined, latestMonth: string | null): BarChartDataItem[] => {
  if (!data || !data.barChartData || !latestMonth) return [];
  // Filter for latest month
  return data.barChartData.filter((item: BarChartDataItem) => item.timePeriod === latestMonth);
};

const getPieChartData = (categoryData: BarChartDataItem[]): PieChartDataItem[] => {
  return categoryData.map((item: BarChartDataItem) => ({ name: item.category, value: item.amount }));
};

const getHistoricalAverages = (data: { barChartData: BarChartDataItem[] } | undefined, months: number): Record<string, number> => {
  if (!data || !data.barChartData) return {};
  // Get unique categories from data
  const uniqueCategories = Array.from(new Set(data.barChartData.map(item => item.category)));
  // Get last N months (assuming data is sorted by time)
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
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [showBudget, setShowBudget] = useState(true);
  const [showAverage, setShowAverage] = useState(false);
  const [averagePeriod, setAveragePeriod] = useState(3);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [budget, setBudget] = useState<Record<string, number>>({});

  const { data, fetchExpenseDetails, selectedDetail, filters, updateFilters, handleFileUpload, availableCategories, availableYears, loading } = useExpenseDataContext();

  useEffect(() => {
    fetchBudgetConfig().then(budgetData => {
      console.log('Loaded budget config:', budgetData);
      setBudget(budgetData);
    });
  }, []);

  const latestMonth = data ? getLatestMonth(data) : null;
  const categoryData = (data && latestMonth) ? getLatestMonthCategoryData(data, latestMonth) : [];
  const historicalAverages: Record<string, number> = data ? getHistoricalAverages(data, averagePeriod) : {};

  const timePeriodLabel = filters.timePeriod ? filters.timePeriod.charAt(0).toUpperCase() + filters.timePeriod.slice(1) : 'Period';
  const chartTitle = `${timePeriodLabel} - Bar Chart`;
  const pieTitle = `${timePeriodLabel} - Pie Chart`;

  // Get the latest period for the selected time period type
  const latestPeriod = data ? getLatestMonth(data) : null;
  const selectedPeriod = latestPeriod && data ? data.barChartData.filter((item: BarChartDataItem) => item.timePeriod === latestPeriod) : [];
  let overlayData: BarChartDataItem[] = selectedPeriod.length > 0
    ? (showBudget
        ? selectedPeriod.map((item: BarChartDataItem) => ({ ...item, overlay: budget[item.category] || 0, timePeriod: item.timePeriod }))
        : selectedPeriod.map((item: BarChartDataItem) => ({ ...item, overlay: historicalAverages[item.category] || 0, timePeriod: item.timePeriod }))
      )
    : [];
  // Sort by amount descending
  overlayData = overlayData.sort((a: BarChartDataItem, b: BarChartDataItem) => b.amount - a.amount);
  const pieData = selectedPeriod.length > 0 ? getPieChartData(selectedPeriod) : [];

  // Debug logging
  console.log('Available categories in data:', data ? Array.from(new Set(data.barChartData.map((item: BarChartDataItem) => item.category))) : []);
  console.log('Budget config:', budget);
  console.log('Selected period data:', selectedPeriod);
  console.log('Overlay data:', overlayData);

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
    <Box sx={{ display: 'flex', minHeight: '80vh' }}>
      {/* Main content */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          {/* Controls (upload, filters, etc.) */}
          <Box sx={{ mb: 2 }}>
            <Controls
              filters={filters}
              onFilterChange={updateFilters}
              onFileUpload={handleFileUpload}
              loading={loading}
              availableCategories={availableCategories}
              availableYears={availableYears}
              hideYear
            />
          </Box>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">{chartTitle}</Typography>
            <Box sx={{ mt: 2 }}>
              <BarChart
                data={overlayData}
                onBarClick={handleBarClick}
                overlayLabel={showBudget ? 'Budget' : 'Historical Avg'}
              />
            </Box>
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={<Switch checked={showBudget} onChange={() => { setShowBudget(true); setShowAverage(false); }} />}
                label="Show Budget Overlay"
              />
              <FormControlLabel
                control={<Switch checked={showAverage} onChange={() => { setShowAverage(true); setShowBudget(false); }} />}
                label="Show Historical Average"
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
                <Typography variant="subtitle1">Details for {selectedCategory} (clicked from {selectedCategory === selectedDetail[0]?.category ? 'bar' : 'pie'})</Typography>
                <ExpenseTable data={selectedDetail} />
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">{pieTitle}</Typography>
            <Box sx={{ mt: 2 }}>
              <PieChart
                data={pieData}
                onPieClick={handlePieClick}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
      {/* Right-side drawer navigation */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        variant="persistent"
        sx={{ width: 240, flexShrink: 0, '& .MuiDrawer-paper': { width: 240 } }}
      >
        <List>
          <ListItem disablePadding>
            <ListItemButton selected={window.location.pathname === '/latest'} onClick={() => navigate('/latest')}>
              <ListItemText primary="Latest View" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton selected={window.location.pathname === '/trend'} onClick={() => navigate('/trend')}>
              <ListItemText primary="Trend View" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
    </Box>
  );
};

export default LatestView; 