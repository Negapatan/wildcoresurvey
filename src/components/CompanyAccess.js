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
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SecurityIcon from '@mui/icons-material/Security';
import BusinessIcon from '@mui/icons-material/Business';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { auth, db, signOutUser, trySignIn } from '../firebase-config';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import CompanyMentorEval from './CompanyMentorEval';

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

class CompanyAccess extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accessKey: '',
      showPassword: false,
      isSubmitting: false,
      isAuthenticated: false,
      companyData: null,
      studentInfo: null,
      evaluationMode: 'FINAL', // Default to FINAL evaluation
      accessLocked: false, // Flag to indicate if company access is locked
      snackbar: {
        open: false,
        message: '',
        severity: 'error'
      }
    };
  }

  componentDidMount() {
    // Check if company access is locked
    this.checkAccessLock();
  }

  componentWillUnmount() {
    // Sign out when component is unmounted to clean up auth state
    if (this.state.isAuthenticated) {
      signOutUser();
    }
  }

  checkAccessLock = async () => {
    try {
      // Get survey access settings
      const settingsDoc = await getDoc(doc(db, 'settings', 'surveyAccess'));
      
      if (settingsDoc.exists()) {
        const settings = settingsDoc.data();
        
        if (settings.lockCompanyAccess) {
          this.setState({ 
            accessLocked: true,
            snackbar: {
              open: true,
              message: 'Company survey access is currently locked by administrators. Please try again later.',
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

  handleAccessKeyChange = (e) => {
    this.setState({ accessKey: e.target.value });
  };

  handleTogglePasswordVisibility = () => {
    this.setState(prevState => ({
      showPassword: !prevState.showPassword
    }));
  };

  handleEvaluationModeChange = (mode) => {
    this.setState({ evaluationMode: mode });
  };

  validateStudentInfo = async () => {
    // ... existing code ...
  }

  validateAccessKey = async (accessKey) => {
    try {
      // Check if accessKey is valid
      if (!accessKey || accessKey.trim() === '') {
        console.log('Access key is empty or invalid');
        return { valid: false, error: 'Empty access key' };
      }
      
      const { evaluationMode } = this.state;
      // Use exact field names as specified
      const keyField = evaluationMode === 'MIDTERM' ? 'midtermsKey' : 'finalsKey';
      
      console.log(`Validating ${evaluationMode.toLowerCase()} access key using field ${keyField}:`, accessKey);
      
      // Step 1: Find the student associated with this access key in studentData collection
      let studentInfo = null;
      
      try {
        // Check studentData collection first - THIS IS THE PRIMARY SOURCE
        const studentDataRef = collection(db, 'studentData');
        
        // Try with specific key field
        const keyQuery = query(studentDataRef, where(keyField, '==', accessKey));
        const keySnapshot = await getDocs(keyQuery);
        
        if (!keySnapshot.empty) {
          const studentDoc = keySnapshot.docs[0];
          const studentData = studentDoc.data();
          const studentName = studentData.name || studentData.studentName || '';
          const studentId = studentData.studentId || '';
          studentInfo = { ...studentData, id: studentDoc.id, studentName, studentId };
          
          console.log(`Found student ${studentName} (ID: ${studentId}) associated with this access key`);
        } else {
          // Try with legacy accessKey field
          const legacyQuery = query(studentDataRef, where('accessKey', '==', accessKey));
          const legacySnapshot = await getDocs(legacyQuery);
          
          if (!legacySnapshot.empty) {
            const studentDoc = legacySnapshot.docs[0];
            const studentData = studentDoc.data();
            const studentName = studentData.name || studentData.studentName || '';
            const studentId = studentData.studentId || '';
            studentInfo = { ...studentData, id: studentDoc.id, studentName, studentId };
            
            console.log(`Found student ${studentName} (ID: ${studentId}) associated with this access key (legacy field)`);
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
      
      // Step 2: Check if this student has already submitted a survey in the appropriate collection
      try {
        const studentName = studentInfo.studentName;
        const studentId = studentInfo.studentId;
        
        // Check only the specific collection based on evaluation mode
        const surveyCollectionName = `studentSurveys_${evaluationMode.toLowerCase()}`;
        console.log(`Checking if student has already submitted in ${surveyCollectionName}...`);
        
        const surveysRef = collection(db, surveyCollectionName);
        let existingSubmissionQuery;
        
        if (studentId) {
          // Prefer using studentId if available
          existingSubmissionQuery = query(
            surveysRef,
            where('studentId', '==', studentId)
          );
        } else {
          // Fall back to student name if no ID
          existingSubmissionQuery = query(
            surveysRef,
            where('studentName', '==', studentName)
          );
        }
        
        const existingSubmissionSnapshot = await getDocs(existingSubmissionQuery);
        
        if (!existingSubmissionSnapshot.empty) {
          console.log(`Student ${studentName} has already submitted a ${evaluationMode.toLowerCase()} survey.`);
          existingSubmissionSnapshot.forEach(doc => console.log('- Document ID:', doc.id, 'Data:', doc.data()));
          
          // Instead of returning an error, return a special code that indicates already submitted
          const previousSubmission = existingSubmissionSnapshot.docs[0].data();
          return { 
            valid: true, 
            alreadySubmitted: true,
            previousData: {
              submittedOn: previousSubmission.timestamp || previousSubmission.createdAt || 'unknown date',
              surveyId: existingSubmissionSnapshot.docs[0].id
            },
            data: studentInfo, 
            message: `This student has already submitted a ${evaluationMode.toLowerCase()} survey on ${previousSubmission.timestamp || previousSubmission.createdAt || 'a previous date'}.`
          };
        }
        
        // Also check if this specific access key has already been used
        const keyUsageQuery = query(
          surveysRef,
          where('accessKey', '==', accessKey)
        );
        
        const keyUsageSnapshot = await getDocs(keyUsageQuery);
        
        if (!keyUsageSnapshot.empty) {
          console.log(`Access key ${accessKey} has already been used for a ${evaluationMode.toLowerCase()} survey.`);
          keyUsageSnapshot.forEach(doc => console.log('- Document ID:', doc.id, 'Data:', doc.data()));
          
          // Instead of returning an error, return a special code that indicates already submitted
          const previousSubmission = keyUsageSnapshot.docs[0].data();
          return { 
            valid: true, 
            alreadySubmitted: true,
            previousData: {
              submittedOn: previousSubmission.timestamp || previousSubmission.createdAt || 'unknown date',
              surveyId: keyUsageSnapshot.docs[0].id,
              studentName: previousSubmission.studentName || 'a student'
            },
            data: studentInfo,
            message: `This access key has already been used for a ${evaluationMode.toLowerCase()} evaluation by ${previousSubmission.studentName || 'a student'} on ${previousSubmission.timestamp || previousSubmission.createdAt || 'a previous date'}.`
          };
        }
      } catch (error) {
        console.warn('Error checking for existing submissions:', error);
        // Log error but continue with the flow if this check fails
      }
      
      // Step 3: If we've gotten this far, the key is valid and student has not submitted yet
      // Format student data for pre-filling the form
      const companyData = {
        id: studentInfo.id,
        // Company information
        companyName: studentInfo.partnerCompany || 'Unknown Company',
        // Student identification
        studentName: studentInfo.studentName || '',
        studentId: studentInfo.studentId || '',
        // Academic information
        section: studentInfo.section || '',
        college: studentInfo.college || '',
        program: studentInfo.program || '',
        semester: studentInfo.semester || '',
        schoolYear: studentInfo.schoolYear || '',
        // Additional fields that might be useful
        gender: studentInfo.gender || '',
        contactPerson: studentInfo.contactPerson || '',
        location: studentInfo.location || '',
        startDate: studentInfo.startDate || '',
        endDate: studentInfo.endDate || '',
        middleInitial: studentInfo.middleInitial || '',
        email: studentInfo.email || '',
        internshipEmail: studentInfo.internshipEmail || '',
        // Extract any other potentially useful fields
        ...Object.entries(studentInfo)
          .filter(([key]) => ![
            'midtermsKey', 
            'finalsKey', 
            'accessKey',
            'createdAt',
            'createdBy',
            'updatedAt',
            'updatedBy'
          ].includes(key))
          .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {}),
        // Metadata
        type: 'company',
        studentData: true, // Flag to indicate this came from student data
        evaluationMode: evaluationMode // Include the evaluation mode
      };
      
      console.log("Valid access key found. Student data for pre-filling:", companyData);
      return { valid: true, data: companyData };
      
    } catch (error) {
      console.error('Error in validateAccessKey:', error);
      return { valid: false, error: error.message };
    }
  }

  handleSubmit = async () => {
    const { accessKey, evaluationMode, accessLocked } = this.state;
    
    // Check if access is locked before proceeding
    if (accessLocked) {
      this.setState({
        snackbar: {
          open: true,
          message: 'Company survey access is currently locked by administrators. Please try again later.',
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
          // Special case for already submitted evaluations
          const periodText = evaluationMode.toLowerCase() === 'midterm' ? 'midterm' : 'final';
          
          this.setState({
            isSubmitting: false,
            snackbar: {
              open: true,
              message: result.message || `This access key has already been used for a ${periodText} evaluation.`,
              severity: 'info'
            }
          });
          return;
        }
        
        try {
          // Skip signOut if no current user or if anonymous auth is disabled
          if (auth.currentUser) {
            try {
              // Try to sign out, but continue even if it fails
              await signOutUser();
            } catch (signOutError) {
              console.warn('Sign out failed, but continuing with authentication:', signOutError);
              // Continue with the flow even if sign out fails
            }
          }
          
          // Try to sign in with the company account
          const signInResult = await trySignIn('companyaccess@gmail.com', 'OJT2025!!');
          
          if (!signInResult.success) {
            console.warn('Sign in failed but continuing with access key validation:', signInResult.error);
            // Continue anyway since we have a valid access key
          }
          
          // Set up company info
          const companyInfo = {
            name: result.data.companyName,
            id: result.data.id
          };
          
          // If the data came from studentData, extract student information for pre-filling
          let studentInfo = null;
          if (result.data.studentData) {
            // Extract ALL student information for pre-filling the form
            studentInfo = {
              // Basic student information
              name: result.data.studentName,
              studentId: result.data.studentId,
              section: result.data.section,
              college: result.data.college,
              program: result.data.program,
              // Academic information
              semester: result.data.semester,
              schoolYear: result.data.schoolYear,
              // Additional information
              gender: result.data.gender,
              contactPerson: result.data.contactPerson,
              location: result.data.location,
              startDate: result.data.startDate,
              endDate: result.data.endDate,
              middleInitial: result.data.middleInitial,
              email: result.data.email,
              internshipEmail: result.data.internshipEmail,
              // Include any other fields that might be useful
              ...Object.entries(result.data)
                .filter(([key]) => ![
                  'id', 'companyName', 'studentName', 'studentId', 'section', 'college', 'program',
                  'semester', 'schoolYear', 'gender', 'contactPerson', 'location', 'startDate', 
                  'endDate', 'middleInitial', 'email', 'internshipEmail', 'type', 'studentData',
                  'midtermsKey', 'finalsKey', 'accessKey', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'
                ].includes(key))
                .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})
            };
            
            console.log("Complete student info for pre-filling:", studentInfo);
          }
          
          this.setState({ 
            isAuthenticated: true,
            companyData: companyInfo,
            studentInfo: studentInfo,
            snackbar: {
              open: true,
              message: 'Access granted! Redirecting to company evaluation form.',
              severity: 'success'
            }
          });
        } catch (authError) {
          console.error('Firebase authentication error:', authError);
          
          // If authentication fails but we have valid data, proceed anyway
          // This allows the form to work even if there are authentication issues
          if (result.valid && result.data) {
            console.warn('Proceeding without authentication since we have valid data');
            
            const companyInfo = {
              name: result.data.companyName,
              id: result.data.id
            };
            
            let studentInfo = null;
            if (result.data.studentData) {
              studentInfo = {
                name: result.data.studentName,
                studentId: result.data.studentId,
                section: result.data.section,
                college: result.data.college,
                program: result.data.program,
                semester: result.data.semester,
                schoolYear: result.data.schoolYear,
                // Include other fields as needed
              };
            }
            
            this.setState({ 
              isAuthenticated: true,
              companyData: companyInfo,
              studentInfo: studentInfo,
              snackbar: {
                open: true,
                message: 'Access granted! Proceeding with limited functionality.',
                severity: 'success'
              }
            });
          } else {
            throw authError; // Re-throw if we don't have valid data
          }
        }
      } else {
        const { evaluationMode } = this.state;
        this.setState({
          snackbar: {
            open: true,
            message: result.error || `Invalid ${evaluationMode.toLowerCase()} access key. Please enter the correct key for ${evaluationMode.toLowerCase()} evaluation.`,
            severity: 'error'
          }
        });
      }
    } catch (error) {
      console.error('Authentication error:', error);
      this.setState({
        snackbar: {
          open: true,
          message: `Authentication failed: ${error.message}. Please try again.`,
          severity: 'error'
        }
      });
    } finally {
      this.setState({ isSubmitting: false });
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
      accessKey, 
      showPassword, 
      isSubmitting, 
      isAuthenticated, 
      evaluationMode, 
      snackbar,
      companyData,
      studentInfo
    } = this.state;

    if (isAuthenticated) {
      return (
        <CompanyMentorEval 
          userRole="company" 
          evaluationMode={evaluationMode} 
          companyInfo={companyData}
          studentInfo={studentInfo}
        />
      );
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
            <BusinessIcon sx={{ fontSize: 28, color: '#800000' }} />
            <Typography variant="h4" sx={{ 
              color: '#800000', 
              fontWeight: 600,
              fontSize: '1.6rem'
            }}>
              Company Access
            </Typography>
          </Box>

          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
            maxWidth: '400px',
            mt: 1
          }}>
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
                This area is restricted to company representatives only.
                Please enter the access key provided to your organization.
              </Typography>
            </Box>

            {/* Evaluation Mode Selection */}
            <Box sx={{ width: '100%', mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, textAlign: 'center' }}>
                Evaluation Mode:
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button 
                  variant={evaluationMode === 'MIDTERM' ? 'contained' : 'outlined'} 
                  onClick={() => this.handleEvaluationModeChange('MIDTERM')}
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
                  onClick={() => this.handleEvaluationModeChange('FINAL')}
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

            <TextField
              fullWidth
              label="Access Key"
              variant="outlined"
              value={accessKey}
              onChange={this.handleAccessKeyChange}
              onKeyPress={this.handleKeyPress}
              type={showPassword ? 'text' : 'password'}
              disabled={isSubmitting}
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
                ),
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

            <BackButton onClick={this.handleBack}>
              Back to Survey Options
            </BackButton>
          </Box>
        </Container>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={this.handleSnackbarClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={this.handleSnackbarClose} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </MuiContainer>
    );
  }
}

export default CompanyAccess; 