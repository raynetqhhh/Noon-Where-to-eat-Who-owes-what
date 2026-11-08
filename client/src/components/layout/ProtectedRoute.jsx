import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import { PageLoader } from '../ui/Feedback.jsx';

/** Sends signed-out visitors to /signin, then back here after signing in. */
export default function ProtectedRoute({ children }) {
  const { ready, user } = useAuth();
  const location = useLocation();

  if (!ready) return <PageLoader />;
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/signin?next=${next}`} replace />;
  }
  return children;
}
