import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RecruitmentModule from './RecruitmentModule';
import RequisitionsList from './requisitions/RequisitionsList';
import RequisitionForm from './requisitions/RequisitionForm';
import CandidatesList from './candidates/CandidatesList';
import CandidateForm from './candidates/CandidateForm';
import InterviewsList from './interviews/InterviewsList';
import InterviewForm from './interviews/InterviewForm';
import OffersList from './offers/OffersList';
import OfferForm from './offers/OfferForm';
import OnboardingList from './onboarding/OnboardingList';
import OnboardingForm from './onboarding/OnboardingForm';

const RecruitmentRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<RecruitmentModule />}>
        {/* Requisitions Routes */}
        <Route path="requisitions" element={<RequisitionsList />} />
        <Route path="requisitions/new" element={<RequisitionForm />} />
        <Route path="requisitions/:id/edit" element={<RequisitionForm />} />

        {/* Candidates Routes */}
        <Route path="candidates" element={<CandidatesList />} />
        <Route path="candidates/new" element={<CandidateForm />} />
        <Route path="candidates/:id/edit" element={<CandidateForm />} />

        {/* Interviews Routes */}
        <Route path="interviews" element={<InterviewsList />} />
        <Route path="interviews/new" element={<InterviewForm />} />
        <Route path="interviews/:id/edit" element={<InterviewForm />} />

        {/* Offers Routes */}
        <Route path="offers" element={<OffersList />} />
        <Route path="offers/new" element={<OfferForm />} />
        <Route path="offers/:id/edit" element={<OfferForm />} />

        {/* Onboarding Routes */}
        <Route path="onboarding" element={<OnboardingList />} />
        <Route path="onboarding/new" element={<OnboardingForm />} />
        <Route path="onboarding/:id/edit" element={<OnboardingForm />} />
      </Route>
    </Routes>
  );
};

export default RecruitmentRoutes; 