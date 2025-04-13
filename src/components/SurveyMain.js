import React, { Component } from 'react';
import PrivacyDisclaimer from './PrivacyDisclaimer';
import SecurityRedirect from './SecurityRedirect';
import CompanyAccess from './CompanyAccess';
import StudentAccess from './StudentAccess';
import AdviserAccess from './AdviserAccess';
import ThankYouPage from './ThankYouPage';

class SurveyMain extends Component {
  constructor(props) {
    super(props);
    this.state = {
      disclaimerAccepted: false,
      securityVerified: false,
      userRole: null,
      showThankYou: false,
      surveyType: null
    };
  }

  componentDidMount() {
    // Add browser history state handling
    window.addEventListener('popstate', this.handlePopState);
  }

  componentWillUnmount() {
    // Clean up event listeners
    window.removeEventListener('popstate', this.handlePopState);
  }

  handlePopState = (event) => {
    if (event.state === null) {
      this.setState({ userRole: null, securityVerified: false });
    }
  }

  handleDisclaimerAccept = () => {
    this.setState({ disclaimerAccepted: true });
  }

  handleRoleSelect = (role) => {
    this.setState({ 
      securityVerified: true,
      userRole: role
    });
  }

  handleBackToRoleSelection = () => {
    this.setState({
      securityVerified: true,
      userRole: null
    });
  }

  handleMakeAnother = () => {
    this.setState({ showThankYou: false, surveyType: null });
  }

  renderSurveyContent() {
    const { disclaimerAccepted, securityVerified, userRole } = this.state;

    if (!disclaimerAccepted) {
      return <PrivacyDisclaimer onAccept={this.handleDisclaimerAccept} />;
    }

    if (!securityVerified) {
      return <SecurityRedirect onRoleSelect={this.handleRoleSelect} />;
    }
    
    // Special handling for each role - redirect to appropriate access component
    if (userRole === 'company') {
      return <CompanyAccess onBack={this.handleBackToRoleSelection} />;
    }

    if (userRole === 'student') {
      return <StudentAccess onBack={this.handleBackToRoleSelection} />;
    }
    
    if (userRole === 'adviser') {
      return <AdviserAccess onBack={this.handleBackToRoleSelection} />;
    }

    // Fallback to SecurityRedirect if no role is selected
    return <SecurityRedirect onRoleSelect={this.handleRoleSelect} />;
  }

  render() {
    const { showThankYou, surveyType } = this.state;

    if (showThankYou) {
      return (
        <ThankYouPage 
          surveyType={surveyType} 
          onMakeAnother={this.handleMakeAnother}
          onReturn={this.handleBackToRoleSelection}
        />
      );
    }

    return this.renderSurveyContent();
  }
}

export default SurveyMain; 