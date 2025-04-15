import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const OnboardingList = () => {
  const navigate = useNavigate();
  const [onboardingPlans, setOnboardingPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchOnboardingPlans();
  }, []);

  const fetchOnboardingPlans = async () => {
    try {
      const response = await axios.get('/api/hr/recruitment/onboarding');
      setOnboardingPlans(response.data);
    } catch (error) {
      console.error('Error fetching onboarding plans:', error);
    }
  };

  const handleMenuClick = (event, plan) => {
    setAnchorEl(event.currentTarget);
    setSelectedPlan(plan);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPlan(null);
  };

  const handleEdit = () => {
    if (selectedPlan) {
      navigate(`/recruitment/onboarding/${selectedPlan.id}/edit`);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/hr/recruitment/onboarding/${selectedPlan.id}`);
      fetchOnboardingPlans();
    } catch (error) {
      console.error('Error deleting onboarding plan:', error);
    }
    setDeleteDialogOpen(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'not_started':
        return 'default';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon />;
      case 'in_progress':
        return <PendingIcon />;
      case 'overdue':
        return <WarningIcon />;
      default:
        return null;
    }
  };

  const filteredPlans = onboardingPlans.filter((plan) => {
    const matchesSearch = plan.employee_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Onboarding Plans</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/recruitment/onboarding/new')}
        >
          New Plan
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Search"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by employee name..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="not_started">Not Started</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {filteredPlans.map((plan) => (
          <Grid item xs={12} sm={6} md={4} key={plan.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {plan.employee_name}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      {plan.position}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Start Date: {new Date(plan.start_date).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <IconButton onClick={(e) => handleMenuClick(e, plan)}>
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Chip
                    icon={getStatusIcon(plan.status)}
                    label={plan.status.replace('_', ' ')}
                    color={getStatusColor(plan.status)}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Chip
                    label={`${plan.completed_tasks}/${plan.total_tasks} tasks`}
                    size="small"
                    variant="outlined"
                  />
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Next Task: {plan.next_task || 'No pending tasks'}
                  </Typography>
                  {plan.next_task_due && (
                    <Typography variant="body2" color="textSecondary">
                      Due: {new Date(plan.next_task_due).toLocaleDateString()}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Onboarding Plan</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the onboarding plan for {selectedPlan?.employee_name}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OnboardingList; 