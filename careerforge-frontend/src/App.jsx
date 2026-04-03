import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import Layout from './components/layout/Layout'

import { LoginPage, RegisterPage } from './pages/auth/AuthPages'
import Dashboard from './pages/dashboard/Dashboard'
import { ResumesPage, ResumeFormPage } from './pages/resume/ResumePage'
import ATSPage from './pages/ats/ATSPage'
import { InterviewSetupPage, InterviewActivePage, InterviewHistoryPage } from './pages/interview/InterviewPages'
import { JobMatchPage } from './pages/jobmatch/JobMatchPage'
import CoverLetterPage from './pages/coverletter/CoverLetterPage'
import { ProgressPage, SubscriptionPage } from './pages/progress/ProgressAndSubscription'
import ProfilePage from './pages/profile/ProfilePage'

function PrivateRoute({ children }) {
  const { token } = useAuthStore()
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { token } = useAuthStore()
  return !token ? children : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { fontFamily:'var(--font-sans)', fontSize:13, borderRadius:10, background:'#fff', border:'1px solid var(--cream-200)', boxShadow:'var(--shadow)', color:'var(--ink)' },
          success: { iconTheme: { primary:'var(--green)', secondary:'#fff' } },
          error: { iconTheme: { primary:'var(--red)', secondary:'#fff' } },
        }}
      />
      <Routes>
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/"         element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard"         element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/resumes"           element={<PrivateRoute><ResumesPage /></PrivateRoute>} />
        <Route path="/resumes/new"       element={<PrivateRoute><ResumeFormPage /></PrivateRoute>} />
        <Route path="/resumes/:id"       element={<PrivateRoute><ResumeFormPage /></PrivateRoute>} />
        <Route path="/ats"               element={<PrivateRoute><ATSPage /></PrivateRoute>} />
        <Route path="/interview"         element={<Navigate to="/interview/setup" replace />} />
        <Route path="/interview/setup"   element={<PrivateRoute><InterviewSetupPage /></PrivateRoute>} />
        <Route path="/interview/history" element={<PrivateRoute><InterviewHistoryPage /></PrivateRoute>} />
        <Route path="/interview/:id"     element={<PrivateRoute><InterviewActivePage /></PrivateRoute>} />
        <Route path="/jobmatch"          element={<PrivateRoute><JobMatchPage /></PrivateRoute>} />
        <Route path="/coverletter"       element={<PrivateRoute><CoverLetterPage /></PrivateRoute>} />
        <Route path="/progress"          element={<PrivateRoute><ProgressPage /></PrivateRoute>} />
        <Route path="/subscription"      element={<PrivateRoute><SubscriptionPage /></PrivateRoute>} />
        <Route path="/profile"           element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="*"                  element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
