import React from 'react';
import { HOTS_QUESTIONS } from '../data/questions';
import { Check, ChevronRight } from 'lucide-react';

interface ExamNavigatorProps {
  answers: Record<number, string>;
  onJumpTo: (questionId: number) => void;
}

export const ExamNavigator: React.FC<ExamNavigatorProps> = ({ answers, onJumpTo }) => {
  const answeredIds = HOTS_QUESTIONS.filter((q) => (answers[q.id] || '').trim().length > 10).map(
    (q) => q.id
  );

  const percent = Math.round((answeredIds.length / HOTS_QUESTIONS.length) * 100);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs mb-6 sticky top-16 z-20 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Navigasi Soal:
          </span>
          <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
            {answeredIds.length} dari 10 terjawab ({percent}%)
          </span>
        </div>

        {/* Mini progress bar */}
        <div className="w-32 sm:w-48 bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-sky-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* 10 Question Quick Buttons */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 sm:gap-2">
        {HOTS_QUESTIONS.map((q) => {
          const isDone = answeredIds.includes(q.id);
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJumpTo(q.id)}
              className={`flex items-center justify-center py-2 px-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                isDone
                  ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
              title={`Lompat ke Soal ${q.id}: ${q.badge}`}
            >
              {isDone && <Check className="w-3 h-3 mr-0.5" />}
              <span>{q.id}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
