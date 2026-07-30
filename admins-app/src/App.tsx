import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { VerificationQueue } from './pages/VerificationQueue';
import { ModerationQueue } from './pages/ModerationQueue';
import { UserManagement } from './pages/UserManagement';
import { ResourceManagement } from './pages/ResourceManagement';
import { HealthQA } from './pages/HealthQA';
import { SuccessStories } from './pages/SuccessStories';
import { AuditLogs } from './pages/AuditLogs';
import { UserSafetyDesk } from './pages/UserSafetyDesk';
import { ShieldAlert } from 'lucide-react';

export function App() {
  const { user, loading, isAuthenticated, loginSuccess } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex flex-col justify-center items-center gap-3">
        <ShieldAlert className="w-10 h-10 text-indigo-500 animate-pulse" />
        <span className="text-sm font-medium">Authenticating Staff Workspace...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={loginSuccess} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        <Route
          path="/verification"
          element={
            <ProtectedRoute allowedRoles={['verification_officer', 'admin']} userRole={user?.role}>
              <VerificationQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/moderation"
          element={
            <ProtectedRoute allowedRoles={['moderator', 'admin']} userRole={user?.role}>
              <ModerationQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-safety"
          element={
            <ProtectedRoute allowedRoles={['moderator', 'admin']} userRole={user?.role}>
              <UserSafetyDesk />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['admin']} userRole={user?.role}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resources"
          element={
            <ProtectedRoute allowedRoles={['admin']} userRole={user?.role}>
              <ResourceManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/health-qa"
          element={
            <ProtectedRoute allowedRoles={['health_professional', 'admin']} userRole={user?.role}>
              <HealthQA />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stories"
          element={
            <ProtectedRoute allowedRoles={['admin']} userRole={user?.role}>
              <SuccessStories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['admin']} userRole={user?.role}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
