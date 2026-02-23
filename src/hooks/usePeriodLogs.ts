import { useState, useEffect, useCallback } from 'react';
import { localDb } from '@/lib/localDb';
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

  const fetchLogs = useCallback(() => {
    if (!user) return;
    try {
      const data = localDb.select('period_logs', { user_id: user.id } as any)
        .sort((a: any, b: any) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());
      setLogs(data as PeriodLog[]);
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

  const saveLog = useCallback((log: Omit<PeriodLog, 'id'>) => {
    if (!user) {
      toast.error('Please sign in first');
      return null;
    }
    try {
      const saved = localDb.upsert('period_logs', {
        log_date: log.log_date,
        flow_intensity: log.flow_intensity,
        symptoms: log.symptoms || [],
        moods: log.moods || [],
        notes: log.notes,
        user_id: user.id,
      }, ['log_date', 'user_id']);

      setLogs(prev => {
        const filtered = prev.filter(l => l.log_date !== log.log_date);
        return [saved as PeriodLog, ...filtered].sort((a, b) =>
          new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
        );
      });
      toast.success('Log saved! 💜');
      return saved;
    } catch (error) {
      console.error('Error saving log:', error);
      toast.error('Failed to save log');
      return null;
    }
  }, [user]);

  const deleteLog = useCallback((date: string) => {
    try {
      // Filter out the log with matching date and user
      const all = localDb.select('period_logs', { user_id: user?.id } as any);
      const remaining = all.filter((l: any) => l.log_date !== date);
      localStorage.setItem('mindphase_period_logs', JSON.stringify(remaining));
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
