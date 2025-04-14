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
  InputAdornment,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SecurityIcon from '@mui/icons-material/Security';
import BusinessIcon from '@mui/icons-material/Business';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { auth, signOutUser } from '../firebase-config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import CompanyMentorEval from './CompanyMentorEval';

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

class CompanyAccess extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accessKey: '',
      showPassword: false,
      isSubmitting: false,
      isAuthenticated: false,
      evaluationMode: 'FINAL', // Default to FINAL evaluation
      snackbar: {
        open: false,
        message: '',
        severity: 'error'
      }
    };
  }

  componentWillUnmount() {
    // Sign out when component is unmounted to clean up auth state
    if (this.state.isAuthenticated) {
      signOutUser();
    }
  }

  handleAccessKeyChange = (e) => {
    this.setState({ accessKey: e.target.value });
  };

  handleTogglePasswordVisibility = () => {
    this.setState(prevState => ({
      showPassword: !prevState.showPassword
    }));
  };

  handleEvaluationModeChange = (mode) => {
    this.setState({ evaluationMode: mode });
  };

  handleSubmit = async () => {
    const { accessKey } = this.state;
    
    if (!accessKey) {
      this.setState({
        snackbar: {
          open: true,
          message: 'Please enter the access key',
          severity: 'error'
        }
      });
      return;
    }

    this.setState({ isSubmitting: true });

    // Check if the access key is correct (OJT2025!!)
    if (accessKey === 'OJT2025!!') {
      try {
        // First sign out current user (anonymous)
        await signOutUser();
        
        // Then sign in with the company account
        await signInWithEmailAndPassword(auth, 'companyaccess@gmail.com', accessKey);
        
        this.setState({ 
          isAuthenticated: true,
          snackbar: {
            open: true,
            message: 'Access granted! Redirecting to company evaluation form.',
            severity: 'success'
          }
        });
      } catch (error) {
        console.error('Authentication error:', error);
        this.setState({
          snackbar: {
            open: true,
            message: 'Authentication failed. Please try again.',
            severity: 'error'
          }
        });
      }
    } else {
      this.setState({
        snackbar: {
          open: true,
          message: 'Invalid access key. Please try again.',
          severity: 'error'
        }
      });
    }

    this.setState({ isSubmitting: false });
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
    const { accessKey, showPassword, isSubmitting, isAuthenticated, evaluationMode, snackbar } = this.state;

    if (isAuthenticated) {
      return <CompanyMentorEval userRole="company" evaluationMode={evaluationMode} />;
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
            <BusinessIcon sx={{ fontSize: 28, color: '#800000' }} />
            <Typography variant="h4" sx={{ 
              color: '#800000', 
              fontWeight: 600,
              fontSize: '1.6rem'
            }}>
              Company Access
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
                <SecurityIcon sx={{ fontSize: 18 }} />
                This area is restricted to company representatives only.
                Please enter the access key provided to your organization.
              </Typography>
            </Box>

            {/* Evaluation Mode Selection */}
            <Box sx={{ width: '100%', mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500, textAlign: 'center' }}>
                Select Evaluation Period:
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button 
                  variant={evaluationMode === 'MIDTERM' ? 'contained' : 'outlined'} 
                  onClick={() => this.handleEvaluationModeChange('MIDTERM')}
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
                  onClick={() => this.handleEvaluationModeChange('FINAL')}
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

            <TextField
              label="Access Key"
              variant="outlined"
              fullWidth
              value={accessKey}
              onChange={this.handleAccessKeyChange}
              onKeyPress={this.handleKeyPress}
              type={showPassword ? 'text' : 'password'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={this.handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
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
                '& .MuiInputLabel-root': {
                  '&.Mui-focused': {
                    color: '#800000'
                  }
                }
              }}
            />

            <AccessButton 
              variant="contained"
              onClick={this.handleSubmit}
              disabled={isSubmitting}
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

export default CompanyAccess; 