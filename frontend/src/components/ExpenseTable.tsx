import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
} from '@mui/material';
import { ExpenseDetail } from '../api/client';

interface ExpenseTableProps {
  data: ExpenseDetail[];
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({ data }) => {
  return (
    <>
      <Typography
        sx={{ fontSize: 13, fontWeight: 600, color: '#0f172a', mb: 1 }}
      >
        Expense Details
      </Typography>
      <Box
        sx={{
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          mt: 2,
        }}
      >
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Amount</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 500, color: '#0f172a' }}
                  >
                    £{row.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
};
