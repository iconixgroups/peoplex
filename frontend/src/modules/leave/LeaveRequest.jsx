import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Stepper,
  Step,
  StepLabel,
  FormHelperText,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Calendar,
  Card,
  CardContent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const LeaveRequest = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    type: '',
    start_date: null,
    end_date: null,
    half_day: false,
    half_day_part: 'morning',
    reason: '',
    comments: '',
    attachments: []
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [leavePolicies, setLeavePolicies] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    if (isEdit) {
      fetchLeaveRequest();
    }
    fetchLeaveBalance();
    fetchLeavePolicies();
  }, [id]);

  const fetchLeaveRequest = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/hr/leave/requests/${id}`);
      const leave = response.data.data;
      setFormData({
        type: leave.type,
        start_date: new Date(leave.start_date),
        end_date: new Date(leave.end_date),
        half_day: leave.half_day,
        half_day_part: leave.half_day_part || 'morning',
        reason: leave.reason,
        comments: leave.comments || '',
        attachments: leave.attachments || []
      });
      setError(null);
    } catch (err) {
      setError('Failed to fetch leave request details');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const response = await axios.get('/api/hr/leave/balance');
      setLeaveBalance(response.data.data);
    } catch (err) {
      console.error('Failed to fetch leave balance:', err);
    }
  };

  const fetchLeavePolicies = async () => {
    try {
      const response = await axios.get('/api/hr/leave/policies');
      setLeavePolicies(response.data.data);
    } catch (err) {
      console.error('Failed to fetch leave policies:', err);
    }
  };

  const checkConflicts = async () => {
    if (!formData.start_date || !formData.end_date) return;
    
    try {
      const response = await axios.get('/api/hr/leave/conflicts', {
        params: {
          start_date: formData.start_date.toISOString(),
          end_date: formData.end_date.toISOString()
        }
      });
      setConflicts(response.data.data);
    } catch (err) {
      console.error('Failed to check conflicts:', err);
    }
  };

  const calculatePreview = () => {
    if (!formData.start_date || !formData.end_date || !formData.type) return;

    const days = formData.half_day ? 0.5 : 
      Math.ceil((formData.end_date - formData.start_date) / (1000 * 60 * 60 * 24)) + 1;
    
    const policy = leavePolicies?.[formData.type];
    const balance = leaveBalance?.[formData.type] || 0;
    
    setPreviewData({
      days,
      balance,
      remaining: balance - days,
      policy
    });
    setPreviewDialogOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!formData.type) {
      errors.type = 'Leave type is required';
    }

    if (!formData.start_date) {
      errors.start_date = 'Start date is required';
    } else if (formData.start_date < today) {
      errors.start_date = 'Start date cannot be in the past';
    }

    if (!formData.end_date) {
      errors.end_date = 'End date is required';
    } else if (formData.end_date < formData.start_date) {
      errors.end_date = 'End date must be after start date';
    }

    if (!formData.reason) {
      errors.reason = 'Reason is required';
    }

    // Policy validation
    const policy = leavePolicies?.[formData.type];
    if (policy) {
      if (formData.start_date) {
        const noticeDays = Math.ceil((formData.start_date - today) / (1000 * 60 * 60 * 24));
        if (noticeDays < policy.advanceNotice) {
          errors.start_date = `Minimum ${policy.advanceNotice} days notice required`;
        }
      }

      const days = formData.half_day ? 0.5 : 
        Math.ceil((formData.end_date - formData.start_date) / (1000 * 60 * 60 * 24)) + 1;
      
      if (days < policy.minDuration) {
        errors.end_date = `Minimum duration is ${policy.minDuration} days`;
      }
      if (days > policy.maxDuration) {
        errors.end_date = `Maximum duration is ${policy.maxDuration} days`;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
    if (validationErrors[field]) {
      setValidationErrors({
        ...validationErrors,
        [field]: null
      });
    }
  };

  const handleDateChange = (field) => (date) => {
    setFormData({
      ...formData,
      [field]: date
    });
    if (validationErrors[field]) {
      setValidationErrors({
        ...validationErrors,
        [field]: null
      });
    }
    if (field === 'start_date' || field === 'end_date') {
      checkConflicts();
    }
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setFormData({
      ...formData,
      attachments: [...formData.attachments, ...files]
    });
  };

  const handleRemoveAttachment = (index) => {
    const newAttachments = [...formData.attachments];
    newAttachments.splice(index, 1);
    setFormData({
      ...formData,
      attachments: newAttachments
    });
  };

  const handleNext = () => {
    if (validateForm()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const formDataToSubmit = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'attachments') {
          formData.attachments.forEach(file => {
            formDataToSubmit.append('attachments', file);
          });
        } else if (key === 'start_date' || key === 'end_date') {
          formDataToSubmit.append(key, formData[key].toISOString());
        } else {
          formDataToSubmit.append(key, formData[key]);
        }
      });

      if (isEdit) {
        await axios.put(`/api/hr/leave/requests/${id}`, formDataToSubmit);
      } else {
        await axios.post('/api/hr/leave/requests', formDataToSubmit);
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/leave');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save leave request');
    } finally {
      setSaving(false);
    }
  };

  const steps = ['Leave Details', 'Additional Information'];

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!validationErrors.type}>
                <InputLabel>Leave Type</InputLabel>
                <Select
                  value={formData.type}
                  label="Leave Type"
                  onChange={handleChange('type')}
                >
                  <MenuItem value="annual">Annual Leave</MenuItem>
                  <MenuItem value="sick">Sick Leave</MenuItem>
                  <MenuItem value="personal">Personal Leave</MenuItem>
                  <MenuItem value="maternity">Maternity Leave</MenuItem>
                  <MenuItem value="paternity">Paternity Leave</MenuItem>
                  <MenuItem value="unpaid">Unpaid Leave</MenuItem>
                </Select>
                {validationErrors.type && (
                  <FormHelperText>{validationErrors.type}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              {leaveBalance && (
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2">Available Balance</Typography>
                  <Typography variant="h6">
                    {leaveBalance[formData.type] || 0} days
                  </Typography>
                </Paper>
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={formData.start_date}
                  onChange={handleDateChange('start_date')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!validationErrors.start_date}
                      helperText={validationErrors.start_date}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={formData.end_date}
                  onChange={handleDateChange('end_date')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!validationErrors.end_date}
                      helperText={validationErrors.end_date}
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.half_day}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        half_day: e.target.checked,
                        end_date: formData.start_date
                      });
                    }}
                  />
                }
                label="Half Day Leave"
              />
            </Grid>
            {formData.half_day && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Half Day Part</InputLabel>
                  <Select
                    value={formData.half_day_part}
                    label="Half Day Part"
                    onChange={handleChange('half_day_part')}
                  >
                    <MenuItem value="morning">Morning</MenuItem>
                    <MenuItem value="afternoon">Afternoon</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason"
                multiline
                rows={4}
                value={formData.reason}
                onChange={handleChange('reason')}
                error={!!validationErrors.reason}
                helperText={validationErrors.reason}
              />
            </Grid>
            {conflicts.length > 0 && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  <Typography variant="subtitle2">Potential Conflicts:</Typography>
                  <ul>
                    {conflicts.map((conflict, index) => (
                      <li key={index}>
                        {conflict.employee_name} - {conflict.type} ({new Date(conflict.start_date).toLocaleDateString()} to {new Date(conflict.end_date).toLocaleDateString()})
                      </li>
                    ))}
                  </ul>
                </Alert>
              </Grid>
            )}
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Additional Comments"
                multiline
                rows={4}
                value={formData.comments}
                onChange={handleChange('comments')}
              />
            </Grid>
            <Grid item xs={12}>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="attachments"
              />
              <label htmlFor="attachments">
                <Button variant="outlined" component="span">
                  Upload Attachments
                </Button>
              </label>
              {formData.attachments.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2">Attachments:</Typography>
                  {formData.attachments.map((file, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mt: 1
                      }}
                    >
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {file.name}
                      </Typography>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleRemoveAttachment(index)}
                      >
                        Remove
                      </Button>
                    </Box>
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        {isEdit ? 'Edit Leave Request' : 'New Leave Request'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Leave request {isEdit ? 'updated' : 'created'} successfully!
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 3 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {getStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Box>
              {activeStep !== 0 && (
                <Button onClick={handleBack} sx={{ mr: 1 }}>
                  Back
                </Button>
              )}
              {activeStep === 0 && (
                <Button
                  variant="outlined"
                  onClick={calculatePreview}
                  disabled={!formData.start_date || !formData.end_date || !formData.type}
                >
                  Preview
                </Button>
              )}
            </Box>
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} /> : 'Submit'}
                </Button>
              ) : (
                <Button variant="contained" onClick={handleNext}>
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      )}

      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Leave Request Preview</DialogTitle>
        <DialogContent>
          {previewData && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      Leave Details
                    </Typography>
                    <Typography variant="body1">
                      Type: {formData.type}
                    </Typography>
                    <Typography variant="body1">
                      Duration: {previewData.days} days
                    </Typography>
                    <Typography variant="body1">
                      Start: {formData.start_date.toLocaleDateString()}
                    </Typography>
                    <Typography variant="body1">
                      End: {formData.end_date.toLocaleDateString()}
                    </Typography>
                    {formData.half_day && (
                      <Typography variant="body1">
                        Half Day: {formData.half_day_part}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary">
                      Balance Impact
                    </Typography>
                    <Typography variant="body1">
                      Current Balance: {previewData.balance} days
                    </Typography>
                    <Typography variant="body1">
                      After Request: {previewData.remaining} days
                    </Typography>
                    {previewData.remaining < 0 && (
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        This request will exceed your available balance
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              {previewData.policy && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" color="textSecondary">
                        Policy Compliance
                      </Typography>
                      <Typography variant="body1">
                        Minimum Notice: {previewData.policy.advanceNotice} days
                      </Typography>
                      <Typography variant="body1">
                        Minimum Duration: {previewData.policy.minDuration} days
                      </Typography>
                      <Typography variant="body1">
                        Maximum Duration: {previewData.policy.maxDuration} days
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              setPreviewDialogOpen(false);
              handleNext();
            }}
          >
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeaveRequest; 