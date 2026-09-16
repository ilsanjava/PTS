import React, { useState } from 'react';
import { Lock, User, Key, X, AlertCircle } from 'lucide-react';
import { GURU_USER, GURU_PASS } from '../utils/storage';

interface TeacherLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === GURU_USER && password.trim() === GURU_PASS) {
      setError('');
      setUsername('');
      setPassword('');
      onSuccess();
    } else {
      setError('Username atau Password Guru SALAH! Silakan periksa kembali.');
    }
  };

  return (
    <div id="loginModal" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
      <div className="modal-content bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-sky-100 text-sky-700 mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            🔐 Login Guru
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Akses Panel Rekapitulasi Nilai & Impor Data Roster Siswa
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="guruUser" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-600" />
              Username:
            </label>
            <input
              type="text"
              id="guruUser"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username guru..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <div>
            <label htmlFor="guruPass" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-sky-600" />
              Password:
            </label>
            <input
              type="password"
              id="guruPass"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              Login Guru
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
          Kredensial Guru: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">guru</code>
        </div>
      </div>
    </div>
  );
};
