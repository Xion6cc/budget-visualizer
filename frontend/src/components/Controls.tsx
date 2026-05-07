import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  FormControlLabel,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Divider,
  Typography,
  Checkbox,
  FormGroup,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { ExpenseFilters } from '../api/client';

const SECTION_LABEL_SX = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  color: '#94a3b8',
  mb: 1,
  display: 'block',
};

interface ControlsProps {
  filters: ExpenseFilters;
  onFilterChange: (filters: Partial<ExpenseFilters>) => void;
  onFileUpload: (file: File) => void;
  loading: boolean;
  availableCategories: string[];
  availableYears: number[];
  hideYear?: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  filters,
  onFilterChange,
  onFileUpload,
  loading,
  availableCategories,
  availableYears,
  hideYear,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      onFileUpload(event.target.files[0]);
      setSuccess(true);
    }
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const category = event.target.name;
    const isChecked = event.target.checked;
    const updatedCategories = isChecked
      ? [...filters.categories, category]
      : filters.categories.filter(c => c !== category);
    onFilterChange({ categories: updatedCategories });
  };

  const handleYearToggle = (year: number) => {
    const updatedYears = filters.years.includes(year)
      ? filters.years.filter(y => y !== year)
      : [...filters.years, year];
    onFilterChange({ years: updatedYears });
  };

  const handleSelectAllCategories = () => onFilterChange({ categories: availableCategories });
  const handleDeselectAllCategories = () => onFilterChange({ categories: [] });

  return (
    <Paper
      sx={{
        position: 'fixed',
        top: 52,
        left: 0,
        width: 220,
        height: 'calc(100vh - 52px)',
        p: '24px 16px',
        overflowY: 'auto',
        zIndex: 900,
        borderRadius: 0,
        borderTop: 'none',
        borderLeft: 'none',
        borderBottom: 'none',
      }}
    >
      {/* Upload */}
      <Typography sx={SECTION_LABEL_SX}>Data File</Typography>
      <Box
        component="label"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          border: '1.5px dashed #e2e8f0',
          borderRadius: '8px',
          width: '100%',
          py: 1,
          px: 1.5,
          fontSize: 13,
          color: '#94a3b8',
          cursor: 'pointer',
          mb: 3,
          transition: 'all 0.15s',
          '&:hover': {
            borderColor: '#6366f1',
            color: '#6366f1',
            backgroundColor: '#eef2ff',
          },
        }}
      >
        {loading ? <CircularProgress size={16} /> : (success ? 'Uploaded ✓' : '↑ Upload file')}
        <input
          type="file"
          ref={fileInputRef}
          hidden
          accept=".json,.jsonl"
          onChange={handleFileChange}
          onClick={(e) => {
            (e.target as HTMLInputElement).value = '';
            setSuccess(false);
            setError(null);
          }}
        />
      </Box>

      {/* Time Period */}
      <Typography sx={SECTION_LABEL_SX}>Period</Typography>
      <ToggleButtonGroup
        value={filters.timePeriod}
        exclusive
        onChange={(_: React.MouseEvent, value: string) => {
          if (value) onFilterChange({ timePeriod: value });
        }}
        fullWidth
        sx={{ mb: 3 }}
      >
        <ToggleButton value="month">Monthly</ToggleButton>
        <ToggleButton value="week">Weekly</ToggleButton>
        <ToggleButton value="year">Yearly</ToggleButton>
      </ToggleButtonGroup>

      {/* Currency */}
      <Typography sx={SECTION_LABEL_SX}>Currency</Typography>
      <ToggleButtonGroup
        value={filters.currency}
        exclusive
        onChange={(_: React.MouseEvent, value: string) => {
          if (value) onFilterChange({ currency: value });
        }}
        fullWidth
        sx={{ mb: 3 }}
      >
        <ToggleButton value="GBP">£</ToggleButton>
        <ToggleButton value="USD">$</ToggleButton>
        <ToggleButton value="EUR">€</ToggleButton>
        <ToggleButton value="RMB">¥</ToggleButton>
      </ToggleButtonGroup>

      {!hideYear && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography sx={SECTION_LABEL_SX}>Years</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 3 }}>
            {availableYears.map(year => (
              <ToggleButton
                key={year}
                value={year}
                selected={filters.years.includes(year)}
                onChange={() => handleYearToggle(year)}
                size="small"
                sx={{ minWidth: 52 }}
              >
                {year}
              </ToggleButton>
            ))}
          </Box>
        </>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Categories */}
      <Typography sx={SECTION_LABEL_SX}>Categories</Typography>
      <Box sx={{ mb: 1.5, display: 'flex', gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={handleSelectAllCategories}
          sx={{ flex: 1, fontSize: 12, py: 0.5, px: 1 }}
        >
          All
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={handleDeselectAllCategories}
          sx={{ flex: 1, fontSize: 12, py: 0.5, px: 1 }}
        >
          None
        </Button>
      </Box>

      <FormGroup>
        {availableCategories.map(category => (
          <FormControlLabel
            key={category}
            control={
              <Checkbox
                checked={filters.categories.includes(category)}
                onChange={handleCategoryChange}
                name={category}
                size="small"
              />
            }
            label={
              <Typography sx={{ fontSize: 13, color: '#64748b' }}>{category}</Typography>
            }
            sx={{ mb: 0.5, ml: 0, mr: 0 }}
          />
        ))}
      </FormGroup>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)}>
        <Alert severity="success" onClose={() => setSuccess(false)}>File uploaded successfully!</Alert>
      </Snackbar>
    </Paper>
  );
};
