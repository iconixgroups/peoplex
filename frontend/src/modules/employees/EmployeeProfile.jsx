import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Avatar,
  Chip,
  Divider,
  Button,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Edit as EditIcon,
  Description as DocumentIcon,
  Assessment as PerformanceIcon,
  Work as WorkIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Business as DepartmentIcon,
  SupervisorAccount as ManagerIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EmployeeProfile = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEmployeeData();
  }, [id]);

  const fetchEmployeeData = async () => {
    try {
      const response = await axios.get(`/api/hr/employees/${id}`);
      setEmployee(response.data.data.employee);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch employee data');
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const renderPersonalInfo = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle2" color="textSecondary">Full Name</Typography>
        <Typography variant="body1">
          {employee.first_name} {employee.middle_name} {employee.last_name}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle2" color="textSecondary">Employee ID</Typography>
        <Typography variant="body1">{employee.employee_id}</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle2" color="textSecondary">Date of Birth</Typography>
        <Typography variant="body1">
          {new Date(employee.date_of_birth).toLocaleDateString()}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle2" color="textSecondary">Gender</Typography>
        <Typography variant="body1">{employee.gender}</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle2" color="textSecondary">Marital Status</Typography>
        <Typography variant="body1">{employee.marital_status}</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle2" color="textSecondary">Nationality</Typography>
        <Typography variant="body1">{employee.nationality}</Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="textSecondary">Address</Typography>
        <Typography variant="body1">
          {employee.address}, {employee.city}, {employee.state}, {employee.country} {employee.postal_code}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="subtitle2" color="textSecondary">Emergency Contact</Typography>
        <Typography variant="body1">
          {employee.emergency_contact_name} ({employee.emergency_contact_relation}) - {employee.emergency_contact_phone}
        </Typography>
      </Grid>
    </Grid>
  );

  const renderEmploymentInfo = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle2" color="textSecondary">Department</Typography>
        <Typography variant="body1">
          <DepartmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          {employee.department_name}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle2" color="textSecondary">Job Title</Typography>
        <Typography variant="body1">
          <WorkIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          {employee.job_title}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle2" color="textSecondary">Location</Typography>
        <Typography variant="body1">
          <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          {employee.location_name}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle2" color="textSecondary">Manager</Typography>
        <Typography variant="body1">
          <ManagerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          {employee.manager_name}
        </Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle2" color="textSecondary">Employment Type</Typography>
        <Typography variant="body1">{employee.employment_type}</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle2" color="textSecondary">Employment Status</Typography>
        <Chip
          label={employee.employment_status}
          color={employee.employment_status === 'active' ? 'success' : 'default'}
          size="small"
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle2" color="textSecondary">Hire Date</Typography>
        <Typography variant="body1">
          {new Date(employee.hire_date).toLocaleDateString()}
        </Typography>
      </Grid>
      {employee.termination_date && (
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="textSecondary">Termination Date</Typography>
          <Typography variant="body1">
            {new Date(employee.termination_date).toLocaleDateString()}
          </Typography>
        </Grid>
      )}
    </Grid>
  );

  const renderDocuments = () => (
    <Grid container spacing={3}>
      {employee.documents?.map((doc) => (
        <Grid item xs={12} sm={6} key={doc.id}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <DocumentIcon sx={{ mr: 1 }} />
              <Typography variant="subtitle1">{doc.document_name}</Typography>
            </Box>
            <Typography variant="body2" color="textSecondary">
              Type: {doc.document_type}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Uploaded: {new Date(doc.upload_date).toLocaleDateString()}
            </Typography>
            {doc.expiry_date && (
              <Typography variant="body2" color="textSecondary">
                Expires: {new Date(doc.expiry_date).toLocaleDateString()}
              </Typography>
            )}
            <Box sx={{ mt: 2 }}>
              <Chip
                label={doc.is_verified ? 'Verified' : 'Pending Verification'}
                color={doc.is_verified ? 'success' : 'warning'}
                size="small"
              />
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );

  const renderPerformance = () => (
    <Grid container spacing={3}>
      {employee.performance_reviews?.map((review) => (
        <Grid item xs={12} key={review.id}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle1">
                {review.review_period}
              </Typography>
              <Chip
                label={review.status}
                color={review.status === 'completed' ? 'success' : 'default'}
                size="small"
              />
            </Box>
            <Typography variant="body2" color="textSecondary">
              Rating: {review.rating}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Submitted: {new Date(review.submitted_at).toLocaleDateString()}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading employee profile...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar
              src={`https://ui-avatars.com/api/?name=${employee.first_name}+${employee.last_name}&background=random`}
              sx={{ width: 100, height: 100 }}
            />
          </Grid>
          <Grid item xs>
            <Typography variant="h4">
              {employee.first_name} {employee.last_name}
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {employee.job_title} at {employee.department_name}
            </Typography>
            <Box sx={{ mt: 1 }}>
              <Chip
                label={employee.employment_status}
                color={employee.employment_status === 'active' ? 'success' : 'default'}
              />
            </Box>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/employees/${id}/edit`)}
            >
              Edit Profile
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons={isMobile ? 'auto' : false}
        >
          <Tab icon={<PersonIcon />} label="Personal" />
          <Tab icon={<WorkIcon />} label="Employment" />
          <Tab icon={<DocumentIcon />} label="Documents" />
          <Tab icon={<PerformanceIcon />} label="Performance" />
        </Tabs>
        <Divider />
        <Box sx={{ p: 3 }}>
          {activeTab === 0 && renderPersonalInfo()}
          {activeTab === 1 && renderEmploymentInfo()}
          {activeTab === 2 && renderDocuments()}
          {activeTab === 3 && renderPerformance()}
        </Box>
      </Paper>
    </Box>
  );
};

export default EmployeeProfile; 