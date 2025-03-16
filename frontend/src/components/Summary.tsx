import React from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';

interface SummaryProps {
  data?: {
    total_spent: number;
    average_spent: number;
    currency_symbol: string;
  };
}

export const Summary: React.FC<SummaryProps> = ({ data }) => {
  if (!data) {
    return null;
  }

  const { total_spent, average_spent, currency_symbol } = data;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Total Spent
            </Typography>
            <Typography variant="h4">
              {currency_symbol}{total_spent.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2, height: '100%' }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Average per Period
            </Typography>
            <Typography variant="h4">
              {currency_symbol}{average_spent.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}; 