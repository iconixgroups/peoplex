import React from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Box, Tabs, Tab, Paper, Typography } from '@mui/material';
import EmployeesList from './EmployeesList';
import EmployeeForm from './EmployeeForm';
import EmployeeProfile from './EmployeeProfile';
import EmployeeDashboard from './EmployeeDashboard';
import EmployeeDocuments from './EmployeeDocuments';

// Single employee view with tabs for different sections
const EmployeeView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [value, setValue] = React.useState(0);

  React.useEffect(() => {
    const path = location.pathname;
    if (path.includes(`/employees/${id}/dashboard`)) setValue(0);
    else if (path.includes(`/employees/${id}/profile`)) setValue(1);
    else if (path.includes(`/employees/${id}/documents`)) setValue(2);
    else if (path.includes(`/employees/${id}/edit`)) setValue(3);
    else navigate(`/employees/${id}/dashboard`);
  }, [location.pathname, navigate, id]);

  const handleTabChange = (event, newValue) => {
    setValue(newValue);
    switch (newValue) {
      case 0:
        navigate(`/employees/${id}/dashboard`);
        break;
      case 1:
        navigate(`/employees/${id}/profile`);
        break;
      case 2:
        navigate(`/employees/${id}/documents`);
        break;
      case 3:
        navigate(`/employees/${id}/edit`);
        break;
      default:
        navigate(`/employees/${id}/dashboard`);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={value}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Dashboard" />
          <Tab label="Profile" />
          <Tab label="Documents" />
          <Tab label="Edit Employee" />
        </Tabs>
      </Paper>

      <Routes>
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="profile" element={<EmployeeProfile />} />
        <Route path="documents" element={<EmployeeDocuments />} />
        <Route path="edit" element={<EmployeeForm isEdit={true} />} />
      </Routes>
    </Box>
  );
};

const EmployeesModule = () => {
  return (
    <Routes>
      <Route path="/" element={<EmployeesList />} />
      <Route path="/new" element={<EmployeeForm isEdit={false} />} />
      <Route path="/:id/*" element={<EmployeeView />} />
    </Routes>
  );
};

export default EmployeesModule; 