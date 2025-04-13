import React, { Component } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Container as MuiContainer
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SecurityIcon from '@mui/icons-material/Security';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';

const StyledComponents = {
  Container: styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4, 5),
    maxWidth: 900,
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

  SecurityCard: styled(Card)(({ theme }) => ({
    backgroundColor: 'white',
    width: '240px',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    margin: '8px',
    borderRadius: '4px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    boxShadow: 'none',
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      margin: '6px 0',
    },
    overflow: 'visible',
    padding: 0,
  })),

  CardContentStyled: styled(CardContent)({
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '32px 16px 28px',
    textAlign: 'center',
    '&:last-child': {
      paddingBottom: '28px',
    }
  }),

  SecurityButton: styled(Button)(({ theme }) => ({
    backgroundColor: '#800000',
    color: '#FFD700',
    fontWeight: 'bold',
    '&:hover': {
      backgroundColor: '#600000',
    },
    padding: 0,
    borderRadius: '0',
    width: '100%',
    textTransform: 'uppercase',
    fontSize: '0.9rem',
    letterSpacing: '1px',
    height: '46px',
    marginTop: 0,
    boxShadow: 'none',
  })),

  IconWrapper: styled(Box)(({ theme }) => ({
    color: '#800000',
    fontSize: '2rem',
    marginBottom: theme.spacing(2.5),
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '40px',
  }))
};

class SecurityRedirect extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedRole: null
    };
  }

  handleRoleSelect = (role) => {
    this.setState({ selectedRole: role }, () => {
      // Call the onRoleSelect function passed from the parent
      if (this.props.onRoleSelect) {
        this.props.onRoleSelect(role);
      }
    });
  };

  renderSecurityCard(icon, title, role) {
    const { SecurityCard, CardContentStyled, SecurityButton, IconWrapper } = StyledComponents;
    
    return (
      <SecurityCard elevation={0}>
        <CardContentStyled>
          <IconWrapper>
            {icon}
          </IconWrapper>
          <Typography 
            variant="h6" 
            component="h2" 
            sx={{ 
              color: '#800000',
              fontWeight: 600,
              textAlign: 'center',
              fontSize: '1.1rem',
              mb: 0
            }}
          >
            {title}
          </Typography>
        </CardContentStyled>
        <SecurityButton 
          onClick={() => this.handleRoleSelect(role)}
          variant="contained"
          disableElevation
          fullWidth
        >
          CONTINUE
        </SecurityButton>
      </SecurityCard>
    );
  }

  render() {
    const { Container } = StyledComponents;

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
            mb: 1.5 
          }}>
            <SecurityIcon sx={{ fontSize: 26, color: '#800000' }} />
            <Typography variant="h4" sx={{ 
              color: '#800000', 
              fontWeight: 600,
              fontSize: '1.6rem'
            }}>
              Security Verification
            </Typography>
          </Box>

          <Typography variant="body1" sx={{ 
            mb: 3, 
            textAlign: 'center',
            color: '#444',
            maxWidth: '650px',
            fontSize: '0.92rem'
          }}>
            Please select your role to continue to the appropriate survey.
            This helps us ensure that survey data is properly categorized and secured.
          </Typography>

          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'center',
            alignItems: 'center',
            gap: { xs: 1.5, md: 3 },
            width: '100%',
            mt: 1.5
          }}>
            {this.renderSecurityCard(
              <BusinessIcon fontSize="inherit" />,
              "For Company",
              "company"
            )}
            {this.renderSecurityCard(
              <SchoolIcon fontSize="inherit" />,
              "For Student",
              "student"
            )}
            {this.renderSecurityCard(
              <PeopleIcon fontSize="inherit" />,
              "For Adviser",
              "adviser"
            )}
          </Box>
        </Container>
      </MuiContainer>
    );
  }
}

export default SecurityRedirect; 