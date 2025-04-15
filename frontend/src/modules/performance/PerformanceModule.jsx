import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Box, Tabs, Tab, Paper, Typography } from '@mui/material';
import PerformanceList from './PerformanceList';

// Placeholder components - these would be replaced with actual implementations
const PerformanceGoals = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5">Performance Goals</Typography>
    <Typography paragraph>Set and track performance goals and objectives.</Typography>
  </Box>
);

const PerformanceReviews = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5">Performance Reviews</Typography>
    <Typography paragraph>Manage and conduct performance reviews and evaluations.</Typography>
  </Box>
);

const PerformanceFeedback = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5">Continuous Feedback</Typography>
    <Typography paragraph>Give and receive ongoing performance feedback.</Typography>
  </Box>
);

const PerformanceSettings = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5">Performance Settings</Typography>
    <Typography paragraph>Configure performance management settings and templates.</Typography>
  </Box>
);

const PerformanceModule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = React.useState(0);

  // Update tab value based on current route
  React.useEffect(() => {
    const path = location.pathname;
    if (path.includes('/performance/list')) setValue(0);
    else if (path.includes('/performance/goals')) setValue(1);
    else if (path.includes('/performance/reviews')) setValue(2);
    else if (path.includes('/performance/feedback')) setValue(3);
    else if (path.includes('/performance/settings')) setValue(4);
    else if (path === '/performance' || path === '/performance/') navigate('/performance/list');
  }, [location.pathname, navigate]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    switch (newValue) {
      case 0:
        navigate('/performance/list');
        break;
      case 1:
        navigate('/performance/goals');
        break;
      case 2:
        navigate('/performance/reviews');
        break;
      case 3:
        navigate('/performance/feedback');
        break;
      case 4:
        navigate('/performance/settings');
        break;
      default:
        navigate('/performance/list');
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
          <Tab label="Performance List" />
          <Tab label="Goals & Objectives" />
          <Tab label="Reviews" />
          <Tab label="Feedback" />
          <Tab label="Settings" />
        </Tabs>
      </Paper>

      <Routes>
        <Route path="/" element={<PerformanceList />} />
        <Route path="/list" element={<PerformanceList />} />
        <Route path="/goals" element={<PerformanceGoals />} />
        <Route path="/reviews" element={<PerformanceReviews />} />
        <Route path="/feedback" element={<PerformanceFeedback />} />
        <Route path="/settings" element={<PerformanceSettings />} />
      </Routes>
    </Box>
  );
};

export default PerformanceModule; 