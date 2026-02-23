import { useState, useEffect, useCallback } from 'react';
import { localDb } from '@/lib/localDb';
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

  const fetchEntries = useCallback(() => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = localDb.select('mood_entries', { user_id: user.id } as any)
        .sort((a: any, b: any) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());
      setEntries(data as any);
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

  const saveEntry = useCallback((entry: MoodEntry) => {
    if (!user) return;
    try {
      localDb.upsert('mood_entries', {
        user_id: user.id,
        entry_date: entry.entry_date,
        mood_score: entry.mood_score,
        mood_label: entry.mood_label,
        notes: entry.notes || null,
        energy_level: entry.energy_level || null,
        sleep_quality: entry.sleep_quality || null,
      }, ['user_id', 'entry_date']);
      fetchEntries();
      toast.success('Mood entry saved! 💜');
    } catch (error) {
      console.error('Error saving mood entry:', error);
      toast.error('Failed to save entry');
    }
  }, [user, fetchEntries]);

  const deleteEntry = useCallback((entryDate: string) => {
    if (!user) return;
    try {
      const all = localDb.select('mood_entries', { user_id: user.id } as any);
      const toKeep = all.filter((e: any) => e.entry_date !== entryDate);
      // Rewrite table with filtered data
      localStorage.setItem('mindphase_mood_entries', JSON.stringify(toKeep));
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
