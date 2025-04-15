import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';

const LeaveSettings = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [settings, setSettings] = useState({
    accrual: {
      method: 'monthly',
      carryForward: true,
      maxCarryForward: 5,
      proRata: true
    },
    policies: {
      annual: {
        entitlement: 20,
        minDuration: 0.5,
        maxDuration: 10,
        advanceNotice: 7,
        approvalRequired: true
      },
      sick: {
        entitlement: 10,
        minDuration: 1,
        maxDuration: 5,
        advanceNotice: 0,
        approvalRequired: false,
        medicalCertificate: true
      },
      personal: {
        entitlement: 5,
        minDuration: 0.5,
        maxDuration: 3,
        advanceNotice: 2,
        approvalRequired: true
      }
    },
    notifications: {
      requestSubmitted: true,
      requestApproved: true,
      requestRejected: true,
      balanceLow: true,
      balanceThreshold: 3
    },
    workflow: {
      autoApprove: false,
      approvers: [],
      backupApprovers: []
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/hr/leave/settings');
      setSettings(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch leave settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handlePolicyChange = (leaveType, field, value) => {
    setSettings(prev => ({
      ...prev,
      policies: {
        ...prev.policies,
        [leaveType]: {
          ...prev.policies[leaveType],
          [field]: value
        }
      }
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSuccess(null);
    try {
      await axios.put('/api/hr/leave/settings', settings);
      setSuccess('Settings saved successfully');
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const renderAccrualSettings = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Leave Accrual Settings
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Accrual Method</InputLabel>
              <Select
                value={settings.accrual.method}
                onChange={(e) => handleSettingChange('accrual', 'method', e.target.value)}
                label="Accrual Method"
              >
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="annually">Annually</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.accrual.carryForward}
                  onChange={(e) => handleSettingChange('accrual', 'carryForward', e.target.checked)}
                />
              }
              label="Allow Leave Carry Forward"
            />
          </Grid>
          {settings.accrual.carryForward && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Maximum Carry Forward Days"
                value={settings.accrual.maxCarryForward}
                onChange={(e) => handleSettingChange('accrual', 'maxCarryForward', parseInt(e.target.value))}
              />
            </Grid>
          )}
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.accrual.proRata}
                  onChange={(e) => handleSettingChange('accrual', 'proRata', e.target.checked)}
                />
              }
              label="Pro-rata Accrual for New Hires"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderPolicySettings = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Leave Policy Settings
        </Typography>
        {Object.entries(settings.policies).map(([type, policy]) => (
          <Box key={type} sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              {type.charAt(0).toUpperCase() + type.slice(1)} Leave
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Annual Entitlement (days)"
                  value={policy.entitlement}
                  onChange={(e) => handlePolicyChange(type, 'entitlement', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Minimum Duration (days)"
                  value={policy.minDuration}
                  onChange={(e) => handlePolicyChange(type, 'minDuration', parseFloat(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Maximum Duration (days)"
                  value={policy.maxDuration}
                  onChange={(e) => handlePolicyChange(type, 'maxDuration', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Advance Notice (days)"
                  value={policy.advanceNotice}
                  onChange={(e) => handlePolicyChange(type, 'advanceNotice', parseInt(e.target.value))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={policy.approvalRequired}
                      onChange={(e) => handlePolicyChange(type, 'approvalRequired', e.target.checked)}
                    />
                  }
                  label="Approval Required"
                />
              </Grid>
              {type === 'sick' && (
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={policy.medicalCertificate}
                        onChange={(e) => handlePolicyChange(type, 'medicalCertificate', e.target.checked)}
                      />
                    }
                    label="Medical Certificate Required"
                  />
                </Grid>
              )}
            </Grid>
            <Divider sx={{ my: 2 }} />
          </Box>
        ))}
      </CardContent>
    </Card>
  );

  const renderNotificationSettings = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Notification Settings
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.requestSubmitted}
                  onChange={(e) => handleSettingChange('notifications', 'requestSubmitted', e.target.checked)}
                />
              }
              label="Notify on Leave Request Submission"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.requestApproved}
                  onChange={(e) => handleSettingChange('notifications', 'requestApproved', e.target.checked)}
                />
              }
              label="Notify on Leave Request Approval"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.requestRejected}
                  onChange={(e) => handleSettingChange('notifications', 'requestRejected', e.target.checked)}
                />
              }
              label="Notify on Leave Request Rejection"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.balanceLow}
                  onChange={(e) => handleSettingChange('notifications', 'balanceLow', e.target.checked)}
                />
              }
              label="Notify on Low Leave Balance"
            />
          </Grid>
          {settings.notifications.balanceLow && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Low Balance Threshold (days)"
                value={settings.notifications.balanceThreshold}
                onChange={(e) => handleSettingChange('notifications', 'balanceThreshold', parseInt(e.target.value))}
              />
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  const renderWorkflowSettings = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Workflow Settings
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.workflow.autoApprove}
                  onChange={(e) => handleSettingChange('workflow', 'autoApprove', e.target.checked)}
                />
              }
              label="Auto-approve Leave Requests"
            />
          </Grid>
          {!settings.workflow.autoApprove && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Primary Approvers
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {settings.workflow.approvers.map((approver, index) => (
                    <Chip
                      key={index}
                      label={approver.name}
                      onDelete={() => {
                        const newApprovers = [...settings.workflow.approvers];
                        newApprovers.splice(index, 1);
                        handleSettingChange('workflow', 'approvers', newApprovers);
                      }}
                    />
                  ))}
                  <Tooltip title="Add Approver">
                    <IconButton size="small" color="primary">
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Backup Approvers
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {settings.workflow.backupApprovers.map((approver, index) => (
                    <Chip
                      key={index}
                      label={approver.name}
                      onDelete={() => {
                        const newBackupApprovers = [...settings.workflow.backupApprovers];
                        newBackupApprovers.splice(index, 1);
                        handleSettingChange('workflow', 'backupApprovers', newBackupApprovers);
                      }}
                    />
                  ))}
                  <Tooltip title="Add Backup Approver">
                    <IconButton size="small" color="primary">
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Leave Settings</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchSettings}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {renderAccrualSettings()}
          {renderPolicySettings()}
          {renderNotificationSettings()}
          {renderWorkflowSettings()}
        </>
      )}
    </Box>
  );
};

export default LeaveSettings; 