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
import SchoolIcon from '@mui/icons-material/School';
import SecurityIcon from '@mui/icons-material/Security';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { collection, query, getDocs, where, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase-config';
import StudentsEval from './StudentsEval';

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

class StudentAccess extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accessKey: '',
      showPassword: false,
      isSubmitting: false,
      isAuthenticated: false,
      studentData: null,
      evaluationMode: 'FINAL', // Default to FINAL evaluation
      accessLocked: false, // Flag to indicate if student access is locked
      snackbar: {
        open: false,
        message: '',
        severity: 'error'
      }
    };
  }

  componentDidMount() {
    // Check if student access is locked
    this.checkAccessLock();
  }

  checkAccessLock = async () => {
    try {
      // Get survey access settings
      const settingsDoc = await getDoc(doc(db, 'settings', 'surveyAccess'));
      
      if (settingsDoc.exists()) {
        const settings = settingsDoc.data();
        
        if (settings.lockStudentAccess) {
          this.setState({ 
            accessLocked: true,
            snackbar: {
              open: true,
              message: 'Student survey access is currently locked by administrators. Please try again later.',
              severity: 'error'
            }
          });
        }
      }
    } catch (error) {
      console.error('Error checking access lock status:', error);
      // Continue without locking access in case of error
    }
  };

  componentWillUnmount() {
    // No cleanup needed
  }

  handleAccessKeyChange = (e) => {
    this.setState({ accessKey: e.target.value });
  };

  handleTogglePasswordVisibility = () => {
    this.setState(prevState => ({
      showPassword: !prevState.showPassword
    }));
  };

  handleModeChange = (mode) => {
    this.setState({ evaluationMode: mode });
  };

  validateAccessKey = async (accessKey) => {
    try {
      // Clean up the access key - trim whitespace
      const cleanKey = accessKey ? accessKey.trim() : '';
      
      if (!cleanKey) {
        return { valid: false, error: 'Please enter an access key' };
      }

      console.log('Validating access key:', cleanKey);
      const { evaluationMode } = this.state;
      
      // Use only the correct key field names from the database
      const keyField = evaluationMode === 'MIDTERM' ? 'midtermsKey' : 'finalsKey';
      
      console.log(`Using key field: ${keyField} for ${evaluationMode} evaluation`);
      
      // Step 1: Find the student associated with this access key in studentData collection
      let studentInfo = null;
      
      try {
        // Check studentData collection first - THIS IS THE PRIMARY SOURCE
        const studentDataRef = collection(db, 'studentData');
        
        // Query using the correct key field
        const keyQuery = query(studentDataRef, where(keyField, '==', cleanKey));
        const keySnapshot = await getDocs(keyQuery);
        
        if (!keySnapshot.empty) {
          const studentDoc = keySnapshot.docs[0];
          const studentData = studentDoc.data();
          studentInfo = {
            ...studentData,
            id: studentDoc.id,
            studentId: studentData.studentId || studentData.id || '',
            studentName: studentData.name || studentData.studentName || 'Unknown Student',
            section: studentData.section || '',
            college: studentData.college || 'CICS',
            program: studentData.program || '',
            companyName: studentData.partnerCompany || studentData.companyName || '',
            schoolYear: studentData.schoolYear || '',
            semester: studentData.semester || '',
            evaluationMode: evaluationMode
          };
          
          console.log(`Found student ${studentInfo.studentName} (ID: ${studentInfo.studentId}) associated with this access key using ${keyField}`);
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
              studentId: studentData.studentId || studentData.id || '',
              studentName: studentData.name || studentData.studentName || 'Unknown Student',
              section: studentData.section || '',
              college: studentData.college || 'CICS',
              program: studentData.program || '',
              companyName: studentData.partnerCompany || studentData.companyName || '',
              schoolYear: studentData.schoolYear || '',
              semester: studentData.semester || '',
              evaluationMode: evaluationMode
            };
            
            console.log(`Found student ${studentInfo.studentName} (ID: ${studentInfo.studentId}) associated with this access key using legacy accessKey field`);
          }
        }
        
        // If no student found, the access key is not valid
        if (!studentInfo) {
          console.log('No student record found with this access key');
          return { valid: false, error: 'Invalid access key. Please check and try again.' };
        }
      } catch (error) {
        console.error('Error finding student associated with access key:', error);
        return { valid: false, error: `Error validating access key: ${error.message}` };
      }
      
      // Step 2: Check if this student has already submitted a company evaluation
      try {
        const studentName = studentInfo.studentName;
        const studentId = studentInfo.studentId;
        
        // Check only the specific collection based on evaluation mode
        const evalCollectionName = `companyEvaluations_${evaluationMode.toLowerCase()}`;
        console.log(`Checking if student has already submitted in ${evalCollectionName}...`);
        
        const evalsRef = collection(db, evalCollectionName);
        let existingSubmissionQuery;
        
        if (studentId) {
          // Prefer using studentId if available
          existingSubmissionQuery = query(
            evalsRef,
            where('studentId', '==', studentId)
          );
        } else {
          // Fall back to student name if no ID
          existingSubmissionQuery = query(
            evalsRef,
            where('studentName', '==', studentName)
          );
        }
        
        const existingSubmissionSnapshot = await getDocs(existingSubmissionQuery);
        
        if (!existingSubmissionSnapshot.empty) {
          console.log(`Student ${studentName} has already submitted a ${evaluationMode.toLowerCase()} company evaluation.`);
          existingSubmissionSnapshot.forEach(doc => console.log('- Document ID:', doc.id, 'Data:', doc.data()));
          
          // Instead of returning an error, return data with alreadySubmitted flag
          const previousSubmission = existingSubmissionSnapshot.docs[0].data();
          const submissionDate = previousSubmission.timestamp || previousSubmission.createdAt || 'a previous date';
          
          return { 
            valid: true, 
            alreadySubmitted: true,
            data: studentInfo,
            previousData: {
              submittedOn: submissionDate,
              surveyId: existingSubmissionSnapshot.docs[0].id
            },
            message: `This student has already submitted a ${evaluationMode.toLowerCase()} company evaluation on ${submissionDate}.`
          };
        }
        
        // Also check if this specific access key has been used
        const keyUsageQuery = query(
          evalsRef,
          where('accessKey', '==', cleanKey)
        );
        
        const keyUsageSnapshot = await getDocs(keyUsageQuery);
        
        if (!keyUsageSnapshot.empty) {
          console.log(`Access key ${cleanKey} has already been used for a ${evaluationMode.toLowerCase()} company evaluation.`);
          keyUsageSnapshot.forEach(doc => console.log('- Document ID:', doc.id, 'Data:', doc.data()));
          
          // Return with alreadySubmitted flag
          const previousSubmission = keyUsageSnapshot.docs[0].data();
          const submissionDate = previousSubmission.timestamp || previousSubmission.createdAt || 'a previous date';
          const submitterName = previousSubmission.studentName || 'a student';
          
          return { 
            valid: true, 
            alreadySubmitted: true,
            data: studentInfo,
            previousData: {
              submittedOn: submissionDate,
              surveyId: keyUsageSnapshot.docs[0].id,
              studentName: submitterName
            },
            message: `This access key has already been used for a ${evaluationMode.toLowerCase()} company evaluation by ${submitterName} on ${submissionDate}.`
          };
        }
      } catch (error) {
        console.warn('Error checking for existing submissions:', error);
        // Log error but continue with the flow if this check fails
      }
      
      // Step 3: If we've gotten this far, the key is valid and student has not submitted yet
      console.log('Access key valid, returning student data for evaluation:', studentInfo);
      return { valid: true, data: studentInfo };
      
    } catch (error) {
      console.error('Error validating access key:', error);
      return { valid: false, error: `Error validating access key: ${error.message}` };
    }
  };

  handleSubmit = async () => {
    const { accessKey, evaluationMode, accessLocked } = this.state;
    
    // Check if access is locked before proceeding
    if (accessLocked) {
      this.setState({
        snackbar: {
          open: true,
          message: 'Student survey access is currently locked by administrators. Please try again later.',
          severity: 'error'
        }
      });
      return;
    }
    
    // Set submitting state
    this.setState({ isSubmitting: true });
    
    try {
      // Validate the access key
      const result = await this.validateAccessKey(accessKey);
      
      if (result.valid) {
        if (result.alreadySubmitted) {
          // Handle the case where the evaluation has already been submitted
          const periodText = evaluationMode.toLowerCase() === 'midterm' ? 'midterm' : 'final';
          
          this.setState({
            isSubmitting: false,
            snackbar: {
              open: true,
              message: result.message || `This access key has already been used for a ${periodText} company evaluation.`,
              severity: 'info'
            }
          });
          return;
        }
        
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
      evaluationMode,
      snackbar,
      accessKey,
      showPassword,
      studentData
    } = this.state;

    if (isAuthenticated && studentData) {
      return <StudentsEval 
        studentInfo={studentData}
        evaluationMode={evaluationMode}
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
            <SchoolIcon sx={{ fontSize: 28, color: '#800000' }} />
            <Typography variant="h4" sx={{ 
              color: '#800000', 
              fontWeight: 600,
              fontSize: '1.6rem'
            }}>
              Student Evaluation Access
            </Typography>
          </Box>

          <Box sx={{ width: '100%', mb: 3 }}>
            {/* Evaluation Mode Selection */}
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, textAlign: 'center' }}>
              Evaluation Mode:
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button 
                variant={evaluationMode === 'MIDTERM' ? 'contained' : 'outlined'} 
                onClick={() => this.handleModeChange('MIDTERM')}
                sx={{
                  flex: 1,
                  maxWidth: 150,
                  backgroundColor: evaluationMode === 'MIDTERM' ? '#800000' : 'transparent',
                  color: evaluationMode === 'MIDTERM' ? '#FFD700' : '#800000',
                  borderColor: '#800000',
                  '&:hover': {
                    backgroundColor: evaluationMode === 'MIDTERM' ? '#600000' : 'rgba(128, 0, 0, 0.04)',
                    borderColor: '#800000',
                  }
                }}
              >
                Midterm
              </Button>
              <Button 
                variant={evaluationMode === 'FINAL' ? 'contained' : 'outlined'} 
                onClick={() => this.handleModeChange('FINAL')}
                sx={{
                  flex: 1,
                  maxWidth: 150,
                  backgroundColor: evaluationMode === 'FINAL' ? '#800000' : 'transparent',
                  color: evaluationMode === 'FINAL' ? '#FFD700' : '#800000',
                  borderColor: '#800000',
                  '&:hover': {
                    backgroundColor: evaluationMode === 'FINAL' ? '#600000' : 'rgba(128, 0, 0, 0.04)',
                    borderColor: '#800000',
                  }
                }}
              >
                Final
              </Button>
            </Box>
          </Box>

          {/* Access Key Input Form */}
          <Box sx={{ width: '100%', mt: 2 }}>
            <TextField
              fullWidth
              label="Access Key"
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
                Enter the access key provided to you to access your evaluation form.
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
                  <span style={{ visibility: 'hidden' }}>Access Survey</span>
                </>
              ) : 'Access Survey'}
            </AccessButton>
          </Box>

          <BackButton onClick={this.handleBack}>
            Back to Survey Options
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

export default StudentAccess; 