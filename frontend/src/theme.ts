import { createTheme } from '@mui/material/styles';

const BRAND = '#6366f1';
const BRAND_LIGHT = '#eef2ff';
const BRAND_DARK = '#4338ca';
const BORDER = '#e2e8f0';
const BG = '#f8fafc';
const TEXT_PRIMARY = '#0f172a';
const TEXT_SECONDARY = '#64748b';
const TEXT_MUTED = '#94a3b8';

const theme = createTheme({
  palette: {
    primary: {
      main: BRAND,
      light: BRAND_LIGHT,
      dark: BRAND_DARK,
      contrastText: '#ffffff',
    },
    secondary: {
      main: TEXT_SECONDARY,
      contrastText: '#ffffff',
    },
    success: { main: '#10b981' },
    warning: { main: '#f59e0b' },
    error: { main: '#ef4444' },
    text: {
      primary: TEXT_PRIMARY,
      secondary: TEXT_SECONDARY,
      disabled: TEXT_MUTED,
    },
    background: {
      default: BG,
      paper: '#ffffff',
    },
    divider: BORDER,
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, color: TEXT_PRIMARY },
    h5: { fontWeight: 700, color: TEXT_PRIMARY },
    h6: { fontWeight: 600, color: TEXT_PRIMARY },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: TEXT_PRIMARY,
          boxShadow: 'none',
          borderBottom: `1px solid ${BORDER}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
          border: `1px solid ${BORDER}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
          border: `1px solid ${BORDER}`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: 14,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
        containedPrimary: {
          '&:hover': { backgroundColor: BRAND_DARK },
        },
        containedSecondary: {
          backgroundColor: BRAND,
          '&:hover': { backgroundColor: BRAND_DARK },
        },
        outlined: {
          borderColor: BORDER,
          color: TEXT_SECONDARY,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: BG,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.08em',
            color: TEXT_MUTED,
            padding: '12px 20px',
          },
        },
      },
    },
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root:hover': {
            backgroundColor: '#fafafa',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: BORDER,
          padding: '10px 20px',
          fontSize: 13,
          color: TEXT_PRIMARY,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: 13,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontSize: 13,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: BRAND },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: BRAND },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { fontSize: 13 },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: BORDER,
          '&.Mui-checked': { color: BRAND },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: BORDER },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: 13,
          color: TEXT_SECONDARY,
          border: 'none',
          borderRadius: '6px !important',
          padding: '4px 10px',
          '&.Mui-selected': {
            backgroundColor: '#ffffff',
            color: TEXT_PRIMARY,
            fontWeight: 600,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            '&:hover': { backgroundColor: '#ffffff' },
          },
          '&:hover': { backgroundColor: 'transparent' },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          backgroundColor: BG,
          borderRadius: 8,
          padding: 2,
          border: `1px solid ${BORDER}`,
        },
      },
    },
  },
});

export default theme;
