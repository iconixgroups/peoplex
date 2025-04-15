import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const OfferForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    candidate_id: '',
    position: '',
    department_id: '',
    salary: '',
    start_date: '',
    expiry_date: '',
    benefits: '',
    notes: '',
    status: 'pending',
  });

  const [candidates, setCandidates] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCandidates();
    fetchDepartments();
    if (isEdit) {
      fetchOffer();
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

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/hr/departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchOffer = async () => {
    try {
      const response = await axios.get(`/api/hr/recruitment/offers/${id}`);
      const offer = response.data;
      setFormData({
        ...offer,
        start_date: offer.start_date ? new Date(offer.start_date).toISOString().split('T')[0] : '',
        expiry_date: offer.expiry_date ? new Date(offer.expiry_date).toISOString().split('T')[0] : '',
      });
    } catch (error) {
      console.error('Error fetching offer:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.candidate_id) newErrors.candidate_id = 'Candidate is required';
    if (!formData.position) newErrors.position = 'Position is required';
    if (!formData.department_id) newErrors.department_id = 'Department is required';
    if (!formData.salary) newErrors.salary = 'Salary is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (!formData.expiry_date) newErrors.expiry_date = 'Expiry date is required';
    if (new Date(formData.expiry_date) <= new Date(formData.start_date)) {
      newErrors.expiry_date = 'Expiry date must be after start date';
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
        await axios.put(`/api/hr/recruitment/offers/${id}`, formData);
      } else {
        await axios.post('/api/hr/recruitment/offers', formData);
      }
      navigate('/recruitment/offers');
    } catch (error) {
      console.error('Error saving offer:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {isEdit ? 'Edit Job Offer' : 'New Job Offer'}
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
                <TextField
                  fullWidth
                  label="Position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  error={!!errors.position}
                  helperText={errors.position}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.department_id}>
                  <InputLabel>Department</InputLabel>
                  <Select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleChange}
                    label="Department"
                  >
                    {departments.map((department) => (
                      <MenuItem key={department.id} value={department.id}>
                        {department.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.department_id && (
                    <FormHelperText>{errors.department_id}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Salary"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  error={!!errors.salary}
                  helperText={errors.salary}
                  InputProps={{
                    startAdornment: '$',
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  error={!!errors.start_date}
                  helperText={errors.start_date}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Expiry Date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleChange}
                  error={!!errors.expiry_date}
                  helperText={errors.expiry_date}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Benefits"
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleChange}
                  multiline
                  rows={3}
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
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="accepted">Accepted</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                      <MenuItem value="expired">Expired</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/recruitment/offers')}
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

export default OfferForm; 