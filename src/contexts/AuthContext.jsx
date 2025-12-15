import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../config/supabase";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });
      }

      return { data, error };
    } catch (err) {
      console.error("Sign in exception:", err);
      return {
        data: null,
        error: {
          message: err.message || "Network request failed",
          name: err.name || "AuthError",
        },
      };
    }
  };

  const signUp = async (email, password) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // 1. Create the user in Supabase
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (error) {
        console.error("Sign up error:", {
          message: error.message,
          status: error.status,
          name: error.name,
        });
        return { data, error };
      }

      return { data, error };
    } catch (err) {
      console.error("Sign up exception:", err);
      return {
        data: null,
        error: {
          message: err.message || "Network request failed",
          name: err.name || "AuthError",
        },
      };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "sportstraderapp://reset-password",
    });
    return { data, error };
  };

  const value = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
