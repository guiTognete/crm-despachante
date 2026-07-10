import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return error;
  }

  async function signUp(email, password) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    return error;
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    return error;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}