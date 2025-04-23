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
  Divider,
  Autocomplete,
  Checkbox,
  FormGroup,
  FormLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ThankYouPage from './ThankYouPage';
import { submitCompanySurvey } from '../services/surveyService';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// This component is for OJT advisers to evaluate companies
// It saves data to the OJTadvisers collection

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
  })),
  
  BackButton: styled(Button)(({ theme }) => ({
    color: '#800000',
    '&:hover': {
      backgroundColor: 'rgba(128, 0, 0, 0.04)',
    },
  })),

  PeriodButton: styled(Button)(({ theme, isActive }) => ({
    backgroundColor: isActive ? '#800000' : 'white',
    color: isActive ? '#FFD700' : '#800000',
    border: '1px solid #800000',
    borderRadius: '4px',
    padding: theme.spacing(1.5, 4),
    width: '180px',
    fontWeight: 'bold',
    fontSize: '1rem',
    cursor: 'default',
    '&:hover': {
      backgroundColor: isActive ? '#800000' : 'white',
    },
  })),

  SectionTitle: styled(Typography)(({ theme }) => ({
    fontWeight: 600,
    color: '#800000',
    marginBottom: theme.spacing(2),
    fontSize: '1.25rem',
  })),

  SubsectionTitle: styled(Typography)(({ theme }) => ({
    fontWeight: 600,
    color: '#555',
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(2),
    fontSize: '1.1rem',
  })),
};

class OJTAdviserEval extends Component {
  constructor(props) {
    super(props);
    this.state = {
      formData: {
        // Part 1: Company Profile
        companyName: '',
        companyAddress: '',
        departmentAssigned: '',
        supervisorInCharge: '',
        supervisorContact: '',
        supervisorEmail: '',
        
        // Part 2: Evaluation Checklist
        // A. Priority Level
        priorityLevel: '',
        
        // B. Workplace Safety
        safetyProtocols: false,
        safetyOrientation: false,
        emergencyPlans: false,
        noSafetyConcerns: false,
        safetyComments: '',
        
        // C. Learning Opportunities
        relevantTasks: false,
        supervisionEvident: false,
        industryExposure: false,
        knowledgeApplication: false,
        
        // D. Work Environment
        professionalCulture: false,
        openCommunication: false,
        encouragesInitiative: false,
        noHarassment: false,
        
        // E. Compliance with MOA
        providedHours: false,
        submittedForms: false,
        attendedOrientation: false,
        openToCollaboration: false,
        
        // Interview Questions
        workingDuration: '',
        typicalTasks: '',
        
        // Performance
        technicalSkills: '',
        communication: '',
        professionalism: '',
        adaptability: '',
        
        // Additional Questions
        wellPrepared: '',
        curriculumImprovements: '',
        futureEngagements: '',
        hiringProspects: '',
        programImprovements: '',
        
        // Signatures
        advisorName: '',
        supervisorName: '',
        meetingDate: '',
        
        // System Fields
        program: '',
        evaluationPeriod: props.evaluationPeriod || 'MIDTERMS'
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

  componentDidUpdate(prevProps) {
    // Update evaluation period if prop changes
    if (prevProps.evaluationPeriod !== this.props.evaluationPeriod) {
      this.setState(prevState => ({
        formData: {
          ...prevState.formData,
          evaluationPeriod: this.props.evaluationPeriod
        }
      }));
    }
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

  handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        [name]: checked
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

  handleBack = () => {
    if (this.props.onBack) {
      this.props.onBack();
    }
  };

  handleRadioChange = (event) => {
    const { name, value } = event.target;
    this.setState(prevState => ({
      formData: {
        ...prevState.formData,
        [name]: value
      }
    }), () => {
      console.log(`Updated ${name} = ${this.state.formData[name]}`);
    });
  }

  validateForm() {
    const { 
      companyName,
      companyAddress,
      supervisorInCharge,
      priorityLevel,
      program
    } = this.formData;

    // Required fields validation
    if (!companyName || !companyAddress || !supervisorInCharge || !priorityLevel || !program) {
      this.showError('Please fill in all required fields in the Company Profile and Priority Level sections');
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

      // Create a copy of form data to ensure it's not modified unexpectedly
      const submissionData = { ...this.formData };
      
      // Log the form data before submission for debugging
      console.log('Submitting form data:', JSON.stringify(submissionData, null, 2));
      
      await submitCompanySurvey(submissionData);

      console.log('Survey submitted successfully!');
      this.setState({ isSubmitted: true });
    } catch (error) {
      console.error('Error submitting survey:', error);
      this.showError('Error submitting survey. Please try again.');
    } finally {
      this.setState({ isSubmitting: false });
    }
  }

  renderTextField(name, label, multiline = false, type = 'text', helperText = '', required = false) {
    return (
      <TextField
        required={required}
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

  renderCheckboxGroup(title, checkboxes) {
    return (
      <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
        <FormLabel component="legend" sx={{ color: '#555', fontWeight: 500, mb: 1 }}>
          {title}
        </FormLabel>
        <FormGroup>
          {checkboxes.map((checkbox, index) => (
            <FormControlLabel
              key={index}
              control={
                <Checkbox
                  checked={!!this.formData[checkbox.name]}
                  onChange={this.handleCheckboxChange}
                  name={checkbox.name}
                  sx={{
                    color: '#800000',
                    '&.Mui-checked': {
                      color: '#800000',
                    },
                  }}
                />
              }
              label={checkbox.label}
            />
          ))}
        </FormGroup>
      </FormControl>
    );
  }

  render() {
    const { SurveySection, FormDivider, SubmitButton, BackButton, PeriodButton, SectionTitle, SubsectionTitle } = StyledComponents;
    const { isSubmitting, isSubmitted, snackbar } = this.state;
    const { evaluationPeriod } = this.props;

    if (isSubmitted) {
      return <ThankYouPage 
        surveyType="adviser" 
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
        <Box sx={{ alignSelf: 'flex-start', mb: 2 }}>
          <BackButton
            startIcon={<ArrowBackIcon />}
            onClick={this.handleBack}
          >
            Back to Dashboard
          </BackButton>
        </Box>

        <SurveySection>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 3, 
              color: '#555',
              fontWeight: 500 
            }}
          >
            Evaluation Mode:
          </Typography>

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mb: 4,
            gap: 2
          }}>
            <PeriodButton 
              isActive={evaluationPeriod === 'MIDTERMS'} 
              disableRipple
            >
              MIDTERM
            </PeriodButton>
            <PeriodButton 
              isActive={evaluationPeriod === 'FINALS'} 
              disableRipple
            >
              FINAL
            </PeriodButton>
          </Box>
          
          <Divider sx={{ mb: 4 }} />
        
          <Typography 
            variant="h4" 
            sx={{ 
              color: '#800000', 
              mb: 2, 
              textAlign: 'center',
              fontWeight: 600
            }}
          >
            Host Training Establishment Evaluation
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
            CIT-University OJT Partners Assessment Form
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
            This form is intended for OJT Advisers to evaluate partner companies during site visits 
            or virtual meetings. Please ensure that you document all important details for future reference.
          </Typography>

          <FormDivider />

          {/* Part 1: Company Profile */}
          <SectionTitle>Part 1: Company Profile</SectionTitle>
          <Stack spacing={2} sx={{ px: 2, mb: 4 }}>
            {this.renderTextField('companyName', 'Company Name', false, 'text', '', true)}
            {this.renderTextField('companyAddress', 'Address', false, 'text', '', true)}
            {this.renderTextField('departmentAssigned', 'Department/Area Assigned', false, 'text', '')}
            {this.renderTextField('supervisorInCharge', 'Supervisor-in-Charge', false, 'text', '', true)}
            {this.renderTextField('supervisorContact', 'Contact Info', false, 'text', '')}
            {this.renderTextField('supervisorEmail', 'Email Address', false, 'email', '')}
          </Stack>

          <FormDivider />

          {/* Part 2: Evaluation Checklist */}
          <SectionTitle>Part 2: Evaluation Checklist</SectionTitle>
          
          {/* Section A: Priority Level */}
          <SubsectionTitle>A. Priority Level for Partnership</SubsectionTitle>
          <FormControl component="fieldset" sx={{ mb: 4, width: '100%' }}>
            <RadioGroup
              name="priorityLevel"
              value={this.formData.priorityLevel || ''}
              onChange={this.handleRadioChange}
            >
              <FormControlLabel 
                value="High Priority" 
                control={<Radio sx={{ color: '#800000', '&.Mui-checked': { color: '#800000' } }} />} 
                label="High Priority" 
              />
              <FormControlLabel 
                value="Medium Priority" 
                control={<Radio sx={{ color: '#800000', '&.Mui-checked': { color: '#800000' } }} />} 
                label="Medium Priority" 
              />
              <FormControlLabel 
                value="Low Priority" 
                control={<Radio sx={{ color: '#800000', '&.Mui-checked': { color: '#800000' } }} />} 
                label="Low Priority" 
              />
              <FormControlLabel 
                value="Not Recommended" 
                control={<Radio sx={{ color: '#800000', '&.Mui-checked': { color: '#800000' } }} />} 
                label="Not Recommended" 
              />
            </RadioGroup>
          </FormControl>

          {/* Section B: Workplace Safety */}
          <SubsectionTitle>B. Workplace Safety</SubsectionTitle>
          {this.renderCheckboxGroup('', [
            { name: 'safetyProtocols', label: 'Complies with safety protocols' },
            { name: 'safetyOrientation', label: 'Orientation on safety provided' },
            { name: 'emergencyPlans', label: 'Emergency plans and equipment in place' },
            { name: 'noSafetyConcerns', label: 'No safety concerns raised by interns' }
          ])}
          {this.renderTextField('safetyComments', 'Comments', true)}

          {/* Section C: Learning Opportunities */}
          <SubsectionTitle>C. Learning Opportunities</SubsectionTitle>
          {this.renderCheckboxGroup('', [
            { name: 'relevantTasks', label: 'Tasks assigned are relevant to the student\'s field' },
            { name: 'supervisionEvident', label: 'Supervision and mentoring are evident' },
            { name: 'industryExposure', label: 'Exposure to real industry practices' },
            { name: 'knowledgeApplication', label: 'Opportunity to apply academic knowledge' }
          ])}

          {/* Section D: Work Environment */}
          <SubsectionTitle>D. Work Environment</SubsectionTitle>
          {this.renderCheckboxGroup('', [
            { name: 'professionalCulture', label: 'Professional and respectful culture' },
            { name: 'openCommunication', label: 'Open communication with interns' },
            { name: 'encouragesInitiative', label: 'Encourages initiative and feedback' },
            { name: 'noHarassment', label: 'No reports of harassment or discrimination' }
          ])}

          {/* Section E: Compliance with MOA/Expectations */}
          <SubsectionTitle>E. Compliance with MOA/Expectations</SubsectionTitle>
          {this.renderCheckboxGroup('', [
            { name: 'providedHours', label: 'Provided required number of OJT hours' },
            { name: 'submittedForms', label: 'Submitted evaluation forms' },
            { name: 'attendedOrientation', label: 'Attended OJT orientation (if applicable)' },
            { name: 'openToCollaboration', label: 'Open to further collaboration (e.g. research, capstone, employment)' }
          ])}

          <FormDivider />

          {/* Interview Questions */}
          <SectionTitle>Interview Questions for Supervisors</SectionTitle>
          <Stack spacing={3} sx={{ px: 2 }}>
            {this.renderTextField('workingDuration', '1. How long have you been working with OJT students from CIT University?', true)}
            {this.renderTextField('typicalTasks', '2. What are the typical tasks assigned to our interns?', true)}
            
            <SubsectionTitle>3. How would you describe their performance in terms of:</SubsectionTitle>
            {this.renderTextField('technicalSkills', 'Technical skills', true)}
            {this.renderTextField('communication', 'Communication', true)}
            {this.renderTextField('professionalism', 'Professionalism', true)}
            {this.renderTextField('adaptability', 'Adaptability', true)}
            
            {this.renderTextField('wellPrepared', '4. Do you think the students are well-prepared for the tasks given?', true)}
            {this.renderTextField('curriculumImprovements', '5. Are there areas where you think we can improve our curriculum or student preparation?', true)}
            {this.renderTextField('futureEngagements', '6. Are you open to future engagements such as research collaboration, career talks, or capstone mentoring?', true)}
            {this.renderTextField('hiringProspects', '7. Would you consider hiring our students in the future?', true)}
            {this.renderTextField('programImprovements', '8. What improvements would you suggest for our OJT program?', true)}
          </Stack>

          <FormDivider />

          {/* Signatures */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 4 }}>
            <Box sx={{ flex: 1, minWidth: '250px' }}>
              <SubsectionTitle>CIT-University</SubsectionTitle>
              {this.renderTextField('advisorName', 'Name', false, 'text')}
              {this.renderTextField('meetingDate', 'Date', false, 'date')}
            </Box>
            <Box sx={{ flex: 1, minWidth: '250px' }}>
              <SubsectionTitle>Host Training Establishment</SubsectionTitle>
              {this.renderTextField('supervisorName', 'Name', false, 'text')}
            </Box>
          </Box>

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
                  mb: 3,
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
        </SurveySection>

        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <SubmitButton
            variant="contained"
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

export default OJTAdviserEval; 