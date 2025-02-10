import React, { Component } from 'react';
import { Box, Typography, Button, Fade, Grow, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const StyledComponents = {
  ThankYouButton: styled(Button)(({ theme }) => ({
    backgroundColor: '#800000',
    color: '#FFD700',
    '&:hover': {
      backgroundColor: '#600000',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(128, 0, 0, 0.2)',
    },
    padding: theme.spacing(1.5, 6),
    marginTop: theme.spacing(4),
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    fontSize: '1.1rem',
    fontWeight: 600,
    width: '280px',
  })),

  Container: styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 200px)',
    padding: theme.spacing(4),
    margin: '0 auto',
    width: '100%',
    maxWidth: '800px',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(2),
      minHeight: 'calc(100vh - 150px)',
    },
  })),

  ContentWrapper: styled(Paper)(({ theme }) => ({
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(10px)',
    padding: theme.spacing(6, 4),
    borderRadius: '16px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(4, 2),
      borderRadius: '12px',
    },
  })),

  IconWrapper: styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(3),
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  })),

  Title: styled(Typography)(({ theme }) => ({
    color: '#FFD700',
    marginBottom: theme.spacing(3),
    fontWeight: 'bold',
    fontSize: '2.2rem',
    textAlign: 'center',
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.5rem',
      marginBottom: theme.spacing(2),
    },
  })),

  Message: styled(Typography)(({ theme }) => ({
    color: '#FFD700',
    marginBottom: theme.spacing(2),
    fontSize: '1.1rem',
    lineHeight: 1.6,
    textAlign: 'center',
    maxWidth: '600px',
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.95rem',
      lineHeight: 1.5,
      marginBottom: theme.spacing(1.5),
    },
  })),

  SubMessage: styled(Typography)(({ theme }) => ({
    color: 'rgba(255, 215, 0, 0.8)',
    marginBottom: theme.spacing(2),
    fontSize: '0.95rem',
    textAlign: 'center',
    maxWidth: '550px',
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.9rem',
    },
  }))
};

class ThankYouPage extends Component {
  constructor(props) {
    super(props);
    this.messages = {
      student: {
        title: "Thank You for Your Valuable Feedback!",
        message: "Your assessment of the student's performance is crucial for their growth and development. Your insights will help shape their professional journey.",
        subMessage: "Your contribution helps us maintain high standards in our OJT program and ensures our students receive quality training experiences."
      },
      company: {
        title: "Thank You for Your Partnership!",
        message: "Your feedback about our OJT program and students is invaluable. It helps us strengthen our educational partnerships and improve our training programs.",
        subMessage: "Together, we're building better opportunities for future professionals."
      },
      evaluation: {
        title: "Thank You for Sharing Your Experience!",
        message: "Your honest feedback about your internship experience helps us ensure quality partnerships with companies and better opportunities for future students.",
        subMessage: "Your insights will help us enhance the OJT program and create more meaningful internship experiences."
      }
    };
  }

  get surveyType() {
    return this.props.surveyType;
  }

  get message() {
    return this.messages[this.surveyType];
  }

  handleReturn = () => {
    window.history.back();
  }

  render() {
    const { ThankYouButton, Container, ContentWrapper, IconWrapper, Title, Message, SubMessage } = StyledComponents;
    const messageContent = this.message;

    return (
      <Container>
        <ContentWrapper>
          <Grow in timeout={500}>
            <IconWrapper>
              <CheckCircleIcon 
                sx={{ 
                  fontSize: 90, 
                  color: '#FFD700', 
                  filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.3))'
                }} 
              />
            </IconWrapper>
          </Grow>

          <Fade in timeout={800}>
            <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Title variant="h3">
                {messageContent.title}
              </Title>

              <Message variant="h6">
                {messageContent.message}
              </Message>

              <SubMessage variant="body1">
                {messageContent.subMessage}
              </SubMessage>

              <ThankYouButton 
                variant="contained"
                size="large"
                onClick={this.handleReturn}
              >
                Return to Survey Selection
              </ThankYouButton>
            </Box>
          </Fade>
        </ContentWrapper>
      </Container>
    );
  }
}

// PropTypes for better type checking
ThankYouPage.propTypes = {
  surveyType: PropTypes.oneOf(['student', 'company', 'evaluation']).isRequired
};

export default ThankYouPage; 