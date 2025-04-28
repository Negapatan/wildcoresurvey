import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SettingsIcon from '@mui/icons-material/Settings';
import SecurityIcon from '@mui/icons-material/Security';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase-config';

const StyledComponents = {
  Container: styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 3px 5px rgba(0, 0, 0, 0.1)',
  })),
  
  Header: styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
    gap: theme.spacing(1),
  })),
  
  SettingsOption: styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    border: '1px solid rgba(128, 0, 0, 0.1)',
    borderRadius: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
  })),
  
  SaveButton: styled(Button)(({ theme }) => ({
    backgroundColor: '#800000',
    color: '#FFD700',
    fontWeight: 'bold',
    marginTop: theme.spacing(2),
    '&:hover': {
      backgroundColor: '#600000',
    },
    '&.Mui-disabled': {
      backgroundColor: 'rgba(128, 0, 0, 0.4)',
      color: 'rgba(255, 215, 0, 0.4)',
    },
  })),
};

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    lockStudentAccess: false,
    lockCompanyAccess: false
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const { Container, Header, SettingsOption, SaveButton } = StyledComponents;
  
  useEffect(() => {
    // Load settings from Firestore
    const loadSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'surveyAccess'));
        
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          setSettings({
            lockStudentAccess: data.lockStudentAccess || false,
            lockCompanyAccess: data.lockCompanyAccess || false
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load settings: ' + error.message,
          severity: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  const handleToggleStudentAccess = () => {
    setSettings(prevSettings => ({
      ...prevSettings,
      lockStudentAccess: !prevSettings.lockStudentAccess
    }));
  };
  
  const handleToggleCompanyAccess = () => {
    setSettings(prevSettings => ({
      ...prevSettings,
      lockCompanyAccess: !prevSettings.lockCompanyAccess
    }));
  };
  
  const handleSaveSettings = async () => {
    setIsSaving(true);
    
    try {
      // Update settings in Firestore
      await setDoc(doc(db, 'settings', 'surveyAccess'), {
        lockStudentAccess: settings.lockStudentAccess,
        lockCompanyAccess: settings.lockCompanyAccess,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setSnackbar({
        open: true,
        message: 'Settings saved successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save settings: ' + error.message,
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress sx={{ color: '#800000' }} />
      </Box>
    );
  }
  
  return (
    <Container>
      <Header>
        <SettingsIcon sx={{ color: '#800000', fontSize: 28 }} />
        <Typography variant="h5" sx={{ color: '#800000', fontWeight: 600 }}>
          Admin Settings
        </Typography>
      </Header>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        These settings are only visible to administrators and control survey access for students and companies.
      </Alert>
      
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 500 }}>
        Survey Access Controls
      </Typography>
      
      <SettingsOption>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <SecurityIcon sx={{ color: '#800000', mr: 1 }} />
          <Typography variant="h6">Student Access</Typography>
        </Box>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          When locked, students will not be able to access or submit surveys. 
          Use this during system maintenance or when surveys should be closed.
        </Typography>
        <FormControlLabel
          control={
            <Switch 
              checked={settings.lockStudentAccess}
              onChange={handleToggleStudentAccess}
              color="error"
            />
          }
          label={
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {settings.lockStudentAccess ? "Student Access Locked" : "Student Access Allowed"}
            </Typography>
          }
        />
      </SettingsOption>
      
      <SettingsOption>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <SecurityIcon sx={{ color: '#800000', mr: 1 }} />
          <Typography variant="h6">Company Access</Typography>
        </Box>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          When locked, companies will not be able to access or submit evaluations.
          Use this during system maintenance or when evaluations should be closed.
        </Typography>
        <FormControlLabel
          control={
            <Switch 
              checked={settings.lockCompanyAccess}
              onChange={handleToggleCompanyAccess}
              color="error"
            />
          }
          label={
            <Typography variant="body1" sx={{ fontWeight: 500 }}>
              {settings.lockCompanyAccess ? "Company Access Locked" : "Company Access Allowed"}
            </Typography>
          }
        />
      </SettingsOption>
      
      <Divider sx={{ my: 3 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <SaveButton 
          onClick={handleSaveSettings}
          disabled={isSaving}
          startIcon={isSaving && <CircularProgress size={20} sx={{ color: '#FFD700' }} />}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </SaveButton>
      </Box>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminSettings; 