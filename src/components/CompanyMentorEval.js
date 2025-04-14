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
  Autocomplete
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
        evaluationMode: this.props.evaluationMode || 'FINAL' // Use value passed from CompanyAccess.js or default to FINAL
      },
      companies: [],
      companyStudents: [],
      selectedCompanyId: '',
      isLoadingCompanies: true,
      isLoadingStudents: false,
      isSubmitting: false,
      isSubmitted: false,
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
      { value: 'summer', label: 'Summer' }
    ];
  }

  componentDidMount() {
    this.fetchCompanies();
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
        this.setState({
          snackbar: {
            open: true,
            message: 'No students found for this company. You can still enter a student name manually.',
            severity: 'info'
          }
        });
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      this.setState({
        isLoadingStudents: false,
        snackbar: {
          open: true,
          message: `Error loading students: ${error.message}. You can still enter a student name manually.`,
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
      const { studentName, studentId, evaluationMode } = this.formData;
      console.log('Validating student info for student survey:', { studentName, studentId, evaluationMode });
      
      if (!studentId || !studentName) {
        console.log('Missing student name or ID');
        this.showError('Student name and ID are required');
        return false;
      }
      
      if (!this.formData.college) {
        console.log('Missing college information');
        this.showError('Please select a college for this student');
        return false;
      }
      
      // Check period-specific collection
      const evalMode = evaluationMode.toLowerCase();
      const studentSurveysCollectionName = `studentSurveys_${evalMode}`;
      const studentSurveysRef = collection(db, studentSurveysCollectionName);
      
      // Query for documents with the matching studentId
      const studentSurveysQuery = query(studentSurveysRef, where('studentId', '==', studentId));
      const studentSurveysSnapshot = await getDocs(studentSurveysQuery);
      
      console.log('Student records check results:', {
        evaluationMode,
        foundInPeriodCollection: !studentSurveysSnapshot.empty
      });
      
      if (!studentSurveysSnapshot.empty) {
        console.log(`Student ID found in ${studentSurveysCollectionName} collection. Documents:`);
        studentSurveysSnapshot.forEach(doc => console.log('- Document ID:', doc.id, 'Data:', doc.data()));
        
        this.showError(`This student has already been evaluated for ${evaluationMode} period. Each student can only have one ${evaluationMode.toLowerCase()} performance evaluation.`);
        return false;
      }
      
      // Also check the combined collection as a backup
      try {
        const combinedCollectionRef = collection(db, 'studentSurveys');
        const combinedQuery = query(
          combinedCollectionRef, 
          where('studentId', '==', studentId),
          where('evaluationMode', '==', evaluationMode)
        );
        const combinedSnapshot = await getDocs(combinedQuery);
        
        if (!combinedSnapshot.empty) {
          console.log(`Student ID found in combined collection with ${evaluationMode} mode. Documents:`);
          combinedSnapshot.forEach(doc => console.log('- Document ID:', doc.id, 'Data:', doc.data()));
          
          this.showError(`This student has already been evaluated for ${evaluationMode} period. Each student can only have one ${evaluationMode.toLowerCase()} performance evaluation.`);
          return false;
        }
      } catch (error) {
        console.warn('Error checking combined collection:', error);
        // Continue with validation even if this check fails
      }
      
      // Also check the legacy collection as a final backup
      try {
        const legacyCollectionRef = collection(db, 'studentSurveys_legacy');
        const legacyQuery = query(
          legacyCollectionRef, 
          where('studentId', '==', studentId),
          where('evaluationMode', '==', evaluationMode)
        );
        const legacySnapshot = await getDocs(legacyQuery);
        
        if (!legacySnapshot.empty) {
          console.log(`Student ID found in legacy collection with ${evaluationMode} mode. Documents:`);
          legacySnapshot.forEach(doc => console.log('- Document ID:', doc.id, 'Data:', doc.data()));
          
          this.showError(`This student has already been evaluated for ${evaluationMode} period. Each student can only have one ${evaluationMode.toLowerCase()} performance evaluation.`);
          return false;
        }
      } catch (error) {
        console.warn('Error checking legacy collection:', error);
        // Continue with validation even if legacy check fails
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
        ...this.formData
      };
      
      console.log('Form data before submission:', this.formData);
      console.log('Section value:', this.formData.section);
      console.log('Evaluation mode:', this.formData.evaluationMode);
      console.log('Preparing to submit to studentSurveys collection:', submissionData);
      
      const surveyId = await submitStudentSurvey(submissionData);
      
      console.log('Student survey successfully submitted with ID:', surveyId);
      this.isSubmitted = true;
      
    } catch (error) {
      console.error('Error submitting student survey:', error);
      this.showError(`Error submitting evaluation: ${error.message}`);
    } finally {
      this.setState({ isSubmitting: false });
    }
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
            helperText={companies.length === 0 && !isLoadingCompanies ? "No companies found. You can enter a new company name" : ""}
          />
        )}
      />
    );
  }

  renderStudentSelect() {
    const { companyStudents, isLoadingStudents, formData, selectedCompanyId } = this.state;
    
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
        disabled={!selectedCompanyId && !formData.companyName}
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
            helperText={selectedCompanyId && companyStudents.length === 0 && !isLoadingStudents 
              ? "No students found for this company. You can enter a student name manually"
              : !selectedCompanyId && formData.companyName
                ? "New company entered. You can enter a student name manually"
                : !formData.companyName
                  ? "Select a company first"
                  : "Student's college will be used if available"}
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

  renderCollegeSelect() {
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
      </FormControl>
    );
  }

  renderProgramSelect() {
    // Get programs based on selected college or use all programs if no college is selected
    const programs = this.formData.college ? this.getProgramsByCollege(this.formData.college) : PROGRAMS;
    
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
          disabled={!this.formData.college} // Disable until college is selected
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
        {!this.formData.college && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Please select a College/Department first
          </Typography>
        )}
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

  render() {
    const { SurveySection, SubmitButton } = StyledComponents;
    const { isSubmitting, isSubmitted, snackbar, formData } = this.state;

    if (isSubmitted) {
      return <ThankYouPage 
        surveyType="company" 
        evaluationMode={formData.evaluationMode}
        onMakeAnother={this.handleMakeAnotherEvaluation}
        onReturn={() => window.location.href = '/'} 
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
            {isSubmitting ? 'Submitting...' : 'Submit Student Evaluation'}
          </SubmitButton>
        </Box>

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