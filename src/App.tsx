import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';

// Pages
import LoginPage from './pages/LoginPage';
import ProjectIdentificationUpload from './pages/ProjectIdentificationUpload';
import MasterDataJobHistory from './pages/MasterDataJobHistory';
import JobDetail from './pages/JobDetail';
import ValidationRejectedDashboard from './pages/ValidationRejectedDashboard';
import EnterpriseMasterDataEditor from './pages/EnterpriseMasterDataEditor';
import MonthlyCommissionSummary from './pages/MonthlyCommissionSummary';
import AdminUserMapping from './pages/AdminUserMapping';

// Layout
import MainLayout from './components/MainLayout';

// Protected Route Component
function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !user.roles.includes(requiredRole)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-600">Access Denied: Requires {requiredRole} role</div>
      </div>
    );
  }

  return <>{children}</>;
}

function App() {
  const { isAuthenticated, isLoading, initializeFromCookie } = useAuthStore();

  // Initialize auth from cookie on app mount
  useEffect(() => {
    initializeFromCookie();
  }, []);

  // Don't render anything until auth is initialized
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/upload" replace /> : <LoginPage />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/upload" replace />} />
        <Route path="upload" element={<ProjectIdentificationUpload />} />
        <Route path="job-history" element={<MasterDataJobHistory />} />
        <Route path="job-detail/:jobId" element={<JobDetail />} />
        <Route path="validation-errors/:jobId" element={<ValidationRejectedDashboard />} />
        <Route path="master-data-editor" element={<EnterpriseMasterDataEditor />} />
        <Route path="commission-summary" element={<MonthlyCommissionSummary />} />
        <Route
          path="admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminUserMapping />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
