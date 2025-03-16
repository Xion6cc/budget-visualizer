import React, { useState } from 'react';
import { Button, Box, Typography, CircularProgress } from '@mui/material';

interface FileUploadProps {
  onFileUpload: (file: File) => Promise<void>;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setFileName(file.name);
    setError(null);
    setIsUploading(true);

    try {
      await onFileUpload(file);
    } catch (err) {
      setError(`Error uploading file: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Upload Expense Data
      </Typography>
      
      <input
        accept=".json,.jsonl"
        style={{ display: 'none' }}
        id="raised-button-file"
        type="file"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      
      <label htmlFor="raised-button-file">
        <Button
          variant="contained"
          component="span"
          startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : null}
          disabled={isUploading}
          fullWidth
        >
          {isUploading ? 'Uploading...' : 'Upload File'}
        </Button>
      </label>
      
      {fileName && !error && (
        <Typography variant="body2" sx={{ mt: 1, color: 'success.main' }}>
          Successfully uploaded: {fileName}
        </Typography>
      )}
      
      {error && (
        <Typography variant="body2" sx={{ mt: 1, color: 'error.main' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}; 