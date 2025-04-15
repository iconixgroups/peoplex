import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Add as AddIcon, MoreVert as MoreVertIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';
import axios from 'axios';

const InterviewsList = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: '',
    interviewer_id: '',
    type: 'virtual',
    location: '',
    notes: '',
  });
  const [interviewers, setInterviewers] = useState([]);

  useEffect(() => {
    fetchInterviews();
    fetchInterviewers();
  }, []);

  const fetchInterviews = async () => {
    try {
      const response = await axios.get('/api/hr/recruitment/interviews');
      setInterviews(response.data);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    }
  };

  const fetchInterviewers = async () => {
    try {
      const response = await axios.get('/api/hr/employees?role=interviewer');
      setInterviewers(response.data);
    } catch (error) {
      console.error('Error fetching interviewers:', error);
    }
  };

  const handleScheduleInterview = (interview) => {
    setSelectedInterview(interview);
    setScheduleDialogOpen(true);
  };

  const handleScheduleSubmit = async () => {
    try {
      await axios.post(`/api/hr/recruitment/interviews/${selectedInterview.id}/schedule`, scheduleData);
      setScheduleDialogOpen(false);
      fetchInterviews();
    } catch (error) {
      console.error('Error scheduling interview:', error);
    }
  };

  const handleMenuClick = (event, interview) => {
    setAnchorEl(event.currentTarget);
    setSelectedInterview(interview);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedInterview(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'info';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'no_show':
        return 'warning';
      default:
        return 'default';
    }
  };

  const filteredInterviews = interviews.filter((interview) => {
    const matchesSearch = 
      interview.candidate.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.candidate.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || interview.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Interviews</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/recruitment/interviews/new')}
        >
          Schedule Interview
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Search Interviews"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
                <MenuItem value="no_show">No Show</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {filteredInterviews.map((interview) => (
          <Grid item xs={12} sm={6} md={4} key={interview.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6">
                      {interview.candidate.first_name} {interview.candidate.last_name}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      {interview.candidate.email}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      {interview.candidate.phone}
                    </Typography>
                  </Box>
                  <IconButton onClick={(e) => handleMenuClick(e, interview)}>
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Chip
                    label={interview.status}
                    color={getStatusColor(interview.status)}
                    size="small"
                  />
                </Box>

                {interview.scheduled_at && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="textSecondary">
                      Scheduled: {new Date(interview.scheduled_at).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Interviewer: {interview.interviewer.name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Type: {interview.type}
                    </Typography>
                    {interview.location && (
                      <Typography variant="body2" color="textSecondary">
                        Location: {interview.location}
                      </Typography>
                    )}
                  </Box>
                )}
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
        <MenuItem onClick={() => {
          handleScheduleInterview(selectedInterview);
          handleMenuClose();
        }}>
          Schedule
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/recruitment/interviews/${selectedInterview?.id}/edit`);
          handleMenuClose();
        }}>
          Edit
        </MenuItem>
        <MenuItem onClick={() => {
          navigate(`/recruitment/interviews/${selectedInterview?.id}/feedback`);
          handleMenuClose();
        }}>
          Add Feedback
        </MenuItem>
      </Menu>

      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)}>
        <DialogTitle>Schedule Interview</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={scheduleData.date}
                onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="time"
                label="Time"
                value={scheduleData.time}
                onChange={(e) => setScheduleData({ ...scheduleData, time: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Interviewer"
                value={scheduleData.interviewer_id}
                onChange={(e) => setScheduleData({ ...scheduleData, interviewer_id: e.target.value })}
              >
                {interviewers.map((interviewer) => (
                  <MenuItem key={interviewer.id} value={interviewer.id}>
                    {interviewer.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Type"
                value={scheduleData.type}
                onChange={(e) => setScheduleData({ ...scheduleData, type: e.target.value })}
              >
                <MenuItem value="virtual">Virtual</MenuItem>
                <MenuItem value="in_person">In Person</MenuItem>
                <MenuItem value="phone">Phone</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={scheduleData.location}
                onChange={(e) => setScheduleData({ ...scheduleData, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={scheduleData.notes}
                onChange={(e) => setScheduleData({ ...scheduleData, notes: e.target.value })}
                multiline
                rows={4}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleScheduleSubmit} variant="contained" color="primary">
            Schedule
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InterviewsList; 