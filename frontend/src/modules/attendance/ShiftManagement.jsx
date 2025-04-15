import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

const ShiftManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [shiftForm, setShiftForm] = useState({
    name: '',
    start_time: null,
    end_time: null,
    department_id: '',
    is_default: false,
    employees: []
  });

  useEffect(() => {
    fetchShifts();
    fetchDepartments();
    fetchEmployees();
  }, []);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/hr/attendance/shifts');
      setShifts(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch shifts');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/hr/departments');
      setDepartments(response.data.data);
    } catch (err) {
      setError('Failed to fetch departments');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/hr/employees');
      setEmployees(response.data.data);
    } catch (err) {
      setError('Failed to fetch employees');
    }
  };

  const handleOpenShiftDialog = (shift = null) => {
    if (shift) {
      setSelectedShift(shift);
      setShiftForm({
        name: shift.name,
        start_time: new Date(`2000-01-01T${shift.start_time}`),
        end_time: new Date(`2000-01-01T${shift.end_time}`),
        department_id: shift.department_id,
        is_default: shift.is_default,
        employees: shift.employees.map(e => e.id)
      });
    } else {
      setSelectedShift(null);
      setShiftForm({
        name: '',
        start_time: null,
        end_time: null,
        department_id: '',
        is_default: false,
        employees: []
      });
    }
    setShiftDialogOpen(true);
  };

  const handleCloseShiftDialog = () => {
    setShiftDialogOpen(false);
    setSelectedShift(null);
  };

  const handleShiftFormChange = (field, value) => {
    setShiftForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitShift = async () => {
    try {
      const data = {
        ...shiftForm,
        start_time: shiftForm.start_time ? format(shiftForm.start_time, 'HH:mm:ss') : null,
        end_time: shiftForm.end_time ? format(shiftForm.end_time, 'HH:mm:ss') : null
      };

      if (selectedShift) {
        await axios.put(`/api/hr/attendance/shifts/${selectedShift.id}`, data);
      } else {
        await axios.post('/api/hr/attendance/shifts', data);
      }

      handleCloseShiftDialog();
      fetchShifts();
    } catch (err) {
      setError('Failed to save shift');
    }
  };

  const handleDeleteShift = async (shiftId) => {
    if (window.confirm('Are you sure you want to delete this shift?')) {
      try {
        await axios.delete(`/api/hr/attendance/shifts/${shiftId}`);
        fetchShifts();
      } catch (err) {
        setError('Failed to delete shift');
      }
    }
  };

  const formatTime = (time) => {
    return time ? format(parseISO(`2000-01-01T${time}`), 'hh:mm a') : '-';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Shift Management
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenShiftDialog()}
          >
            New Shift
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchShifts}
          >
            Refresh
          </Button>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Default</TableCell>
                <TableCell>Employee Count</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell>{shift.name}</TableCell>
                  <TableCell>{formatTime(shift.start_time)}</TableCell>
                  <TableCell>{formatTime(shift.end_time)}</TableCell>
                  <TableCell>{shift.department_name}</TableCell>
                  <TableCell>
                    <Chip
                      label={shift.is_default ? 'Yes' : 'No'}
                      color={shift.is_default ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{shift.employee_count}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenShiftDialog(shift)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteShift(shift.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={shiftDialogOpen}
        onClose={handleCloseShiftDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedShift ? 'Edit Shift' : 'New Shift'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Shift Name"
                value={shiftForm.name}
                onChange={(e) => handleShiftFormChange('name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker
                  label="Start Time"
                  value={shiftForm.start_time}
                  onChange={(time) => handleShiftFormChange('start_time', time)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <TimePicker
                  label="End Time"
                  value={shiftForm.end_time}
                  onChange={(time) => handleShiftFormChange('end_time', time)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={shiftForm.department_id}
                  label="Department"
                  onChange={(e) => handleShiftFormChange('department_id', e.target.value)}
                >
                  <MenuItem value="">None</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Employees</InputLabel>
                <Select
                  multiple
                  value={shiftForm.employees}
                  label="Employees"
                  onChange={(e) => handleShiftFormChange('employees', e.target.value)}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const employee = employees.find(e => e.id === value);
                        return (
                          <Chip
                            key={value}
                            label={`${employee?.first_name} ${employee?.last_name}`}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={shiftForm.is_default}
                    onChange={(e) => handleShiftFormChange('is_default', e.target.checked)}
                  />
                }
                label="Default Shift"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseShiftDialog}>Cancel</Button>
          <Button onClick={handleSubmitShift} variant="contained">
            {selectedShift ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShiftManagement; 