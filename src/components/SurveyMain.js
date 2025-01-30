import React, { Component } from 'react';
import { 
  Container, 
  Button, 
  Box, 
  Typography,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import { styled } from '@mui/material/styles';
import StudentSurvey from './StudentSurvey';
import CompanySurvey from './CompanySurvey';
import PrivacyDisclaimer from './PrivacyDisclaimer';

const SurveyCard = styled(Card)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  width: '400px',
  height: '280px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  transition: 'transform 0.3s ease-in-out',
  margin: '0 16px',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

const CardContentStyled = styled(CardContent)({
  flexGrow: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '24px',
  textAlign: 'center',
});

const SurveyButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#800000',
  color: '#FFD700',
  '&:hover': {
    backgroundColor: '#600000',
  },
  padding: theme.spacing(1.5, 3),
  width: '200px',
  height: '48px',
}));

class SurveyMain extends Component {
  constructor(props) {
    super(props);
    this.state = {
      surveyType: null,
      disclaimerAccepted: false
    };
  }

  componentDidMount() {
    // Add browser history state handling
    window.addEventListener('popstate', this.handlePopState);
    // Add keyboard event listener
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    // Clean up event listeners
    window.removeEventListener('popstate', this.handlePopState);
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handlePopState = (event) => {
    if (event.state === null) {
      this.setState({ surveyType: null });
    }
  }

  handleKeyDown = (event) => {
    // Handle Escape key
    if (event.key === 'Escape' && this.state.surveyType) {
      this.handleBack();
    }
  }

  handleSurveySelect = (type) => {
    // Push state to browser history
    window.history.pushState({ page: 'survey' }, '', '');
    this.setState({ surveyType: type });
  }

  handleBack = () => {
    window.history.back();
  }

  handleDisclaimerAccept = () => {
    this.setState({ disclaimerAccepted: true });
  }

  renderSurveyCards() {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        width: '100%',
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            color: '#FFD700', 
            mb: 6,
            textAlign: 'center',
            fontWeight: 'bold'
          }}
        >
          Select Survey Type
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          flexWrap: { xs: 'wrap', md: 'nowrap' },
          gap: { xs: 4, md: 3 },
          width: '100%',
          maxWidth: '900px',
          mx: 'auto'
        }}>
          {this.renderSurveyCard(
            'For Company Mentor Survey',
            'To Evaluate the Students during their internship',
            'student'
          )}
          {this.renderSurveyCard(
            'For OJT Advisers',
            'Assessment Guide to OJT Partners',
            'company'
          )}
        </Box>
      </Box>
    );
  }

  renderSurveyCard(title, description, type) {
    return (
      <SurveyCard elevation={3}>
        <CardContentStyled>
          <Typography 
            variant="h5" 
            component="h2" 
            sx={{ 
              color: '#800000',
              mb: 2,
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: { xs: '1.2rem', sm: '1.4rem' },
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              textAlign: 'center',
              color: 'text.secondary',
              mb: 3,
              fontSize: { xs: '0.9rem', sm: '1rem' },
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {description}
          </Typography>
        </CardContentStyled>
        <CardActions sx={{ 
          justifyContent: 'center', 
          p: 3,
          pb: 4
        }}>
          <SurveyButton 
            onClick={() => this.handleSurveySelect(type)}
            variant="contained"
          >
            Start Survey
          </SurveyButton>
        </CardActions>
      </SurveyCard>
    );
  }

  renderSurveyContent() {
    return (
      <Box sx={{ 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <Typography variant="h4" sx={{ color: '#FFD700', mb: 4, textAlign: 'center' }}>
          {this.surveyType === 'student' ? 'Student Survey' : 'Company Survey'}
        </Typography>
        {this.surveyType === 'student' ? <StudentSurvey /> : <CompanySurvey />}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <SurveyButton onClick={() => this.surveyType = null}>
            Back to Survey Selection
          </SurveyButton>
        </Box>
      </Box>
    );
  }

  render() {
    const { disclaimerAccepted, surveyType } = this.state;

    if (!disclaimerAccepted) {
      return (
        <Container 
          maxWidth="md" 
          sx={{ 
            py: 3,
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <PrivacyDisclaimer onAccept={this.handleDisclaimerAccept} />
        </Container>
      );
    }

    return (
      <Container 
        maxWidth="md" 
        sx={{ 
          py: 3,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {!surveyType ? (
          <Box sx={{ 
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh'
          }}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom
              sx={{ 
                color: '#FFD700', 
                mb: 6,
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
              }}
            >
              Select Survey Type
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              flexWrap: { xs: 'wrap', md: 'nowrap' },
              gap: { xs: 4, md: 3 },
              width: '100%',
              maxWidth: '900px',
              mx: 'auto'
            }}>
              {this.renderSurveyCard(
                'For Company Mentor Survey',
                'To Evaluate the Students during their internship',
                'student'
              )}
              {this.renderSurveyCard(
                'For OJT Advisers',
                'Assessment Guide to OJT Partners',
                'company'
              )}
            </Box>
          </Box>
        ) : (
          <Box sx={{ 
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <Typography 
              variant="h4" 
              sx={{ 
                color: '#FFD700', 
                mb: 4, 
                textAlign: 'center',
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }
              }}
            >
              {surveyType === 'student' ? 'Company Mentor Survey' : 'OJT Adviser Assessment'}
            </Typography>
            {surveyType === 'student' ? <StudentSurvey /> : <CompanySurvey />}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <SurveyButton onClick={this.handleBack}>
                Back to Survey Selection
              </SurveyButton>
            </Box>
          </Box>
        )}
      </Container>
    );
  }
}

export default SurveyMain; 