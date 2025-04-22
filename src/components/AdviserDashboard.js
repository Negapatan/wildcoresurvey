import React, { Component } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  CircularProgress,
  Backdrop
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AssessmentIcon from '@mui/icons-material/Assessment';
import WarningIcon from '@mui/icons-material/Warning';
import LogoutIcon from '@mui/icons-material/Logout';
import OJTAdviserEval from './OJTAdviserEval';
import ConcernsSolutionsAccess from './ConcernsSolutionsAccess';
import { signOutUser } from '../firebase-config';

const StyledComponents = {
  DashboardContainer: styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    maxWidth: 900,
    margin: '0 auto',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  })),

  OptionCard: styled(Card)(({ theme }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
    },
    backgroundColor: 'white',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid rgba(0, 0, 0, 0.05)',
  })),

  CardHeader: styled(Box)(({ theme, bgcolor }) => ({
    padding: theme.spacing(2),
    backgroundColor: bgcolor || '#800000',
    color: '#FFD700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  })),

  ActionButton: styled(Button)(({ theme, bgcolor, hovercolor }) => ({
    backgroundColor: bgcolor || '#800000',
    color: '#FFD700',
    '&:hover': {
      backgroundColor: hovercolor || '#600000',
    },
    padding: theme.spacing(1, 2),
    borderRadius: '4px',
    fontWeight: 'bold',
    flex: 1,
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
    '&:hover': {
      backgroundColor: isActive ? '#600000' : 'rgba(128, 0, 0, 0.05)',
    },
  })),

  LogoutButton: styled(Button)(({ theme }) => ({
    marginTop: theme.spacing(4),
    color: '#800000',
    borderColor: '#800000',
    '&:hover': {
      backgroundColor: 'rgba(128, 0, 0, 0.04)',
      borderColor: '#600000',
    },
  })),
};

class AdviserDashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentView: 'dashboard',
      userRole: props.userRole || 'instructor',
      evaluationPeriod: 'MIDTERMS',
      isLoggingOut: false
    };
  }

  handleLogout = async () => {
    // Set loading state
    this.setState({ isLoggingOut: true });
    
    try {
      await signOutUser();
      // Reset app state and redirect to initial view (Privacy Disclaimer)
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      // Reset loading state if error occurs
      this.setState({ isLoggingOut: false });
    }
  };

  switchView = (view) => {
    this.setState({ currentView: view });
  };

  setEvaluationPeriod = (period) => {
    this.setState({ evaluationPeriod: period });
  };

  renderDashboard() {
    const { DashboardContainer, OptionCard, CardHeader, ActionButton, PeriodButton, LogoutButton } = StyledComponents;
    const { userRole, evaluationPeriod } = this.state;

    return (
      <Box sx={{ 
        maxWidth: 1200, 
        mx: 'auto', 
        p: { xs: 2, sm: 3 },
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '90vh',
        justifyContent: 'center',
      }}>
        <DashboardContainer>
          <Typography 
            variant="h4" 
            sx={{ 
              color: '#800000', 
              mb: 1, 
              textAlign: 'center',
              fontWeight: 600
            }}
          >
            OJT Adviser Dashboard
          </Typography>
          
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#666', 
              mb: 4, 
              textAlign: 'center',
              fontStyle: 'italic'
            }}
          >
            Welcome, {userRole === 'admin' ? 'Administrator' : 'OJT Adviser'}
          </Typography>
          
          <Divider sx={{ mb: 4, backgroundColor: 'rgba(128, 0, 0, 0.2)' }} />
          
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 4, 
              textAlign: 'center',
              color: '#555'
            }}
          >
            Please select one of the following options:
          </Typography>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <OptionCard>
                <CardHeader bgcolor="#800000">
                  <AssessmentIcon />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Visital Assessment
                  </Typography>
                </CardHeader>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 3, color: '#555' }}>
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
                      onClick={() => this.setEvaluationPeriod('MIDTERMS')}
                    >
                      MIDTERM
                    </PeriodButton>
                    <PeriodButton 
                      isActive={evaluationPeriod === 'FINALS'} 
                      onClick={() => this.setEvaluationPeriod('FINALS')}
                    >
                      FINAL
                    </PeriodButton>
                  </Box>
                  
                  <Divider sx={{ mb: 3 }} />
                  
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Complete the OJT Partners Evaluation Form to assess company performance
                    and document student experiences during their internship.
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Use this form to record details from your virtual meetings with company representatives.
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2 }}>
                  <ActionButton 
                    variant="contained" 
                    onClick={() => this.switchView('assessment')}
                  >
                    Open Form
                  </ActionButton>
                </CardActions>
              </OptionCard>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <OptionCard>
                <CardHeader bgcolor="#D32F2F">
                  <WarningIcon />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Concerns & Solutions
                  </Typography>
                </CardHeader>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Address student challenges and difficulties encountered during their OJT experience 
                    and provide recommendations for academic and professional improvement.
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Document student performance issues, learning gaps, and mentoring needs to better support their development.
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2 }}>
                  <ActionButton 
                    variant="contained" 
                    bgcolor="#D32F2F"
                    hovercolor="#B71C1C"
                    onClick={() => this.switchView('concerns')}
                  >
                    Open Form
                  </ActionButton>
                </CardActions>
              </OptionCard>
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <LogoutButton 
              variant="outlined" 
              startIcon={<LogoutIcon />}
              onClick={this.handleLogout}
            >
              Logout
            </LogoutButton>
          </Box>
        </DashboardContainer>
      </Box>
    );
  }

  render() {
    const { currentView, userRole, evaluationPeriod, isLoggingOut } = this.state;

    // Show loading backdrop when logging out
    if (isLoggingOut) {
      return (
        <Backdrop
          sx={{ 
            color: '#FFD700', 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backgroundColor: 'rgba(128, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
          open={true}
        >
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6" sx={{ color: '#FFD700' }}>
            Logging out...
          </Typography>
        </Backdrop>
      );
    }

    switch (currentView) {
      case 'assessment':
        return <OJTAdviserEval 
          userRole={userRole} 
          evaluationPeriod={evaluationPeriod}
          onBack={() => this.switchView('dashboard')} 
        />;
      case 'concerns':
        return <ConcernsSolutionsAccess 
          userRole={userRole} 
          onBack={() => this.switchView('dashboard')} 
        />;
      default:
        return this.renderDashboard();
    }
  }
}

export default AdviserDashboard; 