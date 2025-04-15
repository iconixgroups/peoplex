import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import LeaveList from './LeaveList';
import LeaveRequest from './LeaveRequest';
import LeaveBalance from './LeaveBalance';
import LeaveReport from './LeaveReport';
import LeaveSettings from './LeaveSettings';

const LeaveModule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = React.useState(0);

  // Update tab value based on current route
  React.useEffect(() => {
    const path = location.pathname;
    if (path.includes('/leave/requests')) setValue(0);
    else if (path.includes('/leave/request/new') || path.includes('/leave/request/edit')) setValue(1);
    else if (path.includes('/leave/balance')) setValue(2);
    else if (path.includes('/leave/reports')) setValue(3);
    else if (path.includes('/leave/settings')) setValue(4);
    else if (path === '/leave' || path === '/leave/') navigate('/leave/requests');
  }, [location.pathname, navigate]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    switch (newValue) {
      case 0:
        navigate('/leave/requests');
        break;
      case 1:
        navigate('/leave/request/new');
        break;
      case 2:
        navigate('/leave/balance');
        break;
      case 3:
        navigate('/leave/reports');
        break;
      case 4:
        navigate('/leave/settings');
        break;
      default:
        navigate('/leave/requests');
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
          <Tab label="Leave Requests" />
          <Tab label="New Request" />
          <Tab label="Leave Balance" />
          <Tab label="Reports" />
          <Tab label="Settings" />
        </Tabs>
      </Paper>

      <Routes>
        <Route path="/" element={<LeaveList />} />
        <Route path="/requests" element={<LeaveList />} />
        <Route path="/request/new" element={<LeaveRequest />} />
        <Route path="/request/edit/:id" element={<LeaveRequest />} />
        <Route path="/balance" element={<LeaveBalance />} />
        <Route path="/reports" element={<LeaveReport />} />
        <Route path="/settings" element={<LeaveSettings />} />
      </Routes>
    </Box>
  );
};

export default LeaveModule; 