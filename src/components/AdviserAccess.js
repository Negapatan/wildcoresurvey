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
  IconButton,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { signInWithEmail, signOutUser } from '../firebase-config';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase-config';
import AdviserDashboard from './AdviserDashboard';

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

  LoginButton: styled(Button)(({ theme }) => ({
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

class AdviserAccess extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
      showPassword: false,
      isSubmitting: false,
      authenticated: false,
      userRole: '',
      error: null,
      openSnackbar: false
    };
    
    // Bind the handleSubmit method to the component instance
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleEmailChange = (e) => {
    this.setState({ email: e.target.value });
  };

  handlePasswordChange = (e) => {
    this.setState({ password: e.target.value });
  };

  togglePasswordVisibility = () => {
    this.setState(prevState => ({
      showPassword: !prevState.showPassword
    }));
  };

  handleSubmit = async () => {
    // Set submitting state and clear previous errors
    this.setState({ isSubmitting: true, error: null, openSnackbar: false });
    
    try {
      // Attempt to sign in with the provided credentials
      console.log('Attempting to sign in with:', this.state.email);
      const result = await signInWithEmail(this.state.email, this.state.password);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      const userCredential = { user: result.user };
      
      // Check if authentication was successful
      console.log('Sign in successful, current user:', userCredential.user);
      
      // Get the user's data from Firestore to check their role
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      console.log('User document found:', userDoc.exists());
      
      if (!userDoc.exists()) {
        // User document doesn't exist in Firestore
        console.warn('No user data found in Firestore for this account');
        this.setState({ isSubmitting: false, error: 'Account exists but no user data found. Please contact an administrator.', openSnackbar: true });
        await signOutUser();
        return;
      }
      
      const userData = userDoc.data();
      console.log('User role:', userData.role);
      
      // Ensure the user has the correct role (instructor or admin)
      if (userData.role !== 'instructor' && userData.role !== 'admin') {
        console.warn('Unauthorized role:', userData.role);
        this.setState({ isSubmitting: false, error: 'You do not have permission to access this area.', openSnackbar: true });
        // Sign out the user since they don't have the correct role
        await signOutUser();
        return;
      }
      
      // Authentication and role check successful
      this.setState({
        isSubmitting: false,
        authenticated: true,
        userRole: userData.role,
        error: null
      });
      
    } catch (error) {
      console.error('Authentication error:', error);
      
      // Handle specific authentication errors
      let errorMessage;
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email. Please check your email or contact an administrator.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password. Please try again or reset your password.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Access temporarily disabled due to many failed login attempts. Please try again later.';
            break;
          case 'auth/invalid-credential':
            errorMessage = 'Invalid login credentials. Please check your email and password.';
            break;
          default:
            errorMessage = `Login failed: ${error.message}`;
        }
      } else {
        errorMessage = error.message;
      }
      
      this.setState({ 
        isSubmitting: false, 
        error: errorMessage,
        openSnackbar: true
      });
    }
  }

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

  handleCloseSnackbar = () => {
    this.setState({ openSnackbar: false });
  };

  render() {
    const { Container, LoginButton, BackButton } = StyledComponents;
    const { 
      email, 
      password, 
      showPassword,
      isSubmitting, 
      authenticated, 
      userRole,
      error,
      openSnackbar
    } = this.state;

    if (authenticated) {
      // Redirect to AdviserDashboard when authenticated
      return <AdviserDashboard userRole={userRole} />;
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
            <PersonIcon sx={{ fontSize: 28, color: '#800000' }} />
            <Typography variant="h4" sx={{ 
              color: '#800000', 
              fontWeight: 600,
              fontSize: '1.6rem'
            }}>
              Adviser Login
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
                <PersonIcon sx={{ fontSize: 18 }} />
                This area is restricted to OJT advisers only.
                Please enter your login credentials to proceed.
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Email Address"
              variant="outlined"
              value={email}
              onChange={this.handleEmailChange}
              onKeyPress={this.handleKeyPress}
              type="email"
              autoComplete="email"
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
            />
            
            <TextField
              fullWidth
              label="Password"
              variant="outlined"
              value={password}
              onChange={this.handlePasswordChange}
              onKeyPress={this.handleKeyPress}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
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
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={this.togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <LoginButton 
              variant="contained"
              onClick={this.handleSubmit}
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </LoginButton>

            <BackButton variant="text" onClick={this.handleBack}>
              Back to Role Selection
            </BackButton>
          </Box>
        </Container>

        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={this.handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={this.handleCloseSnackbar} 
            severity="error"
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>
      </MuiContainer>
    );
  }
}

export default AdviserAccess; 