import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StudentHeader } from './components/StudentHeader';
import { QuestionCard } from './components/QuestionCard';
import { ExamNavigator } from './components/ExamNavigator';
import { StudentResultModal } from './components/StudentResultModal';
import { TeacherLoginModal } from './components/TeacherLoginModal';
import { TeacherDashboard } from './components/TeacherDashboard';
import { PrintExamSheet } from './components/PrintExamSheet';
import { HOTS_QUESTIONS } from './data/questions';
import { evaluateAnswers, EvaluationResult } from './utils/evaluator';
import {
  getStoredRoster,
  saveRoster,
  getStoredSubmissions,
  saveSubmission,
  clearAllSubmissions,
  getDraftAnswers,
  saveDraftAnswers,
  clearDraftAnswers,
  getSavedStudentIdentity,
  saveStudentIdentity,
  sendToGoogleSheets,
  GOOGLE_SCRIPT_URL,
  fetchSubmissionsFromServer,
  saveSubmissionToServer,
  syncSubmissionsToServer,
  clearAllSubmissionsServer,
  deleteSubmissionFromServer,
  fetchRosterFromServer,
  saveRosterToServer,
} from './utils/storage';
import { ExamSubmission, RosterItem } from './types';
import { Send, CheckCircle2, AlertCircle, RefreshCw, Printer, AlertTriangle } from 'lucide-react';

interface SubmittedResultInfo {
  nama: string;
  kelas: string;
  nisn?: string;
  evalResult: EvaluationResult;
  answers: Record<number, string>;
  timestamp: string;
}

const CLASSES = ['XII TKJ 1', 'XII TKJ 2', 'XII TKJ 3', 'XII TKJ 4', 'XII TKJ 5'];

export default function App() {
  // State
  const [selectedClass, setSelectedClass] = useState<string>('XII TKJ 1');
  const [studentName, setStudentName] = useState<string>('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [roster, setRoster] = useState<RosterItem[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);

  // Modals & Dashboard visibility
  const [isTeacherLoggedIn, setIsTeacherLoggedIn] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // Statuses
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('');
  const [googleSheetsStatus, setGoogleSheetsStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedResultInfo, setSubmittedResultInfo] = useState<SubmittedResultInfo | null>(null);

  // Load initial persistent storage (Local + Server)
  useEffect(() => {
    // 1. Instant local load
    const loadedRoster = getStoredRoster();
    setRoster(loadedRoster);

    const loadedSubs = getStoredSubmissions();
    setSubmissions(loadedSubs);

    const drafts = getDraftAnswers();
    setAnswers(drafts);

    const id = getSavedStudentIdentity();
    if (id.nama) setStudentName(id.nama);
    if (id.kelas) setSelectedClass(id.kelas);

    // 2. Fetch shared data from server
    fetchRosterFromServer().then((srvRoster) => {
      if (srvRoster && srvRoster.length > 0) {
        setRoster(srvRoster);
      }
    });

    fetchSubmissionsFromServer().then((srvSubs) => {
      if (srvSubs && srvSubs.length >= 0) {
        setSubmissions(srvSubs);
        setLastUpdatedTime(new Date().toLocaleTimeString('id-ID'));
      }
    });
  }, []);

  // Periodic polling when teacher is logged in to see student submissions in real time
  useEffect(() => {
    if (!isTeacherLoggedIn) return;

    // Immediate initial sync
    fetchSubmissionsFromServer().then((subs) => {
      setSubmissions(subs);
      setLastUpdatedTime(new Date().toLocaleTimeString('id-ID'));
    });

    // Poll every 5 seconds
    const interval = setInterval(async () => {
      try {
        const freshSubs = await fetchSubmissionsFromServer();
        setSubmissions(freshSubs);
        setLastUpdatedTime(new Date().toLocaleTimeString('id-ID'));
      } catch (e) {
        console.warn('Auto-poll submissions error:', e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isTeacherLoggedIn]);

  // Manual refresh handler for teacher
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const freshSubs = await fetchSubmissionsFromServer();
      setSubmissions(freshSubs);
      setLastUpdatedTime(new Date().toLocaleTimeString('id-ID'));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Batch import submissions handler (e.g. from Google Sheet CSV or pasted rows)
  const handleImportSubmissions = useCallback(async (newSubs: ExamSubmission[]) => {
    setIsRefreshing(true);
    try {
      const updated = await syncSubmissionsToServer(newSubs);
      setSubmissions(updated);
      setLastUpdatedTime(new Date().toLocaleTimeString('id-ID'));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Sync draft answers to localStorage
  const handleAnswerChange = (questionId: number, text: string) => {
    const updated = { ...answers, [questionId]: text };
    setAnswers(updated);
    saveDraftAnswers(updated);
  };

  // Sync identity
  const handleClassChange = (newClass: string) => {
    setSelectedClass(newClass);
    saveStudentIdentity({ nama: studentName, kelas: newClass });
  };

  const handleNameChange = (newName: string) => {
    setStudentName(newName);
    saveStudentIdentity({ nama: newName, kelas: selectedClass });
  };

  // Roster update by teacher
  const handleRosterUpdate = (newRoster: RosterItem[]) => {
    setRoster(newRoster);
    saveRosterToServer(newRoster);
  };

  // Clear all submissions
  const handleClearSubmissions = async () => {
    await clearAllSubmissionsServer();
    setSubmissions([]);
    setSubmittedResultInfo(null);
    setHasSubmitted(false);
  };

  // Reset single student submission
  const handleResetSingleSubmission = async (sub: { id?: string; nama: string; kelas: string }) => {
    await deleteSubmissionFromServer(sub);
    setSubmissions((prev) =>
      prev.filter(
        (s) =>
          !(
            (sub.id && s.id === sub.id) ||
            (s.nama.trim().toLowerCase() === sub.nama.trim().toLowerCase() &&
              s.kelas.trim().toLowerCase() === sub.kelas.trim().toLowerCase())
          )
      )
    );
    // If currently active student is the one being reset, also allow them to resubmit
    if (
      studentName.trim().toLowerCase() === sub.nama.trim().toLowerCase() &&
      selectedClass.trim().toLowerCase() === sub.kelas.trim().toLowerCase()
    ) {
      setHasSubmitted(false);
      setSubmittedResultInfo(null);
    }
  };

  // Quick jump to question
  const scrollToQuestion = (questionId: number) => {
    const el = document.getElementById(`question-${questionId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Focus textarea
      const textarea = document.getElementById(`ans${questionId}`);
      if (textarea) textarea.focus();
    }
  };

  // Submit assessment handler (strictly follows user prompt specifications)
  const submitAssessment = async () => {
    const trimmedName = studentName.trim();
    if (!trimmedName) {
      alert('Harap isi/pilih Nama Lengkap Siswa terlebih dahulu!');
      const inputEl = document.getElementById('namaSiswaInput');
      if (inputEl) inputEl.focus();
      return;
    }

    // Strict requirement: 1 student can only fill/submit once
    const existing = submissions.find(
      (s) =>
        s.nama.trim().toLowerCase() === trimmedName.toLowerCase() &&
        s.kelas.trim().toLowerCase() === selectedClass.trim().toLowerCase()
    );

    if (existing) {
      alert(
        `Perhatian: Siswa atas nama "${trimmedName}" (${selectedClass}) sudah pernah mengirimkan jawaban ujian PTS PKPJ TJKT SMKN 10 Garut pada ${existing.timestamp} (Nilai: ${existing.nilai}).\n\nSesuai ketentuan, setiap siswa hanya diperbolehkan mengisi ujian 1 kali!`
      );
      return;
    }

    // Evaluate answers
    const evalRes = evaluateAnswers(answers);
    setEvaluationResult(evalRes);

    const submissionPayload: ExamSubmission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toLocaleString('id-ID'),
      nama: trimmedName,
      kelas: selectedClass,
      nilai: evalRes.totalScore.toFixed(1),
      rincian: evalRes.summaryString,
      answers: { ...answers },
      syncedToGoogleSheets: false,
    };

    const currentStudentNisn = roster.find(
      (r) => r.nama.toLowerCase() === trimmedName.toLowerCase() && r.kelas === selectedClass
    )?.nisn;

    // Preserve submitted result data for result modal and print view
    const submittedData: SubmittedResultInfo = {
      nama: trimmedName,
      kelas: selectedClass,
      nisn: currentStudentNisn,
      evalResult: evalRes,
      answers: { ...answers },
      timestamp: submissionPayload.timestamp,
    };
    setSubmittedResultInfo(submittedData);

    setIsSubmitting(true);
    setGoogleSheetsStatus('sending');

    // 1. Immediately save to central server
    const serverResult = await saveSubmissionToServer(submissionPayload);
    if (serverResult.alreadySubmitted) {
      alert(serverResult.message || 'Siswa ini sudah pernah mengisi ujian!');
      setIsSubmitting(false);
      return;
    }

    setSubmissions((prev) => [submissionPayload, ...prev]);
    setHasSubmitted(true);
    setIsResultModalOpen(true);

    // 2. Strict Requirement: Form isian langsung kosong kembali!
    setAnswers({});
    clearDraftAnswers();
    setStudentName('');
    saveStudentIdentity({ nama: '', kelas: selectedClass });

    try {
      // 3. Send to Google Sheets Apps Script asynchronously
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          timestamp: submissionPayload.timestamp,
          nama: submissionPayload.nama,
          kelas: submissionPayload.kelas,
          nilai: submissionPayload.nilai,
          rincian: submissionPayload.rincian,
        }),
      });

      setGoogleSheetsStatus('success');
      submissionPayload.syncedToGoogleSheets = true;
    } catch (err) {
      console.error('Gagal mengirim ke Google Sheets:', err);
      setGoogleSheetsStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const answeredCount = HOTS_QUESTIONS.filter((q) => (answers[q.id] || '').trim().length > 10).length;

  const currentStudentNisn = roster.find(
    (r) => r.nama.toLowerCase() === studentName.trim().toLowerCase() && r.kelas === selectedClass
  )?.nisn;

  const alreadySubmittedRecord = submissions.find(
    (s) =>
      studentName.trim() !== '' &&
      s.nama.trim().toLowerCase() === studentName.trim().toLowerCase() &&
      s.kelas.trim().toLowerCase() === selectedClass.trim().toLowerCase()
  );

  return (
    <div className="min-h-screen bg-[#f2f5f8] text-slate-800 font-sans pb-16">
      {/* Top Navbar */}
      <Navbar
        onOpenTeacherLogin={() => setIsTeacherModalOpen(true)}
        onPrint={handlePrint}
        isDraftSaved={true}
        answeredCount={answeredCount}
        totalQuestions={HOTS_QUESTIONS.length}
      />

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 print:hidden">
        {/* Teacher Dashboard View (when logged in) */}
        {isTeacherLoggedIn && (
          <TeacherDashboard
            submissions={submissions}
            roster={roster}
            onRosterUpdate={handleRosterUpdate}
            onClearSubmissions={handleClearSubmissions}
            onResetSingleSubmission={handleResetSingleSubmission}
            onLogout={() => setIsTeacherLoggedIn(false)}
            onRefresh={handleRefresh}
            onImportSubmissions={handleImportSubmissions}
            isRefreshing={isRefreshing}
            lastUpdatedTime={lastUpdatedTime}
          />
        )}

        {/* Student Identity Form */}
        <StudentHeader
          selectedClass={selectedClass}
          onClassChange={handleClassChange}
          studentName={studentName}
          onNameChange={handleNameChange}
          roster={roster}
          classes={CLASSES}
          submissions={submissions}
        />

        {/* Exam Navigation Bar */}
        <ExamNavigator answers={answers} onJumpTo={scrollToQuestion} />

        {/* 10 HOTS Question Cards */}
        <form id="hotsForm" onSubmit={(e) => { e.preventDefault(); submitAssessment(); }}>
          <div className="space-y-4">
            {HOTS_QUESTIONS.map((q, idx) => (
              <QuestionCard
                key={q.id}
                question={q}
                answer={answers[q.id] || ''}
                onChange={(val) => handleAnswerChange(q.id, val)}
                index={idx}
              />
            ))}
          </div>

          {/* Submit Button */}
          <div className="mt-8 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
            {alreadySubmittedRecord && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <p className="font-bold">
                    Perhatian: Siswa Ini Sudah Mengisi Ujian
                  </p>
                  <p className="mt-0.5 text-amber-800">
                    Siswa atas nama <b>{studentName}</b> ({selectedClass}) sudah pernah mengirimkan jawaban ujian pada {alreadySubmittedRecord.timestamp} (Nilai: {alreadySubmittedRecord.nilai}).
                  </p>
                  <p className="mt-1 font-semibold text-amber-950">
                    Setiap siswa hanya diperbolehkan mengisi ujian 1 kali.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              id="btnSubmitAssessment"
              onClick={submitAssessment}
              disabled={isSubmitting || !!alreadySubmittedRecord}
              className={`btn-submit w-full py-4 px-6 font-bold text-base sm:text-lg rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                alreadySubmittedRecord
                  ? 'bg-slate-400 text-slate-100 cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white hover:shadow-lg disabled:cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Mengirim Jawaban ke Server & Google Sheets...</span>
                </>
              ) : alreadySubmittedRecord ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  <span>Siswa Sudah Mengisi Ujian (Hanya 1 Kali)</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Kirim Jawaban & Evaluasi Otomatis</span>
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-500 mt-2.5">
              {alreadySubmittedRecord
                ? 'Sesuai ketentuan, sistem mengunci pengiriman ulang untuk siswa yang sudah menyelesaikan ujian.'
                : 'Setelah jawaban dikirimkan, nilai langsung dievaluasi otomatis dan formulir isian akan otomatis dikosongkan kembali.'}
            </p>
          </div>
        </form>

        {/* In-page Result Box */}
        {hasSubmitted && submittedResultInfo && (
          <div
            id="studentResultBox"
            className="mt-8 p-6 bg-sky-50 border-2 border-sky-300 rounded-xl text-center shadow-md animate-in fade-in duration-300"
          >
            <h2 id="studentScoreText" className="text-2xl sm:text-3xl font-black text-sky-900 mb-1">
              Nilai Akhir PTS: {submittedResultInfo.evalResult.totalScore.toFixed(1)} / 100
            </h2>
            <p id="studentDetailText" className="text-sm font-semibold text-slate-700 mb-2">
              Siswa: <b>{submittedResultInfo.nama}</b> ({submittedResultInfo.kelas})
            </p>
            <p className="text-xs sm:text-sm text-emerald-700 font-bold mb-2 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              ✔ Jawaban berhasil tersimpan ke rekap server dan terkirim ke Google Sheets.
            </p>
            <p className="text-xs text-sky-800 bg-sky-100 border border-sky-200 py-1.5 px-3 rounded-md max-w-md mx-auto mb-3">
              Formulir isian ujian telah dikosongkan kembali untuk pengerjaan siswa berikutnya.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              <button
                type="button"
                onClick={() => setIsResultModalOpen(true)}
                className="px-4 py-2 bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-sky-800 transition-colors cursor-pointer"
              >
                Lihat Rincian Analisis Kata Kunci
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-slate-900 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Lembar Hasil PDF
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Student Result Detailed Modal */}
      {submittedResultInfo && (
        <StudentResultModal
          isOpen={isResultModalOpen}
          onClose={() => setIsResultModalOpen(false)}
          studentName={submittedResultInfo.nama}
          studentClass={submittedResultInfo.kelas}
          totalScore={submittedResultInfo.evalResult.totalScore}
          scoreDetails={submittedResultInfo.evalResult.questionDetails}
          summaryString={submittedResultInfo.evalResult.summaryString}
          googleSheetsStatus={googleSheetsStatus}
          onPrint={handlePrint}
        />
      )}

      {/* Teacher Login Modal */}
      <TeacherLoginModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        onSuccess={() => {
          setIsTeacherModalOpen(false);
          setIsTeacherLoggedIn(true);
        }}
      />

      {/* Printable Exam Sheet for window.print() */}
      <PrintExamSheet
        studentName={submittedResultInfo?.nama || studentName}
        studentClass={submittedResultInfo?.kelas || selectedClass}
        studentNisn={submittedResultInfo?.nisn || currentStudentNisn}
        answers={submittedResultInfo?.answers || answers}
        totalScore={submittedResultInfo?.evalResult.totalScore ?? evaluationResult?.totalScore}
      />
    </div>
  );
}
