import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/hooks/useAuth.tsx';
import { PreferencesProvider } from '@/hooks/usePreferences';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { WelcomePage } from '@/pages/WelcomePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { MyVideosPage, NotesPage, ProfilePage, QuizzesPage, SettingsPage } from '@/pages/LearningPages';
import { VideoDetailPage } from '@/pages/VideoDetailPage';
import { VideoResultPage } from '@/pages/VideoResultPage';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GlobalProcessingNotifier } from '@/components/processing/GlobalProcessingNotifier';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <PreferencesProvider>
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
                  path="/videos"
                  element={
                    <ProtectedRoute>
                      <MyVideosPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notes"
                  element={
                    <ProtectedRoute>
                      <NotesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/quizzes"
                  element={
                    <ProtectedRoute>
                      <QuizzesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
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
                <Route
                  path="/videos/:videoId/result"
                  element={
                    <ProtectedRoute>
                      <VideoResultPage />
                    </ProtectedRoute>
                  }
                />

                {/* Default Redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
              <GlobalProcessingNotifier />
            </BrowserRouter>
            <Toaster position="top-right" />
          </PreferencesProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
