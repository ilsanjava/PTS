import { ExamSubmission, RosterItem } from '../types';
import { INITIAL_ROSTER } from '../data/initialRoster';

export const STORAGE_REKAP = 'rekap_ujian_qos_tkj_hots';
export const STORAGE_ROSTER = 'roster_siswa_tkj';
export const STORAGE_DRAFT = 'draft_jawaban_hots';
export const STORAGE_STUDENT_ID = 'student_active_identity';

export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxBvtg_OyH09MlWyoOaR3w45VaAe117EwQZzM-wO-2xQWQ3H2BIiu1MpaX0nT4ugkSU/exec';
export const GURU_USER = 'guru';
export const GURU_PASS = '147258369';

export function getStoredRoster(): RosterItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_ROSTER);
    if (!raw) {
      // Seed with initial roster
      localStorage.setItem(STORAGE_ROSTER, JSON.stringify(INITIAL_ROSTER));
      return INITIAL_ROSTER;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_ROSTER;
  } catch (e) {
    console.error('Error reading roster:', e);
    return INITIAL_ROSTER;
  }
}

export function saveRoster(roster: RosterItem[]): void {
  try {
    localStorage.setItem(STORAGE_ROSTER, JSON.stringify(roster));
  } catch (e) {
    console.error('Failed to save roster', e);
  }
}

export function getStoredSubmissions(): ExamSubmission[] {
  try {
    const raw = localStorage.getItem(STORAGE_REKAP);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading submissions:', e);
    return [];
  }
}

export function saveSubmission(submission: ExamSubmission): void {
  try {
    const list = getStoredSubmissions();
    list.unshift(submission); // Newest first
    localStorage.setItem(STORAGE_REKAP, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save submission', e);
  }
}

export function clearAllSubmissions(): void {
  localStorage.removeItem(STORAGE_REKAP);
}

export function getDraftAnswers(): Record<number, string> {
  try {
    const raw = localStorage.getItem(STORAGE_DRAFT);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveDraftAnswers(answers: Record<number, string>): void {
  try {
    localStorage.setItem(STORAGE_DRAFT, JSON.stringify(answers));
  } catch (e) {
    console.error('Failed to save drafts', e);
  }
}

export function clearDraftAnswers(): void {
  localStorage.removeItem(STORAGE_DRAFT);
}

export function getSavedStudentIdentity(): { nama: string; kelas: string } {
  try {
    const raw = localStorage.getItem(STORAGE_STUDENT_ID);
    return raw ? JSON.parse(raw) : { nama: '', kelas: 'XII TKJ 1' };
  } catch {
    return { nama: '', kelas: 'XII TKJ 1' };
  }
}

export function saveStudentIdentity(identity: { nama: string; kelas: string }): void {
  try {
    localStorage.setItem(STORAGE_STUDENT_ID, JSON.stringify(identity));
  } catch {}
}

export async function fetchSubmissionsFromServer(): Promise<ExamSubmission[]> {
  const localList = getStoredSubmissions();

  try {
    const res = await fetch('/api/submissions');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.submissions)) {
        const serverList: ExamSubmission[] = data.submissions;

        // Check if there are local submissions not yet on server
        const serverIds = new Set(serverList.map((s) => s.id));
        const missingOnServer = localList.filter((s) => !serverIds.has(s.id));

        if (missingOnServer.length > 0) {
          // Sync them to the server in the background
          syncSubmissionsToServer(missingOnServer).catch((e) =>
            console.warn('Background sync error:', e)
          );
        }

        // Merge both, preferring server list with newest first
        const allIds = new Set<string>();
        const merged: ExamSubmission[] = [];

        for (const item of [...serverList, ...localList]) {
          const key = item.id || `${item.nama}-${item.kelas}-${item.timestamp}`;
          if (!allIds.has(key)) {
            allIds.add(key);
            merged.push(item);
          }
        }

        // Cache back to localStorage
        try {
          localStorage.setItem(STORAGE_REKAP, JSON.stringify(merged));
        } catch {}

        return merged;
      }
    }
  } catch (err) {
    console.warn('Could not fetch submissions from server, using local data:', err);
  }

  return localList;
}

export async function saveSubmissionToServer(submission: ExamSubmission): Promise<boolean> {
  // Always save locally first
  saveSubmission(submission);

  try {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
    if (res.ok) {
      return true;
    }
  } catch (err) {
    console.warn('Failed to post submission to server:', err);
  }
  return false;
}

export async function syncSubmissionsToServer(submissions: ExamSubmission[]): Promise<ExamSubmission[]> {
  try {
    const res = await fetch('/api/submissions/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissions }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.submissions)) {
        try {
          localStorage.setItem(STORAGE_REKAP, JSON.stringify(data.submissions));
        } catch {}
        return data.submissions;
      }
    }
  } catch (err) {
    console.warn('Failed to sync submissions to server:', err);
  }
  return submissions;
}

export async function clearAllSubmissionsServer(): Promise<void> {
  clearAllSubmissions();
  try {
    await fetch('/api/submissions', { method: 'DELETE' });
  } catch (err) {
    console.warn('Failed to clear submissions on server:', err);
  }
}

export async function fetchRosterFromServer(): Promise<RosterItem[]> {
  const localRoster = getStoredRoster();
  try {
    const res = await fetch('/api/roster');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.roster) && data.roster.length > 0) {
        saveRoster(data.roster);
        return data.roster;
      }
    }
  } catch (err) {
    console.warn('Could not fetch roster from server:', err);
  }
  return localRoster;
}

export async function saveRosterToServer(roster: RosterItem[]): Promise<void> {
  saveRoster(roster);
  try {
    await fetch('/api/roster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roster }),
    });
  } catch (err) {
    console.warn('Failed to save roster to server:', err);
  }
}

export async function sendToGoogleSheets(payload: {
  timestamp: string;
  nama: string;
  kelas: string;
  nilai: string;
  rincian: string;
}): Promise<boolean> {
  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
    return true;
  } catch (err) {
    console.warn('Google Sheets submission warning:', err);
    // Even if fetch throws on offline/cors, local record is safe
    return false;
  }
}
