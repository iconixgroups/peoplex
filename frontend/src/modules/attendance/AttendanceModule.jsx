import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import AttendanceList from './AttendanceList';
import AttendanceCalendar from './AttendanceCalendar';
import AttendanceReport from './AttendanceReport';
import ShiftManagement from './ShiftManagement';
import AttendanceSettings from './AttendanceSettings';

const AttendanceModule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = React.useState(0);

  // Update tab value based on current route
  React.useEffect(() => {
    const path = location.pathname;
    if (path.includes('/attendance/list')) setValue(0);
    else if (path.includes('/attendance/calendar')) setValue(1);
    else if (path.includes('/attendance/reports')) setValue(2);
    else if (path.includes('/attendance/shifts')) setValue(3);
    else if (path.includes('/attendance/settings')) setValue(4);
    else if (path === '/attendance' || path === '/attendance/') navigate('/attendance/list');
  }, [location.pathname, navigate]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    switch (newValue) {
      case 0:
        navigate('/attendance/list');
        break;
      case 1:
        navigate('/attendance/calendar');
        break;
      case 2:
        navigate('/attendance/reports');
        break;
      case 3:
        navigate('/attendance/shifts');
        break;
      case 4:
        navigate('/attendance/settings');
        break;
      default:
        navigate('/attendance/list');
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
          <Tab label="Attendance Records" />
          <Tab label="Calendar View" />
          <Tab label="Reports" />
          <Tab label="Shift Management" />
          <Tab label="Settings" />
        </Tabs>
      </Paper>

      <Routes>
        <Route path="/" element={<AttendanceList />} />
        <Route path="/list" element={<AttendanceList />} />
        <Route path="/calendar" element={<AttendanceCalendar />} />
        <Route path="/reports" element={<AttendanceReport />} />
        <Route path="/shifts" element={<ShiftManagement />} />
        <Route path="/settings" element={<AttendanceSettings />} />
      </Routes>
    </Box>
  );
};

export default AttendanceModule; 