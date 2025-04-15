import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Today as TodayIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import axios from 'axios';

const AttendanceCalendar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentDate, setCurrentDate] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    status: '',
    notes: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchAttendanceRecords();
  }, [currentDate, selectedEmployee]);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/hr/employees');
      setEmployees(response.data.data);
    } catch (err) {
      setError('Failed to fetch employees');
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      const employeeId = selectedEmployee === 'all' ? '' : selectedEmployee;
      
      const response = await axios.get(`/api/hr/attendance/records`, {
        params: {
          start_date: startDate,
          end_date: endDate,
          employee_id: employeeId
        }
      });
      
      setAttendanceRecords(response.data.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch attendance records');
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date) => {
    const records = attendanceRecords.filter(record => 
      isSameDay(parseISO(record.date), date)
    );
    if (records.length > 0) {
      setSelectedDate(date);
      setSelectedRecord(records[0]);
      setEditForm({
        status: records[0].status,
        notes: records[0].notes || ''
      });
      setEditDialogOpen(true);
    }
  };

  const handleEditSubmit = async () => {
    try {
      await axios.put(`/api/hr/attendance/records/${selectedRecord.id}`, editForm);
      await fetchAttendanceRecords();
      setEditDialogOpen(false);
    } catch (err) {
      setError('Failed to update attendance record');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircleIcon color="success" />;
      case 'absent':
        return <WarningIcon color="error" />;
      case 'late':
        return <AccessTimeIcon color="warning" />;
      case 'leave':
        return <EventIcon color="info" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'success';
      case 'absent':
        return 'error';
      case 'late':
        return 'warning';
      case 'leave':
        return 'info';
      default:
        return 'default';
    }
  };

  const getRecordsForDate = (date) => {
    return attendanceRecords.filter(record => 
      isSameDay(parseISO(record.date), date)
    );
  };

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Attendance Calendar
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>Employee</InputLabel>
            <Select
              value={selectedEmployee}
              label="Employee"
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <MenuItem value="all">All Employees</MenuItem>
              {employees.map(employee => (
                <MenuItem key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={8} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <IconButton onClick={handlePrevMonth}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="h6" sx={{ mx: 2 }}>
            {format(currentDate, 'MMMM yyyy')}
          </Typography>
          <IconButton onClick={handleNextMonth}>
            <ChevronRightIcon />
          </IconButton>
          <IconButton onClick={handleToday} sx={{ ml: 2 }}>
            <TodayIcon />
          </IconButton>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Grid container spacing={1}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <Grid item xs key={day} sx={{ textAlign: 'center', fontWeight: 'bold' }}>
              {day}
            </Grid>
          ))}
          {daysInMonth.map((date, index) => {
            const records = getRecordsForDate(date);
            const isCurrentMonth = isSameMonth(date, currentDate);
            
            return (
              <Grid
                item
                xs
                key={date.toString()}
                sx={{
                  minHeight: 100,
                  border: '1px solid',
                  borderColor: 'divider',
                  p: 1,
                  opacity: isCurrentMonth ? 1 : 0.5,
                  cursor: records.length > 0 ? 'pointer' : 'default',
                  '&:hover': {
                    backgroundColor: records.length > 0 ? 'action.hover' : 'inherit'
                  }
                }}
                onClick={() => records.length > 0 && handleDateClick(date)}
              >
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {format(date, 'd')}
                </Typography>
                {records.map(record => (
                  <Chip
                    key={record.id}
                    icon={getStatusIcon(record.status)}
                    label={record.employee_name}
                    color={getStatusColor(record.status)}
                    size="small"
                    sx={{ mb: 0.5, width: '100%', justifyContent: 'flex-start' }}
                  />
                ))}
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>
          Edit Attendance - {selectedDate && format(selectedDate, 'MMM dd, yyyy')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editForm.status}
                  label="Status"
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <MenuItem value="present">Present</MenuItem>
                  <MenuItem value="absent">Absent</MenuItem>
                  <MenuItem value="late">Late</MenuItem>
                  <MenuItem value="leave">Leave</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={4}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendanceCalendar; 