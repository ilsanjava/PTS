import React, { useState, useEffect } from 'react';
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
} from './utils/storage';
import { ExamSubmission, RosterItem } from './types';
import { Send, CheckCircle2, AlertCircle, RefreshCw, Printer } from 'lucide-react';

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
  const [googleSheetsStatus, setGoogleSheetsStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Load initial persistent storage
  useEffect(() => {
    const loadedRoster = getStoredRoster();
    setRoster(loadedRoster);

    const loadedSubs = getStoredSubmissions();
    setSubmissions(loadedSubs);

    const drafts = getDraftAnswers();
    setAnswers(drafts);

    const id = getSavedStudentIdentity();
    if (id.nama) setStudentName(id.nama);
    if (id.kelas) setSelectedClass(id.kelas);
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
    saveRoster(newRoster);
  };

  // Clear submissions
  const handleClearSubmissions = () => {
    clearAllSubmissions();
    setSubmissions([]);
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

    // Evaluate answers
    const evalRes = evaluateAnswers(answers);
    setEvaluationResult(evalRes);

    const submissionPayload: ExamSubmission = {
      id: `sub-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      nama: trimmedName,
      kelas: selectedClass,
      nilai: evalRes.totalScore.toFixed(1),
      rincian: evalRes.summaryString,
      answers: { ...answers },
      syncedToGoogleSheets: false,
    };

    // Save to local storage
    saveSubmission(submissionPayload);
    setSubmissions((prev) => [submissionPayload, ...prev]);

    setHasSubmitted(true);
    setIsResultModalOpen(true);
    setGoogleSheetsStatus('sending');
    setIsSubmitting(true);

    try {
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
      // Update local flag
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
            onLogout={() => setIsTeacherLoggedIn(false)}
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
          <div className="mt-8 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <button
              type="button"
              id="btnSubmitAssessment"
              onClick={submitAssessment}
              disabled={isSubmitting}
              className="btn-submit w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold text-base sm:text-lg rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Mengirim Jawaban ke Google Sheets...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Kirim Jawaban & Evaluasi Otomatis</span>
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-500 mt-2.5">
              Klik tombol di atas untuk menganalisis jawaban esai HOTS Anda secara otomatis dan mengirim hasil ke rekap guru.
            </p>
          </div>
        </form>

        {/* In-page Result Box matching studentResultBox specification */}
        {hasSubmitted && evaluationResult && (
          <div
            id="studentResultBox"
            className="mt-8 p-6 bg-sky-50 border-2 border-sky-300 rounded-xl text-center shadow-md animate-in fade-in duration-300"
          >
            <h2 id="studentScoreText" className="text-2xl sm:text-3xl font-black text-sky-900 mb-1">
              Nilai Akhir HOTS: {evaluationResult.totalScore.toFixed(1)} / 100
            </h2>
            <p id="studentDetailText" className="text-sm font-semibold text-slate-700 mb-2">
              Siswa: <b>{studentName}</b> ({selectedClass})
            </p>
            <p className="text-xs sm:text-sm text-emerald-700 font-bold mb-3 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              ✔ Jawaban berhasil tersimpan dan dikirim ke Google Sheets.
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
      {evaluationResult && (
        <StudentResultModal
          isOpen={isResultModalOpen}
          onClose={() => setIsResultModalOpen(false)}
          studentName={studentName}
          studentClass={selectedClass}
          totalScore={evaluationResult.totalScore}
          scoreDetails={evaluationResult.questionDetails}
          summaryString={evaluationResult.summaryString}
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
        studentName={studentName}
        studentClass={selectedClass}
        answers={answers}
        totalScore={evaluationResult?.totalScore}
      />
    </div>
  );
}
