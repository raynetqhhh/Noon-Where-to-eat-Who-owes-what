import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getMe } from '../api/me.js';
import { isSupabaseConfigured, supabase } from '../lib/supabase.js';

const AuthContext = createContext(null);

const throwIfError = ({ data, error }) => {
  if (error) throw error;
  return data;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error('Sign-in is not set up yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to client/.env.');
  }
  return supabase;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(!supabase);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id ?? null;

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      setProfile(null);
      return;
    }
    try {
      setProfile(await getMe());
    } catch {
      setProfile(null);
    }
  }, [userId]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const value = useMemo(
    () => ({
      ready,
      isConfigured: isSupabaseConfigured,
      user: session?.user ?? null,
      profile,
      setProfile,
      refreshProfile,
      signIn: (email, password) => requireSupabase().auth.signInWithPassword({ email, password }).then(throwIfError),
      /** Returns { session } (null when email confirmation is on). */
      signUp: (email, password, displayName) =>
        requireSupabase()
          .auth.signUp({
            email,
            password,
            options: { data: { display_name: displayName }, emailRedirectTo: `${window.location.origin}/app` },
          })
          .then(throwIfError),
      sendPasswordReset: (email) =>
        requireSupabase()
          .auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/app/settings` })
          .then(throwIfError),
      changePassword: (password) => requireSupabase().auth.updateUser({ password }).then(throwIfError),
      signOut: () => supabase?.auth.signOut(),
    }),
    [ready, session, profile, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
