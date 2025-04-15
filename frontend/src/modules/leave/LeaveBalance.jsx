import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Card,
  CardContent,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import axios from 'axios';

const LeaveBalance = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [balanceData, setBalanceData] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const fetchLeaveData = async () => {
    setLoading(true);
    try {
      const [balanceResponse, usageResponse, historyResponse] = await Promise.all([
        axios.get('/api/hr/leave/balance'),
        axios.get('/api/hr/leave/usage'),
        axios.get('/api/hr/leave/history')
      ]);

      setBalanceData(balanceResponse.data.data);
      setUsageData(usageResponse.data.data);
      setHistoryData(historyResponse.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch leave data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'info';
    }
  };

  const renderBalanceCards = () => {
    if (!balanceData) return null;

    return (
      <Grid container spacing={3}>
        {Object.entries(balanceData).map(([type, data]) => (
          <Grid item xs={12} sm={6} md={4} key={type}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {type.charAt(0).toUpperCase() + type.slice(1)} Leave
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h4" component="div">
                    {data.available} days
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    of {data.total} days total
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(data.available / data.total) * 100}
                  sx={{ height: 10, borderRadius: 5 }}
                />
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Used: {data.used} days
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending: {data.pending} days
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderUsageChart = () => {
    if (!usageData) return null;

    return (
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Leave Usage by Month
        </Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="annual" fill={theme.palette.primary.main} name="Annual Leave" />
              <Bar dataKey="sick" fill={theme.palette.secondary.main} name="Sick Leave" />
              <Bar dataKey="personal" fill={theme.palette.info.main} name="Personal Leave" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    );
  };

  const renderHistoryTable = () => {
    return (
      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {historyData.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  {new Date(record.start_date).toLocaleDateString()} -{' '}
                  {new Date(record.end_date).toLocaleDateString()}
                </TableCell>
                <TableCell>{record.type}</TableCell>
                <TableCell>{record.duration} days</TableCell>
                <TableCell>
                  <Chip
                    label={record.status}
                    color={getStatusColor(record.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{record.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Leave Balance & History
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{ mb: 3 }}
            variant={isMobile ? 'fullWidth' : 'standard'}
          >
            <Tab label="Balance Overview" />
            <Tab label="Usage History" />
            <Tab label="Detailed History" />
          </Tabs>

          {activeTab === 0 && renderBalanceCards()}
          {activeTab === 1 && renderUsageChart()}
          {activeTab === 2 && renderHistoryTable()}
        </>
      )}
    </Box>
  );
};

export default LeaveBalance; 