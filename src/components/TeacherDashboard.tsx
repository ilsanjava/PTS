import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  Download,
  Trash2,
  LogOut,
  Search,
  Filter,
  FileSpreadsheet,
  Users,
  Award,
  BookCheck,
  ChevronDown,
  Eye,
  X,
  FileDown,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { ExamSubmission, RosterItem } from '../types';
import { HOTS_QUESTIONS } from '../data/questions';

interface TeacherDashboardProps {
  submissions: ExamSubmission[];
  roster: RosterItem[];
  onRosterUpdate: (newRoster: RosterItem[]) => void;
  onClearSubmissions: () => void;
  onLogout: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  submissions,
  roster,
  onRosterUpdate,
  onClearSubmissions,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'rekap' | 'roster'>('rekap');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [importStatus, setImportStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<ExamSubmission | null>(null);

  // Filter submissions
  const filteredSubmissions = submissions.filter((item) => {
    const matchClass = filterClass === 'ALL' || item.kelas === filterClass;
    const matchSearch =
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kelas.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSearch;
  });

  // Analytics
  const totalSubmissions = submissions.length;
  const avgScore =
    totalSubmissions > 0
      ? (
          submissions.reduce((acc, curr) => acc + parseFloat(curr.nilai || '0'), 0) /
          totalSubmissions
        ).toFixed(1)
      : '0';

  const maxScore =
    totalSubmissions > 0
      ? Math.max(...submissions.map((s) => parseFloat(s.nilai || '0'))).toFixed(1)
      : '0';

  // Import handler for CSV / XLSX / XLS using SheetJS
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportStatus('Memproses berkas...');

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const lines = text.split(/\r\n|\n/);
          const importedRoster: RosterItem[] = [];

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = line.split(/[,;]/);
            if (cols.length >= 2) {
              const nama = cols[0].replace(/^["']|["']$/g, '').trim();
              const kelas = cols[1].replace(/^["']|["']$/g, '').trim();

              if (nama.toLowerCase().includes('nama') || kelas.toLowerCase().includes('kelas')) continue;

              if (nama && kelas) {
                importedRoster.push({ nama, kelas });
              }
            }
          }

          if (importedRoster.length > 0) {
            onRosterUpdate(importedRoster);
            setImportStatus(`✔ Berhasil mengimpor ${importedRoster.length} data siswa dari file CSV!`);
          } else {
            alert('Format CSV kurang sesuai. Pastikan Kolom 1 = Nama dan Kolom 2 = Kelas!');
            setImportStatus('');
          }
        } catch (err: any) {
          alert('Gagal membaca file CSV: ' + err.message);
          setImportStatus('');
        } finally {
          setIsProcessing(false);
          // reset input
          e.target.value = '';
        }
      };
      reader.readAsText(file);
    } else {
      // XLSX / XLS via SheetJS library
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

          const importedRoster: RosterItem[] = [];
          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row && row.length >= 2) {
              const nama = String(row[0]).trim();
              const kelas = String(row[1]).trim();

              if (nama.toLowerCase().includes('nama') || kelas.toLowerCase().includes('kelas')) continue;

              if (nama && kelas) {
                importedRoster.push({ nama, kelas });
              }
            }
          }

          if (importedRoster.length > 0) {
            onRosterUpdate(importedRoster);
            setImportStatus(`✔ Berhasil mengimpor ${importedRoster.length} data siswa dari Excel!`);
          } else {
            alert('Tidak ada data siswa yang valid dalam file Excel.');
            setImportStatus('');
          }
        } catch (err: any) {
          alert('Gagal membaca file Excel: ' + err.message);
          setImportStatus('');
        } finally {
          setIsProcessing(false);
          e.target.value = '';
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Export CSV matching the prompt exact format
  const exportToExcel = () => {
    if (submissions.length === 0) {
      alert('Belum ada data rekap untuk diunduh!');
      return;
    }

    let csv = '\uFEFF';
    csv += 'No,Waktu Pengerjaan,Nama Siswa,Kelas,Nilai Akhir HOTS,Rincian Poin\n';
    submissions.forEach((row, idx) => {
      csv += `"${idx + 1}","${row.timestamp}","${row.nama}","${row.kelas}",${row.nilai},"${row.rincian}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Rekap_Ujian_HOTS_QoS_Guru.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Sample Template CSV for teachers
  const downloadSampleTemplate = () => {
    let csv = '\uFEFF';
    csv += 'Nama,Kelas\n';
    csv += 'Achmad Fauzan,XII TKJ 1\n';
    csv += 'Aditya Pratama Putra,XII TKJ 1\n';
    csv += 'Agung Wicaksono,XII TKJ 2\n';
    csv += 'Aldi Firmansyah,XII TKJ 3\n';
    csv += 'Andika Pratama,XII TKJ 4\n';
    csv += 'Arya Yudha,XII TKJ 5\n';

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `roster_siswa_tkj_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClear = () => {
    if (confirm('Apakah Anda yakin ingin MENGHAPUS SEMUA REKAP NILAI siswa?')) {
      onClearSubmissions();
    }
  };

  return (
    <div id="teacherDashboard" className="bg-white rounded-2xl border-2 border-sky-700 p-5 sm:p-7 shadow-lg mb-10 print:hidden animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-6 border-b-2 border-sky-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-700 text-white flex items-center justify-center font-bold">
            👨‍🏫
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              Panel Guru: Import XLS & Rekap Nilai
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Monitoring Asesmen HOTS MikroTik QoS • Kurikulum Merdeka XII TKJ
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Panel</span>
        </button>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
            <span>Peserta Ujian</span>
            <BookCheck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalSubmissions}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Siswa telah mengirim</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
            <span>Rata-Rata Nilai</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{avgScore}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Skala 0 - 100</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
            <span>Nilai Tertinggi</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">{maxScore}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Top score kelas</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
            <span>Roster Siswa</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-sky-800">{roster.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Total terdaftar (5 kelas)</div>
        </div>
      </div>

      {/* Import Roster Box */}
      <div className="import-box bg-rose-50/70 border-2 border-dashed border-rose-300 rounded-xl p-5 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-rose-900 mb-1 flex items-center gap-2">
              <Upload className="w-5 h-5 text-rose-600" />
              Import Roster Data Siswa (.CSV / .XLSX / .XLS)
            </h4>
            <p className="text-xs sm:text-sm text-slate-600">
              Pilih file <b>roster_siswa_tkj-v3.csv</b> atau file Excel (.xlsx/.xls). Sistem akan otomatis memperbarui daftar nama siswa pada dropdown ujian siswa.
            </p>
          </div>
          <button
            type="button"
            onClick={downloadSampleTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 text-rose-800 text-xs font-semibold rounded-lg hover:bg-rose-100/50 transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Contoh CSV</span>
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="file"
            id="excelFileInput"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="block w-full sm:w-auto text-xs sm:text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-rose-700 file:text-white hover:file:bg-rose-800 cursor-pointer"
          />
        </div>

        {importStatus && (
          <p id="importStatus" className="text-xs sm:text-sm font-bold text-emerald-700 mt-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {importStatus}
          </p>
        )}
      </div>

      {/* Tab Controls */}
      <div className="flex items-center gap-2 mb-4 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('rekap')}
          className={`pb-2.5 px-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'rekap'
              ? 'border-sky-700 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          📋 Rekapitulasi Hasil Ujian Siswa ({submissions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={`pb-2.5 px-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'roster'
              ? 'border-sky-700 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          👥 Daftar Roster Terpasang ({roster.length} Siswa)
        </button>
      </div>

      {/* TAB 1: Rekapitulasi Ujian */}
      {activeTab === 'rekap' && (
        <div>
          {/* Filters & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama siswa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">Semua Kelas</option>
                <option value="XII TKJ 1">XII TKJ 1</option>
                <option value="XII TKJ 2">XII TKJ 2</option>
                <option value="XII TKJ 3">XII TKJ 3</option>
                <option value="XII TKJ 4">XII TKJ 4</option>
                <option value="XII TKJ 5">XII TKJ 5</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportToExcel}
                className="btn-action inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Rekap Excel (.CSV)</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="btn-action inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Semua Rekap</span>
              </button>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs">
            <table id="rekapTable" className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-sky-700 text-white">
                <tr>
                  <th className="py-2.5 px-3 font-semibold text-center w-12">No</th>
                  <th className="py-2.5 px-3 font-semibold w-40">Waktu Ujian</th>
                  <th className="py-2.5 px-3 font-semibold">Nama Siswa</th>
                  <th className="py-2.5 px-3 font-semibold w-24">Kelas</th>
                  <th className="py-2.5 px-3 font-semibold text-center w-24">Nilai HOTS</th>
                  <th className="py-2.5 px-3 font-semibold">Rincian Poin Soal</th>
                  <th className="py-2.5 px-3 font-semibold text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody id="rekapTableBody" className="divide-y divide-slate-200">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400">
                      Belum ada rekap nilai siswa yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((row, idx) => (
                    <tr key={row.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        {row.timestamp}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {row.nama}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded bg-sky-50 text-sky-800 font-semibold border border-sky-200 text-[11px]">
                          {row.kelas}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block font-bold text-sm px-2.5 py-0.5 rounded-md ${
                            parseFloat(row.nilai) >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : parseFloat(row.nilai) >= 60
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {row.nilai}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {row.rincian}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedSubmission(row)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-sky-100 text-sky-700 text-[11px] font-semibold transition-colors cursor-pointer"
                          title="Lihat Jawaban Lengkap Siswa"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Detail</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Roster Siswa */}
      {activeTab === 'roster' && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <p className="text-xs text-slate-500">
              Daftar siswa terdaftar per kelas untuk validasi nama saat ujian berlangsung.
            </p>
            <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-200">
              Total: {roster.length} Siswa
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 max-h-96 overflow-y-auto pr-1">
            {['XII TKJ 1', 'XII TKJ 2', 'XII TKJ 3', 'XII TKJ 4', 'XII TKJ 5'].map((kls) => {
              const studentsInClass = roster.filter((r) => r.kelas === kls);
              return (
                <div key={kls} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                    <span className="font-bold text-xs text-sky-800">{kls}</span>
                    <span className="text-[11px] text-slate-500 font-semibold">{studentsInClass.length}</span>
                  </div>
                  <ul className="space-y-1 text-[11px] text-slate-700 max-h-60 overflow-y-auto">
                    {studentsInClass.map((st, i) => (
                      <li key={i} className="truncate py-0.5 px-1 rounded hover:bg-white">
                        {i + 1}. {st.nama}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail Submission Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setSelectedSubmission(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-200 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                Detail Lembar Jawaban Siswa
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                <span>Nama: <b>{selectedSubmission.nama}</b></span>
                <span>Kelas: <b>{selectedSubmission.kelas}</b></span>
                <span>Waktu: {selectedSubmission.timestamp}</span>
                <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">
                  Nilai: {selectedSubmission.nilai} / 100
                </span>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {HOTS_QUESTIONS.map((q) => {
                const answerText = selectedSubmission.answers?.[q.id] || 'Tidak ada data jawaban tercatat.';
                return (
                  <div key={q.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-1.5 font-bold text-sky-900">
                      <span>Soal {q.id}: {q.badge}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mb-2 font-medium italic">
                      {q.question}
                    </p>
                    <div className="p-2.5 bg-white border border-slate-200 rounded text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {answerText}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
