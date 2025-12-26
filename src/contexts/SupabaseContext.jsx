import React, { createContext, useContext, useMemo, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SupabaseContext = createContext(null);

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === null) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
};

// Hook to get the current Supabase user
// Pass the Privy user ID as parameter to avoid circular dependencies
export const useSupabaseUser = (privyUserId) => {
  const { supabase, isInitialized } = useSupabase();
  const [supabaseUser, setSupabaseUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (!privyUserId || !isInitialized || !supabase) {
        setSupabaseUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (typeof supabase.from !== "function") {
          setSupabaseUser(null);
          setLoading(false);
          return;
        }

        const { data, error: queryError } = await supabase
          .from("users")
          .select("*")
          .eq("id", privyUserId)
          .single();

        if (queryError) {
          if (
            queryError.code === "PGRST116" ||
            queryError.message?.includes("No rows")
          ) {
            // User not found - not an error
            setSupabaseUser(null);
            setError(null);
          } else if (queryError.message?.includes("not configured")) {
            setSupabaseUser(null);
            setError(null);
          } else {
            setError(queryError.message);
            setSupabaseUser(null);
          }
        } else {
          setSupabaseUser(data);
          setError(null);
        }
      } catch (err) {
        if (err?.message?.includes("not configured")) {
          setSupabaseUser(null);
          setError(null);
        } else {
          setError(err?.message || "Failed to fetch user");
          setSupabaseUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [privyUserId, isInitialized, supabase]);

  return { supabaseUser, loading, error };
};

// Helper function to create a mock query builder
const createMockQueryBuilder = () => ({
  select: () => createMockQueryBuilder(),
  eq: () => createMockQueryBuilder(),
  single: async () => ({
    data: null,
    error: { message: "Supabase not configured" },
  }),
});

export const SupabaseProvider = ({ children }) => {
  const [supabase, setSupabase] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeSupabase = () => {
      // Get Supabase credentials from environment variables
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

      if (!supabaseUrl || !supabaseAnonKey) {
        // Create a mock client when Supabase is not configured
        const mockClient = {
          auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            signIn: async () => ({
              data: null,
              error: new Error("Supabase not configured"),
            }),
            signOut: async () => ({ error: null }),
          },
          from: () => createMockQueryBuilder(),
        };
        setSupabase(mockClient);
        setIsInitialized(true);
        return;
      }

      try {
        const client = createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
        });
        setSupabase(client);
        setError(null);
      } catch (err) {
        setError(err?.message || "Failed to initialize Supabase");
        // Create a mock client that won't crash but will return errors
        const mockClient = {
          auth: {
            getSession: async () => ({
              data: { session: null },
              error: new Error("Supabase not configured"),
            }),
            signIn: async () => ({
              data: null,
              error: new Error("Supabase not configured"),
            }),
            signOut: async () => ({ error: new Error("Supabase not configured") }),
          },
          from: () => createMockQueryBuilder(),
        };
        setSupabase(mockClient);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeSupabase();
  }, []);

  const value = useMemo(
    () => ({
      supabase,
      isInitialized,
      error,
      isConfigured: !!(
        process.env.EXPO_PUBLIC_SUPABASE_URL &&
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
      ),
    }),
    [supabase, isInitialized, error]
  );

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};

