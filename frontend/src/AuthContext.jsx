import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getCurrentUser, logoutUser } from './authStore';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser());

  useEffect(() => {
    function handleAuthUpdate(e) {
      setUser(e.detail?.user !== undefined ? e.detail.user : getCurrentUser());
    }
    function handleStorage(e) {
      if (e.key === 'libraai_auth_user' || !e.key) {
        setUser(getCurrentUser());
      }
    }
    window.addEventListener('libraai_auth_update', handleAuthUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('libraai_auth_update', handleAuthUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, logout: logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    const user = getCurrentUser();
    return { user, isAuthenticated: !!user, logout: logoutUser };
  }
  return context;
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}

export function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    const rawFrom = location.state?.from;
    const dest =
      rawFrom?.pathname &&
      rawFrom.pathname !== '/' &&
      rawFrom.pathname !== '/login' &&
      rawFrom.pathname !== '/signup'
        ? rawFrom.pathname + (rawFrom.search || '')
        : '/home';
    return <Navigate to={dest} replace />;
  }

  return children ? children : <Outlet />;
}
