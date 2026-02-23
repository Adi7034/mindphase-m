import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userGender, setUserGender] = useState<string | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Fetch profile for gender
        const { data } = await supabase
          .from('profiles')
          .select('gender')
          .eq('user_id', session.user.id)
          .maybeSingle();
        setUserGender(data?.gender ?? null);
      } else {
        setUserGender(null);
      }
      setIsLoading(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('gender')
          .eq('user_id', session.user.id)
          .maybeSingle();
        setUserGender(data?.gender ?? null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string, gender: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { data: null, error: { message: error.message } };

      // Create profile
      if (data.user) {
        await supabase.from('profiles').insert({
          user_id: data.user.id,
          gender,
        });
      }

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: { message: error.message } };
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserGender(null);
    return { error: null };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) return { error: { message: error.message } };
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { error: { message: error.message } };
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  }, []);

  return { user, session: user, isLoading, signUp, signIn, signOut, resetPassword, updatePassword, userGender };
}
