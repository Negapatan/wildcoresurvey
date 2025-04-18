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
    this.state = {
      formData: {
        concerns: '',
        solutions: '',
        recommendations: '',
        evaluation: ''
      },
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

      await submitConcernsSurvey(this.formData);

      console.log('Concerns and solutions submitted successfully!');
      this.setState({ isSubmitted: true });
    } catch (error) {
      console.error('Error submitting concerns:', error);
      this.showError('Error submitting concerns. Please try again.');
    } finally {
      this.setState({ isSubmitting: false });
    }
  }

  render() {
    const { SurveySection, SubmitButton, BackButton, StyledTextField, SectionTitle } = StyledComponents;
    const { isSubmitting, isSubmitted, snackbar } = this.state;

    if (isSubmitted) {
      return <ThankYouPage 
        surveyType="concerns" 
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
              <SectionTitle>Evaluation</SectionTitle>
              <StyledTextField
                fullWidth
                multiline
                rows={7}
                name="evaluation"
                placeholder="Assess the student's overall performance, areas of strength, and opportunities for improvement..."
                value={this.formData.evaluation || ''}
                onChange={this.handleFormChange}
                variant="outlined"
              />
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <SubmitButton
              variant="contained"
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
          <Alert 
            onClose={this.handleSnackbarClose} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  }
}

export default ConcernsSolutions; 