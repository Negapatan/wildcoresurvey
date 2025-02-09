import React, { Component } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Stack,
  Snackbar,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Rating,
  Divider,
  Autocomplete
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ThankYouPage from './ThankYouPage';
import { submitCompanySurvey } from '../services/surveyService';

const StyledComponents = {
  SurveySection: styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    marginBottom: theme.spacing(3),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  })),

  FormDivider: styled(Divider)(({ theme }) => ({
    margin: theme.spacing(4, 0),
    backgroundColor: '#800000',
    opacity: 0.2,
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
  }))
};

class CompanySurvey extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formData: {
        meetingDate: '',
        companyName: '',
        studentNames: '',
        overallPerformance: '',
        tasksAssigned: '',
        trainingProvided: '',
        technicalSkills: '',
        recommendations: '',
        industryMentor: '',
        recommendToStudents: '',
        program: '',
      },
      isSubmitting: false,
      isSubmitted: false,
      snackbar: {
        open: false,
        message: '',
        severity: 'success'
      }
    };

    this.PROGRAMS = [
      'BS Architecture',
      'BS Chemical Engineering',
      'BS Civil Engineering',
      'BS Computer Engineering',
      'BS Electrical Engineering',
      'BS Electronics Engineering',
      'BS Industrial Engineering',
      'BS Mechanical Engineering',
      'BS Mining Engineering',
      'BS Accountancy',
      'BS Accounting Information Systems',
      'BS Management Accounting',
      'BS Business Administration',
      'BS Hospitality Management',
      'BS Tourism Management',
      'BS Office Administration',
      'Bachelor in Public Administration',
      'AB Communication',
      'AB English with Applied Linguistics',
      'Bachelor of Elementary Education',
      'Bachelor of Secondary Education',
      'Bachelor of Multimedia Arts',
      'BS Biology',
      'BS Math with Applied Industrial Mathematics',
      'BS Psychology',
      'BS Nursing',
      'BS Pharmacy',
      'BS Computer Science',
      'BS Information Technology',
      'BS Criminology'
    ];
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

  handleReturn = () => {
    window.location.reload();
  }

  validateForm() {
    const { 
      meetingDate,
      companyName,
      studentNames,
      program,
      overallPerformance,
      tasksAssigned,
      trainingProvided,
      technicalSkills,
      recommendations,
      industryMentor,
      recommendToStudents
    } = this.formData;

    if (!meetingDate || !companyName || !studentNames || !program || !overallPerformance || !tasksAssigned || !trainingProvided || !technicalSkills || !recommendations || !industryMentor || !recommendToStudents) {
      this.showError('Please fill in all required fields');
      return false;
    }

    // Check text fields
    const textFields = [
      tasksAssigned,
      trainingProvided,
      technicalSkills,
      recommendations,
      industryMentor
    ];

    if (textFields.some(field => !field || field.trim() === '')) {
      this.showError('Please fill in all required fields');
      return false;
    }

    // Check recommendation selection
    if (!recommendToStudents) {
      this.showError('Please select whether you would recommend this to other Students');
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
        return;
      }

      await submitCompanySurvey(this.formData);

      console.log('Survey submitted successfully!');
      this.setState({ isSubmitted: true });
    } catch (error) {
      console.error('Error submitting survey:', error);
      this.showError('Error submitting survey. Please try again.');
    } finally {
      this.setState({ isSubmitting: false });
    }
  }

  renderTextField(name, label, multiline = false, type = 'text', helperText = '') {
    return (
      <TextField
        required
        fullWidth
        multiline={multiline}
        rows={multiline ? 4 : 1}
        type={type}
        name={name}
        label={label}
        helperText={helperText}
        value={this.formData[name] || ''}
        onChange={this.handleFormChange}
        variant="outlined"
        inputProps={{
          placeholder: ' ',
          ...(type === 'date' && { 
            className: 'remove-date-placeholder'
          })
        }}
        sx={{
          mb: 3,
          '& .remove-date-placeholder::-webkit-datetime-edit-text': {
            visibility: 'hidden'
          },
          '& .remove-date-placeholder::-webkit-datetime-edit-fields-wrapper': {
            visibility: this.formData[name] ? 'visible' : 'hidden'
          },
          '& .MuiOutlinedInput-root': {
            backgroundColor: 'white',
            '&:hover fieldset': {
              borderColor: '#800000',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#800000',
            }
          },
          '& .MuiInputLabel-root': {
            color: '#666',
            '&.Mui-focused': {
              color: '#800000'
            }
          },
          '& .MuiFormHelperText-root': {
            marginLeft: 0,
            fontSize: '0.75rem',
            color: '#666'
          }
        }}
      />
    );
  }

  renderPerformanceRating() {
    return (
      <Box sx={{ width: '100%', mb: 3 }}>
        <Typography component="legend" sx={{ mb: 1, color: '#555', fontWeight: 500 }}>
          Overall performance of student/s
        </Typography>
        <Rating
          name="overallPerformance"
          value={parseInt(this.formData.overallPerformance) || 0}
          onChange={(event, newValue) => {
            this.handleFormChange({
              target: {
                name: 'overallPerformance',
                value: newValue
              }
            });
          }}
          max={10}
          sx={{
            '& .MuiRating-icon': {
              color: '#800000',
            },
            '& .MuiRating-iconFilled': {
              color: '#800000',
            },
            '& .MuiRating-iconHover': {
              color: '#600000',
            }
          }}
        />
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#666' }}>
          Rating: 1 = lowest to 10 = highest
        </Typography>
      </Box>
    );
  }

  render() {
    const { SurveySection, FormDivider, SubmitButton } = StyledComponents;
    const { isSubmitting, isSubmitted, snackbar } = this.state;

    if (isSubmitted) {
      return <ThankYouPage surveyType="company" />;
    }

    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
        <SurveySection>
          <Typography 
            variant="h4" 
            sx={{ 
              color: '#800000', 
              mb: 2, 
              textAlign: 'center',
              fontWeight: 600
            }}
          >
            Interview and Assessment Guide
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#666', 
              mb: 4, 
              textAlign: 'center',
              fontWeight: 500
            }}
          >
            OJT Partners Evaluation Form
          </Typography>

          <Typography 
            variant="body1" 
            sx={{ 
              mb: 4, 
              textAlign: 'justify',
              color: '#555',
              lineHeight: 1.6,
              px: 2
            }}
          >
            Dear OJT Adviser, The following questionnaire and guide are intended for OJT Advisers 
            to use during virtual meetings with company representatives. Please ensure that you 
            document all important details discussed during the meeting for future reference.
          </Typography>

          <FormDivider />

          <Stack spacing={3} sx={{ px: 2 }}>
            {this.renderTextField('meetingDate', 'Meeting Date', false, 'date', 'Please input date (M/d/yyyy)')}
            {this.renderTextField('companyName', 'Company Name')}
            {this.renderTextField('studentNames', 'Name of Student/s')}
            {this.renderPerformanceRating()}
            
            <FormDivider />
            
            {this.renderTextField('tasksAssigned', 'Tasks assigned to students', true)}
            {this.renderTextField('trainingProvided', 'Training / learning enhancement given by the company to students', true)}
            {this.renderTextField('technicalSkills', 'Technical skills of students significant to your company needs', true)}
            {this.renderTextField('recommendations', 'Recommendation for curriculum or OJT program enhancement', true)}
            {this.renderTextField('industryMentor', 'Industry Mentor')}

            <FormDivider />

            <Autocomplete
              options={this.PROGRAMS}
              value={this.formData.program}
              onChange={(event, newValue) => {
                this.handleFormChange({
                  target: {
                    name: 'program',
                    value: newValue
                  }
                });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Program"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:hover fieldset': {
                        borderColor: '#800000',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#800000',
                      }
                    },
                    '& .MuiInputLabel-root': {
                      '&.Mui-focused': {
                        color: '#800000'
                      }
                    }
                  }}
                />
              )}
            />

            <FormDivider />

            <FormControl component="fieldset">
              <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, color: '#555' }}>
                Would you recommend this to other Students?
              </Typography>
              <RadioGroup
                name="recommendToStudents"
                value={this.formData.recommendToStudents || ''}
                onChange={this.handleFormChange}
                sx={{ flexDirection: 'row', gap: 4 }}
              >
                <FormControlLabel 
                  value="yes" 
                  control={
                    <Radio 
                      sx={{ 
                        color: '#800000',
                        '&.Mui-checked': { color: '#800000' }
                      }} 
                    />
                  } 
                  label="Yes" 
                />
                <FormControlLabel 
                  value="no" 
                  control={
                    <Radio 
                      sx={{ 
                        color: '#800000',
                        '&.Mui-checked': { color: '#800000' }
                      }} 
                    />
                  } 
                  label="No" 
                />
              </RadioGroup>
            </FormControl>
          </Stack>
        </SurveySection>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 6 }}>
          <SubmitButton
            variant="contained"
            size="large"
            onClick={this.handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Survey'}
          </SubmitButton>
        </Box>

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

export default CompanySurvey; 