// src/contexts/AuthContext.jsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useRouter } from 'next/router';
import pb from '../lib/pocketbase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  // ─── Sync con PocketBase ────────────────────────────────
  // NOTA: la limpieza de sesiones admin vive en _app.js (route interceptor).
  // Aquí solo reflejamos el estado actual de pb.authStore.
  useEffect(() => {
    const syncAuth = () => {
      const isValid = pb.authStore.isValid;
      setIsAuthenticated(isValid);
      setUser(isValid ? pb.authStore.model : null);
    };

    syncAuth();
    setLoading(false);

    const unsubscribe = pb.authStore.onChange(() => syncAuth());
    return () => unsubscribe();
  }, []);

  // ─── Acciones ───────────────────────────────────────────
  const openLogin = useCallback(() => setShowLogin(true), []);
  const closeLogin = useCallback(() => setShowLogin(false), []);

  const logout = useCallback(
    (redirectTo = '/') => {
      pb.authStore.clearAll();
      setUser(null);
      setIsAuthenticated(false);
      setShowLogin(false);
      if (redirectTo) router.push(redirectTo);
    },
    [router]
  );

  const refreshUser = useCallback(async () => {
    if (!pb.authStore.isValid) return;
    try {
      const result = await pb.collection('users').authRefresh();
      setUser(result.record);
    } catch (err) {
      console.error('Error refreshing user:', err);
      pb.authStore.clearAll();
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // ─── Value memoizado ────────────────────────────────────
  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      role: user?.role || null,
      loading,
      showLogin,
      openLogin,
      closeLogin,
      logout,
      refreshUser,
    }),
    [user, isAuthenticated, loading, showLogin, openLogin, closeLogin, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}