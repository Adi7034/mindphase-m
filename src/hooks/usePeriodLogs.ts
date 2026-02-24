import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface PeriodLog {
  id: string;
  log_date: string;
  flow_intensity: 'light' | 'medium' | 'heavy' | 'spotting' | null;
  symptoms: string[];
  moods: string[];
  notes: string | null;
  user_id?: string;
}

export function usePeriodLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<PeriodLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('period_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('log_date', { ascending: false });

      if (error) throw error;
      setLogs((data || []) as PeriodLog[]);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load period logs');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchLogs();
  }, [fetchLogs, user]);

  const saveLog = useCallback(async (log: Omit<PeriodLog, 'id'>) => {
    if (!user) {
      toast.error('Please sign in first');
      return null;
    }
    try {
      const { data, error } = await supabase
        .from('period_logs')
        .upsert({
          log_date: log.log_date,
          flow_intensity: log.flow_intensity,
          symptoms: log.symptoms || [],
          moods: log.moods || [],
          notes: log.notes,
          user_id: user.id,
        }, { onConflict: 'log_date,user_id' })
        .select()
        .single();

      if (error) throw error;
      fetchLogs();
      toast.success('Log saved! 💜');
      return data;
    } catch (error) {
      console.error('Error saving log:', error);
      toast.error('Failed to save log');
      return null;
    }
  }, [user, fetchLogs]);

  const deleteLog = useCallback(async (date: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('period_logs')
        .delete()
        .eq('user_id', user.id)
        .eq('log_date', date);

      if (error) throw error;
      setLogs(prev => prev.filter(l => l.log_date !== date));
      toast.success('Log deleted');
    } catch (error) {
      console.error('Error deleting log:', error);
      toast.error('Failed to delete log');
    }
  }, [user]);

  const getLogByDate = useCallback((date: string) => {
    return logs.find(l => l.log_date === date);
  }, [logs]);

  return { logs, isLoading, saveLog, deleteLog, getLogByDate, refetch: fetchLogs };
}
