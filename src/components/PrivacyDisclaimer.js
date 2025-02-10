import React, { Component } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Checkbox,
  FormControlLabel,
  Divider,
  Container as MuiContainer
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SecurityIcon from '@mui/icons-material/Security';
import GavelIcon from '@mui/icons-material/Gavel';
import InfoIcon from '@mui/icons-material/Info';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const StyledComponents = {
  Container: styled(Paper)(({ theme }) => ({
    padding: theme.spacing(3),
    maxWidth: 800,
    margin: '0 auto',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(2),
      margin: theme.spacing(2),
      borderRadius: '8px',
    },
  })),

  Section: styled(Box)(({ theme }) => ({
    width: '100%',
    marginBottom: theme.spacing(2.5),
    padding: theme.spacing(1.5),
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    '&:hover': {
      backgroundColor: 'rgba(128, 0, 0, 0.02)',
    },
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(2),
      padding: theme.spacing(1),
    },
  })),

  AcceptButton: styled(Button)(({ theme }) => ({
    backgroundColor: '#800000',
    color: '#FFD700',
    '&:hover': {
      backgroundColor: '#600000',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(128, 0, 0, 0.2)',
    },
    padding: theme.spacing(1.2, 4),
    marginTop: theme.spacing(2),
    borderRadius: '8px',
    transition: 'all 0.3s ease',
    fontWeight: 600,
    textTransform: 'none',
    fontSize: '1rem',
  })),

  SectionHeader: styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  })
};

class PrivacyDisclaimer extends Component {
  constructor(props) {
    super(props);
    this.state = { accepted: false };
  }

  handleCheckboxChange = (event) => {
    this.setState({ accepted: event.target.checked });
  }

  renderSection(icon, title, content) {
    const { Section, SectionHeader } = StyledComponents;
    return (
      <Section>
        <SectionHeader>
          {icon}
          <Typography variant="h6" sx={{ 
            color: '#800000', 
            fontWeight: 600,
            fontSize: '1.1rem'
          }}>
            {title}
          </Typography>
        </SectionHeader>
        {content}
      </Section>
    );
  }

  render() {
    const { Container, AcceptButton } = StyledComponents;
    const { accepted } = this.state;
    const { onAccept } = this.props;

    return (
      <MuiContainer maxWidth="lg" sx={{ 
        py: { xs: 2, sm: 3 },
        px: { xs: 1, sm: 2 }
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '90vh',
        }}>
          <Container elevation={3}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              mb: 2 
            }}>
              <SecurityIcon sx={{ fontSize: 32, color: '#800000' }} />
              <Typography variant="h4" sx={{ 
                color: '#800000', 
                fontWeight: 700,
                fontSize: '1.8rem'
              }}>
                Privacy Notice
              </Typography>
            </Box>

            <Typography variant="body1" sx={{ 
              mb: 2, 
              textAlign: 'justify',
              color: '#444',
              lineHeight: 1.5,
              fontSize: '1rem'
            }}>
              This privacy notice explains how we collect, use, and protect your personal information in accordance with the Data Privacy Act of 2012 (RA 10173).
            </Typography>

            <Divider sx={{ mb: 2, backgroundColor: 'rgba(128, 0, 0, 0.1)' }} />

            {this.renderSection(
              <InfoIcon sx={{ color: '#800000', fontSize: 24 }} />,
              "Information We Collect",
              <Typography variant="body2" sx={{ color: '#444', lineHeight: 1.5 }}>
                We collect information such as your name, program, school year, and feedback regarding your internship experience. This information is essential for evaluating and improving our OJT program.
              </Typography>
            )}

            {this.renderSection(
              <DataUsageIcon sx={{ color: '#800000', fontSize: 24 }} />,
              "How We Use Your Information",
              <Box component="div" sx={{ color: '#444', fontSize: '0.875rem' }}>
                <Typography variant="body2">Your information will be used for:</Typography>
                <ul style={{ margin: '4px 0 0 20px', lineHeight: 1.5 }}>
                  <li>Evaluating the effectiveness of our OJT program</li>
                  <li>Improving the quality of internship experiences</li>
                  <li>Maintaining partnerships with companies</li>
                  <li>Generating anonymous statistical reports</li>
                  <li>Academic research and program development</li>
                </ul>
              </Box>
            )}

            {this.renderSection(
              <AdminPanelSettingsIcon sx={{ color: '#800000', fontSize: 24 }} />,
              "Data Protection",
              <Typography variant="body2" sx={{ color: '#444', lineHeight: 1.5 }}>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </Typography>
            )}

            {this.renderSection(
              <GavelIcon sx={{ color: '#800000', fontSize: 24 }} />,
              "Your Rights",
              <Typography variant="body2" sx={{ color: '#444', lineHeight: 1.5 }}>
                You have the right to access, correct, and request the deletion of your personal information. You may also withdraw your consent or object to the processing of your information.
              </Typography>
            )}

            <Divider sx={{ my: 2, backgroundColor: 'rgba(128, 0, 0, 0.1)' }} />

            <FormControlLabel
              control={
                <Checkbox 
                  checked={accepted}
                  onChange={this.handleCheckboxChange}
                  sx={{
                    color: '#800000',
                    '&.Mui-checked': {
                      color: '#800000',
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: 24,
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ 
                  color: '#444',
                  fontWeight: 500,
                  fontSize: '0.95rem'
                }}>
                  I have read and agree to the privacy notice
                </Typography>
              }
              sx={{ mb: 1 }}
            />

            <AcceptButton
              variant="contained"
              disabled={!accepted}
              onClick={onAccept}
              fullWidth
            >
              Proceed to Survey
            </AcceptButton>
          </Container>
        </Box>
      </MuiContainer>
    );
  }
}

export default PrivacyDisclaimer; 