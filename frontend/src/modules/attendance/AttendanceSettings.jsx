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
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';

const AttendanceSettings = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [settings, setSettings] = useState({
    // General Settings
    enable_auto_checkout: false,
    auto_checkout_time: '18:00',
    grace_period_minutes: 15,
    enable_break_time: true,
    break_duration_minutes: 60,
    
    // Overtime Settings
    enable_overtime: true,
    overtime_threshold_hours: 8,
    overtime_rate_multiplier: 1.5,
    enable_weekend_overtime: true,
    weekend_overtime_rate_multiplier: 2,
    
    // Leave Settings
    enable_leave_deduction: true,
    leave_deduction_threshold_hours: 4,
    enable_half_day_leave: true,
    half_day_threshold_hours: 4,
    
    // Notification Settings
    enable_late_notifications: true,
    late_notification_threshold_minutes: 15,
    enable_absent_notifications: true,
    enable_early_checkout_notifications: true,
    early_checkout_threshold_minutes: 30,
    
    // Integration Settings
    enable_biometric_integration: false,
    enable_mobile_checkin: true,
    enable_geo_fencing: false,
    geo_fencing_radius_meters: 100
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/hr/attendance/settings');
      setSettings(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch attendance settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setSuccess(null);
    try {
      await axios.put('/api/hr/attendance/settings', settings);
      setSuccess('Settings saved successfully');
      setError(null);
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Attendance Settings
      </Typography>

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
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* General Settings */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                General Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enable_auto_checkout}
                        onChange={(e) => handleSettingChange('enable_auto_checkout', e.target.checked)}
                      />
                    }
                    label="Enable Auto Checkout"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Auto Checkout Time"
                    type="time"
                    value={settings.auto_checkout_time}
                    onChange={(e) => handleSettingChange('auto_checkout_time', e.target.value)}
                    disabled={!settings.enable_auto_checkout}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Grace Period (minutes)"
                    type="number"
                    value={settings.grace_period_minutes}
                    onChange={(e) => handleSettingChange('grace_period_minutes', parseInt(e.target.value))}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enable_break_time}
                        onChange={(e) => handleSettingChange('enable_break_time', e.target.checked)}
                      />
                    }
                    label="Enable Break Time"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Break Duration (minutes)"
                    type="number"
                    value={settings.break_duration_minutes}
                    onChange={(e) => handleSettingChange('break_duration_minutes', parseInt(e.target.value))}
                    disabled={!settings.enable_break_time}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Overtime Settings */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Overtime Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enable_overtime}
                        onChange={(e) => handleSettingChange('enable_overtime', e.target.checked)}
                      />
                    }
                    label="Enable Overtime"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Overtime Threshold (hours)"
                    type="number"
                    value={settings.overtime_threshold_hours}
                    onChange={(e) => handleSettingChange('overtime_threshold_hours', parseFloat(e.target.value))}
                    disabled={!settings.enable_overtime}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Overtime Rate Multiplier"
                    type="number"
                    value={settings.overtime_rate_multiplier}
                    onChange={(e) => handleSettingChange('overtime_rate_multiplier', parseFloat(e.target.value))}
                    disabled={!settings.enable_overtime}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enable_weekend_overtime}
                        onChange={(e) => handleSettingChange('enable_weekend_overtime', e.target.checked)}
                      />
                    }
                    label="Enable Weekend Overtime"
                    disabled={!settings.enable_overtime}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Weekend Overtime Rate Multiplier"
                    type="number"
                    value={settings.weekend_overtime_rate_multiplier}
                    onChange={(e) => handleSettingChange('weekend_overtime_rate_multiplier', parseFloat(e.target.value))}
                    disabled={!settings.enable_overtime || !settings.enable_weekend_overtime}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Leave Settings */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Leave Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enable_leave_deduction}
                        onChange={(e) => handleSettingChange('enable_leave_deduction', e.target.checked)}
                      />
                    }
                    label="Enable Leave Deduction"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Leave Deduction Threshold (hours)"
                    type="number"
                    value={settings.leave_deduction_threshold_hours}
                    onChange={(e) => handleSettingChange('leave_deduction_threshold_hours', parseFloat(e.target.value))}
                    disabled={!settings.enable_leave_deduction}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enable_half_day_leave}
                        onChange={(e) => handleSettingChange('enable_half_day_leave', e.target.checked)}
                      />
                    }
                    label="Enable Half Day Leave"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Half Day Threshold (hours)"
                    type="number"
                    value={settings.half_day_threshold_hours}
                    onChange={(e) => handleSettingChange('half_day_threshold_hours', parseFloat(e.target.value))}
                    disabled={!settings.enable_half_day_leave}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Notification Settings */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Notification Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enable_late_notifications}
                        onChange={(e) => handleSettingChange('enable_late_notifications', e.target.checked)}
                      />
                    }
                    label="Enable Late Notifications"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Late Notification Threshold (minutes)"
                    type="number"
                    value={settings.late_notification_threshold_minutes}
                    onChange={(e) => handleSettingChange('late_notification_threshold_minutes', parseInt(e.target.value))}
                    disabled={!settings.enable_late_notifications}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enable_absent_notifications}
                        onChange={(e) => handleSettingChange('enable_absent_notifications', e.target.checked)}
                      />
                    }
                    label="Enable Absent Notifications"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enable_early_checkout_notifications}
                        onChange={(e) => handleSettingChange('enable_early_checkout_notifications', e.target.checked)}
                      />
                    }
                    label="Enable Early Checkout Notifications"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Early Checkout Threshold (minutes)"
                    type="number"
                    value={settings.early_checkout_threshold_minutes}
                    onChange={(e) => handleSettingChange('early_checkout_threshold_minutes', parseInt(e.target.value))}
                    disabled={!settings.enable_early_checkout_notifications}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Integration Settings */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Integration Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enable_biometric_integration}
                        onChange={(e) => handleSettingChange('enable_biometric_integration', e.target.checked)}
                      />
                    }
                    label="Enable Biometric Integration"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enable_mobile_checkin}
                        onChange={(e) => handleSettingChange('enable_mobile_checkin', e.target.checked)}
                      />
                    }
                    label="Enable Mobile Check-in"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enable_geo_fencing}
                        onChange={(e) => handleSettingChange('enable_geo_fencing', e.target.checked)}
                      />
                    }
                    label="Enable Geo-fencing"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Geo-fencing Radius (meters)"
                    type="number"
                    value={settings.geo_fencing_radius_meters}
                    onChange={(e) => handleSettingChange('geo_fencing_radius_meters', parseInt(e.target.value))}
                    disabled={!settings.enable_geo_fencing}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchSettings}
                disabled={saving}
              >
                Reset
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
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default AttendanceSettings; 