import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { usePlaidLink } from 'react-plaid-link';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

interface BankConnection {
  provider: string;
  display_name: string;
  status: 'connected' | 'expiring' | 'expired' | 'disconnected';
  expires_at: string | null;
  days_left: number | null;
  account_count: number;
  source: 'truelayer' | 'plaid';
}

interface PlaidConnection {
  item_id: string;
  institution_name: string;
  account_count: number;
  connected_at: string;
}

// ── Design tokens ─────────────────────────────────────────────────────────────
const BRAND = '#6366f1';
const BRAND_DARK = '#4338ca';
const BORDER = '#e2e8f0';
const MUTED = '#94a3b8';
const MUTED2 = '#64748b';

const STATUS_STYLES: Record<BankConnection['status'], { label: (d: number | null) => string; bg: string; color: string; border: string }> = {
  connected:    { label: () => 'Connected',              bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  expiring:     { label: (d) => `Expiring in ${d}d`,     bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  expired:      { label: () => 'Expired — re-connect',   bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
  disconnected: { label: () => 'Not connected',          bg: '#f8fafc', color: MUTED2,    border: BORDER   },
};

const TABLE_HEAD_CELL_SX = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
  color: MUTED,
  bgcolor: '#f8fafc',
  borderColor: BORDER,
  py: 1.5,
};

const TABLE_CELL_SX = { fontSize: 13, borderColor: BORDER };

const CONNECT_BTN_SX = {
  backgroundColor: BRAND,
  color: '#fff',
  fontSize: 13,
  fontWeight: 600,
  py: '6px',
  px: '14px',
  borderRadius: '8px',
  textTransform: 'none' as const,
  boxShadow: 'none',
  '&:hover': { backgroundColor: BRAND_DARK, boxShadow: 'none' },
};

const DISCONNECT_BTN_SX = {
  fontSize: 13,
  py: '6px',
  px: '14px',
  borderRadius: '8px',
  textTransform: 'none' as const,
  borderColor: BORDER,
  color: MUTED2,
  '&:hover': { borderColor: '#ef4444', color: '#ef4444', backgroundColor: 'transparent' },
};

const StatusChip: React.FC<{ status: BankConnection['status']; daysLeft: number | null }> = ({ status, daysLeft }) => {
  const s = STATUS_STYLES[status];
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        fontSize: 12,
        fontWeight: 500,
        padding: '3px 10px',
        borderRadius: '999px',
        border: `1px solid ${s.border}`,
        backgroundColor: s.bg,
        color: s.color,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label(daysLeft)}
    </Box>
  );
};

// ── Plaid Link wrapper ─────────────────────────────────────────────────────────
const PlaidLinkButton: React.FC<{ onSuccess: (publicToken: string, metadata: any) => void; disabled?: boolean }> = ({ onSuccess, disabled }) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);

  const fetchLinkToken = async () => {
    setFetching(true);
    setTokenError(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/plaid/link-token`);
      setLinkToken(res.data.link_token);
    } catch (err: any) {
      setTokenError(err.response?.data?.detail || 'Failed to create Plaid link token');
    } finally {
      setFetching(false);
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken || '',
    onSuccess,
  });

  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

  if (tokenError) {
    return <Typography sx={{ fontSize: 12, color: '#ef4444' }}>{tokenError}</Typography>;
  }

  return (
    <Button
      variant="contained"
      onClick={fetchLinkToken}
      disabled={disabled || fetching}
      sx={CONNECT_BTN_SX}
    >
      {fetching ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Connect US Bank'}
    </Button>
  );
};

// ── Main component ─────────────────────────────────────────────────────────────
const BankConnections: React.FC = () => {
  const [connections, setConnections] = useState<BankConnection[]>([]);
  const [plaidConnections, setPlaidConnections] = useState<PlaidConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchConnections = async () => {
    const [tlResult, plaidResult] = await Promise.allSettled([
      axios.get(`${API_BASE_URL}/banks/connections`),
      axios.get(`${API_BASE_URL}/plaid/connections`),
    ]);
    if (tlResult.status === 'fulfilled') setConnections(tlResult.value.data);
    if (plaidResult.status === 'fulfilled') setPlaidConnections(plaidResult.value.data);
  };

  useEffect(() => {
    fetchConnections().catch(() => {});
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleTrueLayerConnect = async (provider: string) => {
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/banks/auth-url`, { params: { provider } });
      const tab = window.open(response.data.url, '_blank');
      setConnectingProvider(provider);

      const initialConn = connections.find(c => c.provider === provider);
      const initialExpiresAt = initialConn?.expires_at ?? null;

      pollRef.current = setInterval(async () => {
        try {
          const res = await axios.get(`${API_BASE_URL}/banks/connections`);
          const conn = res.data.find((c: BankConnection) => c.provider === provider);
          const gotFreshToken =
            conn &&
            conn.status !== 'disconnected' &&
            conn.expires_at !== initialExpiresAt;
          if (gotFreshToken) {
            clearInterval(pollRef.current!);
            pollRef.current = null;
            setConnectingProvider(null);
            setConnections(res.data);
            tab?.close();
          }
        } catch {
          // keep polling
        }
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate auth URL');
    }
  };

  const handleTrueLayerDisconnect = async (provider: string) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_BASE_URL}/banks/connections/${provider}`);
      await fetchConnections();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaidSuccess = useCallback(async (publicToken: string, metadata: any) => {
    setError(null);
    try {
      await axios.post(`${API_BASE_URL}/plaid/exchange-token`, {
        public_token: publicToken,
        institution_name: metadata.institution?.name || 'Unknown',
        institution_id: metadata.institution?.institution_id || '',
      });
      await fetchConnections();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to connect via Plaid');
    }
  }, []);

  const handlePlaidDisconnect = async (itemId: string) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_BASE_URL}/plaid/connections/${itemId}`);
      await fetchConnections();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to disconnect Plaid bank');
    } finally {
      setLoading(false);
    }
  };

  // Only TrueLayer entries for the UK table
  const tlConnections = connections.filter(c => c.source === 'truelayer');

  return (
    <Box sx={{ p: '28px' }}>
      <Typography sx={{ fontSize: 22, fontWeight: 700, color: '#0f172a', mb: 0.5 }}>
        Bank Connections
      </Typography>
      <Typography sx={{ fontSize: 14, color: MUTED, mb: 3 }}>
        Connect UK banks via TrueLayer and US banks via Plaid. Once connected, transactions
        are fetched automatically in the Import tab.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {connectingProvider && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: '8px' }} icon={<CircularProgress size={16} />}>
          Waiting for <strong>{connectingProvider}</strong> authentication… complete it in the new browser tab.
        </Alert>
      )}

      {/* ── UK Banks (TrueLayer) ── */}
      <Box sx={{ mb: 4 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0f172a', mb: 0.5 }}>
          UK Banks
        </Typography>
        <Typography sx={{ fontSize: 13, color: MUTED2, mb: 2 }}>
          Via TrueLayer Open Banking.{' '}
          <a href="https://console.truelayer.com" target="_blank" rel="noreferrer" style={{ color: BRAND }}>
            Get free credentials at console.truelayer.com
          </a>
          , set redirect URI to <code>http://localhost:8000/banks/callback</code>, then add{' '}
          <code>client_id</code> / <code>client_secret</code> to <code>config/bank_connections.json</code>.
        </Typography>

        <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
          <Table>
            <TableHead>
              <TableRow>
                {['Bank', 'Status', 'Accounts', 'Token expires', 'Actions'].map(h => (
                  <TableCell key={h} sx={TABLE_HEAD_CELL_SX}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tlConnections.map((conn) => (
                <TableRow key={conn.provider} sx={{ height: 56 }}>
                  <TableCell sx={TABLE_CELL_SX}>
                    <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                      {conn.display_name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={TABLE_CELL_SX}>
                    <StatusChip status={conn.status} daysLeft={conn.days_left} />
                  </TableCell>
                  <TableCell sx={TABLE_CELL_SX}>
                    {conn.account_count > 0 ? `${conn.account_count} account(s)` : '—'}
                  </TableCell>
                  <TableCell sx={TABLE_CELL_SX}>
                    {conn.expires_at ? new Date(conn.expires_at).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell sx={TABLE_CELL_SX}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleTrueLayerConnect(conn.provider)}
                        disabled={connectingProvider === conn.provider || loading}
                        sx={CONNECT_BTN_SX}
                      >
                        {conn.status === 'disconnected' ? 'Connect' : 'Re-connect'}
                      </Button>
                      {conn.status !== 'disconnected' && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleTrueLayerDisconnect(conn.provider)}
                          disabled={loading}
                          sx={DISCONNECT_BTN_SX}
                        >
                          Disconnect
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* ── US Banks (Plaid) ── */}
      <Box>
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#0f172a', mb: 0.5 }}>
          US Banks
        </Typography>
        <Typography sx={{ fontSize: 13, color: MUTED2, mb: 2 }}>
          Via Plaid — supports Chase, Discover, and 12,000+ US institutions.{' '}
          <a href="https://dashboard.plaid.com" target="_blank" rel="noreferrer" style={{ color: BRAND }}>
            Get free sandbox credentials at dashboard.plaid.com
          </a>
          , then add <code>client_id</code> / <code>secret</code> / <code>environment</code> to{' '}
          <code>config/bank_connections.json</code> under the <code>"plaid"</code> key.
          In sandbox, log in with <code>user_good</code> / <code>pass_good</code>.
        </Typography>

        <Box sx={{ mb: 2 }}>
          <PlaidLinkButton onSuccess={handlePlaidSuccess} disabled={loading} />
        </Box>

        {plaidConnections.length > 0 ? (
          <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
            <Table>
              <TableHead>
                <TableRow>
                  {['Institution', 'Accounts', 'Connected', 'Actions'].map(h => (
                    <TableCell key={h} sx={TABLE_HEAD_CELL_SX}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {plaidConnections.map((conn) => (
                  <TableRow key={conn.item_id} sx={{ height: 56 }}>
                    <TableCell sx={TABLE_CELL_SX}>
                      <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                        {conn.institution_name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={TABLE_CELL_SX}>
                      {conn.account_count > 0 ? `${conn.account_count} account(s)` : '—'}
                    </TableCell>
                    <TableCell sx={TABLE_CELL_SX}>
                      {conn.connected_at ? new Date(conn.connected_at).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell sx={TABLE_CELL_SX}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handlePlaidDisconnect(conn.item_id)}
                        disabled={loading}
                        sx={DISCONNECT_BTN_SX}
                      >
                        Disconnect
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box
            sx={{
              border: `1.5px dashed ${BORDER}`,
              borderRadius: '12px',
              p: 4,
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontSize: 13, color: MUTED }}>
              No US banks connected yet. Click <strong>Connect US Bank</strong> above to add Chase, Discover, or any US institution.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default BankConnections;
