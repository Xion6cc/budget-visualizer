import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography,
  Box
} from '@mui/material';
import { ExpenseDetail } from '../api/client';

interface ExpenseDetailsProps {
  details: ExpenseDetail[] | null;
  isLoading: boolean;
  selectedCategory: string;
  selectedTimePeriod: string;
  currency: string;
}

// Currency symbol mapping
const CURRENCY_SYMBOLS: Record<string, string> = {
  'GBP': '£',
  'USD': '$',
  'EUR': '€',
  'RMB': '¥'
};

export const ExpenseDetails: React.FC<ExpenseDetailsProps> = ({ 
  details, 
  isLoading, 
  selectedCategory,
  selectedTimePeriod,
  currency
}) => {
  // Get the appropriate currency symbol
  const currencySymbol = CURRENCY_SYMBOLS[currency] || '£';
  
  // Calculate total amount
  const totalAmount = details?.reduce((sum, item) => sum + item.amount, 0) || 0;
  
  if (isLoading) {
    return <Typography>Loading expense details...</Typography>;
  }
  
  if (!details || details.length === 0) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1">
          No expense details available. Click on a bar in the chart to view details.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        {selectedCategory} Expenses for {selectedTimePeriod}
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Total: {currencySymbol}{totalAmount.toFixed(2)}
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount ({currencySymbol})</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {details.map((detail, index) => (
              <TableRow key={index}>
                <TableCell>{detail.date}</TableCell>
                <TableCell>{detail.description}</TableCell>
                <TableCell align="right">{currencySymbol}{detail.amount.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}; 