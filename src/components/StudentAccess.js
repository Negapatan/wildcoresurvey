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
  Autocomplete
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SchoolIcon from '@mui/icons-material/School';
import { collection, query, getDocs, orderBy, where, doc } from 'firebase/firestore';
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
      studentSection: '',
      studentName: '',
      studentNames: [],
      studentData: {},
      sections: [],
      isSubmitting: false,
      isAuthenticated: false,
      isLoadingNames: false,
      isLoadingSections: true,
      evaluationMode: 'FINAL', // Default to FINAL evaluation
      snackbar: {
        open: false,
        message: '',
        severity: 'error'
      }
    };
  }

  componentDidMount() {
    // Fetch available sections from sections collection
    this.fetchSections();
  }

  componentWillUnmount() {
    // No need to clean up Firestore listener since we're using getDocs now
  }

  fetchSections = async () => {
    this.setState({ isLoadingSections: true });
    
    console.log("Starting to fetch sections...");
    
    try {
      // Query to get active sections with ordering
      const sectionsRef = collection(db, 'sections');
      const sectionsQuery = query(sectionsRef, orderBy('sectionName', 'asc'));
      
      console.log("Sections reference created:", sectionsRef);
      
      const snapshot = await getDocs(sectionsQuery);
      
      console.log("Snapshot received, size:", snapshot.size);
      console.log("Snapshot empty:", snapshot.empty);
      
      const sectionsArray = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Section document ID:", doc.id);
        console.log("Section data:", data);
        
        // Only include sections that have a valid section name and instructor
        if (data.sectionName && data.sectionName.trim() !== '') {
          sectionsArray.push({
            id: doc.id,
            name: data.sectionName,
            instructorName: data.instructorName || 'Unassigned',
            college: data.college || 'CICS',
            instructorId: data.instructorId || ''
          });
        }
      });
      
      console.log("Processed sections array:", sectionsArray);
      
      this.setState({ 
        sections: sectionsArray,
        isLoadingSections: false,
      });
      
      if (sectionsArray.length === 0) {
        console.log("No active sections found in the database");
        this.setState({
          snackbar: {
            open: true,
            message: 'No active sections found. Please contact your administrator or instructor.',
            severity: 'warning'
          }
        });
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      this.setState({
        isLoadingSections: false,
        snackbar: {
          open: true,
          message: `Error loading sections: ${error.message}. Please try again later.`,
          severity: 'error'
        }
      });
    }
  };

  handleSectionChange = async (e) => {
    const sectionId = e.target.value;
    const selectedSection = this.state.sections.find(section => section.id === sectionId);
    
    if (!selectedSection) return;
    
    this.setState({ 
      studentSection: selectedSection.name,
      sectionId: sectionId,
      studentName: '',
      studentNames: [],
      studentData: {},
      isLoadingNames: true 
    });
    
    try {
      console.log(`Fetching students for section: ${sectionId}`);
      
      // Fetch students from the section's students subcollection with ordering
      const studentsRef = collection(db, `sections/${sectionId}/students`);
      const studentsQuery = query(studentsRef, orderBy('studentName', 'asc'));
      
      console.log("Students reference created:", studentsRef);
      
      const querySnapshot = await getDocs(studentsQuery);
      
      console.log("Students snapshot received, size:", querySnapshot.size);
      console.log("Students snapshot empty:", querySnapshot.empty);
      
      const names = [];
      const studentData = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Student document ID:", doc.id);
        console.log("Student data:", data);
        
        if (data.studentName && data.studentName.trim() !== '') {
          names.push(data.studentName);
          studentData[data.studentName] = {
            id: doc.id,
            studentId: data.studentId || '',
            section: selectedSection.name,
            college: selectedSection.college,
            sectionId: sectionId,
          };
        }
      });
      
      console.log("Processed student names:", names);
      
      this.setState({ 
        studentNames: names,
        studentData,
        isLoadingNames: false
      });
      
      if (names.length === 0) {
        console.log("No students found for this section");
        this.setState({
          snackbar: {
            open: true,
            message: 'No students found for this section. Please contact your administrator or instructor.',
            severity: 'warning'
          }
        });
      }
    } catch (error) {
      console.error('Error fetching student names:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      this.setState({
        isLoadingNames: false,
        snackbar: {
          open: true,
          message: `Error fetching student names: ${error.message}. Please try again.`,
          severity: 'error'
        }
      });
    }
  };

  handleNameChange = (e) => {
    this.setState({ studentName: e.target.value });
  };

  handleModeChange = (e) => {
    this.setState({ evaluationMode: e.target.value });
  };

  validateStudentInfo = async (studentName, sectionId) => {
    if (!studentName || !sectionId) return false;
    
    try {
      const { evaluationMode } = this.state;
      console.log(`Validating student info for ${evaluationMode} evaluation:`, studentName);
      
      // Check if the student has already submitted a company evaluation for this evaluation mode
      // Method 1: Check in the legacy flat collection
      const companyEvalsRef = collection(db, 'companyEvaluations');
      const companyEvalsQuery = query(
        companyEvalsRef, 
        where('studentName', '==', studentName),
        where('evaluationMode', '==', evaluationMode)
      );
      const companyEvalsSnapshot = await getDocs(companyEvalsQuery);
      
      // Method 2: Check in the new hierarchical structure
      // First, determine the department and normalize the student ID
      const selectedStudentData = this.state.studentData[studentName];
      const department = selectedStudentData?.college || 'CICS';
      const section = this.state.studentSection;
      const studentId = selectedStudentData?.studentId || '';
      const normalizedStudentId = studentId 
        ? studentId.replace(/[^a-zA-Z0-9]/g, '_')
        : studentName.trim().toLowerCase().replace(/\s+/g, '_');
      
      console.log('Checking hierarchical structure:', `departments/${department}/sections/${section}/students/${normalizedStudentId}/evaluations`);
      
      // Create reference to the student's evaluations collection
      const departmentRef = doc(db, 'departments', department);
      const sectionsRef = collection(departmentRef, 'sections');
      const sectionDocRef = doc(sectionsRef, section);
      const studentsRef = collection(sectionDocRef, 'students');
      const studentDocRef = doc(studentsRef, normalizedStudentId);
      const evaluationsRef = collection(studentDocRef, 'evaluations');
      
      // Query evaluations with mode filter
      const evaluationsQuery = query(evaluationsRef, where('evaluationMode', '==', evaluationMode));
      
      // Get all evaluations for this student with matching mode
      let hierarchicalSnapshot;
      try {
        hierarchicalSnapshot = await getDocs(evaluationsQuery);
        console.log('Hierarchical check result:', !hierarchicalSnapshot.empty);
      } catch (error) {
        console.log('Hierarchical structure may not exist yet, proceeding with legacy check only');
        hierarchicalSnapshot = { empty: true };
      }
      
      console.log('Student records check results:', {
        evaluationMode,
        foundInLegacyCollection: !companyEvalsSnapshot.empty,
        foundInHierarchicalStructure: !hierarchicalSnapshot.empty
      });
      
      // If found in either structure with matching mode, show error
      if (!companyEvalsSnapshot.empty || !hierarchicalSnapshot.empty) {
        console.log(`Student has already submitted a ${evaluationMode} company evaluation`);
        this.setState({
          snackbar: {
            open: true,
            message: `You have already submitted a ${evaluationMode} company evaluation. Each student can only submit one ${evaluationMode} evaluation.`,
            severity: 'error'
          }
        });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating student info:', error);
      this.setState({
        snackbar: {
          open: true,
          message: `Error validating student information: ${error.message}`,
          severity: 'error'
        }
      });
      return false;
    }
  };

  handleSubmit = async () => {
    const { studentSection, studentName, sectionId } = this.state;

    if (!studentSection || !studentName) {
      this.setState({
        snackbar: {
          open: true,
          message: 'Please select your section and name',
          severity: 'error'
        }
      });
      return;
    }

    this.setState({ isSubmitting: true });
    
    try {
      console.log('Student submission attempt:', { 
        studentName, 
        studentSection, 
        studentData: this.state.studentData,
        evaluationMode: this.state.evaluationMode
      });
      
      // Check if student data exists
      if (!this.state.studentData[studentName]) {
        console.log('No student data found for:', studentName);
        throw new Error('Student data not found');
      }
      
      // Validate student hasn't already submitted for this evaluation mode
      const isValid = await this.validateStudentInfo(studentName, sectionId);
      if (!isValid) {
        this.setState({ isSubmitting: false });
        return;
      }
      
      console.log('Validation passed, proceeding to evaluation form');
      this.setState({ isAuthenticated: true });
    } catch (error) {
      console.error('Validation error:', error);
      this.setState({
        isSubmitting: false,
        snackbar: {
          open: true,
          message: `Error validating student information: ${error.message}. Please try again.`,
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
      studentSection, 
      studentName, 
      studentNames,
      sections,
      studentData,
      isSubmitting, 
      isAuthenticated, 
      isLoadingNames,
      isLoadingSections,
      evaluationMode,
      snackbar 
    } = this.state;

    if (isAuthenticated) {
      const selectedStudentData = studentData[studentName] || {};
      
      return <StudentsEval 
        userRole="student" 
        studentInfo={{
          name: studentName,
          section: studentSection,
          studentId: selectedStudentData.studentId || '',
          program: selectedStudentData.program || '',
          college: selectedStudentData.college || 'CICS'
        }}
        evaluationMode={evaluationMode}
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
              Student Access
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
                <SchoolIcon sx={{ fontSize: 18 }} />
                Please select your section and name to verify your identity and proceed with the evaluation.
              </Typography>
            </Box>

            {/* Evaluation Mode Selection */}
            <Box sx={{ width: '100%', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                Evaluation Mode:
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant={evaluationMode === 'MIDTERM' ? 'contained' : 'outlined'} 
                  onClick={() => this.handleModeChange({ target: { value: 'MIDTERM' } })}
                  sx={{
                    flex: 1,
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
                  onClick={() => this.handleModeChange({ target: { value: 'FINAL' } })}
                  sx={{
                    flex: 1,
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

            {/* Section Autocomplete */}
            <Autocomplete
              fullWidth
              id="section-autocomplete"
              options={sections}
              getOptionLabel={(option) => `${option.name} - ${option.instructorName}`}
              value={sections.find(section => section.id === this.state.sectionId) || null}
              onChange={(event, newValue) => {
                if (newValue) {
                  // Simulate the event object for the handleSectionChange
                  this.handleSectionChange({ target: { value: newValue.id } });
                } else {
                  this.handleSectionChange({ target: { value: '' } });
                }
              }}
              disabled={isLoadingSections}
              loading={isLoadingSections}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Section"
                  variant="outlined"
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#800000',
                      },
                      '&:hover fieldset': {
                        borderColor: '#800000',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#800000',
                    },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isLoadingSections ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  helperText={!isLoadingSections && sections.length === 0 ? "No sections found in database" : ""}
                />
              )}
            />

            {/* Student Name Autocomplete */}
            <Autocomplete
              fullWidth
              id="student-autocomplete"
              options={studentNames}
              value={studentName || null}
              onChange={(event, newValue) => {
                this.setState({ studentName: newValue || '' });
              }}
              disabled={!this.state.sectionId || isLoadingNames}
              loading={isLoadingNames}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Student Name"
                  variant="outlined"
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      '&.Mui-focused fieldset': {
                        borderColor: '#800000',
                      },
                      '&:hover fieldset': {
                        borderColor: '#800000',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#800000',
                    },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isLoadingNames ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  helperText={this.state.sectionId && !isLoadingNames && studentNames.length === 0 ? "No students found for this section" : ""}
                />
              )}
            />

            <AccessButton 
              variant="contained"
              onClick={this.handleSubmit}
              disabled={isSubmitting || isLoadingNames || isLoadingSections || !this.state.sectionId || !studentName}
            >
              {isSubmitting ? 'Verifying...' : 'Access Survey'}
            </AccessButton>

            <BackButton variant="text" onClick={this.handleBack}>
              Back to Role Selection
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

export default StudentAccess; 