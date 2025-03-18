import React from 'react';
import { Box, Grid, Paper, Alert, CircularProgress, Stack, Typography } from '@mui/material';
import { Controls } from '../components/Controls';
import { BarChart } from '../components/BarChart';
import { ExpenseTable } from '../components/ExpenseTable';
import { useExpenseData } from '../hooks/useExpenseData';

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
  } = useExpenseData();

  const handleBarClick = (category: string, timePeriod: string) => {
    console.log('Bar clicked:', { category, timePeriod });
    fetchExpenseDetails(category, timePeriod);
  };

  const calculateSummary = () => {
    if (!data?.barChartData) return { total: 0, average: 0 };
    
    const total = data.barChartData.reduce((sum, item) => sum + (item.amount || 0), 0);
    const average = total / (data.barChartData.length || 1);
    
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
      
      <Box sx={{ flexGrow: 1, ml: '280px', p: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        )}

        {data && (
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total Spent
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'medium' }}>
                    {formatCurrency(total)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    During selected period
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper elevation={1} sx={{ p: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Average per {filters.timePeriod}
                  </Typography>
                  <Typography variant="h4" component="div" sx={{ fontWeight: 'medium' }}>
                    {formatCurrency(average)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Based on {data.barChartData.length} periods
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Paper elevation={1} sx={{ p: 3 }}>
              <BarChart data={data.barChartData} onBarClick={handleBarClick} />
            </Paper>
            
            {selectedDetail && (
              <Paper elevation={1} sx={{ p: 3 }}>
                <ExpenseTable data={selectedDetail} />
              </Paper>
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
}; 