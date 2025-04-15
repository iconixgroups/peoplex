import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const InterviewForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    candidate_id: '',
    interviewer_id: '',
    type: 'virtual',
    scheduled_at: '',
    duration: 60,
    location: '',
    notes: '',
    status: 'scheduled',
  });

  const [candidates, setCandidates] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCandidates();
    fetchInterviewers();
    if (isEdit) {
      fetchInterview();
    }
  }, [id]);

  const fetchCandidates = async () => {
    try {
      const response = await axios.get('/api/hr/recruitment/candidates');
      setCandidates(response.data);
    } catch (error) {
      console.error('Error fetching candidates:', error);
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

  const fetchInterview = async () => {
    try {
      const response = await axios.get(`/api/hr/recruitment/interviews/${id}`);
      const interview = response.data;
      setFormData({
        ...interview,
        scheduled_at: interview.scheduled_at ? new Date(interview.scheduled_at).toISOString().slice(0, 16) : '',
      });
    } catch (error) {
      console.error('Error fetching interview:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.candidate_id) newErrors.candidate_id = 'Candidate is required';
    if (!formData.interviewer_id) newErrors.interviewer_id = 'Interviewer is required';
    if (!formData.scheduled_at) newErrors.scheduled_at = 'Date and time are required';
    if (!formData.duration) newErrors.duration = 'Duration is required';
    if (formData.type === 'in_person' && !formData.location) {
      newErrors.location = 'Location is required for in-person interviews';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (isEdit) {
        await axios.put(`/api/hr/recruitment/interviews/${id}`, formData);
      } else {
        await axios.post('/api/hr/recruitment/interviews', formData);
      }
      navigate('/recruitment/interviews');
    } catch (error) {
      console.error('Error saving interview:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {isEdit ? 'Edit Interview' : 'New Interview'}
      </Typography>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.candidate_id}>
                  <InputLabel>Candidate</InputLabel>
                  <Select
                    name="candidate_id"
                    value={formData.candidate_id}
                    onChange={handleChange}
                    label="Candidate"
                  >
                    {candidates.map((candidate) => (
                      <MenuItem key={candidate.id} value={candidate.id}>
                        {candidate.first_name} {candidate.last_name} ({candidate.email})
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.candidate_id && (
                    <FormHelperText>{errors.candidate_id}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.interviewer_id}>
                  <InputLabel>Interviewer</InputLabel>
                  <Select
                    name="interviewer_id"
                    value={formData.interviewer_id}
                    onChange={handleChange}
                    label="Interviewer"
                  >
                    {interviewers.map((interviewer) => (
                      <MenuItem key={interviewer.id} value={interviewer.id}>
                        {interviewer.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.interviewer_id && (
                    <FormHelperText>{errors.interviewer_id}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    label="Type"
                  >
                    <MenuItem value="virtual">Virtual</MenuItem>
                    <MenuItem value="in_person">In Person</MenuItem>
                    <MenuItem value="phone">Phone</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Date and Time"
                  name="scheduled_at"
                  value={formData.scheduled_at}
                  onChange={handleChange}
                  error={!!errors.scheduled_at}
                  helperText={errors.scheduled_at}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Duration (minutes)"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  error={!!errors.duration}
                  helperText={errors.duration}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  error={!!errors.location}
                  helperText={errors.location}
                  disabled={formData.type !== 'in_person'}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  multiline
                  rows={4}
                />
              </Grid>

              {isEdit && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      label="Status"
                    >
                      <MenuItem value="scheduled">Scheduled</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                      <MenuItem value="cancelled">Cancelled</MenuItem>
                      <MenuItem value="no_show">No Show</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/recruitment/interviews')}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                  >
                    {isEdit ? 'Update' : 'Create'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InterviewForm; 