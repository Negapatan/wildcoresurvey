import React, { Component } from 'react';
// eslint-disable-next-line no-unused-vars
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Snackbar,
  Alert,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ThankYouPage from './ThankYouPage';
import { submitConcernsSurvey } from '../services/surveyService';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FeedbackIcon from '@mui/icons-material/Feedback';

// This component is for OJT advisers to submit concerns and solutions

const StyledComponents = {
  SurveySection: styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4, 5),
    marginBottom: theme.spacing(3),
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(0, 0, 0, 0.1)',
  })),

  FormDivider: styled(Divider)(({ theme }) => ({
    margin: theme.spacing(3, 0),
    backgroundColor: '#800000',
    opacity: 0.15,
  })),

  SubmitButton: styled(Button)(({ theme }) => ({
    backgroundColor: '#800000',
    color: '#FFD700',
    '&:hover': {
      backgroundColor: '#600000',
    },
    padding: theme.spacing(1.5, 6),
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 500,
    marginTop: theme.spacing(4),
  })),

  BackButton: styled(Button)(({ theme }) => ({
    color: '#800000',
    '&:hover': {
      backgroundColor: 'rgba(128, 0, 0, 0.04)',
    },
  })),

  StyledTextField: styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'white',
      borderRadius: '8px',
      '&:hover fieldset': {
        borderColor: 'rgba(128, 0, 0, 0.5)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#800000',
        borderWidth: '1px',
      },
    },
    '& .MuiInputBase-input': {
      padding: theme.spacing(2),
      color: '#555',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(0, 0, 0, 0.15)',
    },
  })),

  SectionTitle: styled(Typography)(({ theme }) => ({
    color: '#444',
    fontWeight: 600,
    marginBottom: theme.spacing(2),
    fontSize: '1.2rem',
  })),
};

class ConcernsSolutions extends Component {
  constructor(props) {
    super(props);
    
    // Get student info from props
    const studentInfo = this.props.studentInfo || {};
    
    this.state = {
      formData: {
        concerns: studentInfo.concerns || '',
        solutions: studentInfo.solutions || '',
        recommendations: studentInfo.recommendations || '',
        evaluation: studentInfo.evaluation || '',
        // Add student identification fields from props
        studentName: studentInfo.studentName || studentInfo.name || '',
        section: studentInfo.section || '',
        college: studentInfo.college || '',
        program: studentInfo.program || '',
        semester: studentInfo.semester || '',
        schoolYear: studentInfo.schoolYear || '',
        companyName: studentInfo.companyName || studentInfo.partnerCompany || '',
        accessKey: studentInfo.finalsKey || ''
      },
      studentInfo: studentInfo,
      isSubmitting: false,
      isSubmitted: false,
      snackbar: {
        open: false,
        message: '',
        severity: 'success'
      }
    };
  }

  // Getters and Setters
  get formData() {
    return this.state.formData;
  }

  set formData(newData) {
    this.setState({ formData: newData });
  }

  // Event Handlers
  handleFormChange = (event) => {
    const { name, value } = event.target;
    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        [name]: value
      }
    }));
  }

  handleSnackbarClose = () => {
    this.setState(prevState => ({
      snackbar: {
        ...prevState.snackbar,
        open: false
      }
    }));
  }

  handleBack = () => {
    if (this.props.onBack) {
      this.props.onBack();
    }
  };

  validateForm() {
    const { 
      concerns,
      solutions
    } = this.formData;

    if (!concerns || !solutions) {
      this.showError('Please fill in all required fields');
      return false;
    }

    return true;
  }

  showError(message) {
    this.setState({
      snackbar: {
        open: true,
        message,
        severity: 'error'
      }
    });
  }

  handleSubmit = async (e) => {
    e.preventDefault();
    this.setState({ isSubmitting: true });

    try {
      if (!this.validateForm()) {
        this.setState({ isSubmitting: false });
        return;
      }

      // Get the student information to include in the submission
      const { studentInfo } = this.state;
      const formData = {
        ...this.formData,
        // Student identification fields for the submission
        studentName: studentInfo.studentName || studentInfo.name || '',
        accessKey: studentInfo.finalsKey || studentInfo.accessKey || '',
        // Add metadata
        timestamp: new Date().toISOString(),
        submittedBy: this.props.userRole || 'adviser',
        // Store reference to student's document ID
        studentDocId: studentInfo.id || ''
      };

      try {
        // Submit the concerns and solutions data
        const result = await submitConcernsSurvey(formData);
        console.log('Submission result:', result);
        
        // Consider it a success if at least the student data was updated
        if (result.success && (result.studentDataUpdated || result.concernsSaved)) {
          this.setState({ isSubmitted: true });
          return;
        } else {
          // This would be strange - the function returned success but nothing was updated
          throw new Error('Submission operation returned success but no data was updated');
        }
      } catch (submitError) {
        console.error('Error submitting concerns to server:', submitError);
        
        // Check if it's a permissions error
        if (submitError.message && submitError.message.includes('permission')) {
          this.showError('You do not have permission to submit feedback. Please contact the administrator.');
        } else {
          // Try to store locally at least
          try {
            // Store in localStorage as a fallback
            const localData = {
              formData: this.formData,
              studentInfo: {
                name: studentInfo.studentName || studentInfo.name,
                accessKey: studentInfo.finalsKey || studentInfo.accessKey || '',
                docId: studentInfo.id || ''
              },
              timestamp: new Date().toISOString()
            };
            
            // Store in localStorage
            const localStorageKey = `concerns_data_${Date.now()}`;
            localStorage.setItem(localStorageKey, JSON.stringify(localData));
            
            console.log('Stored feedback locally as fallback:', localStorageKey);
            this.showError(
              'Could not save to server, but your feedback was saved locally. ' +
              'Please contact the administrator with reference: ' + localStorageKey
            );
          } catch (localError) {
            // If even local storage fails
            console.error('Complete failure to store feedback:', localError);
            this.showError('Error submitting feedback. Please try again or contact support.');
          }
        }
      }
    } catch (error) {
      console.error('Error in submission process:', error);
      this.showError('Error processing your request. Please try again.');
    } finally {
      this.setState({ isSubmitting: false });
    }
  }

  render() {
    const { SurveySection, SubmitButton, BackButton, StyledTextField, SectionTitle } = StyledComponents;
    const { isSubmitting, isSubmitted, snackbar, studentInfo } = this.state;

    if (isSubmitted) {
      return <ThankYouPage 
        surveyType="evaluation" 
        onReturn={() => window.location.href = '/'} 
      />;
    }

    return (
      <Box sx={{ 
        maxWidth: 1200, 
        mx: 'auto', 
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        my: 4
      }}>
        <Box sx={{ alignSelf: 'flex-start', mb: 3 }}>
          <BackButton
            startIcon={<ArrowBackIcon />}
            onClick={this.handleBack}
          >
            Back to Dashboard
          </BackButton>
        </Box>

        <SurveySection>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-start', 
            mb: 4,
            borderBottom: '1px solid rgba(128, 0, 0, 0.2)',
            pb: 2
          }}>
            <FeedbackIcon sx={{ color: '#800000', fontSize: 32, mr: 2 }} />
            <Typography 
              variant="h4" 
              sx={{ 
                color: '#800000', 
                fontWeight: 600,
                fontSize: {xs: '1.5rem', md: '1.8rem'}
              }}
            >
              Feedback and Evaluation
            </Typography>
          </Box>

          {/* Student Information Section */}
          {studentInfo && (
            <Box sx={{ mb: 4, backgroundColor: 'rgba(128, 0, 0, 0.03)', p: 3, borderRadius: 2, border: '1px solid rgba(128, 0, 0, 0.1)' }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#800000', fontWeight: 600 }}>
                Student Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#666' }}>Student Name:</Typography>
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                    {studentInfo.studentName || studentInfo.name || 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#666' }}>Program:</Typography>
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                    {studentInfo.program || 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#666' }}>Section:</Typography>
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                    {studentInfo.section || 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#666' }}>Company:</Typography>
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                    {studentInfo.companyName || studentInfo.partnerCompany || 'N/A'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#666' }}>Semester & School Year:</Typography>
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                    {studentInfo.semester || 'N/A'} {studentInfo.schoolYear ? `/ ${studentInfo.schoolYear}` : ''}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ color: '#666' }}>College:</Typography>
                  <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                    {studentInfo.college || 'CICS'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          <Box sx={{ mb: 5 }}>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#555',
                lineHeight: 1.7,
                fontSize: '1.05rem',
                maxWidth: '900px'
              }}
            >
              Please provide feedback on student OJT performance and challenges. Document any academic or professional issues
              encountered, propose solutions to address these challenges, and offer recommendations for student improvement and
              development.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <SectionTitle>Concerns</SectionTitle>
              <StyledTextField
                fullWidth
                multiline
                rows={7}
                name="concerns"
                placeholder="Document student issues, challenges, or difficulties observed during the OJT program..."
                value={this.formData.concerns || ''}
                onChange={this.handleFormChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionTitle>Solutions</SectionTitle>
              <StyledTextField
                fullWidth
                multiline
                rows={7}
                name="solutions"
                placeholder="Suggest solutions to address the student challenges and enhance their learning experience..."
                value={this.formData.solutions || ''}
                onChange={this.handleFormChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionTitle>Recommendations</SectionTitle>
              <StyledTextField
                fullWidth
                multiline
                rows={7}
                name="recommendations"
                placeholder="Provide recommendations for student skill development, coursework, or academic preparation..."
                value={this.formData.recommendations || ''}
                onChange={this.handleFormChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <SectionTitle>Overall Evaluation</SectionTitle>
              <StyledTextField
                fullWidth
                multiline
                rows={7}
                name="evaluation"
                placeholder="Provide an overall evaluation of the student's OJT performance and learning progress..."
                value={this.formData.evaluation || ''}
                onChange={this.handleFormChange}
                variant="outlined"
              />
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <SubmitButton
              onClick={this.handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </SubmitButton>
          </Box>
        </SurveySection>

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
      </Box>
    );
  }
}

export default ConcernsSolutions; 