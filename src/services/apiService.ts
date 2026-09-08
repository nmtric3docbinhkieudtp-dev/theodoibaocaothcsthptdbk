import { ReportSubmission, ReportPeriod } from '../types';

export const ApiService = {
  async fetchSubmissions(): Promise<ReportSubmission[] | null> {
    try {
      const res = await fetch('/api/submissions');
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('[ApiService] Failed to fetch submissions from server API:', e);
      return null;
    }
  },

  async saveSubmission(submission: ReportSubmission): Promise<ReportSubmission | null> {
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.submission || submission;
    } catch (e) {
      console.warn('[ApiService] Failed to save submission to server API:', e);
      return null;
    }
  },

  async batchSyncSubmissions(localSubs: ReportSubmission[]): Promise<ReportSubmission[] | null> {
    try {
      const res = await fetch('/api/submissions/batch-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissions: localSubs })
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.submissions || null;
    } catch (e) {
      console.warn('[ApiService] Failed to batch-sync with server API:', e);
      return null;
    }
  },

  async deleteSubmission(id: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/submissions/${id}`, { method: 'DELETE' });
      return res.ok;
    } catch (e) {
      console.warn('[ApiService] Failed to delete submission via server API:', e);
      return false;
    }
  },

  async batchDeleteSubmissions(ids: string[]): Promise<boolean> {
    try {
      const res = await fetch('/api/submissions/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      return res.ok;
    } catch (e) {
      console.warn('[ApiService] Failed to batch delete submissions:', e);
      return false;
    }
  },

  async deduplicateSubmissions(): Promise<{ removedCount: number; submissions: ReportSubmission[] } | null> {
    try {
      const res = await fetch('/api/submissions/deduplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('[ApiService] Failed to deduplicate submissions:', e);
      return null;
    }
  },

  async fetchPeriods(): Promise<ReportPeriod[] | null> {
    try {
      const res = await fetch('/api/periods');
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      console.warn('[ApiService] Failed to fetch periods from server API:', e);
      return null;
    }
  },

  async savePeriod(period: ReportPeriod): Promise<ReportPeriod | null> {
    try {
      const res = await fetch('/api/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(period)
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.period || period;
    } catch (e) {
      console.warn('[ApiService] Failed to save period via server API:', e);
      return null;
    }
  }
};
