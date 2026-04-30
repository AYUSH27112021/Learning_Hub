import { Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "../features/landing/pages/LandingPage";
import AdminPage from "../features/admin/pages/AdminPage";
import AdminDashboardPage from "../features/admin/pages/AdminDashboardPage";
import AdminLayout from "../features/admin/components/AdminLayout";
import ForgotPasswordPage from "../features/admin/pages/ForgotPasswordPage";
import WhyLearningHubPage from "../features/why-learning-hub/pages/WhyLearningHubPage";
import AboutUsPage from "../features/about-us/pages/AboutUsPage";
import RegistrationPage from "../features/registration/pages/RegistrationPage";
import AdminAuthProvider from "../features/admin/components/AdminAuthProvider";
import RequireAdminAuth from "../features/admin/components/RequireAdminAuth";
import HomepageEditorPage from "../features/admin/pages/HomepageEditorPage";
import RegistrationDetailPage from "../features/admin/pages/RegistrationDetailPage";

export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/why-learning-hub" element={<WhyLearningHubPage />} />
        <Route path="/about-us" element={<AboutUsPage />} />

        {/* ── All /admin/* routes share the Cognito provider ── */}
        <Route
          path="/admin/*"
          element={
            <AdminAuthProvider>
              <Routes>
                {/* Public admin routes (no auth needed) */}
                <Route path="forgot-password" element={<ForgotPasswordPage />} />

                {/* Protected admin routes */}
                <Route
                  path="*"
                  element={
                    <RequireAdminAuth>
                      <Routes>
                        <Route element={<AdminLayout />}>
                          <Route index element={<AdminDashboardPage />} />
                          <Route path="registration/:id" element={<RegistrationDetailPage />} />
                          <Route path="panel" element={<AdminPage />} />
                          <Route path="editor" element={<HomepageEditorPage />} />
                          <Route path="*" element={<Navigate to="/admin" replace />} />
                        </Route>
                      </Routes>
                    </RequireAdminAuth>
                  }
                />
              </Routes>
            </AdminAuthProvider>
          }
        />
      </Routes>
    </div>
  );
}
