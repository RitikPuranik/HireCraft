import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';

import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import ResumeList from './pages/resume/ResumeList';
import ResumeUpload from './pages/resume/ResumeUpload';
import ResumeAnalysis from './pages/resume/ResumeAnalysis';
import ResumeBuilder from './pages/resume/ResumeBuilder';
import ResumeTemplates from './pages/resume/ResumeTemplates';
import InterviewList from './pages/interview/InterviewList';
import InterviewSession from './pages/interview/InterviewSession';
import InterviewReport from './pages/interview/InterviewReport';
import AtsChecker from './pages/ats/AtsChecker';
import JobMatch from './pages/jobmatch/JobMatch';
import CoverLetter from './pages/coverletter/CoverLetter';
import Progress from './pages/progress/Progress';
import Pricing from './pages/pricing/Pricing';
import Profile from './pages/profile/Profile';
import LandingPage from './pages/LandingPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 * 5 } },
});

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/dashboard"              element={<Dashboard />} />
            <Route path="/resumes"                element={<ResumeList />} />
            <Route path="/resumes/upload"         element={<ResumeUpload />} />
            <Route path="/resumes/templates"       element={<ResumeTemplates />} />
            <Route path="/resumes/build"           element={<ResumeBuilder />} />
            <Route path="/resumes/builder"         element={<ResumeBuilder />} />
            <Route path="/resumes/:id"            element={<ResumeAnalysis />} />
            <Route path="/interview"              element={<InterviewList />} />
            <Route path="/interview/session/:id"  element={<InterviewSession />} />
            <Route path="/interview/report/:id"   element={<InterviewReport />} />
            <Route path="/ats"                    element={<AtsChecker />} />
            <Route path="/jobmatch"               element={<JobMatch />} />
            <Route path="/coverletter"            element={<CoverLetter />} />
            <Route path="/progress"               element={<Progress />} />
            <Route path="/pricing"                element={<Pricing />} />
            <Route path="/profile"                element={<Profile />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#fff',
            color: '#1c2120',
            border: '1px solid #ede1c8',
            borderRadius: '12px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          },
          success: { iconTheme: { primary: '#4a7d55', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#e05252', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  );
}