import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface MoodEntry {
  id?: string;
  entry_date: string;
  mood_score: number;
  mood_label: string;
  notes?: string;
  energy_level?: number;
  sleep_quality?: number;
}

export function useMoodEntries() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching mood entries:', error);
      toast.error('Failed to load mood entries');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const saveEntry = useCallback(async (entry: MoodEntry) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('mood_entries')
        .upsert({
          user_id: user.id,
          entry_date: entry.entry_date,
          mood_score: entry.mood_score,
          mood_label: entry.mood_label,
          notes: entry.notes || null,
          energy_level: entry.energy_level || null,
          sleep_quality: entry.sleep_quality || null,
        }, { onConflict: 'user_id,entry_date' });

      if (error) throw error;
      fetchEntries();
      toast.success('Mood entry saved! 💜');
    } catch (error) {
      console.error('Error saving mood entry:', error);
      toast.error('Failed to save entry');
    }
  }, [user, fetchEntries]);

  const deleteEntry = useCallback(async (entryDate: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('mood_entries')
        .delete()
        .eq('user_id', user.id)
        .eq('entry_date', entryDate);

      if (error) throw error;
      fetchEntries();
      toast.success('Entry deleted');
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  }, [user, fetchEntries]);

  const getEntryByDate = useCallback((date: string) => {
    return entries.find(e => e.entry_date === date);
  }, [entries]);

  const getEntriesForDays = useCallback((days: number) => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - days + 1);
    return entries.filter(e => {
      const entryDate = new Date(e.entry_date);
      return entryDate >= startDate && entryDate <= today;
    }).sort((a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime());
  }, [entries]);

  return {
    entries,
    isLoading,
    saveEntry,
    deleteEntry,
    getEntryByDate,
    getEntriesForDays,
    refetch: fetchEntries,
  };
}
