import React from 'react';
import { CheckCircle2, Award, Printer, X, FileCheck, ArrowRight, Share2 } from 'lucide-react';
import { HOTS_QUESTIONS } from '../data/questions';
import { QuestionScoreDetail } from '../types';

interface StudentResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentClass: string;
  totalScore: number;
  scoreDetails: QuestionScoreDetail[];
  summaryString: string;
  googleSheetsStatus: 'idle' | 'sending' | 'success' | 'error';
  onPrint: () => void;
}

export const StudentResultModal: React.FC<StudentResultModalProps> = ({
  isOpen,
  onClose,
  studentName,
  studentClass,
  totalScore,
  scoreDetails,
  summaryString,
  googleSheetsStatus,
  onPrint,
}) => {
  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-blue-700 bg-blue-50 border-blue-200';
    return 'text-amber-700 bg-amber-50 border-amber-200';
  };

  const getGradePredicate = (score: number) => {
    if (score >= 90) return 'Sangat Kompeten (A) - Pemahaman HOTS Sangat Mendalam';
    if (score >= 80) return 'Kompeten (B+) - Mampu Menganalisis QoS MikroTik';
    if (score >= 70) return 'Cukup Kompeten (B) - Konsep Dasar Terpenuhi';
    return 'Perlu Remedial / Pendalaman Analisis QoS';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:hidden">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Ribbon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mb-3 shadow-inner">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Hasil Evaluasi Ujian HOTS QoS
          </h2>
          <p className="text-sm font-medium text-slate-600 mt-1">
            Siswa: <span className="font-bold text-slate-900">{studentName}</span> ({studentClass})
          </p>
        </div>

        {/* Score Card Banner */}
        <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-6 text-center mb-6">
          <span className="text-xs uppercase font-bold tracking-wider text-sky-800">
            Nilai Akhir Evaluasi Mandiri HOTS
          </span>
          <div className="text-4xl sm:text-5xl font-black text-sky-900 my-2">
            {totalScore.toFixed(1)} <span className="text-2xl font-semibold text-sky-600">/ 100</span>
          </div>
          <div className="text-xs sm:text-sm font-semibold text-slate-700">
            Predikat: <span className="text-sky-800">{getGradePredicate(totalScore)}</span>
          </div>
        </div>

        {/* Google Sheets Sync Indicator */}
        <div className="mb-6 p-3.5 rounded-lg border flex items-center gap-3 bg-emerald-50 border-emerald-200 text-emerald-900 text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-bold">
              {googleSheetsStatus === 'sending'
                ? 'Mengirim jawaban ke Google Sheets Guru...'
                : '✔ Jawaban berhasil tersimpan dan dikirim ke Google Sheets.'}
            </p>
            <p className="text-emerald-700 text-xs mt-0.5">
              Data rekap lokal di browser dan basis data Google Spreadsheet guru telah sinkron.
            </p>
          </div>
        </div>

        {/* Breakdown Accordion / List */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
            <span>Rincian Evaluasi Tiap Soal (S1 - S10)</span>
            <span className="text-sky-700">{summaryString}</span>
          </h4>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 text-xs">
            {scoreDetails.map((item) => {
              const qMeta = HOTS_QUESTIONS.find((q) => q.id === item.questionId);
              return (
                <div
                  key={item.questionId}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-3"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900">
                        Soal {item.questionId}: {qMeta?.badge}
                      </span>
                    </div>
                    <div className="text-slate-600 leading-snug">
                      <span className="font-semibold text-emerald-700">Kata kunci terdeteksi ({item.matchedKeywords.length}/{item.matchedKeywords.length + item.missedKeywords.length}): </span>
                      {item.matchedKeywords.length > 0 ? (
                        <span className="text-slate-700 font-mono">{item.matchedKeywords.join(', ')}</span>
                      ) : (
                        <span className="text-rose-600 italic">Belum ada terminologi kunci yang cocok</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2.5 py-1 rounded font-bold text-sky-800 bg-sky-100 border border-sky-200">
                      {item.score.toFixed(1)} / 10
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onPrint}
            className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Bukti Nilai (PDF)</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-1/2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>Selesai & Tutup</span>
          </button>
        </div>
      </div>
    </div>
  );
};
