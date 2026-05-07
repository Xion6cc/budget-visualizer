import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepIconProps,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  FormControlLabel,
  TextField,
  Chip,
  Collapse,
  Divider,
} from '@mui/material';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

// ── Design tokens ───────────────────────────────────────────────────────────
const BRAND = '#6366f1';
const BRAND_LIGHT = '#eef2ff';
const BRAND_DARK = '#4338ca';
const MUTED = '#94a3b8';
const MUTED2 = '#64748b';
const BORDER = '#e2e8f0';
const DANGER = '#ef4444';
const DANGER_BG = '#fef2f2';

// ── Reusable sx shortcuts ────────────────────────────────────────────────────
const PRIMARY_BTN_SX = {
  bgcolor: BRAND,
  color: '#fff',
  px: '28px',
  py: '10px',
  fontSize: 14,
  borderRadius: '8px',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: 'none',
  '&:hover': { bgcolor: BRAND_DARK, boxShadow: 'none' },
  '&.Mui-disabled': { bgcolor: '#c7d2fe', color: '#fff' },
};

const GHOST_BTN_SX = {
  color: MUTED2,
  fontSize: 13,
  fontWeight: 500,
  textTransform: 'none',
  borderRadius: '8px',
  px: 2,
  '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' },
};

const OUTLINED_BTN_SX = {
  border: `1.5px solid ${BORDER}`,
  color: MUTED2,
  fontSize: 13,
  fontWeight: 500,
  textTransform: 'none',
  borderRadius: '8px',
  px: 2,
  '&:hover': { border: `1.5px solid ${BRAND}`, color: BRAND, bgcolor: BRAND_LIGHT },
};

const DROP_BTN_SX = {
  color: DANGER,
  fontSize: 13,
  fontWeight: 500,
  textTransform: 'none',
  borderRadius: '8px',
  px: 2,
  '&:hover': { bgcolor: DANGER_BG },
};

const SECTION_LABEL_SX = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  color: MUTED,
  mb: 1.5,
};

const INFO_BANNER_SX = {
  bgcolor: BRAND_LIGHT,
  borderLeft: `3px solid ${BRAND}`,
  borderRadius: '6px',
  px: 2,
  py: 1.5,
  mb: 2,
};

const OPTION_BOX_SX = (active: boolean) => ({
  border: `1.5px solid ${active ? BRAND : BORDER}`,
  borderRadius: '10px',
  p: 2.5,
  mb: 2,
  bgcolor: active ? BRAND_LIGHT : '#fff',
  transition: 'border-color 0.15s, background-color 0.15s',
});

const CAT_BTN_SX = (selected: boolean) => ({
  border: `1.5px solid ${selected ? BRAND : BORDER}`,
  borderRadius: '8px',
  color: selected ? BRAND : MUTED2,
  bgcolor: selected ? BRAND_LIGHT : '#fff',
  fontSize: 13,
  fontWeight: 500,
  textTransform: 'none' as const,
  px: 2,
  py: 0.75,
  '&:hover': { border: `1.5px solid ${BRAND}`, color: BRAND, bgcolor: BRAND_LIGHT },
});

// ── Custom Stepper Icon ──────────────────────────────────────────────────────
const CustomStepIcon: React.FC<StepIconProps> = ({ active, completed, icon }) => {
  const size = 32;
  let bg = '#fff';
  let border = `2px solid ${BORDER}`;
  let color = MUTED;

  if (completed) { bg = BRAND; border = `2px solid ${BRAND}`; color = '#fff'; }
  else if (active) { bg = BRAND; border = `2px solid ${BRAND}`; color = '#fff'; }

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: bg,
        border,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        fontWeight: 700,
        color,
        flexShrink: 0,
      }}
    >
      {completed ? <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1 }}>✓</span> : icon}
    </Box>
  );
};

// ── Interfaces ───────────────────────────────────────────────────────────────
interface BankSelection {
  filename: string;
  bank_config: string;
}

interface Transaction {
  index: number;
  Date: string;
  Description: string;
  Amount: number;
  Currency: string;
  Card: string;
  Category?: string;
}

interface AllTransaction {
  Date: string;
  Description: string;
  Amount: number;
  Currency: string;
  Card: string;
  Category?: string | null;
}

interface BankStatus {
  provider: string;
  display_name: string;
  status: 'connected' | 'expiring' | 'expired' | 'disconnected';
}

// ── Component ────────────────────────────────────────────────────────────────
const ImportLab: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 0: File loading
  const [existingJsonFile, setExistingJsonFile] = useState<File | null>(null);
  const [csvFiles, setCsvFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [bankConfigs, setBankConfigs] = useState<string[]>([]);
  const [existingCount, setExistingCount] = useState(0);

  // Step 1: Bank config selection + bank connection status
  const [bankSelections, setBankSelections] = useState<BankSelection[]>([]);
  const [bankStatuses, setBankStatuses] = useState<BankStatus[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(new Set());
  const [fetchFromDate, setFetchFromDate] = useState<string>(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return first.toISOString().split('T')[0];
  });
  const [fetchToDate, setFetchToDate] = useState<string>(() => {
    const now = new Date();
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return last.toISOString().split('T')[0];
  });

  // Step 2 (Review): All loaded transactions
  const [allTransactions, setAllTransactions] = useState<AllTransaction[]>([]);
  const [expandedBank, setExpandedBank] = useState<string | null>(null);

  // Step 3 (Label): Categorization state
  const [totalNew, setTotalNew] = useState(0);
  const [autoCategorized, setAutoCategorized] = useState(0);
  const [uncategorized, setUncategorized] = useState<Transaction[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [saveToMapping, setSaveToMapping] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [editedDescription, setEditedDescription] = useState('');

  const steps = ['Load Files', 'Configure', 'Review Data', 'Label Transactions', 'Export'];

  useEffect(() => {
    handleAutoLoad();
    fetchBankStatuses();
  }, []);

  useEffect(() => {
    if (currentTransaction) {
      setEditedDescription(currentTransaction.Description);
    }
  }, [currentIndex, uncategorized]);

  const fetchBankStatuses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/banks/connections`);
      const statuses: BankStatus[] = response.data;
      setBankStatuses(statuses);
      const active = new Set(
        statuses
          .filter(b => b.status === 'connected' || b.status === 'expiring')
          .map(b => b.provider)
      );
      setSelectedProviders(active);
    } catch {
      // Bank connections are optional; silently ignore
    }
  };

  const handleAutoLoad = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/import/auto-load`);

      setUploadedFiles(response.data.uploaded_files);
      setBankConfigs(response.data.bank_configs);
      setExistingCount(response.data.existing_transaction_count);

      const selections = response.data.uploaded_files.map((filename: string) => {
        let bank_config = '';
        const fileBaseName = filename.toLowerCase().replace('.csv', '').replace('.xlsx', '');
        for (const config of response.data.bank_configs) {
          const configNormalized = config.toLowerCase();
          if (
            fileBaseName === configNormalized ||
            fileBaseName.replace(/_/g, '') === configNormalized.replace(/_/g, '')
          ) {
            bank_config = config;
            break;
          }
        }
        return { filename, bank_config };
      });
      setBankSelections(selections);

      const catResponse = await axios.get(`${API_BASE_URL}/import/categories`);
      setCategories(catResponse.data.categories);

      if (response.data.existing_json_file) {
        setExistingJsonFile({ name: response.data.existing_json_file } as File);
      }

      setActiveStep(1);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to auto-load files');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!existingJsonFile || csvFiles.length === 0) {
      setError('Please upload both existing JSON and CSV/Excel files');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('existing_json', existingJsonFile);
      csvFiles.forEach(file => {
        formData.append('csv_files', file);
      });

      const response = await axios.post(`${API_BASE_URL}/import/process`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadedFiles(response.data.uploaded_files);
      setBankConfigs(response.data.bank_configs);
      setExistingCount(response.data.existing_transaction_count);

      const selections = response.data.uploaded_files.map((filename: string) => ({
        filename,
        bank_config: '',
      }));
      setBankSelections(selections);

      const catResponse = await axios.get(`${API_BASE_URL}/import/categories`);
      setCategories(catResponse.data.categories);

      setActiveStep(1);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload files');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchFromBanks = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/banks/fetch`, {
        from_date: fetchFromDate,
        to_date: fetchToDate,
        providers: Array.from(selectedProviders),
      });

      setTotalNew(response.data.total_new);
      setAutoCategorized(response.data.auto_categorized);
      setUncategorized(response.data.uncategorized);
      setAllTransactions(response.data.all_transactions ?? []);
      setCurrentIndex(0);

      if (categories.length === 0) {
        const catResponse = await axios.get(`${API_BASE_URL}/import/categories`);
        setCategories(catResponse.data.categories);
      }

      setActiveStep(2);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch from banks');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessWithBankConfigs = async () => {
    const incomplete = bankSelections.some(s => !s.bank_config);
    if (incomplete) {
      setError('Please select bank config for all files');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/import/auto-categorize`, bankSelections);

      setTotalNew(response.data.total_new);
      setAutoCategorized(response.data.auto_categorized);
      setUncategorized(response.data.uncategorized);
      setAllTransactions(response.data.all_transactions ?? []);
      setCurrentIndex(0);

      setActiveStep(2);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process files');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueFromReview = () => {
    if (uncategorized.length === 0) {
      setActiveStep(4);
    } else {
      setActiveStep(3);
    }
  };

  const handleLabel = async (category: string) => {
    setLoading(true);
    setError(null);

    try {
      await axios.post(`${API_BASE_URL}/import/label`, {
        index: currentIndex,
        category: category,
        save_to_mapping: saveToMapping,
        description: editedDescription,
      });

      const updated = [...uncategorized];
      updated.splice(currentIndex, 1);
      setUncategorized(updated);

      setSelectedCategory('');
      setSaveToMapping(false);
      setEditedDescription('');

      if (updated.length === 0) {
        setActiveStep(4);
      } else if (currentIndex >= updated.length) {
        setCurrentIndex(updated.length - 1);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to label transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (currentIndex < uncategorized.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedCategory('');
      setSaveToMapping(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedCategory('');
      setSaveToMapping(false);
    }
  };

  const handleDrop = async () => {
    setLoading(true);
    setError(null);

    try {
      await axios.post(`${API_BASE_URL}/import/drop`, { index: currentIndex });

      const updated = [...uncategorized];
      updated.splice(currentIndex, 1);
      setUncategorized(updated);

      setSelectedCategory('');
      setSaveToMapping(false);
      setEditedDescription('');

      if (updated.length === 0) {
        setActiveStep(4);
      } else if (currentIndex >= updated.length) {
        setCurrentIndex(updated.length - 1);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to drop transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/import/export`, { responseType: 'text' });

      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = response.headers['content-disposition'];
      const filenameMatch = contentDisposition?.match(/filename=(.+)/);
      const filename = filenameMatch ? filenameMatch[1] : `expense_${new Date().toISOString().split('T')[0]}.json`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setActiveStep(0);
      setExistingJsonFile(null);
      setCsvFiles([]);
      setUploadedFiles([]);
      setBankSelections([]);
      setUncategorized([]);
      setAllTransactions([]);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to export');
    } finally {
      setLoading(false);
    }
  };

  // Group all transactions by Card for the Review step
  const transactionsByBank = useMemo(() => {
    const groups: Record<string, AllTransaction[]> = {};
    for (const t of allTransactions) {
      const key = t.Card || 'Unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    }
    return groups;
  }, [allTransactions]);

  const currentTransaction = uncategorized[currentIndex];

  // ── Bank status chip color ────────────────────────────────────────────────
  const bankChipSx = (status: BankStatus['status']) => {
    if (status === 'connected') return { bgcolor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' };
    if (status === 'expiring') return { bgcolor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' };
    return { bgcolor: '#f8fafc', color: MUTED2, border: `1px solid ${BORDER}` };
  };

  return (
    <Box sx={{ p: '28px', ml: '220px', minHeight: '100vh' }}>
      <Typography sx={{ fontSize: 20, fontWeight: 700, color: '#0f172a', mb: 3 }}>
        Import & Label Transactions
      </Typography>

      {/* ── Custom Stepper ── */}
      <Stepper
        activeStep={activeStep}
        sx={{
          mb: 4,
          '& .MuiStepConnector-line': { borderColor: BORDER, borderTopWidth: 2 },
          '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': { borderColor: BRAND },
          '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': { borderColor: BRAND },
        }}
      >
        {steps.map((label, idx) => (
          <Step key={label}>
            <StepLabel
              StepIconComponent={CustomStepIcon}
              onClick={() => { if (idx < activeStep) setActiveStep(idx); }}
              sx={{
                cursor: idx < activeStep ? 'pointer' : 'default',
                '& .MuiStepLabel-label': {
                  fontSize: 13,
                  fontWeight: 500,
                  color: MUTED2,
                  '&.Mui-active': { color: BRAND, fontWeight: 600 },
                  '&.Mui-completed': { color: BRAND, fontWeight: 600 },
                },
                '&:hover .MuiStepLabel-label': idx < activeStep ? { color: BRAND } : {},
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: '8px', fontSize: 13 }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* ── Step 0: Auto-loading Files ── */}
      {activeStep === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0f172a', mb: 2 }}>
            Loading Files
          </Typography>

          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <CircularProgress size={20} sx={{ color: BRAND }} />
              <Typography sx={{ fontSize: 13, color: MUTED2 }}>Auto-loading files from server...</Typography>
            </Box>
          )}

          {!loading && error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
              {error}
              <Button size="small" onClick={handleAutoLoad} sx={{ ml: 2, ...GHOST_BTN_SX }}>
                Retry
              </Button>
            </Alert>
          )}
        </Paper>
      )}

      {/* ── Step 1: Select Bank Configs ── */}
      {activeStep === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0f172a', mb: 2 }}>
            Select Bank Configuration
          </Typography>

          <Box sx={INFO_BANNER_SX}>
            <Typography sx={{ fontSize: 13, color: BRAND, fontWeight: 500 }}>
              Loaded from: <strong>{existingJsonFile?.name || 'Unknown'}</strong>
              &nbsp;·&nbsp;
              <strong>{existingCount}</strong> existing transactions
            </Typography>
          </Box>

          {/* Option A */}
          <Box sx={OPTION_BOX_SX(false)}>
            <Typography sx={{ ...SECTION_LABEL_SX }}>
              Option A — Fetch automatically from connected banks
            </Typography>

            {bankStatuses.filter(b => b.status === 'connected' || b.status === 'expiring').length > 0 ? (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {bankStatuses
                  .filter(b => b.status === 'connected' || b.status === 'expiring')
                  .map((b) => {
                    const isSelected = selectedProviders.has(b.provider);
                    return (
                      <Chip
                        key={b.provider}
                        label={b.display_name}
                        size="small"
                        onClick={() => {
                          const next = new Set(selectedProviders);
                          if (isSelected) next.delete(b.provider);
                          else next.add(b.provider);
                          setSelectedProviders(next);
                        }}
                        sx={{
                          fontSize: 12,
                          fontWeight: 500,
                          height: 28,
                          borderRadius: '999px',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          ...(isSelected
                            ? { bgcolor: BRAND, color: '#fff', border: `1.5px solid ${BRAND}` }
                            : { bgcolor: '#f8fafc', color: MUTED2, border: `1.5px solid ${BORDER}` }
                          ),
                          '&:hover': isSelected
                            ? { bgcolor: BRAND_DARK }
                            : { border: `1.5px solid ${BRAND}`, color: BRAND, bgcolor: BRAND_LIGHT },
                        }}
                      />
                    );
                  })}
              </Box>
            ) : (
              <Typography sx={{ fontSize: 13, color: MUTED, display: 'block', mb: 1.5 }}>
                No banks connected. Go to the Banks page to connect a bank.
              </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
              <TextField
                label="From"
                type="date"
                size="small"
                value={fetchFromDate}
                onChange={(e) => setFetchFromDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 13 } }}
              />
              <TextField
                label="To"
                type="date"
                size="small"
                value={fetchToDate}
                onChange={(e) => setFetchToDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 13 } }}
              />
            </Box>

            <Button
              variant="contained"
              onClick={handleFetchFromBanks}
              disabled={loading || selectedProviders.size === 0}
              sx={PRIMARY_BTN_SX}
            >
              {loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Fetch from Banks'}
            </Button>
          </Box>

          {/* Option B */}
          <Box sx={OPTION_BOX_SX(false)}>
            <Typography sx={{ ...SECTION_LABEL_SX }}>
              Option B — Process uploaded CSVs manually
            </Typography>

            <Box
              sx={{
                bgcolor: '#f0fdf4',
                borderLeft: '3px solid #22c55e',
                borderRadius: '6px',
                px: 2,
                py: 1.5,
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: 13, color: '#15803d', fontWeight: 500 }}>
                Auto-loaded {uploadedFiles.length} CSV file(s) from statements directory
              </Typography>
            </Box>

            <Box
              sx={{
                border: `1px solid ${BORDER}`,
                borderRadius: '8px',
                overflow: 'hidden',
                mb: 2,
              }}
            >
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: MUTED, py: 1.5, border: 0 }}>
                      Filename
                    </TableCell>
                    <TableCell sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: MUTED, py: 1.5, border: 0 }}>
                      Bank Config
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bankSelections.map((selection, idx) => (
                    <TableRow key={idx} sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ fontSize: 13, color: '#0f172a', borderColor: BORDER }}>
                        {selection.filename}
                      </TableCell>
                      <TableCell sx={{ borderColor: BORDER }}>
                        <FormControl fullWidth size="small">
                          <Select
                            value={selection.bank_config}
                            onChange={(e) => {
                              const updated = [...bankSelections];
                              updated[idx].bank_config = e.target.value;
                              setBankSelections(updated);
                            }}
                            sx={{ fontSize: 13, borderRadius: '8px' }}
                          >
                            {bankConfigs.map((config) => (
                              <MenuItem key={config} value={config} sx={{ fontSize: 13 }}>
                                {config}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button onClick={() => setActiveStep(0)} sx={GHOST_BTN_SX}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleProcessWithBankConfigs}
                disabled={loading}
                sx={PRIMARY_BTN_SX}
              >
                {loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Process & Continue'}
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* ── Step 2: Review Data ── */}
      {activeStep === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0f172a', mb: 2 }}>
            Review Loaded Data
          </Typography>

          <Box
            sx={{
              bgcolor: '#f0fdf4',
              borderLeft: '3px solid #22c55e',
              borderRadius: '6px',
              px: 2,
              py: 1.5,
              mb: 3,
            }}
          >
            <Typography sx={{ fontSize: 13, color: '#15803d', fontWeight: 500 }}>
              {totalNew} transactions loaded&nbsp;·&nbsp;
              {autoCategorized} auto-categorized&nbsp;·&nbsp;
              {uncategorized.length} need labelling
            </Typography>
          </Box>

          {Object.entries(transactionsByBank).map(([bankName, txns]) => {
            const dates = txns.map(t => t.Date).sort();
            const dateFrom = dates[0];
            const dateTo = dates[dates.length - 1];
            const isExpanded = expandedBank === bankName;

            return (
              <Paper
                key={bankName}
                sx={{
                  mb: 2,
                  overflow: 'hidden',
                  border: `1px solid ${BORDER}`,
                  borderRadius: '10px',
                  boxShadow: 'none',
                }}
              >
                <Box
                  sx={{
                    px: 2.5,
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                      {bankName}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: MUTED2, mt: 0.25 }}>
                      {dateFrom} → {dateTo}&nbsp;·&nbsp;{txns.length} transactions
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    onClick={() => setExpandedBank(isExpanded ? null : bankName)}
                    sx={OUTLINED_BTN_SX}
                  >
                    {isExpanded ? 'Hide' : 'View'}
                  </Button>
                </Box>

                <Collapse in={isExpanded}>
                  <Divider sx={{ borderColor: BORDER }} />
                  <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          {['Date', 'Description', 'Amount', 'Category'].map(col => (
                            <TableCell
                              key={col}
                              align={col === 'Amount' ? 'right' : 'left'}
                              sx={{
                                fontSize: 11,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.06em',
                                color: MUTED,
                                bgcolor: '#f8fafc',
                                borderColor: BORDER,
                                py: 1.25,
                              }}
                            >
                              {col}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {txns.map((t, i) => (
                          <TableRow key={i} sx={{ '&:last-child td': { border: 0 } }}>
                            <TableCell sx={{ fontSize: 13, color: MUTED2, borderColor: BORDER }}>{t.Date}</TableCell>
                            <TableCell sx={{ fontSize: 13, color: '#0f172a', borderColor: BORDER }}>{t.Description}</TableCell>
                            <TableCell align="right" sx={{ fontSize: 13, fontWeight: 500, color: '#0f172a', borderColor: BORDER }}>
                              {t.Currency} {t.Amount?.toFixed(2)}
                            </TableCell>
                            <TableCell sx={{ fontSize: 13, borderColor: BORDER }}>
                              {t.Category
                                ? <Chip label={t.Category} size="small" sx={{ fontSize: 11, height: 20, borderRadius: '999px', bgcolor: BRAND_LIGHT, color: BRAND }} />
                                : <Typography component="span" sx={{ fontSize: 13, color: MUTED }}>—</Typography>
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Collapse>
              </Paper>
            );
          })}

          <Box sx={{ mt: 3 }}>
            <Button variant="contained" onClick={handleContinueFromReview} sx={PRIMARY_BTN_SX}>
              {uncategorized.length === 0 ? 'Continue to Export →' : 'Continue to Label →'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* ── Step 3: Label Uncategorized ── */}
      {activeStep === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0f172a', mb: 2 }}>
            Label Uncategorized Transactions
          </Typography>

          <Box sx={INFO_BANNER_SX}>
            <Typography sx={{ fontSize: 13, color: BRAND, fontWeight: 500 }}>
              {totalNew} total new&nbsp;·&nbsp;{autoCategorized} auto-categorized&nbsp;·&nbsp;
              <strong>{uncategorized.length} remaining</strong>
            </Typography>
          </Box>

          {currentTransaction && (
            <Box>
              <Typography sx={{ fontSize: 12, color: MUTED, mb: 2 }}>
                Transaction {currentIndex + 1} of {uncategorized.length}
              </Typography>

              <Paper
                sx={{
                  p: 3,
                  mb: 3,
                  border: `1px solid ${BORDER}`,
                  borderRadius: '10px',
                  boxShadow: 'none',
                }}
              >
                <TextField
                  fullWidth
                  label="Description"
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 13 },
                    '& .MuiInputLabel-root': { fontSize: 13 },
                  }}
                  helperText="Edit the description if needed"
                />
                <Box sx={{ display: 'flex', gap: 4 }}>
                  <Box>
                    <Typography sx={{ ...SECTION_LABEL_SX }}>Date</Typography>
                    <Typography sx={{ fontSize: 14, color: '#0f172a', fontWeight: 500 }}>
                      {currentTransaction.Date}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ ...SECTION_LABEL_SX }}>Amount</Typography>
                    <Typography sx={{ fontSize: 14, color: '#0f172a', fontWeight: 500 }}>
                      {currentTransaction.Currency} {currentTransaction.Amount !== null && currentTransaction.Amount !== undefined ? currentTransaction.Amount.toFixed(2) : 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ ...SECTION_LABEL_SX }}>Card</Typography>
                    <Typography sx={{ fontSize: 14, color: MUTED2 }}>
                      {currentTransaction.Card || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Box sx={{ mb: 3 }}>
                <Typography sx={{ ...SECTION_LABEL_SX }}>Select Category</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {categories.map((cat) => (
                    <Button
                      key={cat}
                      variant="outlined"
                      onClick={() => handleLabel(cat)}
                      disabled={loading}
                      sx={CAT_BTN_SX(selectedCategory === cat)}
                    >
                      {cat}
                    </Button>
                  ))}
                </Box>
              </Box>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={saveToMapping}
                    onChange={(e) => setSaveToMapping(e.target.checked)}
                    size="small"
                    sx={{ color: BRAND, '&.Mui-checked': { color: BRAND } }}
                  />
                }
                label={
                  <Typography sx={{ fontSize: 13, color: MUTED2 }}>
                    Save this merchant to category mapping (auto-categorize in future)
                  </Typography>
                }
              />

              <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button onClick={handlePrevious} disabled={currentIndex === 0 || loading} sx={GHOST_BTN_SX}>
                  Previous
                </Button>
                <Button onClick={handleSkip} disabled={uncategorized.length === 1 || loading} sx={GHOST_BTN_SX}>
                  Skip
                </Button>
                <Button
                  onClick={handleDrop}
                  disabled={loading}
                  sx={DROP_BTN_SX}
                >
                  Drop Row
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* ── Step 4: Export ── */}
      {activeStep === 4 && (
        <Paper sx={{ p: 3 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0f172a', mb: 2 }}>
            Export Final Data
          </Typography>

          <Box
            sx={{
              bgcolor: '#f0fdf4',
              borderLeft: '3px solid #22c55e',
              borderRadius: '6px',
              px: 2,
              py: 1.5,
              mb: 3,
            }}
          >
            <Typography sx={{ fontSize: 13, color: '#15803d', fontWeight: 500 }}>
              All transactions have been processed and categorized!
            </Typography>
          </Box>

          <Typography sx={{ ...SECTION_LABEL_SX }}>Summary</Typography>
          <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
            {[
              { label: 'Existing', value: existingCount },
              { label: 'New', value: totalNew },
              { label: 'Total', value: existingCount + totalNew },
            ].map(({ label, value }) => (
              <Box key={label}>
                <Typography sx={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: MUTED, mb: 0.5 }}>
                  {label}
                </Typography>
                <Typography sx={{ fontSize: 28, fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>

          <Button variant="contained" onClick={handleExport} disabled={loading} sx={PRIMARY_BTN_SX}>
            {loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Download JSON'}
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default ImportLab;
