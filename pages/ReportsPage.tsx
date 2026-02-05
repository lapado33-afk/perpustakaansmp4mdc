
import React, { useMemo, useState } from 'react';
import { 
  Printer, 
  Download, 
  AlertTriangle,
  Award,
  Sparkles,
  Loader2,
  FileSearch,
  User,
  Filter,
  CheckCircle2,
  AlertCircle,
  Key,
  Info
} from 'lucide-react';
import { Book, Loan, LoanStatus } from '../types';
import { GoogleGenAI } from "@google/genai";
import { storageService } from '../services/storageService';

interface ReportsPageProps {
  books: Book[];
  loans: Loan[];
}

type DateFilter = 'all' | 'daily' | 'weekly' | 'monthly';

const ReportsPage: React.FC<ReportsPageProps> = ({ books, loans }) => {
  const [aiReport, setAiReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [librarianName, setLibrarianName] = useState('Admin Perpustakaan');
  
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = useMemo(() => {
    const cats = new Set(books.map(b => b.category));
    return Array.from(cats);
  }, [books]);

  const filteredLoans = useMemo(() => {
    let result = [...loans];

    if (categoryFilter !== 'all') {
      const bookIdsInCategory = books
        .filter(b => b.category === categoryFilter)
        .map(b => b.id);
      result = result.filter(l => bookIdsInCategory.includes(l.bookId));
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    if (dateFilter === 'daily') {
      result = result.filter(l => l.loanDate === todayStr);
    } else if (dateFilter === 'weekly') {
      const lastWeek = new Date();
      lastWeek.setDate(now.getDate() - 7);
      result = result.filter(l => new Date(l.loanDate) >= lastWeek);
    } else if (dateFilter === 'monthly') {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      result = result.filter(l => new Date(l.loanDate) >= firstDayOfMonth);
    }

    return result;
  }, [loans, books, dateFilter, categoryFilter]);

  const topBooks = useMemo(() => {
    const counts: Record<string, {title: string, count: number}> = {};
    filteredLoans.forEach(loan => {
      if (!counts[loan.bookId]) {
        counts[loan.bookId] = { title: loan.bookTitle, count: 0 };
      }
      counts[loan.bookId].count += 1;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [filteredLoans]);

  const lateReturns = useMemo(() => {
    return filteredLoans.filter(l => l.status === LoanStatus.TERLAMBAT);
  }, [filteredLoans]);

  const stats = useMemo(() => {
    const relevantBooks = categoryFilter === 'all' 
      ? books 
      : books.filter(b => b.category === categoryFilter);

    return {
      totalBooks: relevantBooks.reduce((acc, curr) => acc + (curr.count || 0), 0),
      totalLoans: filteredLoans.length,
      totalLate: lateReturns.length,
      totalFines: lateReturns.reduce((acc, curr) => acc + (curr.fine || 0), 0),
      popularBook: topBooks[0]?.title || 'Belum ada data'
    };
  }, [books, filteredLoans, lateReturns, topBooks, categoryFilter]);

  const generateAIReport = async () => {
    setErrorMsg(null);
    
    if (!librarianName.trim()) {
      setErrorMsg("Mohon masukkan nama petugas pelapor.");
      return;
    }

    const apiKey = process.env.API_KEY;
    
    // Logika deteksi kesalahan API KEY yang lebih mendalam
    if (!apiKey || apiKey === "API_KEY_ANDA" || apiKey === "") {
      setErrorMsg(`API_KEY tidak ditemukan sistem. 
        Pastikan Bro sudah: 
        1. Menambahkan "API_KEY" di menu Environment Variables.
        2. Mencentang 'Production', 'Preview', dan 'Development'.
        3. Melakukan 'Redeploy' aplikasi setelah menyimpan perubahan.`);
      return;
    }
    
    setIsGenerating(true);
    setIsSynced(false);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const filterDesc = `Periode: ${dateFilter === 'all' ? 'Semua Waktu' : dateFilter}, Kategori: ${categoryFilter === 'all' ? 'Semua Kategori' : categoryFilter}`;
      
      const prompt = `
        Tulis laporan naratif resmi perpustakaan sekolah.
        
        IDENTITAS:
        - Sekolah: UPT SMPN 4 Mappedeceng
        - Petugas: ${librarianName}
        - Filter: ${filterDesc}
        
        DATA:
        - Total Koleksi: ${stats.totalBooks} buku
        - Total Peminjaman: ${stats.totalLoans} transaksi
        - Buku Terpopuler: ${stats.popularBook}
        - Kasus Terlambat: ${stats.totalLate}
        - Total Denda: Rp ${stats.totalFines.toLocaleString()}

        INSTRUKSI:
        - Bahasa Indonesia Formal & Profesional.
        - DILARANG menggunakan tanda markdown (seperti *, #, _, atau - di awal baris).
        - Format paragraf mengalir.
        - Analisis singkat tren minat baca.
        - Judul: LAPORAN SIRKULASI PERPUSTAKAAN UPT SMPN 4 MAPPEDECENG.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const resultText = response.text;
      if (!resultText) throw new Error("Gagal menerima teks dari AI.");

      // Pembersihan total dari markdown
      const cleanText = resultText.replace(/[*#_]/g, '').replace(/^- /gm, '').trim();
      setAiReport(cleanText);
      
      storageService.saveReport({
        timestamp: new Date().toLocaleString('id-ID'),
        librarian: librarianName,
        filter: filterDesc,
        content: cleanText
      });
      setIsSynced(true);

    } catch (error: any) {
      console.error("AI Error:", error);
      let msg = 'Gagal menyusun laporan. Silakan periksa koneksi internet atau API Key Bro.';
      if (error.message?.includes('401')) msg = 'API Key tidak valid atau telah kedaluwarsa.';
      if (error.message?.includes('403')) msg = 'Akses API ditolak. Periksa batasan region atau API Key.';
      setErrorMsg(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-800">Laporan & Rekapitulasi</h1>
            <p className="text-slate-500 mb-4">Analisis data sirkulasi buku secara otomatis menggunakan AI.</p>
            
            <div className="max-w-xs space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <User size={12} /> Nama Petugas Pelapor
              </label>
              <input 
                type="text" 
                placeholder="Nama petugas..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm"
                value={librarianName}
                onChange={(e) => setLibrarianName(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button 
              onClick={generateAIReport}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-50 active:scale-95"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              {isGenerating ? 'Menyusun Laporan...' : 'Buat Laporan AI'}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
              <Download size={18} />
              Excel
            </button>
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-900 transition-colors shadow-sm"
            >
              <Printer size={18} />
              Cetak PDF
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-600" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-red-800">Masalah Konfigurasi Sistem</p>
              <p className="text-xs text-red-700 leading-relaxed whitespace-pre-line">{errorMsg}</p>
              <div className="pt-2 flex items-center gap-2 text-[10px] text-red-500 font-bold uppercase">
                <Info size={12} /> Cek Dashboard Hosting Bro (Vercel/Lainnya)
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mr-2">
            <Filter size={18} />
            <span className="text-sm font-bold uppercase tracking-wider">Filter Laporan</span>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Waktu</span>
            <select 
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            >
              <option value="all">Semua Waktu</option>
              <option value="daily">Hari Ini</option>
              <option value="weekly">Minggu Ini</option>
              <option value="monthly">Bulan Ini</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Kategori</span>
            <select 
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {aiReport && (
        <div className="bg-white rounded-3xl shadow-xl border border-indigo-50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-gradient-to-r from-indigo-50 to-white px-8 py-5 border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-3 text-indigo-700 font-bold">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <FileSearch size={20} />
              </div>
              <span className="tracking-tight text-sm md:text-base">Laporan Resmi Sirkulasi</span>
              {isSynced && (
                <div className="hidden md:flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full ml-2">
                  <CheckCircle2 size={12} /> Sinkron Cloud OK
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Key size={14} /> API Active
            </div>
          </div>
          
          <div className="p-10 md:p-16 max-w-4xl mx-auto bg-white">
            <div className="font-serif text-slate-800 leading-[2.2] text-lg text-justify whitespace-pre-line">
              {aiReport}
              
              <div className="mt-20 flex justify-end">
                <div className="text-center w-64">
                  <p className="mb-20">Mappedeceng, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-bold border-b-2 border-slate-900 inline-block px-4">{librarianName}</p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-sans font-bold">Petugas Administrasi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Award className="text-amber-500" size={22} />
            Peringkat Koleksi
          </h3>
          <div className="space-y-4">
            {topBooks.map((book, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-indigo-100">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-xs font-black text-indigo-600">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-slate-700 truncate max-w-[180px] md:max-w-xs">{book.title}</span>
                </div>
                <span className="shrink-0 text-indigo-600 font-bold text-[10px] bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100 uppercase">
                  {book.count}x Pinjam
                </span>
              </div>
            ))}
            {topBooks.length === 0 && <p className="text-center py-10 text-slate-400 italic">Data belum mencukupi.</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={22} />
            Data Keterlambatan
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-red-50 rounded-xl border border-red-100 text-center">
              <p className="text-[10px] text-red-600 font-black uppercase tracking-wider mb-2">Kasus</p>
              <p className="text-4xl font-black text-red-700">{lateReturns.length}</p>
            </div>
            <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
              <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider mb-2">Denda</p>
              <p className="text-2xl font-black text-emerald-700 truncate">Rp{stats.totalFines.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
