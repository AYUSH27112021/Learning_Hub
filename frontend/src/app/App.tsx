import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

const LandingPage            = lazy(() => import("../features/landing/pages/LandingPage"));
const RegistrationPage       = lazy(() => import("../features/registration/pages/RegistrationPage"));
const WhyLearningHubPage     = lazy(() => import("../features/why-learning-hub/pages/WhyLearningHubPage"));
const AboutUsPage            = lazy(() => import("../features/about-us/pages/AboutUsPage"));
const AdminAuthProvider      = lazy(() => import("../features/admin/components/AdminAuthProvider"));
const RequireAdminAuth       = lazy(() => import("../features/admin/components/RequireAdminAuth"));
const AdminLayout            = lazy(() => import("../features/admin/components/AdminLayout"));
const AdminPage              = lazy(() => import("../features/admin/pages/AdminPage"));
const AdminDashboardPage     = lazy(() => import("../features/admin/pages/AdminDashboardPage"));
const ForgotPasswordPage     = lazy(() => import("../features/admin/pages/ForgotPasswordPage"));
const HomepageEditorPage     = lazy(() => import("../features/admin/pages/HomepageEditorPage"));
const RegistrationDetailPage = lazy(() => import("../features/admin/pages/RegistrationDetailPage"));

export default function App() {
  return (
    <div>
      <Suspense fallback={null}>
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
      </Suspense>
    </div>
  );
}
