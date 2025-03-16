import React from 'react';
import { FormControl, InputLabel, MenuItem, Select, Chip, Box } from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';

interface MultiSelectProps {
  label: string;
  value: (string | number)[];
  onChange: (event: SelectChangeEvent<(string | number)[]>) => void;
  options: (string | number)[];
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  value,
  onChange,
  options,
}) => {
  return (
    <FormControl sx={{ minWidth: 200 }}>
      <InputLabel>{label}</InputLabel>
      <Select
        multiple
        value={value}
        onChange={onChange}
        label={label}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {selected.map((value) => (
              <Chip key={value} label={value} />
            ))}
          </Box>
        )}
      >
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}; 