import React from 'react';
import { User, Users, BookOpen, Clock, AlertCircle, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ExamSubmission, RosterItem } from '../types';

interface StudentHeaderProps {
  selectedClass: string;
  onClassChange: (kelas: string) => void;
  studentName: string;
  onNameChange: (nama: string) => void;
  roster: RosterItem[];
  classes: string[];
  submissions?: ExamSubmission[];
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  selectedClass,
  onClassChange,
  studentName,
  onNameChange,
  roster,
  classes,
  submissions = [],
}) => {
  // Filter roster by selected class
  const classStudents = roster.filter((r) => r.kelas === selectedClass);
  const matchedStudent = classStudents.find(
    (s) => s.nama.toLowerCase() === studentName.trim().toLowerCase()
  );

  // Check if student has already submitted (1 student = 1 time only)
  const alreadySubmittedRecord = submissions.find(
    (s) =>
      studentName.trim() !== '' &&
      s.nama.trim().toLowerCase() === studentName.trim().toLowerCase() &&
      s.kelas.trim().toLowerCase() === selectedClass.trim().toLowerCase()
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs mb-6">
      {/* Title & Info Banner */}
      <div className="text-center pb-5 mb-5 border-b border-slate-100">
        <span className="inline-block px-3 py-1 bg-sky-50 text-sky-700 text-xs font-semibold rounded-full border border-sky-100 mb-2">
          SMKN 10 Garut • Program Keahlian TJKT
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          PTS PKPJ TJKT SMKN 10 Garut
        </h2>
        <p className="text-sm text-slate-500 mt-1 max-w-xl mx-auto">
          Penilaian Tengah Semester • Pengelolaan Komputer Jaringan & Telekomunikasi (PKPJ)
        </p>

        {/* Badges metadata */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-3.5 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md">
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            10 Studi Kasus HOTS
          </span>
          <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Waktu: 90 Menit
          </span>
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-md border border-emerald-200">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            Target: 100 Poin Total
          </span>
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-md border border-amber-200">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            Ketentuan: 1 Siswa Hanya 1 Kali Pengisian
          </span>
        </div>
      </div>

      {/* Identity Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Class Selection */}
        <div>
          <label htmlFor="kelasSiswa" className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-sky-600" />
            Pilih Kelas:
          </label>
          <div className="relative">
            <select
              id="kelasSiswa"
              value={selectedClass}
              onChange={(e) => onClassChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all cursor-pointer"
            >
              {classes.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Terdaftar {classStudents.length} siswa dalam {selectedClass}
          </p>
        </div>

        {/* Student Name Input with Datalist */}
        <div>
          <label htmlFor="namaSiswaInput" className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
            <User className="w-4 h-4 text-sky-600" />
            Nama Lengkap Siswa:
          </label>
          <input
            type="text"
            id="namaSiswaInput"
            list="siswaDatalist"
            value={studentName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Ketik atau pilih nama siswa..."
            className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 transition-all ${
              alreadySubmittedRecord
                ? 'border-amber-400 focus:ring-amber-500 bg-amber-50/30'
                : 'border-slate-300 focus:ring-sky-500 focus:border-sky-500'
            }`}
            autoComplete="off"
          />
          <datalist id="siswaDatalist">
            {classStudents.map((s, idx) => {
              const hasSub = submissions.some(
                (sub) =>
                  sub.nama.trim().toLowerCase() === s.nama.trim().toLowerCase() &&
                  sub.kelas.trim().toLowerCase() === s.kelas.trim().toLowerCase()
              );
              return (
                <option
                  key={`${s.nama}-${idx}`}
                  value={s.nama}
                  label={`${s.nisn ? `NISN: ${s.nisn}` : ''}${hasSub ? ' (Sudah Mengisi Ujian)' : ''}`}
                />
              );
            })}
          </datalist>

          {matchedStudent?.nisn ? (
            <p className="text-xs text-emerald-700 font-semibold mt-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>NISN Terverifikasi: <strong className="font-mono bg-emerald-100/70 px-1.5 py-0.5 rounded text-emerald-800">{matchedStudent.nisn}</strong></span>
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-1">
              Pilih dari daftar nama atau ketik nama lengkap sesuai presensi kelas.
            </p>
          )}
        </div>
      </div>

      {/* Warning banner if student already submitted */}
      {alreadySubmittedRecord && (
        <div className="mt-4 p-4 bg-amber-50 border-2 border-amber-400 rounded-xl text-amber-900 flex items-start gap-3 animate-in fade-in duration-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <p className="font-bold text-amber-950 text-sm">
                ⚠️ Siswa Ini Sudah Pernah Mengisi & Mengirimkan Ujian!
              </p>
              <span className="bg-amber-200 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-md">
                1 Siswa = 1 Kali Saja
              </span>
            </div>
            <p className="mt-1 text-amber-900 leading-relaxed">
              Siswa atas nama <strong>{matchedStudent?.nama || studentName}</strong> ({selectedClass}) sudah tercatat mengumpulkan lembar jawaban ujian pada <strong>{alreadySubmittedRecord.timestamp}</strong> dengan perolehan nilai <strong>{alreadySubmittedRecord.nilai}</strong>.
            </p>
            <p className="mt-1 text-amber-950 font-semibold">
              Ketentuan Ujian: Setiap siswa hanya diperbolehkan mengisi ujian 1 kali. Anda tidak dapat mengirimkan lembar ujian ulang.
            </p>
          </div>
        </div>
      )}

      {/* Quick notice on rubric */}
      <div className="mt-4 p-3 bg-sky-50/70 border border-sky-200/80 rounded-lg text-xs text-sky-900 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Petunjuk Pengerjaan:</span> Analisis setiap studi kasus secara komprehensif. Jawaban dievaluasi berdasarkan ketepatan terminologi teknis MikroTik (QoS keywords, formula burst/PCQ, dan arsitektur antrean). Setiap siswa hanya dapat mengirimkan jawaban ujian satu kali. Setelah terkirim, formulir akan otomatis dikosongkan kembali.
        </div>
      </div>
    </div>
  );
};
