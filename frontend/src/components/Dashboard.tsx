import React, { useEffect, useState } from 'react';
import { 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  CircularProgress, 
  Alert, 
  Container
} from '@mui/material';
import { BarChart } from './BarChart';
import { Controls } from './Controls';
import { ExpenseDetails } from './ExpenseDetails';
import { useExpenseData } from '../hooks/useExpenseData';
import { FileUpload } from './FileUpload';

// Define types for SummaryCard props
interface SummaryCardProps {
  title: string;
  value: number;
  currency: string;
  subtitle?: string;
}

// Simple SummaryCard component
const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, currency, subtitle }) => {
  const symbol = currency === 'USD' ? '$' : currency === 'RMB' ? '¥' : '£';
  
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>{title}</Typography>
      <Typography variant="h4">{`${symbol}${value.toFixed(2)}`}</Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
};

export const Dashboard: React.FC = () => {
  const {
    data,
    loading,
    error,
    filters,
    updateFilters,
    handleFileUpload,
    fetchExpenseDetails,
    selectedDetail,
    availableCategories,
    availableYears,
  } = useExpenseData();

  const [totalSpent, setTotalSpent] = useState(0);
  const [averagePerPeriod, setAveragePerPeriod] = useState(0);
  const [periodCount, setPeriodCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>('');
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  // Calculate summary statistics when data changes
  useEffect(() => {
    if (data?.barChartData?.length) {
      const total = data.barChartData.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const average = total / data.barChartData.length;
      
      setTotalSpent(total);
      setAveragePerPeriod(average);
      setPeriodCount(data.barChartData.length);
    }
  }, [data]);

  // Handle bar click to show expense details
  const handleBarClick = async (category: string, timePeriod: string) => {
    setSelectedCategory(category);
    setSelectedTimePeriod(timePeriod);
    setIsLoadingDetails(true);
    
    try {
      await fetchExpenseDetails(category, timePeriod);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3, ml: '280px' }}>
      {/* Controls sidebar */}
      <Controls
        filters={filters}
        onFilterChange={updateFilters}
        availableCategories={availableCategories}
        availableYears={availableYears}
        onFileUpload={handleFileUpload}
        loading={loading}
      />

      <Container maxWidth="xl">
        <Grid container spacing={3}>
          {/* Loading/Error/Empty states */}
          {loading && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            </Grid>
          )}
          
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
          
          {!data && !loading && !error && (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6">Upload a file to get started</Typography>
              </Paper>
            </Grid>
          )}

          {/* Summary Cards */}
          {data && (
            <>
              <Grid item xs={12} sm={6}>
                <SummaryCard
                  title="Total Spent"
                  value={totalSpent}
                  currency={filters.currency}
                  subtitle="During selected period"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <SummaryCard
                  title={`Average per ${filters.timePeriod}`}
                  value={averagePerPeriod}
                  currency={filters.currency}
                  subtitle={`Based on ${periodCount} periods`}
                />
              </Grid>
            </>
          )}

          {/* BAR CHART */}
          {data && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Expenses by Category</Typography>
                <BarChart 
                  data={data.barChartData} 
                  onBarClick={handleBarClick}
                />
              </Paper>
            </Grid>
          )}

          {/* Expense Details - Show when a bar is clicked */}
          {selectedDetail && selectedCategory && selectedTimePeriod && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <ExpenseDetails 
                  details={selectedDetail}
                  isLoading={isLoadingDetails}
                  selectedCategory={selectedCategory}
                  selectedTimePeriod={selectedTimePeriod}
                  currency={filters.currency}
                />
              </Paper>
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  );
}; 