import React, { Component } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';

const StyledComponents = {
  ThankYouButton: styled(Button)(({ theme }) => ({
    backgroundColor: '#800000',
    color: '#FFD700',
    '&:hover': {
      backgroundColor: '#600000',
    },
    padding: theme.spacing(1, 4),
    marginTop: theme.spacing(4),
  })),

  Container: styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: '32px',
  }),

  Title: styled(Typography)(({ theme }) => ({
    color: '#FFD700',
    marginBottom: theme.spacing(3),
    fontWeight: 'bold',
  })),

  Message: styled(Typography)(({ theme }) => ({
    color: '#FFD700',
    marginBottom: theme.spacing(4),
  }))
};

class ThankYouPage extends Component {
  constructor(props) {
    super(props);
    this.messages = {
      student: "Your feedback has been successfully submitted. Thank you for sharing your experience!",
      company: "Thank you for providing your valuable feedback about our student's performance!",
      evaluation: "Thank you for evaluating your internship experience with the company. Your feedback helps improve our OJT program!"
    };
  }

  get surveyType() {
    return this.props.surveyType;
  }

  get message() {
    return this.messages[this.surveyType];
  }

  handleReturn = () => {
    window.location.href = '/';  // This will redirect to SurveyMain
  }

  render() {
    const { ThankYouButton, Container, Title, Message } = StyledComponents;

    return (
      <Container>
        <Title variant="h4">
          Thank You!
        </Title>
        <Message variant="h6">
          {this.message}
        </Message>
        <ThankYouButton 
          variant="contained"
          size="large"
          onClick={this.handleReturn}
        >
          Return to Homepage
        </ThankYouButton>
      </Container>
    );
  }
}

// PropTypes for better type checking
ThankYouPage.propTypes = {
  surveyType: PropTypes.oneOf(['student', 'company', 'evaluation']).isRequired
};

export default ThankYouPage; 