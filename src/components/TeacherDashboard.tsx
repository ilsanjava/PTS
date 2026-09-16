import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  Download,
  Trash2,
  LogOut,
  Search,
  Users,
  Award,
  BookCheck,
  Eye,
  X,
  FileDown,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ClipboardPaste,
  Database,
  Plus,
  Edit3,
  FileSpreadsheet,
  RotateCcw,
  Check
} from 'lucide-react';
import { ExamSubmission, RosterItem } from '../types';
import { HOTS_QUESTIONS } from '../data/questions';
import { INITIAL_ROSTER } from '../data/initialRoster';

interface TeacherDashboardProps {
  submissions: ExamSubmission[];
  roster: RosterItem[];
  onRosterUpdate: (newRoster: RosterItem[]) => void;
  onClearSubmissions: () => void;
  onLogout: () => void;
  onRefresh?: () => Promise<void>;
  onImportSubmissions?: (newSubs: ExamSubmission[]) => Promise<void>;
  isRefreshing?: boolean;
  lastUpdatedTime?: string;
}

const DEFAULT_CLASSES = ['XII TKJ 1', 'XII TKJ 2', 'XII TKJ 3', 'XII TKJ 4', 'XII TKJ 5'];

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  submissions,
  roster,
  onRosterUpdate,
  onClearSubmissions,
  onLogout,
  onRefresh,
  onImportSubmissions,
  isRefreshing = false,
  lastUpdatedTime = '',
}) => {
  const [activeTab, setActiveTab] = useState<'rekap' | 'roster'>('rekap');

  // Submissions Tab states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [selectedSubmission, setSelectedSubmission] = useState<ExamSubmission | null>(null);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedText, setPastedText] = useState('');

  // Roster Tab states
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterClassFilter, setRosterClassFilter] = useState('ALL');
  const [importStatus, setImportStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Add / Edit Student modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState<RosterItem>({
    no: '',
    nisn: '',
    nama: '',
    kelas: 'XII TKJ 1',
  });

  const [editingStudent, setEditingStudent] = useState<{ index: number; item: RosterItem } | null>(null);

  // Import preview / confirmation modal
  const [pendingRosterImport, setPendingRosterImport] = useState<RosterItem[] | null>(null);

  // Filter submissions
  const filteredSubmissions = submissions.filter((item) => {
    const matchClass = filterClass === 'ALL' || item.kelas === filterClass;
    const matchSearch =
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kelas.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSearch;
  });

  // Filter roster items
  const filteredRoster = roster
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) => {
      const matchClass = rosterClassFilter === 'ALL' || item.kelas === rosterClassFilter;
      const searchLower = rosterSearch.toLowerCase().trim();
      const matchSearch =
        !searchLower ||
        item.nama.toLowerCase().includes(searchLower) ||
        (item.nisn && item.nisn.toLowerCase().includes(searchLower)) ||
        (item.no && String(item.no).includes(searchLower)) ||
        item.kelas.toLowerCase().includes(searchLower);
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

  // --------------------------------------------------------------------------
  // DOWNLOAD TEMPLATE FUNCTIONS (.XLSX & .CSV) with [No, NISN, Nama, Kelas]
  // --------------------------------------------------------------------------
  const handleDownloadExcelTemplate = () => {
    const sampleData = [
      ['No', 'NISN', 'Nama', 'Kelas'],
      [1, '0068112001', 'Achmad Fauzan', 'XII TKJ 1'],
      [2, '0068112002', 'Aditya Pratama Putra', 'XII TKJ 1'],
      [3, '0068112003', 'Ahmad Dani Ramadhan', 'XII TKJ 1'],
      [4, '0068112004', 'Alifia Zahra Salsabila', 'XII TKJ 1'],
      [5, '0068112005', 'Bayu Aji Pamungkas', 'XII TKJ 1'],
      [1, '0068122001', 'Agung Wicaksono', 'XII TKJ 2'],
      [2, '0068122002', 'Anisa Rahmawati', 'XII TKJ 2'],
      [3, '0068122003', 'Bagus Tri Atmojo', 'XII TKJ 2'],
      [1, '0068132001', 'Aldi Firmansyah', 'XII TKJ 3'],
      [2, '0068132002', 'Bima Arya Kusuma', 'XII TKJ 3'],
      [1, '0068142001', 'Andika Pratama', 'XII TKJ 4'],
      [2, '0068142002', 'Bambang Pamungkas', 'XII TKJ 4'],
      [1, '0068152001', 'Arya Yudha', 'XII TKJ 5'],
      [2, '0068152002', 'Budi Utomo', 'XII TKJ 5'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    ws['!cols'] = [
      { wch: 6 },  // No
      { wch: 18 }, // NISN
      { wch: 32 }, // Nama
      { wch: 16 }, // Kelas
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Roster_Siswa');
    XLSX.writeFile(wb, 'format_roster_siswa_tkj.xlsx');
  };

  const handleDownloadCsvTemplate = () => {
    let csv = '\uFEFF'; // UTF-8 BOM for Excel compatibility
    csv += 'No,NISN,Nama,Kelas\n';
    csv += '1,0068112001,Achmad Fauzan,XII TKJ 1\n';
    csv += '2,0068112002,Aditya Pratama Putra,XII TKJ 1\n';
    csv += '3,0068112003,Ahmad Dani Ramadhan,XII TKJ 1\n';
    csv += '4,0068112004,Alifia Zahra Salsabila,XII TKJ 1\n';
    csv += '5,0068112005,Bayu Aji Pamungkas,XII TKJ 1\n';
    csv += '1,0068122001,Agung Wicaksono,XII TKJ 2\n';
    csv += '2,0068122002,Anisa Rahmawati,XII TKJ 2\n';
    csv += '1,0068132001,Aldi Firmansyah,XII TKJ 3\n';
    csv += '1,0068142001,Andika Pratama,XII TKJ 4\n';
    csv += '1,0068152001,Arya Yudha,XII TKJ 5\n';

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'format_roster_siswa_tkj.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --------------------------------------------------------------------------
  // IMPORT ROSTER HANDLER (.XLSX / .XLS / .CSV) with [No, NISN, Nama, Kelas]
  // --------------------------------------------------------------------------
  const handleRosterFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportStatus('Memproses file roster siswa...');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        if (!jsonData || jsonData.length === 0) {
          alert('File spreadsheet kosong!');
          setIsProcessing(false);
          return;
        }

        // Detect column positions
        const headerRow = jsonData[0].map((h) => String(h || '').trim().toLowerCase());
        let noIdx = headerRow.findIndex((h) => h === 'no' || h.includes('nomor') || h.includes('urut'));
        let nisnIdx = headerRow.findIndex((h) => h.includes('nisn') || h.includes('nis') || h.includes('induk'));
        let nameIdx = headerRow.findIndex((h) => h.includes('nama') || h.includes('siswa') || h.includes('student') || h.includes('name'));
        let classIdx = headerRow.findIndex((h) => h.includes('kelas') || h.includes('class') || h.includes('rombel'));

        // Fallbacks if no matching headers found:
        // Case A: 4 columns: [No, NISN, Nama, Kelas]
        if (nameIdx === -1 && jsonData[0].length >= 4) {
          noIdx = 0;
          nisnIdx = 1;
          nameIdx = 2;
          classIdx = 3;
        } else if (nameIdx === -1 && jsonData[0].length === 3) {
          // Case B: 3 columns: [NISN, Nama, Kelas]
          noIdx = -1;
          nisnIdx = 0;
          nameIdx = 1;
          classIdx = 2;
        } else if (nameIdx === -1 && jsonData[0].length === 2) {
          // Case C: 2 columns: [Nama, Kelas]
          noIdx = -1;
          nisnIdx = -1;
          nameIdx = 0;
          classIdx = 1;
        }

        const startIndex = (nameIdx !== -1 && (headerRow[nameIdx] || '').includes('nama')) ? 1 : 0;
        const parsedRoster: RosterItem[] = [];

        for (let i = startIndex; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const rawName = nameIdx >= 0 && row[nameIdx] !== undefined ? String(row[nameIdx]).trim() : '';
          if (!rawName || rawName.toLowerCase() === 'nama' || rawName.toLowerCase() === 'nama siswa') continue;

          const rawClass = classIdx >= 0 && row[classIdx] !== undefined ? String(row[classIdx]).trim() : 'XII TKJ 1';
          const rawNisn = nisnIdx >= 0 && row[nisnIdx] !== undefined ? String(row[nisnIdx]).trim().replace(/^'/, '') : '';
          const rawNo = noIdx >= 0 && row[noIdx] !== undefined ? String(row[noIdx]).trim() : String(parsedRoster.length + 1);

          parsedRoster.push({
            no: rawNo || parsedRoster.length + 1,
            nisn: rawNisn,
            nama: rawName,
            kelas: rawClass,
          });
        }

        if (parsedRoster.length > 0) {
          setPendingRosterImport(parsedRoster);
          setImportStatus(`✔ Terbaca ${parsedRoster.length} data siswa dari file. Silakan konfirmasi metode penyimpanan.`);
        } else {
          alert('Tidak dapat menemukan data siswa yang valid. Pastikan format kolom: No, NISN, Nama, Kelas.');
          setImportStatus('');
        }
      } catch (err: any) {
        alert('Gagal membaca file Excel/CSV: ' + err.message);
        setImportStatus('');
      } finally {
        setIsProcessing(false);
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Apply imported roster (Replace or Merge)
  const handleApplyRosterImport = (mode: 'replace' | 'merge') => {
    if (!pendingRosterImport) return;

    let updatedRoster: RosterItem[] = [];
    if (mode === 'replace') {
      updatedRoster = [...pendingRosterImport];
    } else {
      // Merge by Nama + Kelas
      const map = new Map<string, RosterItem>();
      roster.forEach((item) => {
        const key = `${item.nama.toLowerCase()}_${item.kelas.toLowerCase()}`;
        map.set(key, item);
      });

      pendingRosterImport.forEach((item) => {
        const key = `${item.nama.toLowerCase()}_${item.kelas.toLowerCase()}`;
        map.set(key, item); // overwrites/updates with new data
      });

      updatedRoster = Array.from(map.values());
    }

    onRosterUpdate(updatedRoster);
    setImportStatus(`✔ Berhasil menyimpan ${updatedRoster.length} data roster siswa ke server!`);
    setPendingRosterImport(null);
  };

  // --------------------------------------------------------------------------
  // MANUAL ADD, EDIT, DELETE ROSTER
  // --------------------------------------------------------------------------
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNama = newStudent.nama.trim();
    if (!trimmedNama) {
      alert('Nama siswa tidak boleh kosong!');
      return;
    }

    const itemToAdd: RosterItem = {
      no: newStudent.no || roster.length + 1,
      nisn: newStudent.nisn?.trim() || '',
      nama: trimmedNama,
      kelas: newStudent.kelas.trim() || 'XII TKJ 1',
    };

    const updated = [...roster, itemToAdd];
    onRosterUpdate(updated);

    // Reset and close
    setNewStudent({ no: '', nisn: '', nama: '', kelas: 'XII TKJ 1' });
    setIsAddModalOpen(false);
    setImportStatus(`✔ Berhasil menambahkan siswa "${trimmedNama}" ke ${itemToAdd.kelas}.`);
  };

  const handleEditStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const trimmedNama = editingStudent.item.nama.trim();
    if (!trimmedNama) {
      alert('Nama siswa tidak boleh kosong!');
      return;
    }

    const updated = [...roster];
    updated[editingStudent.index] = {
      ...editingStudent.item,
      nama: trimmedNama,
      nisn: editingStudent.item.nisn?.trim() || '',
      kelas: editingStudent.item.kelas.trim() || 'XII TKJ 1',
    };

    onRosterUpdate(updated);
    setEditingStudent(null);
    setImportStatus(`✔ Berhasil memperbarui data siswa "${trimmedNama}".`);
  };

  const handleDeleteStudent = (indexToDelete: number) => {
    const student = roster[indexToDelete];
    if (!student) return;

    if (confirm(`Apakah Anda yakin ingin menghapus siswa "${student.nama}" (${student.kelas}) dari daftar roster?`)) {
      const updated = roster.filter((_, idx) => idx !== indexToDelete);
      onRosterUpdate(updated);
      setImportStatus(`✔ Berhasil menghapus "${student.nama}" dari roster.`);
    }
  };

  const handleResetToDefaultRoster = () => {
    if (confirm('Kembalikan roster ke daftar 75 siswa bawaan SMK XII TKJ (1-5)? Perubahan kustom yang belum diekspor akan digantikan.')) {
      onRosterUpdate([...INITIAL_ROSTER]);
      setImportStatus('✔ Roster berhasil dikembalikan ke 75 siswa awal dengan nomor NISN lengkap.');
    }
  };

  // --------------------------------------------------------------------------
  // SUBMISSION LOGIC (REKAP TAB)
  // --------------------------------------------------------------------------
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

  const handleClearSubmissionsConfirm = () => {
    if (confirm('Apakah Anda yakin ingin MENGHAPUS SEMUA REKAP NILAI siswa dari halaman dan server?')) {
      onClearSubmissions();
    }
  };

  // Import existing submissions from Sheets CSV/Excel
  const handleSubmissionsFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          alert('File spreadsheet kosong atau tidak memiliki baris data.');
          return;
        }

        const header = jsonData[0].map((h) => String(h || '').toLowerCase());
        let timeIdx = header.findIndex((h) => h.includes('waktu') || h.includes('timestamp') || h.includes('tanggal'));
        let nameIdx = header.findIndex((h) => h.includes('nama') || h.includes('siswa') || h.includes('student'));
        let classIdx = header.findIndex((h) => h.includes('kelas') || h.includes('class'));
        let scoreIdx = header.findIndex((h) => h.includes('nilai') || h.includes('skor') || h.includes('score'));
        let detailIdx = header.findIndex((h) => h.includes('rincian') || h.includes('poin') || h.includes('detail'));

        if (nameIdx === -1) {
          timeIdx = 0;
          nameIdx = 1;
          classIdx = 2;
          scoreIdx = 3;
          detailIdx = 4;
        }

        const imported: ExamSubmission[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;

          const nama = nameIdx >= 0 && row[nameIdx] ? String(row[nameIdx]).trim() : '';
          const kelas = classIdx >= 0 && row[classIdx] ? String(row[classIdx]).trim() : 'XII TKJ 1';
          const nilai = scoreIdx >= 0 && row[scoreIdx] !== undefined ? String(row[scoreIdx]).trim() : '0';
          const timestamp = timeIdx >= 0 && row[timeIdx] ? String(row[timeIdx]).trim() : new Date().toLocaleString('id-ID');
          const rincian = detailIdx >= 0 && row[detailIdx] ? String(row[detailIdx]).trim() : '';

          if (nama && nama.toLowerCase() !== 'nama siswa') {
            imported.push({
              id: `sub-imp-${Date.now()}-${i}`,
              timestamp,
              nama,
              kelas,
              nilai,
              rincian,
              syncedToGoogleSheets: true,
            });
          }
        }

        if (imported.length > 0 && onImportSubmissions) {
          await onImportSubmissions(imported);
          alert(`Berhasil mengimpor ${imported.length} riwayat nilai siswa ke rekap guru dan server!`);
        } else {
          alert('Tidak ada data nilai siswa yang dapat dikenali dalam file.');
        }
      } catch (err: any) {
        alert('Gagal mengimpor file rekap: ' + err.message);
      } finally {
        setIsProcessing(false);
        e.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Paste text handler
  const handleProcessPastedText = async () => {
    if (!pastedText.trim()) {
      alert('Silakan tempel teks tabel dari Google Sheets terlebih dahulu!');
      return;
    }

    try {
      const lines = pastedText.trim().split(/\r\n|\n/);
      const imported: ExamSubmission[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(/\t|,/);
        if (cols.length >= 2) {
          const firstCol = cols[0].toLowerCase();
          if (firstCol.includes('timestamp') || firstCol.includes('nama') || firstCol.includes('no')) continue;

          let timestamp = new Date().toLocaleString('id-ID');
          let nama = '';
          let kelas = 'XII TKJ 1';
          let nilai = '0';
          let rincian = '';

          if (cols.length >= 4) {
            timestamp = cols[0].trim();
            nama = cols[1].trim();
            kelas = cols[2].trim();
            nilai = cols[3].trim();
            if (cols[4]) rincian = cols[4].trim();
          } else if (cols.length === 3) {
            nama = cols[0].trim();
            kelas = cols[1].trim();
            nilai = cols[2].trim();
          } else if (cols.length === 2) {
            nama = cols[0].trim();
            kelas = cols[1].trim();
          }

          if (nama) {
            imported.push({
              id: `sub-paste-${Date.now()}-${i}`,
              timestamp,
              nama,
              kelas,
              nilai,
              rincian,
              syncedToGoogleSheets: true,
            });
          }
        }
      }

      if (imported.length > 0 && onImportSubmissions) {
        await onImportSubmissions(imported);
        setIsPasteModalOpen(false);
        setPastedText('');
        alert(`Berhasil mengimpor ${imported.length} data rekap siswa!`);
      } else {
        alert('Format teks tidak dikenali. Pastikan menyalin minimal kolom Nama dan Kelas/Nilai.');
      }
    } catch (err: any) {
      alert('Gagal memproses data tempel: ' + err.message);
    }
  };

  return (
    <div id="teacherDashboard" className="bg-white rounded-2xl border-2 border-sky-700 p-5 sm:p-7 shadow-lg mb-10 print:hidden animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b-2 border-sky-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-700 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            👨‍🏫
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              Panel Guru: Monitoring & Rekap Nilai Siswa
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Asesmen HOTS MikroTik QoS • Kurikulum Merdeka XII TKJ (1 - 5)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50"
              title="Perbarui data kiriman siswa terbaru dari server"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-700' : ''}`} />
              <span>{isRefreshing ? 'Menyinkronkan...' : 'Segarkan Data'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Panel</span>
          </button>
        </div>
      </div>

      {/* Real-time sync status banner */}
      <div className="mb-6 p-3 bg-emerald-50/80 border border-emerald-300 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-bold">Sinkronisasi Real-Time Server Terpusat Aktif</span>
          <span className="text-emerald-700 hidden sm:inline">• Setiap siswa yang menekan "Kirim Jawaban" dari HP/laptop akan langsung tersimpan ke server dan otomatis muncul di sini.</span>
        </div>
        {lastUpdatedTime && (
          <span className="text-emerald-700 font-mono text-[11px]">
            Pembaruan: {lastUpdatedTime}
          </span>
        )}
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
            <span>Siswa Mengirim</span>
            <BookCheck className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalSubmissions}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tercatat di server</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
            <span>Rata-Rata Nilai</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{avgScore}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Skala 0 - 100</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
            <span>Nilai Tertinggi</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700">{maxScore}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Top score ujian</div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase mb-1">
            <span>Roster Siswa</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-sky-800">{roster.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Siswa terdaftar aktif</div>
        </div>
      </div>

      {/* Tab Controls */}
      <div className="flex items-center gap-2 mb-5 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('rekap')}
          className={`pb-2.5 px-3 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'rekap'
              ? 'border-sky-700 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>📋 Rekapitulasi Hasil Ujian Siswa ({submissions.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={`pb-2.5 px-3 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'roster'
              ? 'border-sky-700 text-sky-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>👥 Daftar Roster Terpasang ({roster.length} Siswa)</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: REKAPITULASI HASIL UJIAN SISWA                                */}
      {/* ==================================================================== */}
      {activeTab === 'rekap' && (
        <div>
          {/* Quick Tool / Action Toolbar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-sky-700" />
                  Alat Impor Data Rekap Nilai Siswa
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Impor rekap jika siswa telah mengerjakan sebelumnya di Google Sheets, atau unduh hasil ke Excel.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Impor Rekap (.CSV/.XLSX)</span>
                  <input
                    type="file"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleSubmissionsFileUpload}
                    disabled={isProcessing}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setIsPasteModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span>Tempel Teks Spreadsheet</span>
                </button>
              </div>
            </div>
          </div>

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
                {DEFAULT_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
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
                onClick={handleClearSubmissionsConfirm}
                className="btn-action inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Semua Rekap</span>
              </button>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs bg-white">
            <table id="rekapTable" className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-sky-700 text-white">
                <tr>
                  <th className="py-2.5 px-3 font-semibold text-center w-12">No</th>
                  <th className="py-2.5 px-3 font-semibold w-36">Waktu Ujian</th>
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
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <BookCheck className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-slate-600">Belum ada rekap nilai siswa yang sesuai kriteria pencarian.</p>
                        <p className="text-[11px] text-slate-400 max-w-md text-center">
                          Hasil pengerjaan siswa akan otomatis muncul di sini begitu siswa mengklik tombol "Kirim Jawaban & Evaluasi Otomatis".
                        </p>
                      </div>
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
                        {row.rincian || '-'}
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

      {/* ==================================================================== */}
      {/* TAB 2: DAFTAR ROSTER TERPASANG (BISA EDIT, TAMBAH, IMPORT XLS)        */}
      {/* ==================================================================== */}
      {activeTab === 'roster' && (
        <div>
          {/* Top Instruction & Template Download Banner */}
          <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 sm:p-5 mb-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-xl">
                <h4 className="text-sm sm:text-base font-bold text-sky-900 mb-1 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-sky-700" />
                  Format File Roster Siswa (.XLSX / .XLS / .CSV)
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  File spreadsheet roster yang Anda unggah harus memuat 4 kolom utama: <b>No</b>, <b>NISN</b>, <b>Nama</b>, dan <b>Kelas</b>.
                  Unduh template resmi di sebelah kanan untuk langsung diisi sesuai format data sekolah.
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-mono text-sky-800">
                  <span className="bg-white px-2 py-0.5 rounded border border-sky-200">Kolom 1: No</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-sky-200">Kolom 2: NISN (10 Digit)</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-sky-200">Kolom 3: Nama Siswa</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-sky-200">Kolom 4: Kelas (contoh: XII TKJ 1)</span>
                </div>
              </div>

              {/* Action Buttons: Download Templates */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                  title="Download template file format Microsoft Excel .xlsx"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Download Format Excel (.XLSX)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCsvTemplate}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                  title="Download template file format .CSV"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Download Format CSV</span>
                </button>
              </div>
            </div>

            {/* Upload Box */}
            <div className="mt-4 pt-4 border-t border-sky-200/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Unggah / Import File Roster (.XLSX / .XLS / .CSV)</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleRosterFileUpload}
                    disabled={isProcessing}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-slate-500">
                  Mendukung file Excel (.xlsx / .xls) dan CSV
                </span>
              </div>

              <button
                type="button"
                onClick={handleResetToDefaultRoster}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 underline transition-colors cursor-pointer"
                title="Kembalikan ke daftar awal 75 siswa"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Roster Bawaan</span>
              </button>
            </div>

            {importStatus && (
              <p className="text-xs sm:text-sm font-bold text-emerald-700 mt-3 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {importStatus}
              </p>
            )}
          </div>

          {/* Roster Controls: Search, Filter, Add Student Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama atau NISN siswa..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 w-48 sm:w-60"
                />
              </div>

              <select
                value={rosterClassFilter}
                onChange={(e) => setRosterClassFilter(e.target.value)}
                className="py-1.5 px-3 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option value="ALL">Semua Kelas ({roster.length} Siswa)</option>
                {DEFAULT_CLASSES.map((cls) => {
                  const count = roster.filter((r) => r.kelas === cls).length;
                  return (
                    <option key={cls} value={cls}>
                      {cls} ({count} Siswa)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setNewStudent({
                    no: String(roster.length + 1),
                    nisn: '',
                    nama: '',
                    kelas: rosterClassFilter !== 'ALL' ? rosterClassFilter : 'XII TKJ 1',
                  });
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Siswa Manual</span>
              </button>
            </div>
          </div>

          {/* Roster Table with Edit & Delete */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs bg-white">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead className="bg-sky-800 text-white">
                <tr>
                  <th className="py-2.5 px-3 font-semibold text-center w-14">No</th>
                  <th className="py-2.5 px-3 font-semibold w-36">NISN</th>
                  <th className="py-2.5 px-3 font-semibold">Nama Lengkap Siswa</th>
                  <th className="py-2.5 px-3 font-semibold w-32">Kelas</th>
                  <th className="py-2.5 px-3 font-semibold text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRoster.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">Tidak ada siswa yang sesuai pencarian atau filter.</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Gunakan tombol "Tambah Siswa Manual" atau unggah file Excel/CSV untuk menambahkan data.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRoster.map(({ item, originalIndex }, displayIdx) => (
                    <tr key={originalIndex} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                        {item.no || displayIdx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 font-medium">
                        {item.nisn ? (
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 text-[11px]">
                            {item.nisn}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">- Belum ada -</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {item.nama}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block px-2.5 py-0.5 rounded bg-sky-50 text-sky-800 font-semibold border border-sky-200 text-[11px]">
                          {item.kelas}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingStudent({ index: originalIndex, item: { ...item } })}
                            className="p-1.5 rounded hover:bg-sky-100 text-sky-700 transition-colors cursor-pointer"
                            title="Edit Data Siswa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(originalIndex)}
                            className="p-1.5 rounded hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="Hapus Siswa dari Roster"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Menampilkan <b>{filteredRoster.length}</b> dari total <b>{roster.length}</b> siswa
            </span>
            <span>
              Data tersimpan otomatis di server terpusat & localStorage browser
            </span>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: KONFIRMASI IMPOR ROSTER (GANTI / GABUNG)                      */}
      {/* ==================================================================== */}
      {pendingRosterImport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5 text-sky-700" />
              Konfirmasi Impor Roster Siswa
            </h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Ditemukan <b>{pendingRosterImport.length}</b> data siswa dari file yang Anda unggah.
              Bagaimana Anda ingin menyimpan data ini ke sistem?
            </p>

            {/* Quick Preview */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 mb-5 max-h-40 overflow-y-auto text-xs font-mono">
              <div className="font-bold text-slate-500 pb-1 mb-1 border-b border-slate-200">
                Pratinjau Data (3 Siswa Pertama):
              </div>
              {pendingRosterImport.slice(0, 3).map((s, i) => (
                <div key={i} className="truncate text-slate-700 py-0.5">
                  • {s.no ? `[${s.no}] ` : ''}{s.nisn ? `${s.nisn} - ` : ''}<b>{s.nama}</b> ({s.kelas})
                </div>
              ))}
              {pendingRosterImport.length > 3 && (
                <div className="text-slate-400 italic mt-1">
                  ... dan {pendingRosterImport.length - 3} siswa lainnya.
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => handleApplyRosterImport('replace')}
                className="flex-1 py-2.5 px-3 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer text-center"
              >
                Ganti Seluruh Roster
              </button>
              <button
                type="button"
                onClick={() => handleApplyRosterImport('merge')}
                className="flex-1 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer text-center"
              >
                Gabungkan / Tambahkan
              </button>
              <button
                type="button"
                onClick={() => setPendingRosterImport(null)}
                className="py-2.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer text-center"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: TAMBAH SISWA MANUAL                                           */}
      {/* ==================================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-700" />
              Tambah Siswa Baru ke Roster
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Isi identitas siswa lengkap agar otomatis muncul saat siswa memilih nama untuk ujian.
            </p>

            <form onSubmit={handleAddStudentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Urut / No:</label>
                <input
                  type="text"
                  value={newStudent.no || ''}
                  onChange={(e) => setNewStudent({ ...newStudent, no: e.target.value })}
                  placeholder="Contoh: 1, 2, atau 16"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NISN (Nomor Induk Siswa Nasional):</label>
                <input
                  type="text"
                  value={newStudent.nisn || ''}
                  onChange={(e) => setNewStudent({ ...newStudent, nisn: e.target.value })}
                  placeholder="Contoh: 0068112016 (10 Digit)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Siswa: <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  required
                  value={newStudent.nama}
                  onChange={(e) => setNewStudent({ ...newStudent, nama: e.target.value })}
                  placeholder="Contoh: Muhammad Syukri"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kelas: <span className="text-rose-600">*</span></label>
                <select
                  value={newStudent.kelas}
                  onChange={(e) => setNewStudent({ ...newStudent, kelas: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  {DEFAULT_CLASSES.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg shadow-xs"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: EDIT SISWA                                                    */}
      {/* ==================================================================== */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setEditingStudent(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-sky-700" />
              Edit Data Siswa
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Perbarui Nomor, NISN, Nama, atau Kelas siswa.
            </p>

            <form onSubmit={handleEditStudentSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nomor Urut / No:</label>
                <input
                  type="text"
                  value={editingStudent.item.no || ''}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      item: { ...editingStudent.item, no: e.target.value },
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">NISN (Nomor Induk Siswa Nasional):</label>
                <input
                  type="text"
                  value={editingStudent.item.nisn || ''}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      item: { ...editingStudent.item, nisn: e.target.value },
                    })
                  }
                  placeholder="Contoh: 0068112001"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Siswa: <span className="text-rose-600">*</span></label>
                <input
                  type="text"
                  required
                  value={editingStudent.item.nama}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      item: { ...editingStudent.item, nama: e.target.value },
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kelas: <span className="text-rose-600">*</span></label>
                <select
                  value={editingStudent.item.kelas}
                  onChange={(e) =>
                    setEditingStudent({
                      ...editingStudent,
                      item: { ...editingStudent.item, kelas: e.target.value },
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  {DEFAULT_CLASSES.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: PASTE REKAP FROM GOOGLE SHEETS                                */}
      {/* ==================================================================== */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setIsPasteModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <ClipboardPaste className="w-5 h-5 text-sky-700" />
              Tempel Data Teks dari Google Spreadsheet
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Buka Google Spreadsheet nilai Anda, blok baris siswa (Timestamp, Nama, Kelas, Nilai), tekan <b>Ctrl + C</b>, lalu tempel (<b>Ctrl + V</b>) pada kotak di bawah ini:
            </p>

            <textarea
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Contoh:&#10;15/09/2026 09:30&#9;Aditya Pratama Putra&#9;XII TKJ 1&#9;85.0&#9;S1: 10.0 | S2: 8.5&#10;15/09/2026 09:35&#9;Bima Arya Kusuma&#9;XII TKJ 3&#9;92.0&#9;S1: 10.0 | S2: 9.0"
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 bg-slate-50"
            />

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleProcessPastedText}
                className="px-4 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-sm"
              >
                Proses & Simpan ke Rekap
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: DETAIL JAWABAN SISWA                                         */}
      {/* ==================================================================== */}
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
                const answerText = selectedSubmission.answers?.[q.id] || 'Jawaban tidak tersimpan pada detail.';
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
