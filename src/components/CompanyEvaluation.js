import React, { Component } from 'react';
import {
  Box,
  Typography,
  Rating,
  Paper,
  Button,
  Stack,
  Snackbar,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { submitCompanyEvaluation } from '../services/surveyService';
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

class CompanyEvaluation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formData: {
        companyName: '',
        schoolYear: '',
        semester: '',
        college: '',
        program: '',
        evaluatorName: ''
      },
      workEnvironmentRatings: {},
      supportGuidanceRatings: {},
      workPerformanceRatings: {},
      overallExperienceRatings: {},
      isSubmitting: false,
      isSubmitted: false,
      snackbar: {
        open: false,
        message: '',
        severity: 'success'
      }
    };

    this.workEnvironmentItems = [
      "The company fosters an atmosphere of enthusiasm and eagerness to learn",
      "The company encourages cooperation and a willingness to collaborate with others",
      "The company is adaptable and encourages sociability among its employees",
      "The company promotes industriousness and initiative",
      "The company assigns tasks that encourage a sense of responsibility",
      "The company ensures attentiveness and provides focus in the work environment",
      "The company maintains an environment of personal grooming and professionalism",
      "The company values and supports consistent attendance"
    ];

    this.supportGuidanceItems = [
      "The company provides sufficient training and resources for the tasks assigned",
      "The company offers clear instructions and guidance to help employees succeed",
      "The company is responsive and provides timely feedback on work performance",
      "The company supports work-life balance and recognizes the importance of well-being",
      "The company provides adequate support for problem-solving and challenges"
    ];

    this.workPerformanceItems = [
      "The tasks assigned match my skill level and allow for personal growth",
      "The workload is reasonable, and expectations are clear",
      "The company provides a safe working environment",
      "The company emphasizes waste reduction and efficient use of resources",
      "The company values quality of work over sheer quantity"
    ];

    this.overallExperienceItems = [
      "I feel valued and appreciated as a member of the company",
      "My experience with the company has helped me improve my professional skills",
      "The company promotes a positive and respectful work culture",
      "I would recommend this company to other students for work experience or internships"
    ];

    this.semesterOptions = ['1st', '2nd', 'Summer'];
    
    const currentYear = new Date().getFullYear();
    this.schoolYearOptions = [
      `${currentYear-1}-${currentYear}`,
      `${currentYear}-${currentYear+1}`
    ];

    this.collegesAndPrograms = {
      'COLLEGE OF ENGINEERING AND ARCHITECTURE': [
        'BS Architecture',
        'BS Chemical Engineering',
        'BS Civil Engineering',
        'BS Computer Engineering',
        'BS Electrical Engineering',
        'BS Electronics Engineering',
        'BS Industrial Engineering',
        'BS Mechanical Engineering',
        'BS Mining Engineering'
      ],
      'COLLEGE OF MANAGEMENT, BUSINESS & ACCOUNTANCY': [
        'BS Accountancy',
        'BS Accounting Information Systems',
        'BS Management Accounting',
        'BS Business Administration',
        'BS Hospitality Management',
        'BS Tourism Management',
        'BS Office Administration',
        'Bachelor in Public Administration'
      ],
      'COLLEGE OF ARTS, SCIENCES, & EDUCATION': [
        'AB Communication',
        'AB English with Applied Linguistics',
        'Bachelor of Elementary Education',
        'Bachelor of Secondary Education',
        'Bachelor of Multimedia Arts',
        'BS Biology',
        'BS Math with Applied Industrial Mathematics',
        'BS Psychology'
      ],
      'COLLEGE OF NURSING & ALLIED HEALTH SCIENCES': [
        'BS Nursing',
        'BS Pharmacy'
      ],
      'COLLEGE OF COMPUTER STUDIES': [
        'BS Computer Science',
        'BS Information Technology'
      ],
      'COLLEGE OF CRIMINAL JUSTICE': [
        'BS Criminology'
      ]
    };
  }

  // Getters and Setters
  get workEnvironmentRatings() {
    return this.state.workEnvironmentRatings;
  }

  set workEnvironmentRatings(newRatings) {
    this.setState({ workEnvironmentRatings: newRatings });
  }

  get supportGuidanceRatings() {
    return this.state.supportGuidanceRatings;
  }

  set supportGuidanceRatings(newRatings) {
    this.setState({ supportGuidanceRatings: newRatings });
  }

  get workPerformanceRatings() {
    return this.state.workPerformanceRatings;
  }

  set workPerformanceRatings(newRatings) {
    this.setState({ workPerformanceRatings: newRatings });
  }

  get overallExperienceRatings() {
    return this.state.overallExperienceRatings;
  }

  set overallExperienceRatings(newRatings) {
    this.setState({ overallExperienceRatings: newRatings });
  }

  // Event Handlers
  handleWorkEnvironmentRatingChange = (item, newValue) => {
    this.workEnvironmentRatings = {
      ...this.workEnvironmentRatings,
      [item]: newValue
    };
  }

  handleSupportGuidanceRatingChange = (item, newValue) => {
    this.supportGuidanceRatings = {
      ...this.supportGuidanceRatings,
      [item]: newValue
    };
  }

  handleWorkPerformanceRatingChange = (item, newValue) => {
    this.workPerformanceRatings = {
      ...this.workPerformanceRatings,
      [item]: newValue
    };
  }

  handleOverallExperienceRatingChange = (item, newValue) => {
    this.overallExperienceRatings = {
      ...this.overallExperienceRatings,
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

  handleSubmit = async () => {
    if (!this.validateForm()) {
      return;
    }

    this.setState({ isSubmitting: true });

    try {
      const { formData } = this.state;

      // Prepare the ratings data with exact structure matching Firestore rules
      const surveyData = {
        // Basic fields
        surveyType: 'evaluation',
        companyName: formData.companyName,
        schoolYear: formData.schoolYear,
        semester: formData.semester,
        college: formData.college,
        program: formData.program,

        // Rating sections with exact structure
        workEnvironment: {
          ratings: this.workEnvironmentRatings,
          totalScore: Object.values(this.workEnvironmentRatings).reduce((sum, rating) => sum + rating, 0),
          maxPossibleScore: this.workEnvironmentItems.length * 5
        },
        supportGuidance: {
          ratings: this.supportGuidanceRatings,
          totalScore: Object.values(this.supportGuidanceRatings).reduce((sum, rating) => sum + rating, 0),
          maxPossibleScore: this.supportGuidanceItems.length * 5
        },
        workPerformance: {
          ratings: this.workPerformanceRatings,
          totalScore: Object.values(this.workPerformanceRatings).reduce((sum, rating) => sum + rating, 0),
          maxPossibleScore: this.workPerformanceItems.length * 5
        },
        overallExperience: {
          ratings: this.overallExperienceRatings,
          totalScore: Object.values(this.overallExperienceRatings).reduce((sum, rating) => sum + rating, 0),
          maxPossibleScore: this.overallExperienceItems.length * 5
        },

        // Overall scores
        totalScore: Object.values(this.workEnvironmentRatings).reduce((sum, rating) => sum + rating, 0) +
                   Object.values(this.supportGuidanceRatings).reduce((sum, rating) => sum + rating, 0) +
                   Object.values(this.workPerformanceRatings).reduce((sum, rating) => sum + rating, 0) +
                   Object.values(this.overallExperienceRatings).reduce((sum, rating) => sum + rating, 0),
        maxPossibleScore: (this.workEnvironmentItems.length + 
                          this.supportGuidanceItems.length + 
                          this.workPerformanceItems.length + 
                          this.overallExperienceItems.length) * 5,

        // Required metadata
        submittedAt: new Date(), // Will be converted to timestamp by service
        submittedBy: 'anonymous',
        status: 'submitted'
      };

      await submitCompanyEvaluation(surveyData);
      this.setState({ isSubmitted: true });
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      this.setState({
        snackbar: {
          open: true,
          message: 'Error submitting evaluation. Please try again.',
          severity: 'error'
        }
      });
    } finally {
      this.setState({ isSubmitting: false });
    }
  }

  handleFormChange = (event) => {
    const { name, value } = event.target;
    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        [name]: value
      }
    }));

    if (name === 'college') {
      this.setState(prevState => ({
        formData: {
          ...prevState.formData,
          program: ''
        }
      }));
    }
  }

  validateForm() {
    const { companyName, schoolYear, semester, college, program } = this.state.formData;
    
    if (!companyName || !schoolYear || !semester || !college || !program) {
      this.setState({
        snackbar: {
          open: true,
          message: 'Please fill in all required fields',
          severity: 'error'
        }
      });
      return false;
    }

    const sections = [
      this.workEnvironmentRatings,
      this.supportGuidanceRatings,
      this.workPerformanceRatings,
      this.overallExperienceRatings
    ];

    for (const section of sections) {
      if (Object.keys(section).length === 0) {
        this.setState({
          snackbar: {
            open: true,
            message: 'Please rate all sections before submitting',
            severity: 'error'
          }
        });
        return false;
      }
    }
    return true;
  }

  renderRatingSection(title, items, ratings, handleRatingChange) {
    const { SurveySection, RatingContainer } = StyledComponents;
    return (
      <SurveySection elevation={3}>
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

  renderFormFields() {
    const { SurveySection } = StyledComponents;
    const { formData } = this.state;

    const currentYear = new Date().getFullYear();
    const schoolYears = [
      `${currentYear-1}-${currentYear}`,
      `${currentYear}-${currentYear+1}`
    ];

    const semesters = [
      { value: '1st', label: '1st Semester' },
      { value: '2nd', label: '2nd Semester' },
      { value: 'Summer', label: 'Summer' }
    ];

    return (
      <SurveySection elevation={3}>
        <Typography variant="h5" sx={{ color: '#800000', mb: 3, textAlign: 'center' }}>
          Basic Information
        </Typography>
        
        <Stack spacing={3} sx={{ px: 2 }}>
          <TextField
            label="Name of Company"
            name="companyName"
            value={formData.companyName}
            onChange={this.handleFormChange}
            required
            fullWidth
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

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel 
                id="school-year-label"
                sx={{
                  '&.Mui-focused': {
                    color: '#800000'
                  }
                }}
              >
                School Year
              </InputLabel>
              <Select
                labelId="school-year-label"
                name="schoolYear"
                value={formData.schoolYear}
                onChange={this.handleFormChange}
                label="School Year"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    '&:hover': {
                      borderColor: '#800000'
                    }
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#800000'
                  }
                }}
              >
                {schoolYears.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel 
                id="semester-label"
                sx={{
                  '&.Mui-focused': {
                    color: '#800000'
                  }
                }}
              >
                Semester
              </InputLabel>
              <Select
                labelId="semester-label"
                name="semester"
                value={formData.semester}
                onChange={this.handleFormChange}
                label="Semester"
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    '&:hover': {
                      borderColor: '#800000'
                    }
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#800000'
                  }
                }}
              >
                {semesters.map(sem => (
                  <MenuItem key={sem.value} value={sem.value}>
                    {sem.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Autocomplete
            options={Object.keys(this.collegesAndPrograms)}
            value={formData.college}
            onChange={(event, newValue) => {
              this.handleFormChange({
                target: { name: 'college', value: newValue }
              });
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="College"
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

          <Autocomplete
            options={this.collegesAndPrograms[formData.college] || []}
            value={formData.program}
            onChange={(event, newValue) => {
              this.handleFormChange({
                target: { name: 'program', value: newValue }
              });
            }}
            disabled={!formData.college}
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
        </Stack>
      </SurveySection>
    );
  }

  render() {
    const { SubmitButton } = StyledComponents;
    const { isSubmitting, isSubmitted, snackbar } = this.state;

    if (isSubmitted) {
      return <ThankYouPage surveyType="evaluation" />;
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
          'Work Environment',
          this.workEnvironmentItems,
          this.workEnvironmentRatings,
          this.handleWorkEnvironmentRatingChange
        )}

        {this.renderRatingSection(
          'Support and Guidance',
          this.supportGuidanceItems,
          this.supportGuidanceRatings,
          this.handleSupportGuidanceRatingChange
        )}

        {this.renderRatingSection(
          'Work Performance',
          this.workPerformanceItems,
          this.workPerformanceRatings,
          this.handleWorkPerformanceRatingChange
        )}

        {this.renderRatingSection(
          'Overall Experience',
          this.overallExperienceItems,
          this.overallExperienceRatings,
          this.handleOverallExperienceRatingChange
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, width: '100%', maxWidth: 600 }}>
          <SubmitButton
            variant="contained"
            size="large"
            onClick={this.handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
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

export default CompanyEvaluation; 