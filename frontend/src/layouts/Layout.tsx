import React from 'react';
import { Box, AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_HEIGHT = 52;

const navItems = [
  { label: 'Latest', path: '/latest' },
  { label: 'Trend', path: '/trend' },
  { label: 'Banks', path: '/banks' },
  { label: 'Import', path: '/import' },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || (path === '/latest' && location.pathname === '/');

  return (
    <>
      <AppBar position="fixed" sx={{ height: NAV_HEIGHT, zIndex: 1100 }}>
        <Toolbar sx={{ minHeight: `${NAV_HEIGHT}px !important`, px: 3 }}>
          <Typography
            sx={{
              flexGrow: 1,
              fontWeight: 700,
              fontSize: 16,
              color: 'primary.main',
              letterSpacing: '-0.01em',
            }}
          >
            Budget Visualizer
          </Typography>

          {navItems.map(({ label, path }) => {
            const active = isActive(path);
            return (
              <Button
                key={path}
                onClick={() => navigate(path)}
                disableRipple
                sx={{
                  px: 2,
                  height: NAV_HEIGHT,
                  borderRadius: 0,
                  fontSize: 14,
                  fontWeight: 500,
                  color: active ? 'primary.main' : 'text.secondary',
                  borderBottom: '2px solid',
                  borderColor: active ? 'primary.main' : 'transparent',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: 'text.primary',
                  },
                }}
              >
                {label}
              </Button>
            );
          })}
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, pt: `${NAV_HEIGHT}px` }}>
        {children}
      </Box>
    </>
  );
};

export default Layout;
