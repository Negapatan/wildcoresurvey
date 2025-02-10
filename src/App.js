import { AppBar, Toolbar, Box, Typography, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import SurveyMain from './components/SurveyMain';
import wordlogo from './assets/wordlogo.png';
import bgImage from './assets/bg.jpg';
import MenuIcon from '@mui/icons-material/Menu';
import SchoolIcon from '@mui/icons-material/School';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'rgba(128, 0, 0, 0.95)',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 2px 12px rgba(0, 0, 0, 0.15)',
  borderBottom: '1px solid rgba(255, 215, 0, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'rgba(128, 0, 0, 0.98)',
  },
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

const LogoImg = styled('img')(({ theme }) => ({
  height: '45px',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  },
  [theme.breakpoints.down('sm')]: {
    height: '40px',
  },
}));

const BackgroundContainer = styled(Box)({
  minHeight: '100vh',
  backgroundImage: `url(${bgImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5))',
    backdropFilter: 'blur(10px)',
  },
});

const ContentContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.down('sm')]: {
    paddingTop: theme.spacing(1),
  },
}));

const ScrollableContent = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  scrollBehavior: 'smooth',
  '&::-webkit-scrollbar': {
    width: '10px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '5px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'linear-gradient(45deg, #800000, #600000)',
    borderRadius: '5px',
    border: '2px solid transparent',
    backgroundClip: 'padding-box',
    '&:hover': {
      background: 'linear-gradient(45deg, #600000, #400000)',
    },
  },
  [theme.breakpoints.down('sm')]: {
    '&::-webkit-scrollbar': {
      width: '6px',
    },
  },
}));

const NavText = styled(Typography)(({ theme }) => ({
  color: '#FFD700',
  fontWeight: 500,
  marginLeft: theme.spacing(1),
  opacity: 0.9,
  transition: 'opacity 0.3s ease',
  '&:hover': {
    opacity: 1,
  },
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.9rem',
  },
}));

function App() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden' }}>
      <StyledAppBar position="fixed">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <LogoContainer>
            <LogoImg src={wordlogo} alt="CIT Logo" />
            {!isMobile && (
              <NavText variant="h6">
                On-the-Job Training Survey System
              </NavText>
            )}
          </LogoContainer>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SchoolIcon sx={{ 
              color: '#FFD700',
              opacity: 0.9,
              '&:hover': { opacity: 1 },
              transition: 'opacity 0.3s ease',
            }} />
            {isMobile && (
              <IconButton 
                color="inherit" 
                edge="end"
                sx={{ 
                  color: '#FFD700',
                  '&:hover': { 
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>
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
