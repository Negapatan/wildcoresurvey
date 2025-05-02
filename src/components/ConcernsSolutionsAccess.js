import React, { Component } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Container as MuiContainer,
  Alert,
  Snackbar,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SecurityIcon from '@mui/icons-material/Security';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase-config';
import ConcernsSolutions from './ConcernsSolutions';

const StyledComponents = {
  Container: styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4, 5),
    maxWidth: 600,
    margin: '0 auto',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(3),
      margin: theme.spacing(2),
    },
  })),

  AccessButton: styled(Button)(({ theme }) => ({
    backgroundColor: '#800000',
    color: '#FFD700',
    fontWeight: 'bold',
    '&:hover': {
      backgroundColor: '#600000',
    },
    padding: theme.spacing(1.2, 4),
    borderRadius: '4px',
    width: '100%',
    fontSize: '1rem',
    letterSpacing: '0.5px',
    marginTop: theme.spacing(3),
    height: '48px',
  })),
  
  BackButton: styled(Button)(({ theme }) => ({
    marginTop: theme.spacing(2),
    color: '#800000',
    '&:hover': {
      backgroundColor: 'rgba(128, 0, 0, 0.04)',
    },
  }))
};

class ConcernsSolutionsAccess extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accessKey: '',
      showPassword: false,
      isSubmitting: false,
      isAuthenticated: false,
      studentData: null,
      snackbar: {
        open: false,
        message: '',
        severity: 'error'
      }
    };
  }

  handleAccessKeyChange = (e) => {
    this.setState({ accessKey: e.target.value });
  };

  handleTogglePasswordVisibility = () => {
    this.setState(prevState => ({
      showPassword: !prevState.showPassword
    }));
  };

  validateAccessKey = async (accessKey) => {
    try {
      // Clean up the access key - trim whitespace
      const cleanKey = accessKey ? accessKey.trim() : '';
      
      if (!cleanKey) {
        return { valid: false, error: 'Please enter an access key' };
      }

      console.log('Validating access key for concerns and solutions:', cleanKey);
      
      // Only use FINAL access keys for concerns and solutions
      const keyField = 'finalsKey';
      
      console.log(`Using key field: ${keyField} for FINAL concerns and solutions`);
      
      // Step 1: Find the student associated with this access key in studentData collection
      let studentInfo = null;
      
      try {
        // Check studentData collection
        const studentDataRef = collection(db, 'studentData');
        
        // Query using the final key field
        const keyQuery = query(studentDataRef, where(keyField, '==', cleanKey));
        const keySnapshot = await getDocs(keyQuery);
        
        if (!keySnapshot.empty) {
          const studentDoc = keySnapshot.docs[0];
          const studentData = studentDoc.data();
          studentInfo = {
            ...studentData,
            id: studentDoc.id,
            studentName: studentData.name || studentData.studentName || 'Unknown Student',
            section: studentData.section || '',
            college: studentData.college || 'CICS',
            program: studentData.program || '',
            companyName: studentData.partnerCompany || studentData.companyName || '',
            schoolYear: studentData.schoolYear || '',
            semester: studentData.semester || '',
            finalsKey: studentData.finalsKey || cleanKey,
            // Additional fields for concerns and solutions
            concernsRecommendations: studentData.concernsRecommendations || {}
          };
          
          console.log(`Found student ${studentInfo.studentName} associated with this access key using ${keyField}`);
          
          // Check if student has a valid startDate
          if (!studentData.startDate || studentData.startDate.trim() === '') {
            console.log(`Student ${studentInfo.studentName} does not have a start date defined`);
            return { valid: false, error: 'This student\'s internship start date has not been set. Please contact the coordinator to update the student information before proceeding with concerns and solutions.' };
          }
        } else {
          // Fallback to check legacy accessKey field
          const legacyQuery = query(studentDataRef, where('accessKey', '==', cleanKey));
          const legacySnapshot = await getDocs(legacyQuery);
          
          if (!legacySnapshot.empty) {
            const studentDoc = legacySnapshot.docs[0];
            const studentData = studentDoc.data();
            studentInfo = {
              ...studentData,
              id: studentDoc.id,
              studentName: studentData.name || studentData.studentName || 'Unknown Student',
              section: studentData.section || '',
              college: studentData.college || 'CICS',
              program: studentData.program || '',
              companyName: studentData.partnerCompany || studentData.companyName || '',
              schoolYear: studentData.schoolYear || '',
              semester: studentData.semester || '',
              finalsKey: studentData.finalsKey || cleanKey,
              // Additional fields for concerns and solutions
              concernsRecommendations: studentData.concernsRecommendations || {}
            };
            
            console.log(`Found student ${studentInfo.studentName} associated with this access key using legacy accessKey field`);
            
            // Check if student has a valid startDate
            if (!studentData.startDate || studentData.startDate.trim() === '') {
              console.log(`Student ${studentInfo.studentName} does not have a start date defined`);
              return { valid: false, error: 'This student\'s internship start date has not been set. Please contact the coordinator to update the student information before proceeding with concerns and solutions.' };
            }
          }
        }
        
        // If no student found, the access key is not valid
        if (!studentInfo) {
          console.log('No student record found with this access key');
          return { valid: false, error: 'Invalid access key. Please check and try again.' };
        }

        // Step 3: Access key is valid and we have the student data
        console.log('Access key valid, returning student data for concerns and solutions:', studentInfo);
        return { valid: true, data: studentInfo };
      } catch (error) {
        console.error('Error finding student associated with access key:', error);
        return { valid: false, error: `Error validating access key: ${error.message}` };
      }
    } catch (error) {
      console.error('Error validating access key:', error);
      return { valid: false, error: `Error validating access key: ${error.message}` };
    }
  };

  handleSubmit = async () => {
    const { accessKey } = this.state;
    
    if (!accessKey || accessKey.trim() === '') {
      this.setState({
        snackbar: {
          open: true,
          message: 'Please enter an access key',
          severity: 'error'
        }
      });
      return;
    }

    this.setState({ isSubmitting: true });

    try {
      const result = await this.validateAccessKey(accessKey);
      
      if (result.valid) {
        this.setState({
          isAuthenticated: true,
          studentData: result.data,
          isSubmitting: false
        });
      } else {
        this.setState({
          isSubmitting: false,
          snackbar: {
            open: true,
            message: result.error,
            severity: 'error'
          }
        });
      }
    } catch (error) {
      console.error('Error processing access key:', error);
      this.setState({
        isSubmitting: false,
        snackbar: {
          open: true,
          message: `Error: ${error.message}`,
          severity: 'error'
        }
      });
    }
  };

  handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      this.handleSubmit();
    }
  };

  handleBack = () => {
    if (this.props.onBack) {
      this.props.onBack();
    }
  };

  handleSnackbarClose = () => {
    this.setState(prevState => ({
      snackbar: {
        ...prevState.snackbar,
        open: false
      }
    }));
  };

  render() {
    const { Container, AccessButton, BackButton } = StyledComponents;
    const { 
      isSubmitting, 
      isAuthenticated, 
      snackbar,
      accessKey,
      showPassword,
      studentData
    } = this.state;

    if (isAuthenticated && studentData) {
      return <ConcernsSolutions 
        studentInfo={studentData}
        userRole={this.props.userRole}
        onBack={this.handleBack}
      />;
    }

    return (
      <MuiContainer maxWidth="lg" sx={{ 
        py: { xs: 3, sm: 4 },
        px: { xs: 2, sm: 3 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '90vh'
      }}>
        <Container elevation={1}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5, 
            mb: 2
          }}>
            <AssignmentIcon sx={{ fontSize: 28, color: '#800000' }} />
            <Typography variant="h4" sx={{ 
              color: '#800000', 
              fontWeight: 600,
              fontSize: '1.6rem'
            }}>
              Student Concerns & Solutions
            </Typography>
          </Box>

          <Box sx={{
            backgroundColor: 'rgba(128, 0, 0, 0.05)',
            borderRadius: '8px',
            p: 2,
            mb: 3,
            width: '100%',
            border: '1px solid rgba(128, 0, 0, 0.1)',
          }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#800000',
                textAlign: 'center',
                fontStyle: 'italic',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                fontWeight: 500
              }}
            >
              <SecurityIcon sx={{ fontSize: 18 }} />
              Please enter the student's FINAL access key to record concerns, solutions, 
              and recommendations for this student.
            </Typography>
          </Box>

          {/* Access Key Input Form */}
          <Box sx={{ width: '100%', mt: 2 }}>
            <TextField
              fullWidth
              label="Student Access Key"
              variant="outlined"
              value={accessKey || ''}
              onChange={this.handleAccessKeyChange}
              onKeyPress={this.handleKeyPress}
              disabled={isSubmitting}
              type={showPassword ? 'text' : 'password'}
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SecurityIcon sx={{ color: '#800000' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={this.handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#800000',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#800000',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#800000',
                },
              }}
            />

            <Box sx={{ mt: 1, mb: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Enter the student's FINAL access key to view and update their information.
              </Typography>
            </Box>

            <AccessButton 
              onClick={this.handleSubmit}
              disabled={isSubmitting}
              sx={{
                opacity: isSubmitting ? 0.7 : 1,
                position: 'relative'
              }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress 
                    size={24} 
                    sx={{ 
                      color: '#FFD700',
                      position: 'absolute',
                      left: 'calc(50% - 12px)',
                    }} 
                  />
                  <span style={{ visibility: 'hidden' }}>Access Student Data</span>
                </>
              ) : 'Access Student Data'}
            </AccessButton>
          </Box>

          <BackButton onClick={this.handleBack}>
            Back to Dashboard
          </BackButton>
        </Container>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={this.handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={this.handleSnackbarClose} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </MuiContainer>
    );
  }
}

export default ConcernsSolutionsAccess; 