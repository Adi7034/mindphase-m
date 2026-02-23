import { useState, useEffect, useCallback } from 'react';
import { localAuth, LocalUser } from '@/lib/localDb';

export function useAuth() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userGender, setUserGender] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (localAuth.isLoggedIn()) {
          const u = await localAuth.getUser();
          setUser(u);
          setUserGender(u?.gender ?? null);
        }
      } catch (e) {
        console.error('Error loading local user:', e);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const signUp = useCallback(async (pin: string, gender: string, displayName?: string) => {
    try {
      const u = await localAuth.signUp(pin, gender, displayName);
      setUser(u);
      setUserGender(u.gender);
      return { data: u, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  }, []);

  const signIn = useCallback(async (pin: string) => {
    try {
      const u = await localAuth.signIn(pin);
      setUser(u);
      setUserGender(u.gender);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  }, []);

  const signOut = useCallback(async () => {
    localAuth.signOut();
    setUser(null);
    setUserGender(null);
    return { error: null };
  }, []);

  const resetPin = useCallback(async (newPin: string) => {
    try {
      await localAuth.resetPin(newPin);
      return { error: null };
    } catch (error: any) {
      return { error: { message: error.message } };
    }
  }, []);

  return { user, session: user, isLoading, signUp, signIn, signOut, resetPin, userGender };
}
