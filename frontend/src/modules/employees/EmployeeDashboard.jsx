import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  Work as WorkIcon,
  Event as EventIcon,
  Assessment as AssessmentIcon,
  AttachMoney as MoneyIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const EmployeeDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { id } = useParams();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [id]);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`/api/hr/employees/${id}/dashboard`);
      setDashboardData(response.data.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  const renderMetricCard = (title, value, icon, color = 'primary') => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ 
            backgroundColor: `${color}.light`, 
            borderRadius: '50%', 
            p: 1,
            mr: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {React.cloneElement(icon, { sx: { color: `${color}.main` } })}
          </Box>
          <Box>
            <Typography variant="h6" component="div">
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderActivityItem = (activity) => {
    const getActivityIcon = () => {
      switch (activity.type) {
        case 'performance_review':
          return <AssessmentIcon color="primary" />;
        case 'leave_request':
          return <EventIcon color="info" />;
        case 'document_upload':
          return <PersonIcon color="success" />;
        case 'salary_change':
          return <MoneyIcon color="warning" />;
        default:
          return <PersonIcon />;
      }
    };

    const getActivityStatus = () => {
      switch (activity.status) {
        case 'completed':
          return <Chip icon={<CheckIcon />} label="Completed" color="success" size="small" />;
        case 'pending':
          return <Chip icon={<TimeIcon />} label="Pending" color="warning" size="small" />;
        case 'overdue':
          return <Chip icon={<WarningIcon />} label="Overdue" color="error" size="small" />;
        default:
          return null;
      }
    };

    return (
      <ListItem key={activity.id}>
        <ListItemIcon>{getActivityIcon()}</ListItemIcon>
        <ListItemText
          primary={activity.title}
          secondary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {new Date(activity.date).toLocaleDateString()}
              </Typography>
              {getActivityStatus()}
            </Box>
          }
        />
      </ListItem>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Employee Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Metrics Section */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              {renderMetricCard(
                'Years of Service',
                `${dashboardData.employment.years_of_service} years`,
                <WorkIcon />,
                'primary'
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              {renderMetricCard(
                'Leave Balance',
                `${dashboardData.leave.balance} days`,
                <EventIcon />,
                'info'
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              {renderMetricCard(
                'Performance Rating',
                `${dashboardData.performance.rating}/5`,
                <AssessmentIcon />,
                'success'
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              {renderMetricCard(
                'Salary',
                `$${dashboardData.compensation.salary.toLocaleString()}`,
                <MoneyIcon />,
                'warning'
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              {renderMetricCard(
                'Documents',
                `${dashboardData.documents.total} total`,
                <PersonIcon />,
                'secondary'
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              {renderMetricCard(
                'Pending Tasks',
                `${dashboardData.tasks.pending}`,
                <TimeIcon />,
                'error'
              )}
            </Grid>
          </Grid>
        </Grid>

        {/* Quick Info Section */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Quick Information
            </Typography>
            <List>
              <ListItem>
                <ListItemText
                  primary="Department"
                  secondary={dashboardData.employment.department}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Position"
                  secondary={dashboardData.employment.position}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Manager"
                  secondary={dashboardData.employment.manager}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Location"
                  secondary={dashboardData.employment.location}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Recent Activities Section */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Activities
            </Typography>
            <List>
              {dashboardData.recent_activities.map(renderActivityItem)}
            </List>
          </Paper>
        </Grid>

        {/* Upcoming Events Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Upcoming Events
            </Typography>
            <List>
              {dashboardData.upcoming_events.map((event) => (
                <ListItem key={event.id}>
                  <ListItemIcon>
                    <EventIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={event.title}
                    secondary={
                      <Typography variant="body2" color="text.secondary">
                        {new Date(event.date).toLocaleDateString()} - {event.type}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Performance Goals Section */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Performance Goals
            </Typography>
            <List>
              {dashboardData.performance.goals.map((goal) => (
                <ListItem key={goal.id}>
                  <ListItemIcon>
                    <AssessmentIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={goal.title}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Progress: {goal.progress}%
                        </Typography>
                        <Chip
                          label={goal.status}
                          color={goal.status === 'On Track' ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EmployeeDashboard; 