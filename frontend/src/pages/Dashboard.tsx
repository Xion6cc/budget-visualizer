import React from 'react';
import { Box, Grid, Paper, Alert, CircularProgress, Stack, Typography } from '@mui/material';
import { Controls } from '../components/Controls';
import { BarChart } from '../components/BarChart';
import { LineChart } from '../components/LineChart';
import { ExpenseTable } from '../components/ExpenseTable';
import { useExpenseDataContext } from '../context/ExpenseDataContext';

export const Dashboard: React.FC = () => {
  const {
    data,
    loading,
    error,
    filters,
    updateFilters,
    handleFileUpload,
    selectedDetail,
    fetchExpenseDetails,
    availableCategories,
    availableYears,
  } = useExpenseDataContext();

  const handleBarClick = (category: string, timePeriod: string) => {
    console.log('Bar clicked:', { category, timePeriod });
    fetchExpenseDetails(category, timePeriod);
  };

  const calculateSummary = () => {
    if (!data?.lineChartData) return { total: 0, average: 0 };
    const total = data.lineChartData.reduce((sum: number, item: { amount: number }) => sum + item.amount, 0);
    const average = total / data.lineChartData.length;
    return { total, average };
  };

  const formatCurrency = (amount: number) => {
    const currencySymbol = filters.currency === 'GBP' ? '£' :
                          filters.currency === 'USD' ? '$' :
                          filters.currency === 'RMB' ? '¥' : '';
    return `${currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const { total, average } = calculateSummary();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Controls
        filters={filters}
        onFilterChange={updateFilters}
        onFileUpload={handleFileUpload}
        loading={loading}
        availableCategories={availableCategories}
        availableYears={availableYears}
      />

      <Box sx={{ flexGrow: 1, p: '28px', ml: '220px' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress sx={{ color: '#6366f1' }} />
          </Box>
        )}

        {data && (
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography
                    sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', mb: 1 }}
                  >
                    Total Spent
                  </Typography>
                  <Typography sx={{ fontSize: 36, fontWeight: 700, color: '#0f172a', lineHeight: 1, mb: 0.5 }}>
                    {formatCurrency(total)}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>
                    During selected period
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography
                    sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', mb: 1 }}
                  >
                    Average per {filters.timePeriod}
                  </Typography>
                  <Typography sx={{ fontSize: 36, fontWeight: 700, color: '#0f172a', lineHeight: 1, mb: 0.5 }}>
                    {formatCurrency(average)}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: '#94a3b8' }}>
                    Based on {data.lineChartData.length} periods
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Paper sx={{ p: 3 }}>
              <BarChart data={data.barChartData} onBarClick={handleBarClick} mode="trend" />
            </Paper>

            {selectedDetail ? (
              <>
                <Paper sx={{ p: 3 }}>
                  <ExpenseTable data={selectedDetail} />
                </Paper>
                <Paper sx={{ p: 3 }}>
                  <LineChart data={data.lineChartData} />
                </Paper>
              </>
            ) : (
              <Paper sx={{ p: 3 }}>
                <LineChart data={data.lineChartData} />
              </Paper>
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
};
