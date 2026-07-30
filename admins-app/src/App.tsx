import React, { useState } from 'react';
import { useAuthStore } from './store/authStore';
import { useInactivityLogout } from './hooks/useInactivityLogout';
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
  const { user, loading, isAuthenticated, loginSuccess, logout } = useAuthStore();
  const [currentTab, setCurrentTab] = useState('dashboard');

  // Enforce 15-minute inactivity session auto-logout for staff privacy
  useInactivityLogout(logout, isAuthenticated, 15 * 60 * 1000);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex flex-col justify-center items-center gap-3">
        <ShieldAlert className="w-10 h-10 text-indigo-500 animate-pulse" />
        <span className="text-sm font-medium">Authenticating Staff Workspace...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={loginSuccess} />;
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard user={user} onNavigate={setCurrentTab} />;
      case 'verification':
        return (
          <ProtectedRoute allowedRoles={['verification_officer', 'admin']} userRole={user?.role}>
            <VerificationQueue />
          </ProtectedRoute>
        );
      case 'moderation':
        return (
          <ProtectedRoute allowedRoles={['moderator', 'admin']} userRole={user?.role}>
            <ModerationQueue />
          </ProtectedRoute>
        );
      case 'user-safety':
        return (
          <ProtectedRoute allowedRoles={['moderator', 'admin']} userRole={user?.role}>
            <UserSafetyDesk />
          </ProtectedRoute>
        );
      case 'users':
        return (
          <ProtectedRoute allowedRoles={['admin']} userRole={user?.role}>
            <UserManagement />
          </ProtectedRoute>
        );
      case 'resources':
        return (
          <ProtectedRoute allowedRoles={['admin']} userRole={user?.role}>
            <ResourceManagement />
          </ProtectedRoute>
        );
      case 'health-qa':
        return (
          <ProtectedRoute allowedRoles={['health_professional', 'admin']} userRole={user?.role}>
            <HealthQA />
          </ProtectedRoute>
        );
      case 'stories':
        return (
          <ProtectedRoute allowedRoles={['admin']} userRole={user?.role}>
            <SuccessStories />
          </ProtectedRoute>
        );
      case 'audit-logs':
        return (
          <ProtectedRoute allowedRoles={['admin']} userRole={user?.role}>
            <AuditLogs />
          </ProtectedRoute>
        );
      default:
        return <Dashboard user={user} onNavigate={setCurrentTab} />;
    }
  };

  return (
    <Layout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      user={user}
      onLogout={logout}
    >
      {renderTabContent()}
    </Layout>
  );
}

export default App;

