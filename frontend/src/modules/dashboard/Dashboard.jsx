import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Work as WorkIcon,
  Event as EventIcon,
  AssessmentOutlined as AssessmentIcon,
  AttachMoney as MoneyIcon,
  HourglassEmpty as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Cake as BirthdayIcon,
  WorkOff as LeaveIcon,
} from '@mui/icons-material';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    summary: {
      totalEmployees: 0,
      activeEmployees: 0,
      onLeaveToday: 0,
      openPositions: 0,
    },
    attendance: {
      present: 0,
      absent: 0,
      late: 0,
      leavePercentage: 0,
    },
    leave: {
      pending: 0,
      approved: 0,
      rejected: 0,
    },
    recruitment: {
      newApplications: 0,
      interviewsScheduled: 0,
      offersSent: 0,
    },
    upcomingEvents: [],
    recentActivities: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/hr/dashboard');
      setDashboardData(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again later.');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderMetricCard = (title, value, icon, color = 'primary', onClick = null) => (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { boxShadow: 6 } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box 
            sx={{ 
              backgroundColor: `${color}.light`,
              p: 1,
              borderRadius: '50%',
              mr: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {React.cloneElement(icon, { sx: { color: `${color}.main` } })}
          </Box>
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" component="div" sx={{ mt: 2 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );

  const getEventIcon = (type) => {
    switch (type) {
      case 'birthday':
        return <BirthdayIcon color="primary" />;
      case 'leave':
        return <LeaveIcon color="info" />;
      case 'review':
        return <AssessmentIcon color="warning" />;
      case 'meeting':
        return <EventIcon color="success" />;
      default:
        return <EventIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Total Employees',
            dashboardData.summary.totalEmployees,
            <PersonIcon />,
            'primary',
            () => navigate('/employees')
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Present Today',
            dashboardData.attendance.present,
            <ApprovedIcon />,
            'success',
            () => navigate('/attendance')
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'On Leave',
            dashboardData.summary.onLeaveToday,
            <LeaveIcon />,
            'warning',
            () => navigate('/leave')
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          {renderMetricCard(
            'Open Positions',
            dashboardData.summary.openPositions,
            <WorkIcon />,
            'info',
            () => navigate('/recruitment')
          )}
        </Grid>

        {/* Leave Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Leave Requests
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                {renderMetricCard(
                  'Pending',
                  dashboardData.leave.pending,
                  <PendingIcon />,
                  'warning'
                )}
              </Grid>
              <Grid item xs={4}>
                {renderMetricCard(
                  'Approved',
                  dashboardData.leave.approved,
                  <ApprovedIcon />,
                  'success'
                )}
              </Grid>
              <Grid item xs={4}>
                {renderMetricCard(
                  'Rejected',
                  dashboardData.leave.rejected,
                  <RejectedIcon />,
                  'error'
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Recruitment Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recruitment Status
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={4}>
                {renderMetricCard(
                  'Applications',
                  dashboardData.recruitment.newApplications,
                  <PersonIcon />,
                  'primary'
                )}
              </Grid>
              <Grid item xs={4}>
                {renderMetricCard(
                  'Interviews',
                  dashboardData.recruitment.interviewsScheduled,
                  <EventIcon />,
                  'info'
                )}
              </Grid>
              <Grid item xs={4}>
                {renderMetricCard(
                  'Offers',
                  dashboardData.recruitment.offersSent,
                  <MoneyIcon />,
                  'success'
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Upcoming Events */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Upcoming Events
            </Typography>
            <List>
              {dashboardData.upcomingEvents.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No upcoming events" />
                </ListItem>
              ) : (
                dashboardData.upcomingEvents.map((event, index) => (
                  <React.Fragment key={event.id || index}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem>
                      <ListItemIcon>
                        {getEventIcon(event.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={event.title}
                        secondary={new Date(event.date).toLocaleDateString()}
                      />
                    </ListItem>
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Recent Activities
            </Typography>
            <List>
              {dashboardData.recentActivities.length === 0 ? (
                <ListItem>
                  <ListItemText primary="No recent activities" />
                </ListItem>
              ) : (
                dashboardData.recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id || index}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem>
                      <ListItemIcon>
                        {getEventIcon(activity.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.description}
                        secondary={new Date(activity.timestamp).toLocaleString()}
                      />
                    </ListItem>
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 