
import React, { useMemo, useState } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Calendar,
  AlertTriangle,
  Award,
  Sparkles,
  Loader2,
  FileSearch,
  User,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Book, Loan, Member, LoanStatus } from '../types';
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
      totalBooks: relevantBooks.reduce((acc, curr) => acc + curr.count, 0),
      totalLoans: filteredLoans.length,
      totalLate: lateReturns.length,
      totalFines: lateReturns.reduce((acc, curr) => acc + curr.fine, 0),
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
    if (!apiKey || apiKey === "API_KEY_ANDA") {
      setErrorMsg("API Key tidak ditemukan. Pastikan Anda sudah memasukkan API Key Gemini di pengaturan Environment Variables.");
      return;
    }
    
    setIsGenerating(true);
    setIsSynced(false);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const filterDesc = `Periode: ${dateFilter === 'all' ? 'Semua Waktu' : dateFilter}, Kategori: ${categoryFilter === 'all' ? 'Semua Kategori' : categoryFilter}`;
      
      const prompt = `
        Buatlah laporan naratif formal untuk Perpustakaan UPT SMPN 4 Mappedeceng.
        
        DATA STATISTIK:
        - Nama Petugas: ${librarianName}
        - Periode Laporan: ${filterDesc}
        - Total Koleksi Buku: ${stats.totalBooks}
        - Total Transaksi Peminjaman: ${stats.totalLoans}
        - Buku Paling Banyak Dipinjam: ${stats.popularBook}
        - Jumlah Siswa Terlambat Mengembalikan: ${stats.totalLate}
        - Total Akumulasi Denda: Rp ${stats.totalFines.toLocaleString()}

        INSTRUKSI KHUSUS:
        1. Gunakan bahasa Indonesia yang sangat formal, sopan, dan profesional (gaya surat resmi kedinasan).
        2. Tuliskan dalam bentuk paragraf deskriptif yang mengalir, bukan daftar poin.
        3. JANGAN GUNAKAN simbol markdown seperti bintang (**), pagar (#), atau strip (-) di awal kalimat. Teks harus benar-benar polos (plain text).
        4. Berikan judul: LAPORAN RESMI SIRKULASI PERPUSTAKAAN UPT SMPN 4 MAPPEDECENG.
        5. Sertakan analisis singkat mengenai minat baca siswa berdasarkan data tersebut di akhir narasi.
      `;

      // Menggunakan model gemini-3-flash-preview sesuai instruksi
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("AI mengembalikan respon kosong.");
      }

      // Bersihkan sisa-sisa markdown jika AI masih bandel mengeluarkannya
      const cleanText = resultText
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#/g, '')
        .trim();

      setAiReport(cleanText);
      
      // Simpan ke Cloud Spreadsheet
      storageService.saveReport({
        timestamp: new Date().toLocaleString('id-ID'),
        librarian: librarianName,
        filter: filterDesc,
        content: cleanText
      });
      setIsSynced(true);

    } catch (error: any) {
      console.error("AI Report Error:", error);
      let friendlyError = 'Maaf, sistem AI sedang sibuk atau tidak merespons.';
      
      if (error.message?.includes('API_KEY_INVALID') || error.status === 401) {
        friendlyError = 'API Key Anda tidak valid. Silakan periksa kembali di Google AI Studio.';
      } else if (error.message?.includes('quota') || error.status === 429) {
        friendlyError = 'Kuota penggunaan AI gratis Anda telah habis untuk saat ini.';
      }
      
      setErrorMsg(friendlyError);
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
                placeholder="Masukkan nama lengkap..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all shadow-sm"
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
          <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle size={20} className="shrink-0" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mr-2">
            <Filter size={18} />
            <span className="text-sm font-bold uppercase tracking-wider">Filter Data</span>
          </div>
          
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Rentang Waktu</span>
            <select 
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            >
              <option value="all">Semua Waktu</option>
              <option value="daily">Hari Ini</option>
              <option value="weekly">Minggu Ini (7 Hari Terakhir)</option>
              <option value="monthly">Bulan Ini</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Kategori Buku</span>
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

          <div className="ml-auto text-xs text-slate-400 italic">
            Menampilkan {filteredLoans.length} data peminjaman terpilih
          </div>
        </div>
      </header>

      {/* AI Narrative Section */}
      {aiReport && (
        <div className="bg-white rounded-3xl shadow-xl border border-indigo-50 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-gradient-to-r from-indigo-50 to-white px-8 py-5 border-b border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-3 text-indigo-700 font-bold">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <FileSearch size={20} />
              </div>
              <span className="tracking-tight">Pratinjau Laporan Deskriptif</span>
              {isSynced && (
                <div className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full ml-2">
                  <CheckCircle2 size={12} /> Tersimpan ke Cloud
                </div>
              )}
            </div>
            <button 
              onClick={() => { setAiReport(''); setIsSynced(false); }}
              className="text-slate-400 hover:text-red-500 transition-colors text-sm font-bold"
            >
              Hapus Draft
            </button>
          </div>
          
          <div className="p-12 max-w-4xl mx-auto bg-white relative">
            <div className="absolute top-10 right-10 opacity-[0.03] pointer-events-none">
              <FileText size={200} />
            </div>

            <div className="font-serif text-slate-800 leading-[1.8] text-lg">
              <div className="whitespace-pre-line text-justify first-letter:text-4xl first-letter:font-bold first-letter:text-indigo-600 first-letter:mr-2">
                {aiReport}
              </div>
              
              <div className="mt-20 flex justify-end">
                <div className="text-center w-64">
                  <p className="mb-20">Mappedeceng, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="font-bold border-b-2 border-slate-900 inline-block px-4">{librarianName}</p>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-sans font-bold">Kepala Unit Perpustakaan</p>
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
            Buku Terpopuler ({dateFilter !== 'all' ? dateFilter : 'Semua'})
          </h3>
          <div className="space-y-4">
            {topBooks.map((book, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-xs font-black text-indigo-600">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-slate-700">{book.title}</span>
                </div>
                <span className="text-indigo-600 font-bold text-xs bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  {book.count}x Pinjam
                </span>
              </div>
            ))}
            {topBooks.length === 0 && (
              <p className="text-center py-10 text-slate-400 italic">Belum ada data peminjaman untuk filter ini.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={22} />
            Rekap Keterlambatan
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                <p className="text-[10px] text-red-600 font-black uppercase tracking-wider mb-1">Kasus Terpilih</p>
                <p className="text-3xl font-black text-red-700">{lateReturns.length}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider mb-1">Total Denda</p>
                <p className="text-3xl font-black text-emerald-700">
                  <span className="text-sm font-bold mr-1">Rp</span>
                  {lateReturns.reduce((acc, curr) => acc + curr.fine, 0).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {lateReturns.map((loan) => (
                <div key={loan.id} className="text-xs p-3 border border-slate-100 rounded-xl flex justify-between items-center bg-white hover:border-red-200 transition-all">
                  <div>
                    <span className="font-bold text-slate-800">{loan.memberName}</span>
                    <p className="text-slate-400 font-medium truncate max-w-[150px]">{loan.bookTitle}</p>
                  </div>
                  <span className="px-2 py-1 bg-red-100 text-red-600 rounded-md font-bold text-[10px] uppercase">Terlambat</span>
                </div>
              ))}
              {lateReturns.length === 0 && (
                <p className="text-center py-10 text-slate-400 italic">Tidak ada keterlambatan terpilih.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2">
          <Calendar className="text-indigo-600" size={22} />
          Ringkasan Statistik Filtered
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ReportMetric label="Koleksi Relevan" value={stats.totalBooks.toString()} sub={`Kategori: ${categoryFilter}`} color="border-l-indigo-500" />
          <ReportMetric label="Sirkulasi Filter" value={stats.totalLoans.toString()} sub={`Periode: ${dateFilter}`} color="border-l-violet-500" />
          <ReportMetric label="Keterlambatan" value={stats.totalLate.toString()} sub="Berdasarkan filter" color="border-l-red-500" />
          <ReportMetric label="Estimasi Denda" value={`Rp${(stats.totalFines/1000).toFixed(1)}k`} sub="Total akumulasi" color="border-l-emerald-500" />
        </div>
      </div>
    </div>
  );
};

const ReportMetric = ({ label, value, sub, color }: { label: string, value: string, sub: string, color: string }) => (
  <div className={`p-6 bg-slate-50/50 border-l-4 ${color} rounded-r-2xl transition-all hover:bg-white hover:shadow-md cursor-default`}>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-3xl font-black text-slate-800 my-1">{value}</p>
    <p className="text-xs text-slate-500 font-medium">{sub}</p>
  </div>
);

export default ReportsPage;
