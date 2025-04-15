import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Box, Tabs, Tab, Paper, Typography, Grid, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import {
  Business as CompanyIcon,
  Person as UserIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Language as LocalizationIcon,
  Backup as BackupIcon,
  Storage as DatabaseIcon,
  DataObject as IntegrationsIcon,
  Settings as PreferencesIcon
} from '@mui/icons-material';

// Placeholder components - these would be replaced with actual implementations
const CompanySettings = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5">Company Settings</Typography>
    <Typography paragraph>Configure company information, locations, departments, and organizational structure.</Typography>
  </Box>
);

const UserRoleSettings = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5">User & Role Management</Typography>
    <Typography paragraph>Manage users, roles, permissions, and access control.</Typography>
  </Box>
);

const SecuritySettings = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5">Security Settings</Typography>
    <Typography paragraph>Configure password policies, two-factor authentication, and security protocols.</Typography>
  </Box>
);

const NotificationSettings = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5">Notification Settings</Typography>
    <Typography paragraph>Configure email templates, notification rules, and delivery methods.</Typography>
  </Box>
);

const SystemSettings = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5">System Settings</Typography>
    <Typography paragraph>Configure system-wide settings, backups, and maintenance options.</Typography>
  </Box>
);

const IntegrationSettings = () => (
  <Box sx={{ p: 3 }}>
    <Typography variant="h5">Integrations</Typography>
    <Typography paragraph>Configure integrations with third-party systems and APIs.</Typography>
  </Box>
);

const SettingsModule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = React.useState(0);

  const settingsMenu = [
    { label: "Company", path: "/settings/company", icon: <CompanyIcon /> },
    { label: "Users & Roles", path: "/settings/users", icon: <UserIcon /> },
    { label: "Security", path: "/settings/security", icon: <SecurityIcon /> },
    { label: "Notifications", path: "/settings/notifications", icon: <NotificationsIcon /> },
    { label: "System", path: "/settings/system", icon: <DatabaseIcon /> },
    { label: "Integrations", path: "/settings/integrations", icon: <IntegrationsIcon /> },
  ];

  // Update selection based on current route
  React.useEffect(() => {
    const path = location.pathname;
    const index = settingsMenu.findIndex(item => path.includes(item.path));
    
    if (index >= 0) {
      setValue(index);
    } else if (path === '/settings' || path === '/settings/') {
      navigate('/settings/company');
    }
  }, [location.pathname, navigate, settingsMenu]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    navigate(settingsMenu[newValue].path);
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Paper sx={{ height: '100%' }}>
            <List component="nav">
              {settingsMenu.map((item, index) => (
                <React.Fragment key={item.path}>
                  {index > 0 && <Divider />}
                  <ListItem 
                    button 
                    selected={value === index}
                    onClick={() => handleChange(null, index)}
                  >
                    <ListItemIcon>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2, minHeight: '400px' }}>
            <Routes>
              <Route path="/" element={<CompanySettings />} />
              <Route path="/company" element={<CompanySettings />} />
              <Route path="/users" element={<UserRoleSettings />} />
              <Route path="/security" element={<SecuritySettings />} />
              <Route path="/notifications" element={<NotificationSettings />} />
              <Route path="/system" element={<SystemSettings />} />
              <Route path="/integrations" element={<IntegrationSettings />} />
            </Routes>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsModule; 