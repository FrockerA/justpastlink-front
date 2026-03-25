import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth.tsx';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { WelcomePage } from '@/pages/WelcomePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { VideoDetailPage } from '@/pages/VideoDetailPage';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Routes */}
          <Route
            path="/welcome"
            element={
              <ProtectedRoute>
                <WelcomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/videos/:videoId"
            element={
              <ProtectedRoute>
                <VideoDetailPage />
              </ProtectedRoute>
            }
          />
          
          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/welcome" replace />} />
          <Route path="*" element={<Navigate to="/welcome" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </AuthProvider>
  );
}

export default App;
