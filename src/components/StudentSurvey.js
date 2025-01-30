import React, { Component } from 'react';
import {
  Box,
  Typography,
  Rating,
  Paper,
  Button,
  TextField,
  Stack,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  FormControl
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { submitStudentSurvey } from '../services/surveyService';
import ThankYouPage from './ThankYouPage';

const StyledComponents = {
  SurveySection: styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: '100%',
    maxWidth: 600,
    boxSizing: 'border-box'
  })),

  RatingContainer: styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    '& .MuiRating-root': {
      marginLeft: theme.spacing(2),
    }
  })),

  SubmitButton: styled(Button)(({ theme }) => ({
    backgroundColor: '#800000',
    color: '#FFD700',
    '&:hover': {
      backgroundColor: '#600000',
    },
    padding: theme.spacing(1, 4),
  }))
};

const PROGRAMS = [
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

class StudentSurvey extends Component {
  constructor(props) {
    super(props);
    this.state = {
      workAttitudeRatings: {},
      workPerformanceRatings: {},
      formData: {
        studentName: '',
        companyName: '',
        program: '',
        schoolYear: '',
        semester: ''
      },
      isSubmitting: false,
      isSubmitted: false,
      snackbar: {
        open: false,
        message: '',
        severity: 'success'
      }
    };

    this.workAttitudeItems = [
      'Enthusiasm / Eagerness to Learn',
      'Cooperation and Willingness',
      'Adaptability and Sociability',
      'Industriousness and Initiative',
      'Sense of Responsibility',
      'Attentiveness / Attention',
      'Personal Grooming and Pleasant Disposition',
      'Attendance'
    ];

    this.workPerformanceItems = [
      'Quality of Work',
      'Quantity of Work',
      'Dependability',
      'Comprehension',
      'Safety Consciousness',
      'Waste of Consciousness'
    ];

    this.semesters = [
      { value: '1st', label: '1st Semester' },
      { value: '2nd', label: '2nd Semester' },
      { value: 'summer', label: 'Summer' }
    ];
  }

  // Getters and Setters
  get formData() {
    return this.state.formData;
  }

  set formData(newData) {
    this.setState({ formData: newData });
  }

  get workAttitudeRatings() {
    return this.state.workAttitudeRatings;
  }

  set workAttitudeRatings(newRatings) {
    this.setState({ workAttitudeRatings: newRatings });
  }

  get workPerformanceRatings() {
    return this.state.workPerformanceRatings;
  }

  set workPerformanceRatings(newRatings) {
    this.setState({ workPerformanceRatings: newRatings });
  }

  get isSubmitted() {
    return this.state.isSubmitted;
  }

  set isSubmitted(value) {
    this.setState({ isSubmitted: value });
  }

  // Event Handlers
  handleFormChange = (event) => {
    const { name, value } = event.target;
    this.formData = {
      ...this.formData,
      [name]: value
    };
  }

  handleWorkAttitudeRatingChange = (item, newValue) => {
    this.workAttitudeRatings = {
      ...this.workAttitudeRatings,
      [item]: newValue
    };
  }

  handleWorkPerformanceRatingChange = (item, newValue) => {
    this.workPerformanceRatings = {
      ...this.workPerformanceRatings,
      [item]: newValue
    };
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
    const { studentName, companyName, program, schoolYear, semester } = this.formData;
    const hasAllFormFields = studentName && companyName && program && schoolYear && semester;
    const hasAllWorkAttitudeRatings = this.workAttitudeItems.every(item => this.workAttitudeRatings[item]);
    const hasAllWorkPerformanceRatings = this.workPerformanceItems.every(item => this.workPerformanceRatings[item]);

    if (!hasAllFormFields) {
      this.showError('Please fill in all required fields');
      return false;
    }

    if (!hasAllWorkAttitudeRatings || !hasAllWorkPerformanceRatings) {
      this.showError('Please provide all ratings');
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

  handleSubmit = async () => {
    if (!this.validateForm()) {
      this.showError('Please fill in all required fields');
      return;
    }

    try {
      this.setState({ isSubmitting: true });
      
      await submitStudentSurvey({
        workAttitudeRatings: this.workAttitudeRatings,
        workPerformanceRatings: this.workPerformanceRatings,
        ...this.formData
      });

      this.isSubmitted = true;
      
    } catch (error) {
      console.error('Error submitting survey:', error);
      this.showError('Error submitting survey. Please try again.');
    } finally {
      this.setState({ isSubmitting: false });
    }
  }

  // Render Methods
  renderFormFields() {
    const { SurveySection } = StyledComponents;
    return (
      <SurveySection>
        <Typography variant="h5" sx={{ color: '#800000', mb: 3, textAlign: 'center' }}>
          Student Information
        </Typography>
        <Stack spacing={3} sx={{ width: '100%' }}>
          {this.renderTextField('studentName', 'Student Name')}
          {this.renderTextField('companyName', 'Company Name')}
          {this.renderProgramSelect()}
          {this.renderTextField('schoolYear', 'School Year')}
          {this.renderSemesterSelect()}
        </Stack>
      </SurveySection>
    );
  }

  renderTextField(name, label, placeholder = '') {
    return (
      <TextField
        required
        fullWidth
        variant="outlined"
        label={label}
        name={name}
        value={this.formData[name]}
        onChange={this.handleFormChange}
        placeholder={placeholder}
        sx={{
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: '#800000',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#800000',
            }
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#800000',
          }
        }}
      />
    );
  }

  renderProgramSelect() {
    return (
      <FormControl
        required
        fullWidth
        variant="outlined"
      >
        <InputLabel id="program-label">Program</InputLabel>
        <Select
          labelId="program-label"
          id="program"
          name="program"
          value={this.formData.program || ''}
          onChange={this.handleFormChange}
          label="Program"
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 300,
                width: 'auto',
                marginTop: 2
              },
            },
            anchorOrigin: {
              vertical: 'bottom',
              horizontal: 'left'
            },
            transformOrigin: {
              vertical: 'top',
              horizontal: 'left'
            }
          }}
        >
          {PROGRAMS.map((program) => (
            <MenuItem key={program} value={program}>
              {program}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  renderSemesterSelect() {
    return (
      <TextField
        required
        select
        fullWidth
        variant="outlined"
        label="Semester"
        name="semester"
        value={this.formData.semester}
        onChange={this.handleFormChange}
        sx={{
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: '#800000',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#800000',
            }
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#800000',
          }
        }}
      >
        {this.semesters.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  renderRatingSection(title, items, ratings, handleRatingChange) {
    const { SurveySection, RatingContainer } = StyledComponents;
    return (
      <SurveySection elevation={3} sx={{ width: '100%', maxWidth: 600 }}>
        <Typography variant="h5" sx={{ color: '#800000', mb: 3, textAlign: 'center' }}>
          {title}
        </Typography>
        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', textAlign: 'center' }}>
          (5 being the highest, 1 the lowest)
        </Typography>
        {items.map((item, index) => (
          <RatingContainer key={index}>
            <Typography sx={{ flexGrow: 1 }}>{item}</Typography>
            <Rating
              value={ratings[item] || 0}
              onChange={(event, newValue) => handleRatingChange(item, newValue)}
            />
          </RatingContainer>
        ))}
      </SurveySection>
    );
  }

  render() {
    const { SubmitButton } = StyledComponents;
    const { isSubmitting, isSubmitted, snackbar } = this.state;

    if (isSubmitted) {
      return <ThankYouPage onReturn={this.handleReturn} surveyType="student" />;
    }

    return (
      <Box sx={{ 
        maxWidth: 800, 
        mx: 'auto', 
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box'
      }}>
        {this.renderFormFields()}
        
        {this.renderRatingSection(
          'A. Work Attitude',
          this.workAttitudeItems,
          this.workAttitudeRatings,
          this.handleWorkAttitudeRatingChange
        )}

        {this.renderRatingSection(
          'B. Work Performance',
          this.workPerformanceItems,
          this.workPerformanceRatings,
          this.handleWorkPerformanceRatingChange
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, width: '100%', maxWidth: 600 }}>
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

export default StudentSurvey; 