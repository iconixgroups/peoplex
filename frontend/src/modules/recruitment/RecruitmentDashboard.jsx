import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Work as WorkIcon,
  People as PeopleIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const RecruitmentDashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    openRequisitions: 0,
    totalCandidates: 0,
    upcomingInterviews: 0,
    pendingOffers: 0,
    activeOnboarding: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsResponse, activitiesResponse] = await Promise.all([
        axios.get('/api/hr/recruitment/metrics'),
        axios.get('/api/hr/recruitment/activities'),
      ]);
      setMetrics(metricsResponse.data);
      setRecentActivities(activitiesResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (type) => {
    switch (type) {
      case 'requisition':
        return <WorkIcon />;
      case 'candidate':
        return <PeopleIcon />;
      case 'interview':
        return <EventIcon />;
      case 'offer':
        return <AssignmentIcon />;
      case 'onboarding':
        return <CheckCircleIcon />;
      default:
        return null;
    }
  };

  const handleActivityClick = (type, id) => {
    const routes = {
      requisition: '/recruitment/requisitions',
      candidate: '/recruitment/candidates',
      interview: '/recruitment/interviews',
      offer: '/recruitment/offers',
      onboarding: '/recruitment/onboarding',
    };
    navigate(`${routes[type]}/${id}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Recruitment Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Metrics Cards */}
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              '&:hover': { boxShadow: 6 },
            }}
            onClick={() => navigate('/recruitment/requisitions')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <WorkIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Open Requisitions</Typography>
              </Box>
              <Typography variant="h4">{metrics.openRequisitions}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              '&:hover': { boxShadow: 6 },
            }}
            onClick={() => navigate('/recruitment/candidates')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <PeopleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Candidates</Typography>
              </Box>
              <Typography variant="h4">{metrics.totalCandidates}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              '&:hover': { boxShadow: 6 },
            }}
            onClick={() => navigate('/recruitment/interviews')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <EventIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Upcoming Interviews</Typography>
              </Box>
              <Typography variant="h4">{metrics.upcomingInterviews}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              '&:hover': { boxShadow: 6 },
            }}
            onClick={() => navigate('/recruitment/offers')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Pending Offers</Typography>
              </Box>
              <Typography variant="h4">{metrics.pendingOffers}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <Card
            sx={{
              height: '100%',
              cursor: 'pointer',
              '&:hover': { boxShadow: 6 },
            }}
            onClick={() => navigate('/recruitment/onboarding')}
          >
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CheckCircleIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Active Onboarding</Typography>
              </Box>
              <Typography variant="h4">{metrics.activeOnboarding}</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activities
              </Typography>
              <List>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem
                      button
                      onClick={() => handleActivityClick(activity.type, activity.id)}
                    >
                      <ListItemIcon>
                        {getStatusIcon(activity.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.title}
                        secondary={
                          <>
                            {activity.description}
                            <br />
                            <Box component="span" sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                              <ScheduleIcon fontSize="small" sx={{ mr: 0.5 }} />
                              {new Date(activity.timestamp).toLocaleString()}
                            </Box>
                          </>
                        }
                      />
                      <Chip
                        label={activity.status}
                        color={getStatusColor(activity.status)}
                        size="small"
                      />
                    </ListItem>
                    {index < recentActivities.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RecruitmentDashboard; 