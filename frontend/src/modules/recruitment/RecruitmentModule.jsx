import React from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import RequisitionsList from './requisitions/RequisitionsList';
import CandidatesList from './candidates/CandidatesList';
import InterviewsList from './interviews/InterviewsList';
import OffersList from './offers/OffersList';
import OnboardingList from './onboarding/OnboardingList';

const RecruitmentModule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [value, setValue] = React.useState(0);

  // Update tab value based on current route
  React.useEffect(() => {
    const path = location.pathname;
    if (path.includes('requisitions')) setValue(0);
    else if (path.includes('candidates')) setValue(1);
    else if (path.includes('interviews')) setValue(2);
    else if (path.includes('offers')) setValue(3);
    else if (path.includes('onboarding')) setValue(4);
  }, [location.pathname]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    const paths = ['requisitions', 'candidates', 'interviews', 'offers', 'onboarding'];
    navigate(`/recruitment/${paths[newValue]}`);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Job Requisitions" />
          <Tab label="Candidates" />
          <Tab label="Interviews" />
          <Tab label="Offers" />
          <Tab label="Onboarding" />
        </Tabs>
      </Paper>

      <Box sx={{ p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default RecruitmentModule; 