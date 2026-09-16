import React from 'react';
import { QuestionRubric } from '../types';
import { FileText, CheckCircle2, HelpCircle } from 'lucide-react';

interface QuestionCardProps {
  question: QuestionRubric;
  answer: string;
  onChange: (val: string) => void;
  index: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  answer,
  onChange,
  index,
}) => {
  const [showHint, setShowHint] = React.useState(false);

  const charCount = answer.length;
  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const isAnswered = charCount > 15;

  return (
    <div
      id={`question-${question.id}`}
      className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs transition-shadow hover:shadow-sm mb-5 relative group"
    >
      {/* Question Header & Badge */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-sky-700 text-white font-bold text-xs shadow-2xs">
            {question.id}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded border border-sky-100">
            {question.badge}
          </span>
        </div>

        {/* Answer status badge */}
        <div className="flex items-center gap-2">
          {isAnswered ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Dijawab ({wordCount} kata)
            </span>
          ) : (
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              Belum Lengkap
            </span>
          )}
        </div>
      </div>

      {/* Question Title */}
      <h3 className="text-base font-bold text-slate-900 leading-snug mb-3">
        {question.title}
      </h3>

      {/* Scenario / Studi Kasus Box */}
      <div className="bg-slate-50 border-l-4 border-sky-600 rounded-r-lg p-3.5 sm:p-4 mb-4 text-slate-700 text-xs sm:text-sm leading-relaxed">
        <span className="font-bold text-sky-900 block mb-1">
          📌 Studi Kasus Lapangan:
        </span>
        <p className="text-slate-700">
          {question.scenario}
        </p>
      </div>

      {/* Analytical Task Label */}
      <label
        htmlFor={`ans${question.id}`}
        className="block text-sm font-semibold text-slate-800 mb-2 leading-relaxed"
      >
        <span className="text-sky-700 font-bold">Instruksi Analisis: </span>
        {question.question}
      </label>

      {/* Textarea */}
      <div className="relative">
        <textarea
          id={`ans${question.id}`}
          value={answer}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder || "Tuliskan analisis teknis mendalam Anda di sini..."}
          rows={4}
          className="w-full px-3.5 py-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all font-sans leading-relaxed resize-y min-h-[100px]"
        />
      </div>

      {/* Card Footer: Word Counter & Pedagogical Scope Hint */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span>
            Panjang: <strong className="text-slate-700">{charCount}</strong> karakter • <strong className="text-slate-700">{wordCount}</strong> kata
          </span>
          {wordCount >= 15 && (
            <span className="text-emerald-600 font-medium">✓ Memenuhi syarat analisis</span>
          )}
        </div>

        {question.explanationHint && (
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="inline-flex items-center gap-1 text-slate-400 hover:text-sky-700 text-xs transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showHint ? "Tutup Panduan" : "Fokus Penilaian"}</span>
          </button>
        )}
      </div>

      {/* Expandable Hint / Focus */}
      {showHint && question.explanationHint && (
        <div className="mt-3 p-2.5 bg-sky-50/80 border border-sky-200 rounded text-xs text-sky-900 animate-in fade-in duration-150">
          <span className="font-semibold">Fokus Konsep yang Diuji:</span> {question.explanationHint}
        </div>
      )}
    </div>
  );
};
