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
  FormControl,
  CircularProgress,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { submitStudentSurvey } from '../services/surveyService';
import ThankYouPage from './ThankYouPage';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase-config';

// This component is for company mentors to evaluate students (saves to studentSurveys collection)
// Note: Despite the component name, this saves to the studentSurveys collection,
// while the StudentsEval component saves to companyEvaluations collection.

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

// College structure with programs organized by college
const COLLEGE_PROGRAMS = {
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

// Flat list of all programs
const PROGRAMS = Object.values(COLLEGE_PROGRAMS).flat();

// List of colleges
const COLLEGES = Object.keys(COLLEGE_PROGRAMS);

class StudentSurvey extends Component {
  constructor(props) {
    super(props);
    this.state = {
      workAttitudeRatings: {},
      workPerformanceRatings: {},
      formData: {
        studentName: '',
        studentId: '',
        companyName: '',
        college: '',  // Added college field
        program: '',
        schoolYear: '',
        semester: '',
        section: 'OJT', // Default section until a student is selected
        evaluationMode: this.props.evaluationMode || 'FINAL', // Use value passed from CompanyAccess.js or default to FINAL
        accessKey: '' // Store the access key used for this evaluation
      },
      companies: [],
      companyStudents: [],
      selectedCompanyId: '',
      isLoadingCompanies: true,
      isLoadingStudents: false,
      isSubmitting: false,
      isSubmitted: false,
      previewOpen: false, // New state for preview dialog
      snackbar: {
        open: false,
        message: '',
        severity: 'success'
      },
      userRole: this.props.userRole || 'student'
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
      { value: 'Summer', label: 'Summer' }
    ];
  }

  componentDidMount() {
    this.fetchCompanies();
    
    // If company and student info is provided via props, pre-fill the form
    this.prefillFormFromProps();
  }

  prefillFormFromProps() {
    const { companyInfo, studentInfo, evaluationMode } = this.props;
    
    if (companyInfo || studentInfo) {
      console.log('Pre-filling form with provided data:', { companyInfo, studentInfo, evaluationMode });
      
      const formDataUpdate = { ...this.state.formData };
      
      // Pre-fill company information if available
      if (companyInfo) {
        formDataUpdate.companyName = companyInfo.name || '';
        
        // Set selected company ID if available
        if (companyInfo.id) {
          this.setState({ selectedCompanyId: companyInfo.id });
          // Fetch students for this company
          this.fetchStudentsForCompany(companyInfo.id);
        }
      }
      
      // Pre-fill student information if available
      if (studentInfo) {
        console.log('Pre-filling student data:', studentInfo);
        
        // Update form data with ALL student information
        // Basic student information
        if (studentInfo.name) formDataUpdate.studentName = studentInfo.name;
        if (studentInfo.studentId) formDataUpdate.studentId = studentInfo.studentId;
        if (studentInfo.section) formDataUpdate.section = studentInfo.section;
        if (studentInfo.college) formDataUpdate.college = studentInfo.college;
        if (studentInfo.program) formDataUpdate.program = studentInfo.program;
        
        // Academic information
        if (studentInfo.semester) formDataUpdate.semester = this.standardizeSemester(studentInfo.semester);
        if (studentInfo.schoolYear) formDataUpdate.schoolYear = studentInfo.schoolYear;
        
        // If evaluationMode is provided, use it
        if (evaluationMode) {
          formDataUpdate.evaluationMode = evaluationMode;
        }

        // Store the access key that was used - Try all possible access key field formats
        const evalMode = evaluationMode || formDataUpdate.evaluationMode || 'FINAL';
        console.log('Current evaluation mode for access key:', evalMode);
        
        // Define all possible access key field names to check
        const keyFields = [
          `${evalMode.toLowerCase()}Key`,  // e.g. "finalKey"
          `${evalMode}Key`,                // e.g. "FINALKey"
          `${evalMode.toLowerCase()}sKey`, // e.g. "finalsKey"
          `${evalMode}sKey`,               // e.g. "FINALSKey"
          'accessKey'                      // legacy format
        ];
        
        console.log('Looking for access key in these fields:', keyFields);
        
        // Try each possible key field
        let foundAccessKey = false;
        for (const keyField of keyFields) {
          if (studentInfo[keyField]) {
            formDataUpdate.accessKey = studentInfo[keyField];
            console.log(`Found and stored access key from ${keyField}:`, studentInfo[keyField]);
            foundAccessKey = true;
            break;
          }
        }
        
        if (!foundAccessKey) {
          console.warn('No access key found in student info:', studentInfo);
        }
        
        console.log('Updated form data with all fields:', formDataUpdate);
      }
      
      // Update the form data state
      this.setState({ formData: formDataUpdate });
      
      // Log confirmation of pre-filling
      if (studentInfo && studentInfo.studentId) {
        console.log(`Successfully pre-filled form for student ID: ${studentInfo.studentId}`);
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

  fetchCompanies = async () => {
    try {
      console.log("Fetching companies from Firestore...");
      this.setState({ isLoadingCompanies: true });
      
      const companiesRef = collection(db, 'companies');
      const companiesQuery = query(companiesRef, orderBy('companyName', 'asc'));
      
      const snapshot = await getDocs(companiesQuery);
      
      const companiesArray = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.companyName && data.companyName.trim() !== '') {
          companiesArray.push({
            id: doc.id,
            name: data.companyName
          });
        }
      });
      
      console.log("Fetched companies:", companiesArray);
      
      this.setState({ 
        companies: companiesArray,
        isLoadingCompanies: false
      });
      
      if (companiesArray.length === 0) {
        console.log("No companies found in database");
        this.setState({
          snackbar: {
            open: true,
            message: 'No companies found in the database. You can still enter a company name manually.',
            severity: 'info'
          }
        });
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      this.setState({
        isLoadingCompanies: false,
        snackbar: {
          open: true,
          message: `Error loading companies: ${error.message}. You can still enter a company name manually.`,
          severity: 'error'
        }
      });
    }
  };

  fetchStudentsForCompany = async (companyId) => {
    if (!companyId) {
      this.setState({ 
        companyStudents: [],
        isLoadingStudents: false
      });
      return;
    }

    try {
      console.log("Fetching students for company ID:", companyId);
      this.setState({ isLoadingStudents: true });
      
      const studentsRef = collection(db, `companies/${companyId}/students`);
      const studentsQuery = query(studentsRef, orderBy('studentName', 'asc'));
      
      const snapshot = await getDocs(studentsQuery);
      
      const studentsArray = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`Student document data for ${doc.id}:`, data);
        
        if (data.studentName && data.studentName.trim() !== '') {
          const studentSection = data.section || 'OJT';
          const studentCollege = data.college || '';
          console.log(`Student ${data.studentName} has section: ${studentSection}, college: ${studentCollege}`);
          
          studentsArray.push({
            id: doc.id,
            name: data.studentName,
            studentId: data.studentId || '',
            section: studentSection,
            college: studentCollege
          });
        }
      });
      
      console.log("Fetched students with section and college data:", studentsArray);
      
      this.setState({ 
        companyStudents: studentsArray,
        isLoadingStudents: false
      });
      
      if (studentsArray.length === 0) {
        console.log("No students found for this company");
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      this.setState({
        isLoadingStudents: false,
        snackbar: {
          open: true,
          message: `Error loading students: ${error.message}`,
          severity: 'error'
        }
      });
    }
  };

  handleCompanyChange = (event, newValue) => {
    const companyName = newValue ? (typeof newValue === 'string' ? newValue : newValue.name) : '';
    const companyId = newValue && typeof newValue !== 'string' ? newValue.id : '';
    
    this.formData = {
      ...this.formData,
      companyName,
      studentName: '', // Reset student name when company changes
      studentId: ''    // Reset student ID when company changes
    };
    
    this.setState({ 
      selectedCompanyId: companyId,
      companyStudents: [] // Clear students when company changes
    }, () => {
      // Only fetch students if we have a company ID (existing company from database)
      if (companyId) {
        this.fetchStudentsForCompany(companyId);
      }
    });
  };

  handleStudentChange = (event, newValue) => {
    const studentName = newValue ? (typeof newValue === 'string' ? newValue : newValue.name) : '';
    // Get studentId from the selected option or generate one from the name if needed
    let studentId = '';
    
    if (newValue) {
      if (typeof newValue !== 'string' && newValue.studentId) {
        // Use existing studentId if available
        studentId = newValue.studentId;
      } else {
        // Generate a studentId from the name if needed
        studentId = this.generateStudentId(studentName);
      }
    }
    
    const studentSection = newValue && typeof newValue !== 'string' ? (newValue.section || 'OJT') : 'OJT';
    // Check if college data is available from the student data
    const studentCollege = newValue && typeof newValue !== 'string' ? (newValue.college || '') : '';
    
    console.log('Selected student:', newValue);
    console.log('Using studentId:', studentId);
    console.log('Using section from student data:', studentSection);
    console.log('Using college from student data:', studentCollege);
    
    this.formData = {
      ...this.formData,
      studentName,
      studentId,
      section: studentSection, // Set section from student data
      college: studentCollege || this.formData.college // Prioritize student's college if available
    };
  };

  // Helper method to generate a studentId from the name
  generateStudentId = (name) => {
    if (!name) return '';
    
    // Remove any special characters, keep only alphanumeric
    const sanitizedName = name.replace(/[^a-zA-Z0-9 ]/g, '');
    
    // Convert to lowercase and replace spaces with underscores
    const normalizedName = sanitizedName.trim().toLowerCase().replace(/\s+/g, '_');
    
    // Add a timestamp suffix to make it unique
    return `${normalizedName}_${Date.now().toString().substr(-8)}`;
  };

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
    const formData = { ...this.formData };
    formData[name] = value;
    
    // If college is changed, reset program
    if (name === 'college') {
      formData.program = '';
    }
    
    this.formData = formData;
  };

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

  handleBack = () => {
    window.history.back();
  }

  handleEvaluationModeChange = (mode) => {
    const formData = { ...this.formData };
    formData.evaluationMode = mode;
    this.formData = formData;
  };

  validateForm() {
    const { studentName, companyName, college, program, schoolYear, semester, section } = this.formData;
    
    console.log('Validating form with section:', section);
    console.log('College value:', college);
    
    const hasAllFormFields = studentName && companyName && college && program && schoolYear && semester && section;
    const hasAllWorkAttitudeRatings = this.workAttitudeItems.every(item => this.workAttitudeRatings[item]);
    const hasAllWorkPerformanceRatings = this.workPerformanceItems.every(item => this.workPerformanceRatings[item]);

    if (!hasAllFormFields) {
      const missingFields = [];
      if (!studentName) missingFields.push('Student Name');
      if (!companyName) missingFields.push('Company Name');
      if (!college) missingFields.push('College / Department');
      if (!program) missingFields.push('Program');
      if (!schoolYear) missingFields.push('School Year');
      if (!semester) missingFields.push('Semester');
      if (!section) missingFields.push('Section');
      
      console.error('Missing required fields:', missingFields);
      this.showError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      return false;
    }

    // Validate that the program belongs to the selected college
    if (college && program) {
      const validPrograms = this.getProgramsByCollege(college);
      if (!validPrograms.includes(program)) {
        console.error('Program does not belong to selected college:', { college, program });
        this.showError(`The selected program does not belong to the ${college}. Please choose a valid program.`);
        return false;
      }
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

  validateStudentInfo = async () => {
    try {
      const { studentName, studentId, evaluationMode, semester, accessKey } = this.formData;
      console.log('Validating student info for student survey:', { studentName, studentId, evaluationMode, semester, accessKey });
      
      // Check if this is an access-key based student (pre-filled)
      const isPrefilledStudent = this.props.studentInfo && this.props.studentInfo.studentId === studentId;
      
      if (!isPrefilledStudent) {
        console.log('Student was not pre-filled from access key, performing standard validation');
        
        if (!studentName) {
          console.log('Missing student name');
          this.showError('Student name is required');
          return false;
        }
        
        if (!this.formData.college) {
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
      
      // First check if this student has already submitted a survey
      if (studentName) {
        try {
          // Check in the period-specific collection
          const collectionName = `studentSurveys_${evaluationMode.toLowerCase()}`;
          console.log(`Checking if student ${studentName} has already submitted in ${collectionName}...`);
          
          // Create queries based on available identifiers
          let existingSubmissionQuery;
          
          if (studentId) {
            // Prefer student ID if available
            existingSubmissionQuery = query(
              collection(db, collectionName),
              where('studentId', '==', studentId),
              where('semester', '==', semester)
            );
          } else {
            // Fall back to student name
            existingSubmissionQuery = query(
              collection(db, collectionName),
              where('studentName', '==', studentName),
              where('semester', '==', semester)
            );
          }
          
          const existingSubmissionSnapshot = await getDocs(existingSubmissionQuery);
          
          if (!existingSubmissionSnapshot.empty) {
            console.error(`Student ${studentName} has already submitted a ${evaluationMode.toLowerCase()} student survey for ${semester} semester.`);
            existingSubmissionSnapshot.forEach(doc => console.log('- Document ID:', doc.id, 'Data:', doc.data()));
            
            this.showError(`This student has already submitted a ${evaluationMode.toLowerCase()} performance evaluation for the ${semester} semester. Each student can only submit one survey per semester.`);
            return false;
          }
        } catch (error) {
          console.warn('Error checking for existing student submissions:', error);
          // Continue with other validation
        }
      }
      
      // If there's an access key, check if it's already been used
      if (accessKey) {
        try {
          // Check the period-specific collection
          const collectionName = `studentSurveys_${evaluationMode.toLowerCase()}`;
          console.log(`Checking if access key ${accessKey} has already been used in ${collectionName}...`);
          
          const keyUsageQuery = query(
            collection(db, collectionName),
            where('accessKey', '==', accessKey)
          );
          
          const keyUsageSnapshot = await getDocs(keyUsageQuery);
          
          if (!keyUsageSnapshot.empty) {
            console.error(`Access key ${accessKey} has already been used for a ${evaluationMode.toLowerCase()} student survey.`);
            keyUsageSnapshot.forEach(doc => console.log('- Document ID:', doc.id, 'Data:', doc.data()));
            
            this.showError(`This access key has already been used for a ${evaluationMode.toLowerCase()} performance evaluation. Each access key can only be used once.`);
            return false;
          }
        } catch (error) {
          console.warn('Error checking for existing access key usage:', error);
          // Continue with other validation
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error validating student info:', error);
      this.showError(`Error validating student information: ${error.message}`);
      return false;
    }
  }

  handleSubmit = async () => {
    if (!this.validateForm()) {
      return;
    }
    
    // Open the preview dialog instead of immediately submitting
    this.setState({ previewOpen: true });
  }
  
  // New method to handle the actual submission after preview confirmation
  handleConfirmSubmit = async () => {
    // Close the preview dialog
    this.setState({ previewOpen: false });
    
    // Add validation for student info
    const isValidStudentInfo = await this.validateStudentInfo();
    if (!isValidStudentInfo) {
      return;
    }

    try {
      this.setState({ isSubmitting: true });
      
      // Log the submission data for debugging
      const submissionData = {
        workAttitudeRatings: this.workAttitudeRatings,
        workPerformanceRatings: this.workPerformanceRatings,
        userRole: this.state.userRole,
        ...this.formData,
        // Ensure access key is explicitly included
        accessKey: this.formData.accessKey || ''
      };
      
      console.log('Form data before submission:', this.formData);
      console.log('Section value:', this.formData.section);
      console.log('Evaluation mode:', this.formData.evaluationMode);
      console.log('Student ID:', this.formData.studentId); // Log the student ID
      console.log('Access Key:', this.formData.accessKey); // Log the access key
      console.log('Preparing to submit to studentSurveys collection:', submissionData);
      
      // Use student ID as the document ID for better security rules compliance
      const studentId = this.formData.studentId;
      const documentId = studentId; // Use studentId as document ID
      
      const surveyId = await submitStudentSurvey(submissionData, documentId);
      
      console.log('Student survey successfully submitted with ID:', surveyId);
      this.isSubmitted = true;
      
    } catch (error) {
      console.error('Error submitting student survey:', error);
      this.showError(`Error submitting evaluation: ${error.message.includes('Missing required fields: studentId') ? 'Please complete all required fields' : error.message}`);
    } finally {
      this.setState({ isSubmitting: false });
    }
  }
  
  // New method to close the preview dialog
  handleClosePreview = () => {
    this.setState({ previewOpen: false });
  }

  // Render Methods
  renderFormFields() {
    const { SurveySection } = StyledComponents;
    const { formData } = this.state;
    const isCompanyUser = this.state.userRole === 'company';
    
    return (
      <SurveySection>
        <Typography variant="h5" sx={{ color: '#800000', mb: 3, textAlign: 'center' }}>
          Student {formData.evaluationMode.toLowerCase()} Evaluation Form
        </Typography>
        
        {/* Evaluation Mode Selection - only show if not a company user */}
        {!isCompanyUser && (
          <Box sx={{ width: '100%', mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, textAlign: 'center' }}>
              Evaluation Mode:
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button 
                variant={formData.evaluationMode === 'MIDTERM' ? 'contained' : 'outlined'} 
                onClick={() => this.handleEvaluationModeChange('MIDTERM')}
                sx={{
                  flex: 1,
                  maxWidth: 150,
                  backgroundColor: formData.evaluationMode === 'MIDTERM' ? '#800000' : 'transparent',
                  color: formData.evaluationMode === 'MIDTERM' ? '#FFD700' : '#800000',
                  borderColor: '#800000',
                  '&:hover': {
                    backgroundColor: formData.evaluationMode === 'MIDTERM' ? '#600000' : 'rgba(128, 0, 0, 0.04)',
                    borderColor: '#800000',
                  }
                }}
              >
                Midterm
              </Button>
              <Button 
                variant={formData.evaluationMode === 'FINAL' ? 'contained' : 'outlined'} 
                onClick={() => this.handleEvaluationModeChange('FINAL')}
                sx={{
                  flex: 1,
                  maxWidth: 150,
                  backgroundColor: formData.evaluationMode === 'FINAL' ? '#800000' : 'transparent',
                  color: formData.evaluationMode === 'FINAL' ? '#FFD700' : '#800000',
                  borderColor: '#800000',
                  '&:hover': {
                    backgroundColor: formData.evaluationMode === 'FINAL' ? '#600000' : 'rgba(128, 0, 0, 0.04)',
                    borderColor: '#800000',
                  }
                }}
              >
                Final
              </Button>
            </Box>
          </Box>
        )}
        
        {/* Evaluation Mode Badge for company users - just display the mode without allowing changes */}
        {isCompanyUser && (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 3 
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
              {formData.evaluationMode} EVALUATION
            </Typography>
          </Box>
        )}
        
        <Stack spacing={3} sx={{ width: '100%' }}>
          {this.renderCompanySelect()}
          {this.renderStudentSelect()}
          {this.renderCollegeSelect()}
          {this.renderProgramSelect()}
          {this.renderTextField('schoolYear', 'School Year')}
          {this.renderSemesterSelect()}
        </Stack>
      </SurveySection>
    );
  }

  renderCompanySelect() {
    const { companies, isLoadingCompanies, formData } = this.state;
    const hasCompanyInfo = !!this.props.companyInfo;
    
    return (
      <Autocomplete
        id="company-select"
        options={companies}
        getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
        value={formData.companyName ? 
          companies.find(company => company.name === formData.companyName) || formData.companyName 
          : null}
        onChange={this.handleCompanyChange}
        freeSolo
        loading={isLoadingCompanies}
        disabled={hasCompanyInfo}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Company Name"
            required
            variant="outlined"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoadingCompanies ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
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
            helperText={hasCompanyInfo ? "Company information from access key" : 
              (companies.length === 0 && !isLoadingCompanies ? "No companies found. You can enter a new company name" : "")}
          />
        )}
      />
    );
  }

  renderStudentSelect() {
    const { companyStudents, isLoadingStudents, formData, selectedCompanyId } = this.state;
    const hasStudentInfo = !!this.props.studentInfo;
    
    return (
      <Autocomplete
        id="student-select"
        options={companyStudents}
        getOptionLabel={(opt) => {
          if (typeof opt === 'string') return opt;
          // Include college in display if available
          return opt.college ? `${opt.name} (${opt.college})` : opt.name;
        }}
        value={formData.studentName ? 
          companyStudents.find(student => student.name === formData.studentName) || formData.studentName 
          : null}
        onChange={this.handleStudentChange}
        freeSolo
        loading={isLoadingStudents}
        disabled={hasStudentInfo || (!selectedCompanyId && !formData.companyName)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Student Name"
            required
            variant="outlined"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoadingStudents ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
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
            helperText={hasStudentInfo ? "Student information from access key" :
              (!selectedCompanyId && !formData.companyName
                ? "Select a company first"
                : formData.companyName && "Student's college will be used if available")}
          />
        )}
        renderOption={(props, opt) => (
          <li {...props}>
            <Box>
              {opt.name}
              {opt.college && (
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ display: 'block', ml: 1 }}
                >
                  {opt.college}
                </Typography>
              )}
            </Box>
          </li>
        )}
      />
    );
  }

  renderTextField(name, label, placeholder = '') {
    const hasStudentInfo = !!this.props.studentInfo;
    const isPrefilledField = hasStudentInfo && ['schoolYear', 'section'].includes(name);
    
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
        disabled={isPrefilledField}
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
        helperText={isPrefilledField ? "Information from access key" : ""}
      />
    );
  }

  renderCollegeSelect() {
    const hasStudentInfo = !!this.props.studentInfo;
    
    return (
      <FormControl
        required
        fullWidth
        variant="outlined"
      >
        <InputLabel id="college-label">College / Department</InputLabel>
        <Select
          labelId="college-label"
          id="college"
          name="college"
          value={this.formData.college || ''}
          onChange={this.handleFormChange}
          label="College / Department"
          disabled={hasStudentInfo}
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
          {COLLEGES.map((college) => (
            <MenuItem key={college} value={college}>
              {college}
            </MenuItem>
          ))}
        </Select>
        {hasStudentInfo && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            College information from access key
          </Typography>
        )}
      </FormControl>
    );
  }

  renderProgramSelect() {
    // Get programs based on selected college or use all programs if no college is selected
    const programs = this.formData.college ? this.getProgramsByCollege(this.formData.college) : PROGRAMS;
    const hasStudentInfo = !!this.props.studentInfo;
    
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
          disabled={hasStudentInfo || !this.formData.college} // Disable if pre-filled or no college selected
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
          {programs.map((program) => (
            <MenuItem key={program} value={program}>
              {program}
            </MenuItem>
          ))}
        </Select>
        {hasStudentInfo ? (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Program information from access key
          </Typography>
        ) : !this.formData.college && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Please select a College/Department first
          </Typography>
        )}
      </FormControl>
    );
  }

  renderSemesterSelect() {
    const hasStudentInfo = !!this.props.studentInfo;
    
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
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#800000',
          }
        }}
        helperText={hasStudentInfo ? "Semester information from access key" : ""}
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

  renderUserRoleInfo() {
    const { userRole } = this.state;
    
    if (userRole === 'company') {
      return (
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
            You are completing this form as a company representative.
            Your evaluation is important for our OJT program.
          </Typography>
        </Box>
      );
    }
    
    return null;
  }

  renderPreviewDialog() {
    const { previewOpen, workAttitudeRatings, workPerformanceRatings, formData, isSubmitting } = this.state;
    
    // Calculate average ratings
    const calculateAverage = (ratings) => {
      const values = Object.values(ratings).filter(v => v !== null && v !== undefined);
      return values.length > 0 
        ? (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2) 
        : 'N/A';
    };
    
    const attitudeAvg = calculateAverage(workAttitudeRatings);
    const performanceAvg = calculateAverage(workPerformanceRatings);
    const overallAvg = ((parseFloat(attitudeAvg) + parseFloat(performanceAvg)) / 2).toFixed(2);
    
    return (
      <Dialog 
        open={previewOpen} 
        onClose={this.handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#800000', color: '#FFD700', textAlign: 'center' }}>
          Preview Student Evaluation
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Please review the evaluation details before final submission:
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
                <Typography><strong>Evaluation Type:</strong> {formData.evaluationMode}</Typography>
              </Box>
              
              <Box sx={{ mt: 3, p: 1, borderLeft: '3px solid #800000' }}>
                <Typography variant="subtitle2" gutterBottom>Average Ratings</Typography>
                <Typography><strong>Work Attitude:</strong> {attitudeAvg}/5</Typography>
                <Typography><strong>Work Performance:</strong> {performanceAvg}/5</Typography>
                <Typography><strong>Overall Rating:</strong> {overallAvg}/5</Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Work Attitude Ratings</Typography>
              {this.workAttitudeItems.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{item}:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {workAttitudeRatings[item] || 'N/A'}/5
                  </Typography>
                </Box>
              ))}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Work Performance Ratings</Typography>
              {this.workPerformanceItems.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">{item}:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {workPerformanceRatings[item] || 'N/A'}/5
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

  render() {
    const { SurveySection, SubmitButton } = StyledComponents;
    const { isSubmitting, isSubmitted, snackbar, formData } = this.state;

    if (isSubmitted) {
      return <ThankYouPage 
        surveyType="company" 
        evaluationMode={formData.evaluationMode}
        onMakeAnother={this.handleMakeAnotherEvaluation}
        onReturn={() => window.location.href = '/'} 
        onBackToAccess={this.props.onBack ? this.props.onBack : () => {
          // Navigate back to the appropriate access page based on user role
          const userRole = this.state.userRole || 'company';
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
        <SurveySection>
          <Typography variant="h5" sx={{ color: '#800000', mb: 2, textAlign: 'center' }}>
            Student Work Performance Evaluation
          </Typography>
          
          {this.renderUserRoleInfo()}
          
          {this.renderFormFields()}
        </SurveySection>

        {this.renderRatingSection(
          'Work Attitude',
          this.workAttitudeItems,
          this.workAttitudeRatings,
          this.handleWorkAttitudeRatingChange
        )}

        {this.renderRatingSection(
          'Work Performance',
          this.workPerformanceItems,
          this.workPerformanceRatings,
          this.handleWorkPerformanceRatingChange
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <SubmitButton
            variant="contained"
            onClick={this.handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Preview & Submit'}
          </SubmitButton>
        </Box>

        {/* Render the preview dialog */}
        {this.renderPreviewDialog()}

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

  handleMakeAnotherEvaluation = () => {
    const { selectedCompanyId, formData } = this.state;
    const companyName = formData.companyName;
    const currentEvaluationMode = formData.evaluationMode; // Get current evaluation mode
    
    console.log('Starting new evaluation for company:', companyName);
    console.log('Maintaining evaluation mode:', currentEvaluationMode);
    
    this.setState({
      workAttitudeRatings: {},
      workPerformanceRatings: {},
      formData: {
        studentName: '',
        studentId: '',
        companyName: companyName,
        program: '',
        college: '', // Reset college for new student
        schoolYear: '',
        semester: '',
        section: 'OJT', // Default section until a student is selected
        evaluationMode: currentEvaluationMode // Keep the current evaluation mode
      },
      companyStudents: [],
      isSubmitted: false
    }, () => {
      // Log the state after reset
      console.log('Form reset. New form data:', this.state.formData);
      
      if (selectedCompanyId) {
        this.fetchStudentsForCompany(selectedCompanyId);
      }
      
      window.scrollTo(0, 0);
    });
  };

  // Get programs based on the selected college
  getProgramsByCollege = (college) => {
    return COLLEGE_PROGRAMS[college] || [];
  };
}

export default StudentSurvey; 