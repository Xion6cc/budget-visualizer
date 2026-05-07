import React from 'react';
import { ThemeProvider } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import Layout from './layouts/Layout';
import { Dashboard } from './pages/Dashboard';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LatestView from './pages/LatestView';
import ImportLab from './pages/ImportLab';
import BankConnections from './pages/BankConnections';
import { ExpenseDataProvider } from './context/ExpenseDataContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ExpenseDataProvider>
        <BrowserRouter>
      <Layout>
            <Routes>
              <Route path="/" element={<LatestView />} />
              <Route path="/latest" element={<LatestView />} />
              <Route path="/trend" element={<Dashboard />} />
              <Route path="/import" element={<ImportLab />} />
              <Route path="/banks" element={<BankConnections />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
      </Layout>
        </BrowserRouter>
      </ExpenseDataProvider>
    </ThemeProvider>
  );
}

export default App; 