import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import PortalLayout from './components/layout/PortalLayout.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import PublicLayout from './components/layout/PublicLayout.jsx';
import RoomLayout from './components/layout/RoomLayout.jsx';
import { PageLoader } from './components/ui/Feedback.jsx';
import LandingPage from './pages/public/LandingPage.jsx';
import NotFoundPage from './pages/public/NotFoundPage.jsx';

// Public auth pages are small; the portal and lunch room are split into
// separate chunks so the landing page loads fast.
const SignInPage = lazy(() => import('./pages/public/SignInPage.jsx'));
const SignUpPage = lazy(() => import('./pages/public/SignUpPage.jsx'));
const JoinPage = lazy(() => import('./pages/public/JoinPage.jsx'));
const SessionPage = lazy(() => import('./pages/session/SessionPage.jsx'));
const BillPage = lazy(() => import('./pages/session/BillPage.jsx'));
const DashboardPage = lazy(() => import('./pages/portal/DashboardPage.jsx'));
const NewLunchPage = lazy(() => import('./pages/portal/NewLunchPage.jsx'));
const LunchesPage = lazy(() => import('./pages/portal/LunchesPage.jsx'));
const PaymentsPage = lazy(() => import('./pages/portal/PaymentsPage.jsx'));
const CrewsPage = lazy(() => import('./pages/portal/CrewsPage.jsx'));
const CrewDetailPage = lazy(() => import('./pages/portal/CrewDetailPage.jsx'));
const InsightsPage = lazy(() => import('./pages/portal/InsightsPage.jsx'));
const SettingsPage = lazy(() => import('./pages/portal/SettingsPage.jsx'));
const ProfilePage = lazy(() => import('./pages/portal/ProfilePage.jsx'));

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="signin" element={<SignInPage />} />
            <Route path="signup" element={<SignUpPage />} />
            <Route path="join" element={<JoinPage />} />
          </Route>

          <Route path="s/:code" element={<RoomLayout />}>
            <Route index element={<SessionPage />} />
            <Route path="bill" element={<BillPage />} />
          </Route>

          <Route
            path="app"
            element={
              <ProtectedRoute>
                <PortalLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="new" element={<NewLunchPage />} />
            <Route path="lunches" element={<LunchesPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="crews" element={<CrewsPage />} />
            <Route path="crews/:crewId" element={<CrewDetailPage />} />
            <Route path="insights" element={<InsightsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route element={<PublicLayout />}>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
