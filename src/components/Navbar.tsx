import React from 'react';
import { Printer, Shield, Router, CheckCircle2 } from 'lucide-react';

interface NavbarProps {
  onOpenTeacherLogin: () => void;
  onPrint: () => void;
  isDraftSaved: boolean;
  answeredCount: number;
  totalQuestions: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenTeacherLogin,
  onPrint,
  isDraftSaved,
  answeredCount,
  totalQuestions,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs print:hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-700 text-white flex items-center justify-center shadow-xs">
            <Router className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Portal Ujian HOTS MikroTik QoS
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                XII TKJ 1 - 5
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              SMK Teknik Komputer & Jaringan • Kurikulum Merdeka
            </p>
          </div>
        </div>

        {/* Center / Right: Progress & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Answer count badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
            {isDraftSaved ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : null}
            <span>Progress:</span>
            <span className="font-bold text-sky-700">{answeredCount}/{totalQuestions} Soal</span>
          </div>

          {/* Print Button */}
          <button
            type="button"
            id="btn-print"
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            title="Cetak lembar soal atau simpan sebagai PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak PDF / Soal</span>
          </button>

          {/* Teacher Portal Button */}
          <button
            type="button"
            id="btn-teacher"
            onClick={onOpenTeacherLogin}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            title="Masuk ke Panel Guru untuk Rekap & Import"
          >
            <Shield className="w-4 h-4" />
            <span>Rekap Guru & Import XLS</span>
          </button>
        </div>
      </div>
    </header>
  );
};
