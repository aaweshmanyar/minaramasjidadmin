import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute =  ({ element, allowedRoles }) => {
   const { currentUser, userRole } = useAuth(); // Example usage of authentication context

  // Example logic to check if user is authenticated and has required role
  const isAuthenticated = currentUser !== null;
  const hasRequiredRole = allowedRoles.includes(userRole);

  return isAuthenticated && hasRequiredRole ? (
    element
  ) : (
    <Navigate to="/" replace />
  );

};

export default ProtectedRoute;

