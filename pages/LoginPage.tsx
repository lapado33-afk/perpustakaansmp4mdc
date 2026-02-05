
import React, { useState } from 'react';
import { Library, Lock, User as UserIcon, ShieldCheck, ArrowRight } from 'lucide-react';
import { User, UserRole } from '../types';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin') {
      onLogin({ id: '1', name: 'Petugas Perpustakaan', role: UserRole.ADMIN, username: 'admin' });
    } else if (username === 'user' && password === 'user') {
      onLogin({ id: '2', name: 'Siswa / Guru', role: UserRole.USER, username: 'user' });
    } else {
      setError('Username atau password salah.');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      {/* Left side - Visuals */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-900 items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://picsum.photos/1200/800')] bg-cover"></div>
        <div className="z-10 max-w-lg text-center">
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl inline-block mb-8 border border-white/20">
             <Library size={64} className="text-indigo-200" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">E-Pustaka SMPN 4 Mappedeceng</h1>
          <p className="text-indigo-200 text-lg leading-relaxed">
            Sistem manajemen perpustakaan modern, cepat, dan mudah untuk mencerdaskan generasi bangsa.
          </p>
          <div className="mt-12 flex justify-center gap-12">
            <div className="text-center">
              <p className="text-3xl font-bold">1.2k+</p>
              <p className="text-xs text-indigo-300 uppercase font-bold tracking-widest mt-1">Koleksi Buku</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">500+</p>
              <p className="text-xs text-indigo-300 uppercase font-bold tracking-widest mt-1">Anggota Aktif</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md">
          <div className="text-center lg:hidden mb-12">
            <div className="bg-indigo-600 p-4 rounded-2xl inline-block mb-4 shadow-lg shadow-indigo-200">
               <Library size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">E-Pustaka</h2>
            <p className="text-slate-500">SMPN 4 Mappedeceng</p>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h3 className="text-3xl font-bold text-slate-800">Selamat Datang</h3>
            <p className="text-slate-500 mt-2">Silakan masuk ke akun perpustakaan Anda.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 animate-pulse">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <UserIcon size={16} /> Username
              </label>
              <input 
                required
                type="text" 
                placeholder="Masukkan username"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 italic">Petunjuk: Gunakan 'admin' atau 'user'</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                <Lock size={16} /> Password
              </label>
              <input 
                required
                type="password" 
                placeholder="Masukkan password"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              Sign In
              <ArrowRight size={20} />
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-400">
            <ShieldCheck size={16} />
            <p className="text-xs">Sistem Terenkripsi & Aman</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
