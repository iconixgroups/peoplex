import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Box, Tabs, Tab, Paper, Typography, CircularProgress } from '@mui/material';

// Placeholder components - these would be replaced with actual implementations
const PayrollDashboard = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5">Payroll Dashboard</Typography>
    <Typography paragraph>Payroll dashboard content will be displayed here.</Typography>
  </Box>
);

const PayrollList = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5">Payroll List</Typography>
    <Typography paragraph>The list of payroll records will be displayed here.</Typography>
  </Box>
);

const PayrollGeneration = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5">Payroll Generation</Typography>
    <Typography paragraph>Payroll generation forms and controls will be displayed here.</Typography>
  </Box>
);

const PayrollSettings = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5">Payroll Settings</Typography>
    <Typography paragraph>Payroll configuration and settings will be displayed here.</Typography>
  </Box>
);

const PayrollReports = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5">Payroll Reports</Typography>
    <Typography paragraph>Payroll reports and analytics will be displayed here.</Typography>
  </Box>
);

const PayrollModule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = React.useState(0);

  // Update tab value based on current route
  React.useEffect(() => {
    const path = location.pathname;
    if (path.includes('/payroll/list')) setValue(0);
    else if (path.includes('/payroll/generation')) setValue(1);
    else if (path.includes('/payroll/reports')) setValue(2);
    else if (path.includes('/payroll/settings')) setValue(3);
    else if (path === '/payroll' || path === '/payroll/') navigate('/payroll/list');
  }, [location.pathname, navigate]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    switch (newValue) {
      case 0:
        navigate('/payroll/list');
        break;
      case 1:
        navigate('/payroll/generation');
        break;
      case 2:
        navigate('/payroll/reports');
        break;
      case 3:
        navigate('/payroll/settings');
        break;
      default:
        navigate('/payroll/list');
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Payroll Records" />
          <Tab label="Generate Payroll" />
          <Tab label="Payroll Reports" />
          <Tab label="Settings" />
        </Tabs>
      </Paper>

      <Routes>
        <Route path="/" element={<PayrollList />} />
        <Route path="/list" element={<PayrollList />} />
        <Route path="/generation" element={<PayrollGeneration />} />
        <Route path="/reports" element={<PayrollReports />} />
        <Route path="/settings" element={<PayrollSettings />} />
      </Routes>
    </Box>
  );
};

export default PayrollModule; 