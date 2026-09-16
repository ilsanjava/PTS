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
