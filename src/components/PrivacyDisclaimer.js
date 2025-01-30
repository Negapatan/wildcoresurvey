import React, { Component } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledComponents = {
  Container: styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    maxWidth: 800,
    margin: '0 auto',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  })),

  AcceptButton: styled(Button)(({ theme }) => ({
    backgroundColor: '#800000',
    color: '#FFD700',
    '&:hover': {
      backgroundColor: '#600000',
    },
    padding: theme.spacing(1, 4),
    marginTop: theme.spacing(3),
  }))
};

class PrivacyDisclaimer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      accepted: false
    };
  }

  handleCheckboxChange = (event) => {
    this.setState({ accepted: event.target.checked });
  }

  render() {
    const { Container, AcceptButton } = StyledComponents;
    const { accepted } = this.state;
    const { onAccept } = this.props;

    return (
      <Container elevation={3}>
        <Typography variant="h4" sx={{ color: '#800000', mb: 3, textAlign: 'center' }}>
          Data Privacy Notice
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 2, textAlign: 'justify' }}>
          This survey is conducted for feedback and analytics purposes only. The information you provide will be used to improve our OJT program and enhance the learning experience of our students.
        </Typography>

        <Typography variant="body1" sx={{ mb: 2, textAlign: 'justify' }}>
          By participating in this survey, you acknowledge that:
        </Typography>

        <Box sx={{ mb: 3, pl: 2 }}>
          <Typography variant="body1" component="ul">
            <li>Your responses will be stored securely and confidentially</li>
            <li>The data will be used for academic and program improvement purposes only</li>
            <li>Your participation is voluntary and valuable to our continuous improvement</li>
            <li>You can request access to your submitted information at any time</li>
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Checkbox 
              checked={accepted}
              onChange={this.handleCheckboxChange}
              color="primary"
            />
          }
          label="I have read and agree to the data privacy notice"
        />

        <AcceptButton
          variant="contained"
          disabled={!accepted}
          onClick={onAccept}
        >
          Proceed to Survey
        </AcceptButton>
      </Container>
    );
  }
}

export default PrivacyDisclaimer; 