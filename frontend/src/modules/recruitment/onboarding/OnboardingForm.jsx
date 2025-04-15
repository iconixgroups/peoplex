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
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const OnboardingForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    employee_id: '',
    start_date: '',
    duration: 30, // Default duration in days
    status: 'not_started',
    tasks: [],
  });

  const [employees, setEmployees] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    assignee_id: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchEmployees();
    if (isEdit) {
      fetchOnboardingPlan();
    }
  }, [id]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/hr/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchOnboardingPlan = async () => {
    try {
      const response = await axios.get(`/api/hr/recruitment/onboarding/${id}`);
      const plan = response.data;
      setFormData({
        ...plan,
        start_date: plan.start_date ? new Date(plan.start_date).toISOString().split('T')[0] : '',
      });
    } catch (error) {
      console.error('Error fetching onboarding plan:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.employee_id) newErrors.employee_id = 'Employee is required';
    if (!formData.start_date) newErrors.start_date = 'Start date is required';
    if (formData.tasks.length === 0) newErrors.tasks = 'At least one task is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleTaskChange = (e) => {
    const { name, value } = e.target;
    setNewTask((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addTask = () => {
    if (!newTask.title || !newTask.due_date) return;

    const task = {
      id: Date.now().toString(),
      ...newTask,
      status: 'pending',
    };

    setFormData((prev) => ({
      ...prev,
      tasks: [...prev.tasks, task],
    }));

    setNewTask({
      title: '',
      description: '',
      due_date: '',
      assignee_id: '',
    });
  };

  const removeTask = (taskId) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((task) => task.id !== taskId),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (isEdit) {
        await axios.put(`/api/hr/recruitment/onboarding/${id}`, formData);
      } else {
        await axios.post('/api/hr/recruitment/onboarding', formData);
      }
      navigate('/recruitment/onboarding');
    } catch (error) {
      console.error('Error saving onboarding plan:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {isEdit ? 'Edit Onboarding Plan' : 'New Onboarding Plan'}
      </Typography>

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.employee_id}>
                  <InputLabel>Employee</InputLabel>
                  <Select
                    name="employee_id"
                    value={formData.employee_id}
                    onChange={handleChange}
                    label="Employee"
                  >
                    {employees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.first_name} {employee.last_name} ({employee.email})
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.employee_id && (
                    <FormHelperText>{errors.employee_id}</FormHelperText>
                  )}
                </FormControl>
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
                  type="number"
                  label="Duration (days)"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  InputProps={{ inputProps: { min: 1 } }}
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
                      <MenuItem value="not_started">Not Started</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Tasks
                </Typography>
                {errors.tasks && (
                  <FormHelperText error>{errors.tasks}</FormHelperText>
                )}
                <List>
                  {formData.tasks.map((task) => (
                    <React.Fragment key={task.id}>
                      <ListItem>
                        <ListItemText
                          primary={task.title}
                          secondary={
                            <>
                              {task.description}
                              <br />
                              Due: {new Date(task.due_date).toLocaleDateString()}
                              {task.assignee_id && (
                                <>
                                  <br />
                                  Assignee: {
                                    employees.find((e) => e.id === task.assignee_id)?.first_name
                                  } {
                                    employees.find((e) => e.id === task.assignee_id)?.last_name
                                  }
                                </>
                              )}
                            </>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => removeTask(task.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Add New Task
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Task Title"
                      name="title"
                      value={newTask.title}
                      onChange={handleTaskChange}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Due Date"
                      name="due_date"
                      value={newTask.due_date}
                      onChange={handleTaskChange}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                      <InputLabel>Assignee</InputLabel>
                      <Select
                        name="assignee_id"
                        value={newTask.assignee_id}
                        onChange={handleTaskChange}
                        label="Assignee"
                      >
                        <MenuItem value="">None</MenuItem>
                        {employees.map((employee) => (
                          <MenuItem key={employee.id} value={employee.id}>
                            {employee.first_name} {employee.last_name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      value={newTask.description}
                      onChange={handleTaskChange}
                      multiline
                      rows={2}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={addTask}
                    >
                      Add Task
                    </Button>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/recruitment/onboarding')}
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

export default OnboardingForm; 