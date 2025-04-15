import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Upload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Description as DocumentIcon,
  Visibility as ViewIcon,
  CheckCircle as VerifiedIcon,
  Warning as PendingIcon
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const EmployeeDocuments = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { id } = useParams();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    document_name: '',
    document_type: '',
    file: null,
    expiry_date: ''
  });
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchDocuments();
  }, [id]);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`/api/hr/employees/${id}/documents`);
      setDocuments(response.data.data.documents);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch documents');
      setLoading(false);
    }
  };

  const handleUploadDialogOpen = () => {
    setUploadDialogOpen(true);
    setUploadForm({
      document_name: '',
      document_type: '',
      file: null,
      expiry_date: ''
    });
    setValidationErrors({});
  };

  const handleUploadDialogClose = () => {
    setUploadDialogOpen(false);
    setUploadForm({
      document_name: '',
      document_type: '',
      file: null,
      expiry_date: ''
    });
    setValidationErrors({});
  };

  const handleDeleteDialogOpen = (document) => {
    setSelectedDocument(document);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setSelectedDocument(null);
    setDeleteDialogOpen(false);
  };

  const validateForm = () => {
    const errors = {};
    if (!uploadForm.document_name) errors.document_name = 'Document name is required';
    if (!uploadForm.document_type) errors.document_type = 'Document type is required';
    if (!uploadForm.file) errors.file = 'File is required';
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = (event) => {
    setUploadForm({
      ...uploadForm,
      file: event.target.files[0]
    });
  };

  const handleUpload = async () => {
    if (!validateForm()) return;

    const formData = new FormData();
    formData.append('document_name', uploadForm.document_name);
    formData.append('document_type', uploadForm.document_type);
    formData.append('file', uploadForm.file);
    if (uploadForm.expiry_date) {
      formData.append('expiry_date', uploadForm.expiry_date);
    }

    try {
      await axios.post(`/api/hr/employees/${id}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      handleUploadDialogClose();
      fetchDocuments();
    } catch (err) {
      setError('Failed to upload document');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/hr/employees/${id}/documents/${selectedDocument.id}`);
      handleDeleteDialogClose();
      fetchDocuments();
    } catch (err) {
      setError('Failed to delete document');
    }
  };

  const handleDownload = async (document) => {
    try {
      const response = await axios.get(`/api/hr/employees/${id}/documents/${document.id}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.document_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download document');
    }
  };

  const documentTypes = [
    'Employment Contract',
    'ID Proof',
    'Address Proof',
    'Educational Certificate',
    'Experience Certificate',
    'Tax Documents',
    'Insurance Documents',
    'Other'
  ];

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Employee Documents</Typography>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={handleUploadDialogOpen}
        >
          Upload Document
        </Button>
      </Box>

      <Grid container spacing={3}>
        {documents.map((doc) => (
          <Grid item xs={12} sm={6} md={4} key={doc.id}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DocumentIcon sx={{ mr: 1 }} />
                <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                  {doc.document_name}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleDownload(doc)}
                  title="Download"
                >
                  <DownloadIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => handleDeleteDialogOpen(doc)}
                  title="Delete"
                >
                  <DeleteIcon />
                </IconButton>
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
                  icon={doc.is_verified ? <VerifiedIcon /> : <PendingIcon />}
                  label={doc.is_verified ? 'Verified' : 'Pending Verification'}
                  color={doc.is_verified ? 'success' : 'warning'}
                  size="small"
                />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={handleUploadDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Upload New Document</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Document Name"
              value={uploadForm.document_name}
              onChange={(e) => setUploadForm({ ...uploadForm, document_name: e.target.value })}
              error={!!validationErrors.document_name}
              helperText={validationErrors.document_name}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              select
              label="Document Type"
              value={uploadForm.document_type}
              onChange={(e) => setUploadForm({ ...uploadForm, document_type: e.target.value })}
              error={!!validationErrors.document_type}
              helperText={validationErrors.document_type}
              sx={{ mb: 2 }}
            >
              {documentTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              type="file"
              onChange={handleFileChange}
              error={!!validationErrors.file}
              helperText={validationErrors.file}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              type="date"
              label="Expiry Date (Optional)"
              value={uploadForm.expiry_date}
              onChange={(e) => setUploadForm({ ...uploadForm, expiry_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadDialogClose}>Cancel</Button>
          <Button onClick={handleUpload} variant="contained">
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedDocument?.document_name}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeDocuments; 