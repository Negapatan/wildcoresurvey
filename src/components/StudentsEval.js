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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { submitCompanyEvaluation } from '../services/surveyService';
import ThankYouPage from './ThankYouPage';
import InfoIcon from '@mui/icons-material/Info';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase-config';

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
    
    // Get student info from props if available
    const studentInfo = this.props.studentInfo || {};
    
    this.state = {
      formData: {
        companyName: studentInfo.companyName || '',
        studentName: studentInfo.name || '',
        schoolYear: studentInfo.schoolYear || '',
        semester: studentInfo.semester || '',
        program: studentInfo.program || '',
        section: studentInfo.section || '',
        college: studentInfo.college || 'CICS',
        studentId: studentInfo.studentId || '',
        accessKey: '' // Store the access key used for this evaluation
      },
      workEnvironmentRatings: {},
      supportGuidanceRatings: {},
      workPerformanceRatings: {},
      overallExperienceRatings: {},
      isSubmitting: false,
      isSubmitted: false,
      previewOpen: false, // New state for preview dialog
      evaluationMode: this.props.evaluationMode || 'FINAL', // Default to FINAL evaluation if not provided
      snackbar: {
        open: false,
        message: '',
        severity: 'success'
      },
      userRole: this.props.userRole || 'student' // Default to student if not provided
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

  componentDidMount() {
    // Auto-fill additional data from studentInfo if available
    const { studentInfo } = this.props;
    
    if (studentInfo) {
      console.log('Auto-filling data from studentInfo:', studentInfo);
      
      // Create updated form data with all available fields from studentInfo
      const updatedFormData = { ...this.state.formData };
      
      // Map studentInfo properties to formData
      if (studentInfo.companyName) updatedFormData.companyName = studentInfo.companyName;
      if (studentInfo.schoolYear) updatedFormData.schoolYear = studentInfo.schoolYear;
      
      // Prioritize the semester field - make sure it's properly set
      if (studentInfo.semester) {
        console.log(`Setting semester to: ${studentInfo.semester}`);
        updatedFormData.semester = this.standardizeSemester(studentInfo.semester);
      }

      // Store the access key that was used - check the specific key fields
      const evaluationMode = this.state.evaluationMode;
      console.log('Current evaluation mode:', evaluationMode);
      
      // Check for access key in the correct field based on evaluation mode
      const keyField = evaluationMode === 'MIDTERM' ? 'midtermsKey' : 'finalsKey';
      
      if (studentInfo[keyField]) {
        updatedFormData.accessKey = studentInfo[keyField];
        console.log(`Found and stored access key from ${keyField}:`, studentInfo[keyField]);
      } else if (studentInfo.accessKey) {
        // Check legacy access key field as fallback
        updatedFormData.accessKey = studentInfo.accessKey;
        console.log('Found and stored access key from legacy field:', studentInfo.accessKey);
      } else {
        console.warn('No access key found in student info:', studentInfo);
      }
      
      // Make sure studentId is in our form data
      if (studentInfo.studentId) {
        updatedFormData.studentId = studentInfo.studentId;
        console.log('Set student ID:', studentInfo.studentId);
      }
      
      // Only update state if we have new values
      if (Object.keys(updatedFormData).some(key => updatedFormData[key] !== this.state.formData[key])) {
        console.log('Updating form data with:', updatedFormData);
        this.setState({ formData: updatedFormData });
      } else {
        console.log('No changes to form data needed');
      }
    }
  }

  // Standardize semester values to consistent format
  standardizeSemester(semester) {
    if (!semester) return '';
    
    // Convert to lowercase for case-insensitive comparison
    const normalizedSemester = semester.toLowerCase();
    
    // Convert different formats to standard format
    if (normalizedSemester === 'first' || normalizedSemester === '1st') {
      return '1st';
    } else if (normalizedSemester === 'second' || normalizedSemester === '2nd') {
      return '2nd';
    } else if (normalizedSemester === 'summer') {
      return 'Summer';
    }
    
    // If no match found, return the original value
    console.log(`Using original semester value: ${semester}`);
    return semester;
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

  validateStudentId = async () => {
    try {
      const { studentName, studentId, section, college, semester, accessKey } = this.state.formData;
      console.log('Validating student info for company evaluation:', { studentName, studentId, section, college, semester, accessKey });
      const evaluationMode = this.state.evaluationMode;
      
      // Check if this is an access-key based student (pre-filled)
      const isPrefilledStudent = this.props.studentInfo && this.props.studentInfo.studentId === studentId;
      
      if (!isPrefilledStudent) {
        console.log('Student was not pre-filled from access key, performing standard validation');
        
        if (!studentName) {
          console.log('Missing student name');
          this.showError('Student name is required');
          return false;
        }
        
        if (!section) {
          console.log('Missing section information');
          this.showError('Section information is required');
          return false;
        }
        
        if (!college) {
          console.log('Missing college information');
          this.showError('Please select a college for this student');
          return false;
        }

        if (!semester) {
          console.log('Missing semester information');
          this.showError('Semester information is required');
          return false;
        }
      }
      
      // Determine which field to use for validation - prioritize access key if available
      const useAccessKey = Boolean(accessKey);
      
      // First check if this student has already submitted an evaluation
      try {
        // Check in the period-specific collection
        const collectionName = `companyEvaluations_${evaluationMode.toLowerCase()}`;
        console.log(`Checking if ${useAccessKey ? 'access key' : 'student'} has already submitted in ${collectionName}...`);
        
        // Create queries based on available identifiers
        let existingSubmissionQuery;
        
        if (useAccessKey) {
          // If we have an access key, check if it's already been used
          existingSubmissionQuery = query(
            collection(db, collectionName),
            where('accessKey', '==', accessKey)
          );
          
          const existingSubmissionSnapshot = await getDocs(existingSubmissionQuery);
          
          if (!existingSubmissionSnapshot.empty) {
            console.error(`Access key ${accessKey} has already been used for a ${evaluationMode.toLowerCase()} company evaluation.`);
            existingSubmissionSnapshot.forEach(doc => console.log('- Document ID:', doc.id, 'Data:', doc.data()));
            
            this.showError(`This access key has already been used for a ${evaluationMode.toLowerCase()} company evaluation. Each access key can only be used once.`);
            return false;
          }
        } else if (studentId) {
          // Use student ID if available and no access key
          existingSubmissionQuery = query(
            collection(db, collectionName),
            where('studentId', '==', studentId),
            where('semester', '==', semester)
          );
          
          const existingSubmissionSnapshot = await getDocs(existingSubmissionQuery);
          
          if (!existingSubmissionSnapshot.empty) {
            console.error(`Student ID ${studentId} has already submitted a ${evaluationMode.toLowerCase()} company evaluation for ${semester} semester.`);
            existingSubmissionSnapshot.forEach(doc => console.log('- Document ID:', doc.id, 'Data:', doc.data()));
            
            this.showError(`This student has already submitted a ${evaluationMode.toLowerCase()} company evaluation for the ${semester} semester. Each student can only submit one evaluation per semester.`);
            return false;
          }
        } else if (studentName) {
          // Fall back to student name if no ID and no access key
          existingSubmissionQuery = query(
            collection(db, collectionName),
            where('studentName', '==', studentName),
            where('semester', '==', semester)
          );
          
          const existingSubmissionSnapshot = await getDocs(existingSubmissionQuery);
          
          if (!existingSubmissionSnapshot.empty) {
            console.error(`Student ${studentName} has already submitted a ${evaluationMode.toLowerCase()} company evaluation for ${semester} semester.`);
            existingSubmissionSnapshot.forEach(doc => console.log('- Document ID:', doc.id, 'Data:', doc.data()));
            
            this.showError(`This student has already submitted a ${evaluationMode.toLowerCase()} company evaluation for the ${semester} semester. Each student can only submit one evaluation per semester.`);
            return false;
          }
        }
      } catch (error) {
        console.warn('Error checking for existing student submissions:', error);
        // Continue with other validation
      }
      
      // Check if this student has any access key-based submission in studentData collection
      if (studentId || studentName) {
        try {
          const studentDataRef = collection(db, 'studentData');
          let studentQuery;
          
          if (studentId) {
            studentQuery = query(
              studentDataRef,
              where('studentId', '==', studentId),
              where('evaluationMode', '==', evaluationMode),
              where('semester', '==', semester)
            );
          } else {
            studentQuery = query(
              studentDataRef,
              where('studentName', '==', studentName),
              where('evaluationMode', '==', evaluationMode),
              where('semester', '==', semester)
            );
          }
          
          const studentSnapshot = await getDocs(studentQuery);
          
          if (!studentSnapshot.empty) {
            const studentDoc = studentSnapshot.docs[0];
            const studentData = studentDoc.data();
            
            if (studentData.hasSubmitted) {
              console.error(`Student ${studentName || studentId} has already submitted an evaluation for ${semester}.`);
              this.showError(`This student has already submitted a ${evaluationMode.toLowerCase()} company evaluation for the ${semester} semester. Each student can only submit one evaluation per semester.`);
              return false;
            }
          }
        } catch (error) {
          console.warn('Error checking studentData collection:', error);
          // Continue with other validation
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error validating student information:', error);
      this.showError(`Error validating student information: ${error.message}`);
      return false;
    }
  }

  validateForm = () => {
    const { companyName, studentName, program, section, schoolYear, semester } = this.state.formData;
    
    console.log('Validating form with section:', section);
    console.log('Company name value:', companyName);
    
    if (!companyName || !studentName || !program || !section || !schoolYear || !semester) {
      const missingFields = [];
      if (!companyName) missingFields.push('Company Name');
      if (!studentName) missingFields.push('Student Name');
      if (!program) missingFields.push('Program');
      if (!section) missingFields.push('Section');
      if (!schoolYear) missingFields.push('School Year');
      if (!semester) missingFields.push('Semester');
      
      this.showError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Ensure at least 80% of rating items are completed
    const workEnvironmentCompleted = Object.values(this.workEnvironmentRatings).filter(Boolean).length;
    const supportGuidanceCompleted = Object.values(this.supportGuidanceRatings).filter(Boolean).length;
    const workPerformanceCompleted = Object.values(this.workPerformanceRatings).filter(Boolean).length;
    const overallExperienceCompleted = Object.values(this.overallExperienceRatings).filter(Boolean).length;
    
    const totalItems = this.workEnvironmentItems.length + this.supportGuidanceItems.length + 
                       this.workPerformanceItems.length + this.overallExperienceItems.length;
    const completedItems = workEnvironmentCompleted + supportGuidanceCompleted + 
                          workPerformanceCompleted + overallExperienceCompleted;
    
    const completionRate = completedItems / totalItems;
    
    console.log('Rating completion rate:', {
      total: totalItems,
      completed: completedItems,
      rate: completionRate
    });
    
    if (completionRate < 0.8) {
      this.showError('Please complete at least 80% of the rating items');
      return false;
    }
    
    return true;
  }

  // Helper method to show error messages consistently
  showError = (message) => {
    this.setState({
      snackbar: {
        open: true,
        message: message,
        severity: 'error'
      }
    });
  }

  handleSubmit = async () => {
    // Validate form before submission
    if (!this.validateForm()) {
      return;
    }
    
    // Open the preview dialog instead of immediately submitting
    this.setState({ previewOpen: true });
  };
  
  // New method to handle the actual submission after preview confirmation
  handleConfirmSubmit = async () => {
    // Close the preview dialog
    this.setState({ previewOpen: false });
    
    // Add validation for student info including access key check
    const isValidStudentInfo = await this.validateStudentId();
    if (!isValidStudentInfo) {
      return;
    }
    
    this.setState({ isSubmitting: true });
    
    try {
      const { formData, workEnvironmentRatings, supportGuidanceRatings, workPerformanceRatings, overallExperienceRatings, evaluationMode } = this.state;
      
      // Log explicitly what access key is being used
      console.log('Using access key for submission:', formData.accessKey || 'No access key');
      
      // Prepare data for submission
      const submissionData = {
        ...formData,
        workEnvironmentRatings,
        supportGuidanceRatings,
        workPerformanceRatings,
        overallExperienceRatings,
        evaluationMode,
        // Ensure accessKey is explicitly included
        accessKey: formData.accessKey || ''
      };
      
      console.log('Submitting company evaluation:', submissionData);
      console.log('Access Key used:', formData.accessKey);
      
      // Submit data using the service
      const documentId = await submitCompanyEvaluation(submissionData);
      
      console.log('Successfully submitted with ID:', documentId);
      
      this.setState({
        isSubmitted: true,
        snackbar: {
          open: true,
          message: 'Thank you! Your evaluation has been submitted successfully.',
          severity: 'success'
        }
      });
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      
      this.setState({
        snackbar: {
          open: true,
          message: `Error submitting evaluation: ${error.message}`,
          severity: 'error'
        },
        isSubmitting: false
      });
    }
  };
  
  // New method to close the preview dialog
  handleClosePreview = () => {
    this.setState({ previewOpen: false });
  };

  handleFormChange = (event) => {
    const { name, value } = event.target;
    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        [name]: value
      }
    }));
  }

  handleStudentIdChange = (event) => {
    let value = event.target.value;
    let previousValue = this.state.formData.studentId;
    
    // Remove any non-digit and non-hyphen characters
    value = value.replace(/[^\d-]/g, '');
    
    // Handle backspace/deletion
    if (value.length < previousValue.length) {
      // If deleting, remove the hyphen if it's the last character
      if (value.endsWith('-')) {
        value = value.slice(0, -1);
      }
      
      this.setState(prevState => ({
        formData: {
          ...prevState.formData,
          studentId: value
        }
      }));
      return;
    }

    // Add hyphens automatically when typing
    if (value.length === 2 && !value.includes('-')) {
      value = value + '-';
    } else if (value.length === 7 && value.split('-').length === 2) {
      value = value + '-';
    }
    
    // Limit to 11 characters (XX-XXXX-XXX)
    value = value.slice(0, 11);
    
    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        studentId: value
      }
    }));
  }

  getAverageRating = (ratings) => {
    const values = Object.values(ratings);
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + (val || 0), 0) / values.length;
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
    const { formData, evaluationMode } = this.state;
    const hasStudentInfo = !!this.props.studentInfo;

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
      <SurveySection>
        <Typography variant="h5" sx={{ color: '#800000', mb: 2, textAlign: 'center' }}>
          Company {evaluationMode.toLowerCase()} Evaluation Form
        </Typography>
        
        {/* Evaluation Mode Badge */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mb: 2 
        }}>
          <Typography
            variant="subtitle1"
            sx={{
              backgroundColor: '#800000',
              color: '#FFD700',
              padding: '4px 12px',
              borderRadius: '16px',
              fontWeight: 'bold',
              fontSize: '0.85rem',
              display: 'inline-block'
            }}
          >
            {evaluationMode} EVALUATION
          </Typography>
        </Box>
        
        <Box
          sx={{
            backgroundColor: 'rgba(128, 0, 0, 0.05)',
            borderRadius: '8px',
            p: 2,
            mb: 4,
            border: '1px solid rgba(128, 0, 0, 0.2)',
          }}
        >
          <Typography 
            variant="subtitle2" 
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
            <InfoIcon sx={{ fontSize: 20 }} />
            Important: You can only submit one evaluation per internship.
            Please ensure all information is accurate before submitting.
          </Typography>
        </Box>

        <Stack spacing={3} sx={{ width: '100%' }}>
          <TextField
            label="Name of Company"
            name="companyName"
            value={formData.companyName}
            onChange={this.handleFormChange}
            required
            fullWidth
            disabled={hasStudentInfo && formData.companyName}
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

          <TextField
            label="Student Name"
            name="studentName"
            value={formData.studentName}
            onChange={this.handleFormChange}
            required
            fullWidth
            disabled={hasStudentInfo}
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

          {hasStudentInfo && (
            <>
              <TextField
                label="Section"
                name="section"
                value={formData.section}
                disabled
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
              
              <TextField
                label="College"
                name="college"
                value={formData.college}
                disabled
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
            </>
          )}

          <FormControl 
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
          >
            <InputLabel>School Year</InputLabel>
            <Select
              name="schoolYear"
              value={formData.schoolYear}
              onChange={this.handleFormChange}
              label="School Year"
              required
              disabled={hasStudentInfo && formData.schoolYear}
            >
              {schoolYears.map(year => (
                <MenuItem key={year} value={year}>{year}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl 
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
          >
            <InputLabel>Semester</InputLabel>
            <Select
              name="semester"
              value={formData.semester}
              onChange={this.handleFormChange}
              label="Semester"
              required
              disabled={hasStudentInfo && formData.semester}
            >
              {semesters.map(sem => (
                <MenuItem key={sem.value} value={sem.value}>{sem.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl 
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
          >
            <InputLabel>Program</InputLabel>
            <Select
              name="program"
              value={formData.program}
              onChange={this.handleFormChange}
              label="Program"
              required
              disabled={hasStudentInfo && formData.program}
            >
              {this.PROGRAMS.map(program => (
                <MenuItem key={program} value={program}>{program}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </SurveySection>
    );
  }

  // New method to render the preview dialog
  renderPreviewDialog() {
    const { 
      previewOpen, 
      formData, 
      workEnvironmentRatings, 
      supportGuidanceRatings,
      workPerformanceRatings,
      overallExperienceRatings,
      isSubmitting,
      evaluationMode
    } = this.state;
    
    // Calculate average ratings
    const workEnvironmentAvg = this.getAverageRating(workEnvironmentRatings);
    const supportGuidanceAvg = this.getAverageRating(supportGuidanceRatings);
    const workPerformanceAvg = this.getAverageRating(workPerformanceRatings);
    const overallExperienceAvg = this.getAverageRating(overallExperienceRatings);
    
    // Calculate overall average rating
    const totalRatingCount = Object.keys(workEnvironmentRatings).length + 
                            Object.keys(supportGuidanceRatings).length +
                            Object.keys(workPerformanceRatings).length +
                            Object.keys(overallExperienceRatings).length;
    
    const totalRatingSum = this.getSumOfRatings(workEnvironmentRatings) +
                          this.getSumOfRatings(supportGuidanceRatings) +
                          this.getSumOfRatings(workPerformanceRatings) +
                          this.getSumOfRatings(overallExperienceRatings);
    
    const overallAvg = totalRatingCount > 0 ? (totalRatingSum / totalRatingCount).toFixed(2) : 'N/A';
    
    return (
      <Dialog 
        open={previewOpen} 
        onClose={this.handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#800000', color: '#FFD700', textAlign: 'center' }}>
          Preview Company {evaluationMode.toLowerCase()} Evaluation
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Please review your evaluation details before final submission:
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Student Information</Typography>
              <Box sx={{ p: 1, borderLeft: '3px solid #800000' }}>
                <Typography><strong>Name:</strong> {formData.studentName}</Typography>
                <Typography><strong>ID:</strong> {formData.studentId}</Typography>
                <Typography><strong>College:</strong> {formData.college}</Typography>
                <Typography><strong>Program:</strong> {formData.program}</Typography>
                <Typography><strong>School Year:</strong> {formData.schoolYear}</Typography>
                <Typography><strong>Semester:</strong> {formData.semester}</Typography>
                <Typography><strong>Section:</strong> {formData.section}</Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Company Information</Typography>
              <Box sx={{ p: 1, borderLeft: '3px solid #800000' }}>
                <Typography><strong>Company:</strong> {formData.companyName}</Typography>
                <Typography><strong>Evaluation Type:</strong> {evaluationMode}</Typography>
              </Box>
              
              <Box sx={{ mt: 3, p: 1, borderLeft: '3px solid #800000' }}>
                <Typography variant="subtitle2" gutterBottom>Average Ratings</Typography>
                <Typography><strong>Work Environment:</strong> {workEnvironmentAvg.toFixed(2)}/5</Typography>
                <Typography><strong>Support & Guidance:</strong> {supportGuidanceAvg.toFixed(2)}/5</Typography>
                <Typography><strong>Work Performance:</strong> {workPerformanceAvg.toFixed(2)}/5</Typography>
                <Typography><strong>Overall Experience:</strong> {overallExperienceAvg.toFixed(2)}/5</Typography>
                <Typography sx={{ fontWeight: 'bold', mt: 1 }}><strong>Overall Rating:</strong> {overallAvg}/5</Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Work Environment Ratings</Typography>
              {this.workEnvironmentItems.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ flexGrow: 1, pr: 2 }}>{item}:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '40px', textAlign: 'right' }}>
                    {workEnvironmentRatings[item] || 'N/A'}/5
                  </Typography>
                </Box>
              ))}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Support & Guidance Ratings</Typography>
              {this.supportGuidanceItems.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ flexGrow: 1, pr: 2 }}>{item}:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '40px', textAlign: 'right' }}>
                    {supportGuidanceRatings[item] || 'N/A'}/5
                  </Typography>
                </Box>
              ))}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Work Performance Ratings</Typography>
              {this.workPerformanceItems.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ flexGrow: 1, pr: 2 }}>{item}:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '40px', textAlign: 'right' }}>
                    {workPerformanceRatings[item] || 'N/A'}/5
                  </Typography>
                </Box>
              ))}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Overall Experience Ratings</Typography>
              {this.overallExperienceItems.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ flexGrow: 1, pr: 2 }}>{item}:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '40px', textAlign: 'right' }}>
                    {overallExperienceRatings[item] || 'N/A'}/5
                  </Typography>
                </Box>
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button onClick={this.handleClosePreview} variant="outlined" color="inherit">
            Back to Edit
          </Button>
          <Button 
            onClick={this.handleConfirmSubmit} 
            variant="contained" 
            disabled={isSubmitting}
            sx={{ 
              bgcolor: '#800000', 
              color: '#FFD700',
              '&:hover': { bgcolor: '#600000' } 
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
  
  // Helper method to calculate the sum of ratings
  getSumOfRatings = (ratings) => {
    return Object.values(ratings).reduce((sum, val) => sum + (val || 0), 0);
  };

  render() {
    const { 
      SubmitButton 
    } = StyledComponents;
    
    const { 
      isSubmitting, 
      isSubmitted, 
      snackbar,
      evaluationMode
    } = this.state;

    if (isSubmitted) {
      return <ThankYouPage 
        surveyType="evaluation" 
        evaluationMode={evaluationMode}
        onReturn={() => window.location.href = '/'} 
        onBackToAccess={this.props.onBack ? this.props.onBack : () => {
          // Navigate back to the appropriate access page based on user role
          const userRole = this.state.userRole || 'student';
          window.location.href = `/?role=${userRole}`;
        }}
      />;
    }

    return (
      <Box sx={{ 
        maxWidth: 800, 
        mx: 'auto', 
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
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

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <SubmitButton
            variant="contained"
            onClick={this.handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Preview & Submit'}
          </SubmitButton>
        </Box>

        {/* Add the preview dialog */}
        {this.renderPreviewDialog()}

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