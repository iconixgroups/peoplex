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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';
import { format, parseISO, differenceInDays, isValid } from 'date-fns';

const LeaveList = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    department: '',
    employee: '',
    leaveType: '',
    status: ''
  });
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [formData, setFormData] = useState({
    employee_id: '',
    leave_type: 'annual',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    reason: '',
    status: 'pending',
  });

  const leaveTypes = [
    { value: 'annual', label: 'Annual Leave' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'maternity', label: 'Maternity Leave' },
    { value: 'paternity', label: 'Paternity Leave' },
    { value: 'unpaid', label: 'Unpaid Leave' },
    { value: 'bereavement', label: 'Bereavement Leave' },
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'warning' },
    { value: 'approved', label: 'Approved', color: 'success' },
    { value: 'rejected', label: 'Rejected', color: 'error' },
    { value: 'cancelled', label: 'Cancelled', color: 'default' },
  ];

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
    fetchLeaves();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get('/api/hr/departments');
      setDepartments(response.data.data.departments);
    } catch (err) {
      setError('Failed to fetch departments');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/hr/employees');
      setEmployees(response.data.data.employees);
    } catch (err) {
      setError('Failed to fetch employees');
    }
  };

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const params = {
        start_date: filters.startDate?.toISOString(),
        end_date: filters.endDate?.toISOString(),
        department_id: filters.department,
        employee_id: filters.employee,
        leave_type: filters.leaveType,
        status: filters.status
      };
      const response = await axios.get('/api/hr/leave/requests', { params });
      setLeaves(response.data.data.leaves);
      setError(null);
    } catch (err) {
      setError('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleViewLeave = (leave) => {
    setSelectedLeave(leave);
    setViewDialogOpen(true);
  };

  const handleDeleteLeave = async () => {
    try {
      await axios.delete(`/api/hr/leave/requests/${selectedLeave.id}`);
      setLeaves(leaves.filter(l => l.id !== selectedLeave.id));
      setDeleteDialogOpen(false);
      setSelectedLeave(null);
    } catch (err) {
      setError('Failed to delete leave request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleOpenDialog = (mode, leave = null) => {
    setDialogMode(mode);
    setSelectedLeave(leave);
    
    if (mode === 'add') {
      setFormData({
        employee_id: '',
        leave_type: 'annual',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        reason: '',
        status: 'pending',
      });
    } else if (mode === 'edit' && leave) {
      setFormData({
        employee_id: leave.employee_id,
        leave_type: leave.leave_type,
        start_date: leave.start_date,
        end_date: leave.end_date,
        reason: leave.reason || '',
        status: leave.status,
      });
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLeave(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleStartDateChange = (date) => {
    if (isValid(date)) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const currentEndDate = parseISO(formData.end_date);
      
      // If start date is after end date, update end date to match start date
      if (date > currentEndDate) {
        setFormData({
          ...formData,
          start_date: formattedDate,
          end_date: formattedDate
        });
      } else {
        setFormData({
          ...formData,
          start_date: formattedDate
        });
      }
    }
  };

  const handleEndDateChange = (date) => {
    if (isValid(date)) {
      const startDate = parseISO(formData.start_date);
      
      // Ensure end date is not before start date
      if (date >= startDate) {
        setFormData({
          ...formData,
          end_date: format(date, 'yyyy-MM-dd')
        });
      } else {
        setError('End date cannot be before start date');
      }
    }
  };

  const calculateDuration = (startDate, endDate) => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const days = differenceInDays(end, start) + 1; // Include both start and end days
    return days > 1 ? `${days} days` : `${days} day`;
  };

  const handleSubmit = async () => {
    if (dialogMode === 'delete') {
      await deleteLeaveRequest();
      return;
    }
    
    // Validate form
    if (!formData.employee_id || !formData.leave_type || !formData.start_date || !formData.end_date) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      let response;
      
      if (dialogMode === 'add') {
        // Create new leave request
        response = await axios.post('/api/hr/leave/requests', formData);
      } else if (dialogMode === 'edit') {
        // Update leave request
        response = await axios.put(`/api/hr/leave/requests/${selectedLeave.id}`, formData);
      }
      
      if (!response.ok) {
        throw new Error('Failed to save leave request');
      }
      
      // Refresh leave requests
      await fetchLeaves();
      
      // Close dialog
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving leave request:', err);
      setError('Failed to save leave request. Please try again.');
    }
  };

  const deleteLeaveRequest = async () => {
    try {
      await axios.delete(`/api/hr/leave/requests/${selectedLeave.id}`);
      setLeaves(leaves.filter(l => l.id !== selectedLeave.id));
      setDeleteDialogOpen(false);
      setSelectedLeave(null);
    } catch (err) {
      console.error('Error deleting leave request:', err);
      setError('Failed to delete leave request. Please try again.');
    }
  };

  // Filter leave requests based on search term and status filter
  const filteredRequests = leaves.filter(leave => {
    const employee = employees.find(emp => emp.id === leave.employee_id);
    const employeeName = employee ? `${employee.first_name} ${employee.last_name}` : '';
    const leaveType = leaveTypes.find(type => type.value === leave.leave_type)?.label || '';
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = 
      employeeName.toLowerCase().includes(searchLower) || 
      leaveType.toLowerCase().includes(searchLower) ||
      (leave.reason && leave.reason.toLowerCase().includes(searchLower));
    
    const matchesStatus = statusFilter === 'all' || leave.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.first_name} ${employee.last_name}` : 'Unknown Employee';
  };

  const getLeaveTypeName = (leaveType) => {
    return leaveTypes.find(type => type.value === leaveType)?.label || leaveType;
  };

  const getStatusChip = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return (
      <Chip 
        label={statusOption?.label || status}
        color={statusOption?.color || 'default'}
        size="small"
      />
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Leave Requests</Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ mr: 1 }}
            onClick={() => handleOpenDialog('add')}
          >
            New Request
          </Button>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchLeaves}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                label="Department"
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Employee</InputLabel>
              <Select
                value={filters.employee}
                onChange={(e) => handleFilterChange('employee', e.target.value)}
                label="Employee"
              >
                <MenuItem value="">All Employees</MenuItem>
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Leave Type</InputLabel>
              <Select
                value={filters.leaveType}
                onChange={(e) => handleFilterChange('leaveType', e.target.value)}
                label="Leave Type"
              >
                <MenuItem value="">All Types</MenuItem>
                {leaveTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              startIcon={<FilterIcon />}
              onClick={fetchLeaves}
              fullWidth={isMobile}
            >
              Apply Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Leave Type</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>End Date</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No leave requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>
                      {getEmployeeName(leave.employee_id)}
                    </TableCell>
                    <TableCell>{leave.department.name}</TableCell>
                    <TableCell>{getLeaveTypeName(leave.leave_type)}</TableCell>
                    <TableCell>{new Date(leave.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(leave.end_date).toLocaleDateString()}</TableCell>
                    <TableCell>{calculateDuration(leave.start_date, leave.end_date)}</TableCell>
                    <TableCell>
                      {getStatusChip(leave.status)}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog('view', leave)}
                          sx={{ mr: 1 }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog('edit', leave)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog('delete', leave)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7}>
            <TextField
              fullWidth
              variant="outlined"
              label="Search Leave Requests"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={5}>
            <FormControl fullWidth>
              <InputLabel id="status-filter-label">Filter by Status</InputLabel>
              <Select
                labelId="status-filter-label"
                id="status-filter"
                value={statusFilter}
                label="Filter by Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Leave Request Details</DialogTitle>
        <DialogContent>
          {selectedLeave && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Employee
                </Typography>
                <Typography>
                  {selectedLeave.employee.first_name} {selectedLeave.employee.last_name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Department
                </Typography>
                <Typography>{selectedLeave.department.name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Leave Type
                </Typography>
                <Typography>{selectedLeave.leave_type}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Status
                </Typography>
                {getStatusChip(selectedLeave.status)}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Start Date
                </Typography>
                <Typography>
                  {new Date(selectedLeave.start_date).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  End Date
                </Typography>
                <Typography>
                  {new Date(selectedLeave.end_date).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Duration
                </Typography>
                <Typography>{calculateDuration(selectedLeave.start_date, selectedLeave.end_date)}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Requested On
                </Typography>
                <Typography>
                  {new Date(selectedLeave.created_at).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Reason
                </Typography>
                <Typography>{selectedLeave.reason}</Typography>
              </Grid>
              {selectedLeave.comments && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Comments
                  </Typography>
                  <Typography>{selectedLeave.comments}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDialog && ['add', 'edit', 'view'].includes(dialogMode)}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'add' && 'Create New Leave Request'}
          {dialogMode === 'edit' && 'Edit Leave Request'}
          {dialogMode === 'view' && 'Leave Request Details'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="employee-label">Employee</InputLabel>
                <Select
                  labelId="employee-label"
                  id="employee_id"
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleInputChange}
                  disabled={dialogMode === 'view'}
                >
                  {employees.map(emp => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {`${emp.first_name} ${emp.last_name}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel id="leave-type-label">Leave Type</InputLabel>
                <Select
                  labelId="leave-type-label"
                  id="leave_type"
                  name="leave_type"
                  value={formData.leave_type}
                  onChange={handleInputChange}
                  disabled={dialogMode === 'view'}
                >
                  {leaveTypes.map(type => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={parseISO(formData.start_date)}
                  onChange={handleStartDateChange}
                  disabled={dialogMode === 'view'}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={parseISO(formData.end_date)}
                  onChange={handleEndDateChange}
                  disabled={dialogMode === 'view'}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Reason for Leave"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                disabled={dialogMode === 'view'}
                multiline
                rows={3}
              />
            </Grid>
            {(dialogMode === 'edit' || dialogMode === 'view') && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={dialogMode === 'view'}
                  >
                    {statusOptions.map(option => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            {dialogMode === 'view' && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    Duration
                  </Typography>
                  <Typography variant="body1">
                    {calculateDuration(formData.start_date, formData.end_date)}
                  </Typography>
                </Grid>
                {selectedLeave?.created_at && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Requested On
                    </Typography>
                    <Typography variant="body1">
                      {format(parseISO(selectedLeave.created_at), 'MMM dd, yyyy')}
                    </Typography>
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {dialogMode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          {dialogMode !== 'view' && (
            <Button onClick={handleSubmit} variant="contained" color="primary">
              Save
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDialog && dialogMode === 'delete'}
        onClose={handleCloseDialog}
      >
        <DialogTitle>Delete Leave Request</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this leave request? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeaveList; 