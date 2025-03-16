import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  FormControlLabel,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Divider,
  Typography,
  SelectChangeEvent,
  Checkbox,
  FormGroup,
  ToggleButton,
  styled,
} from '@mui/material';
import { ExpenseFilters } from '../api/client';

// Styled components for better spacing
const StyledFormControl = styled(FormControl)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  width: '100%',
}));

const StyledToggleButton = styled(ToggleButton)(({ theme }) => ({
  margin: theme.spacing(0.5),
  minWidth: '60px',
}));

const CategoryLabel = styled(FormControlLabel)(({ theme }) => ({
  width: '100%',
  marginLeft: 0,
  marginRight: 0,
  '& .MuiFormControlLabel-label': {
    width: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}));

interface ControlsProps {
  filters: ExpenseFilters;
  onFilterChange: (filters: Partial<ExpenseFilters>) => void;
  onFileUpload: (file: File) => void;
  loading: boolean;
  availableCategories: string[];
  availableYears: number[];
}

export const Controls: React.FC<ControlsProps> = ({
  filters,
  onFilterChange,
  onFileUpload,
  loading,
  availableCategories,
  availableYears,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      onFileUpload(event.target.files[0]);
      setSuccess(true);
    }
  };

  // Handle time period change
  const handleTimePeriodChange = (event: SelectChangeEvent) => {
    onFilterChange({ timePeriod: event.target.value });
  };

  // Handle currency change
  const handleCurrencyChange = (event: SelectChangeEvent) => {
    onFilterChange({ currency: event.target.value });
  };

  // Handle category selection
  const handleCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const category = event.target.name;
    const isChecked = event.target.checked;
    
    const updatedCategories = isChecked
      ? [...filters.categories, category]
      : filters.categories.filter(c => c !== category);
    
    onFilterChange({ categories: updatedCategories });
  };

  // Handle year toggle
  const handleYearToggle = (year: number) => {
    const updatedYears = filters.years.includes(year)
      ? filters.years.filter(y => y !== year)
      : [...filters.years, year];
    
    onFilterChange({ years: updatedYears });
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '250px',
        height: '100vh',
        p: 3,
        overflowY: 'auto',
        zIndex: 1000,
        borderRadius: 0,
      }}
    >
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Filters
      </Typography>

      {/* File Upload Button */}
      <Button
        variant="contained"
        component="label"
        disabled={loading}
        color={success ? 'success' : 'primary'}
        fullWidth
        size="large"
        sx={{ mb: 3, py: 1.5 }}
      >
        {loading ? <CircularProgress size={24} /> : 'UPLOAD FILE'}
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
      </Button>

      {/* Time Period */}
      <StyledFormControl>
        <InputLabel>Time Period</InputLabel>
        <Select
          value={filters.timePeriod}
          label="Time Period"
          onChange={handleTimePeriodChange}
        >
          <MenuItem value="month">Monthly</MenuItem>
          <MenuItem value="week">Weekly</MenuItem>
          <MenuItem value="year">Yearly</MenuItem>
        </Select>
      </StyledFormControl>

      {/* Currency */}
      <StyledFormControl>
        <InputLabel>Currency</InputLabel>
        <Select
          value={filters.currency}
          label="Currency"
          onChange={handleCurrencyChange}
        >
          <MenuItem value="GBP">GBP (£)</MenuItem>
          <MenuItem value="USD">USD ($)</MenuItem>
          <MenuItem value="EUR">EUR (€)</MenuItem>
          <MenuItem value="RMB">RMB (¥)</MenuItem>
        </Select>
      </StyledFormControl>

      <Divider sx={{ my: 3 }} />

      {/* Years */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Years
      </Typography>
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', mx: -0.5 }}>
        {availableYears.map(year => (
          <StyledToggleButton
            key={year}
            value={year}
            selected={filters.years.includes(year)}
            onChange={() => handleYearToggle(year)}
            size="small"
          >
            {year}
          </StyledToggleButton>
        ))}
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Categories */}
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Categories
      </Typography>
      <FormGroup sx={{ mb: 3 }}>
        {availableCategories.map(category => (
          <CategoryLabel
            key={category}
            control={
              <Checkbox
                checked={filters.categories.includes(category)}
                onChange={handleCategoryChange}
                name={category}
              />
            }
            label={category}
            sx={{ mb: 1 }}
          />
        ))}
      </FormGroup>

      {/* Error Notification */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      {/* Success Notification */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          File uploaded successfully!
        </Alert>
      </Snackbar>
    </Paper>
  );
}; 