import { AppBar, Toolbar, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import SurveyMain from './components/SurveyMain';
import wordlogo from './assets/wordlogo.png';
import bgImage from './assets/bg.jpg';

const StyledAppBar = styled(AppBar)({
  backgroundColor: '#800000', // Maroon
  zIndex: 1300, // Keep navbar on top
});

const LogoImg = styled('img')({
  height: '50px',
  marginRight: '20px',
});

const BackgroundContainer = styled(Box)({
  minHeight: '100vh',
  backgroundImage: `url(${bgImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed', // This makes the background fixed
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'fixed', // This makes the blur effect fixed
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(8px)',
  },
});

const ContentContainer = styled(Box)({
  position: 'relative',
  zIndex: 1,
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
});

const ScrollableContent = styled(Box)({
  flex: 1,
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(255, 255, 255, 0.1)',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#800000',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: '#600000',
  },
});

function App() {
  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      <StyledAppBar position="fixed">
        <Toolbar>
          <LogoImg src={wordlogo} alt="CIT Logo" />
        </Toolbar>
      </StyledAppBar>
      <BackgroundContainer>
        <ContentContainer>
          <Toolbar /> {/* Spacer for fixed AppBar */}
          <ScrollableContent>
            <SurveyMain />
          </ScrollableContent>
        </ContentContainer>
      </BackgroundContainer>
    </Box>
  );
}

export default App;
