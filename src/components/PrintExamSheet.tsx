import React from 'react';
import { HOTS_QUESTIONS } from '../data/questions';

interface PrintExamSheetProps {
  studentName: string;
  studentClass: string;
  answers: Record<number, string>;
  totalScore?: number;
}

export const PrintExamSheet: React.FC<PrintExamSheetProps> = ({
  studentName,
  studentClass,
  answers,
  totalScore,
}) => {
  return (
    <div className="hidden print:block text-black bg-white p-6 max-w-4xl mx-auto font-serif">
      {/* School Header */}
      <div className="text-center border-b-2 border-black pb-3 mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider">
          PEMERINTAH DAERAH PROVINSI • DINAS PENDIDIKAN
        </h3>
        <h2 className="text-lg font-black uppercase tracking-wide">
          SEKOLAH MENENGAH KEJURUAN (SMK) TEKNIK KOMPUTER DAN JARINGAN
        </h2>
        <p className="text-xs italic">
          ASESMEN KOMPETENSI KEAHLIAN (AKK) / UJIAN ESEI HOTS MIKROTIK QoS
        </p>
        <p className="text-xs">
          Tahun Pelajaran 2024/2025 • Tingkat XII TKJ (1 - 5) • Waktu: 90 Menit
        </p>
      </div>

      {/* Student Meta Table */}
      <div className="border border-black p-3 mb-5 text-xs grid grid-cols-2 gap-2">
        <div>
          <p><strong>Nama Siswa:</strong> {studentName || '................................................................'}</p>
          <p className="mt-1"><strong>Kelas:</strong> {studentClass || 'XII TKJ ......'}</p>
        </div>
        <div>
          <p><strong>Mata Pelajaran:</strong> Administrasi Infrastruktur Jaringan (AIJ / QoS)</p>
          <p className="mt-1"><strong>Nilai / Paraf:</strong> {totalScore !== undefined ? `${totalScore} / 100` : '............... / ...............'}</p>
        </div>
      </div>

      {/* Question Items */}
      <div className="space-y-4 text-xs leading-relaxed">
        {HOTS_QUESTIONS.map((q) => {
          const ans = answers[q.id];
          return (
            <div key={q.id} className="border-b border-gray-300 pb-3 break-inside-avoid">
              <div className="font-bold text-sm mb-1">
                {q.title}
              </div>
              <div className="bg-gray-100 p-2 text-xs italic mb-1.5 border-l-2 border-black">
                <strong>Kasus:</strong> {q.scenario}
              </div>
              <p className="font-semibold mb-2">
                <strong>Soal:</strong> {q.question}
              </p>

              {ans ? (
                <div className="p-2 border border-gray-400 bg-gray-50 whitespace-pre-wrap font-sans text-xs">
                  <strong>Jawaban Siswa:</strong><br />
                  {ans}
                </div>
              ) : (
                <div className="h-20 border-b border-dashed border-gray-400">
                  <span className="text-[10px] text-gray-400 italic">Ruang Jawaban Siswa...</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-4 border-t border-black flex justify-between text-xs text-center">
        <div>
          <p>Mengetahui,</p>
          <p className="mt-12 font-bold underline">Guru Pengampu QoS</p>
          <p>NIP. ........................................</p>
        </div>
        <div>
          <p>Siswa Peserta Ujian,</p>
          <p className="mt-12 font-bold underline">{studentName || '........................................'}</p>
          <p>NISN. ........................................</p>
        </div>
      </div>
    </div>
  );
};
