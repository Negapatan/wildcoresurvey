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
import CompanyMentorEval from './CompanyMentorEval';
import OJTAdviserEval from './OJTAdviserEval';
import StudentsEval from './StudentsEval';
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

  // Add constants for survey types
  SURVEY_TYPES = {
    COMPANY_MENTOR: 'student',
    OJT_ADVISER: 'company',
    STUDENT: 'evaluation'
  };

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
            'For Company Mentor',
            'Evaluate student performance during internship',
            this.SURVEY_TYPES.COMPANY_MENTOR
          )}
          {this.renderSurveyCard(
            'For OJT Advisers',
            'Assess and guide OJT partners',
            this.SURVEY_TYPES.OJT_ADVISER
          )}
          {this.renderSurveyCard(
            'For Students',
            'Evaluate your internship company',
            this.SURVEY_TYPES.STUDENT
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

  render() {
    const { disclaimerAccepted, surveyType } = this.state;

    if (!disclaimerAccepted) {
      return <PrivacyDisclaimer onAccept={this.handleDisclaimerAccept} />;
    }

    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        {!surveyType ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {this.renderSurveyCards()}
          </Box>
        ) : (
          <Box>
            {surveyType === this.SURVEY_TYPES.COMPANY_MENTOR && <CompanyMentorEval />}
            {surveyType === this.SURVEY_TYPES.OJT_ADVISER && <OJTAdviserEval />}
            {surveyType === this.SURVEY_TYPES.STUDENT && <StudentsEval />}
          </Box>
        )}
      </Container>
    );
  }
}

export default SurveyMain; 