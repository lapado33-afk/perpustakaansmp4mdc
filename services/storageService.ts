
import { Book, Member, Loan } from '../types';
import { INITIAL_BOOKS, INITIAL_MEMBERS, INITIAL_LOANS } from '../constants';

// GANTI URL DI BAWAH INI DENGAN URL WEB APP BARU HASIL DEPLOY TADI
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxj5QGSU6ob3SSSVjzJJxU5zKPKujbXYAGJgMoVIOdXqL0cNGZRqDYeSRQBhW24jbw/exec';

const KEYS = {
  BOOKS: 'lib_books',
  MEMBERS: 'lib_members',
  LOANS: 'lib_loans',
  REPORTS: 'lib_reports_history'
};

const syncToCloud = async (sheetName: string, data: any[]) => {
  // Cek apakah URL masih placeholder
  if (GOOGLE_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
    console.warn("Sinkronisasi gagal: URL Google Script belum dikonfigurasi.");
    return;
  }
  
  try {
    // Kita gunakan mode 'no-cors' karena Apps Script sering bermasalah dengan CORS pada request POST
    // Data tetap akan sampai ke server Apps Script
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ sheetName, data })
    });
    console.log(`Sinkronisasi Cloud Berhasil: ${sheetName}`);
  } catch (error) {
    console.error(`Sinkronisasi Cloud Gagal: ${sheetName}`, error);
  }
};

export const storageService = {
  getBooks: (): Book[] => {
    const data = localStorage.getItem(KEYS.BOOKS);
    return data ? JSON.parse(data) : INITIAL_BOOKS;
  },
  saveBooks: (books: Book[]) => {
    localStorage.setItem(KEYS.BOOKS, JSON.stringify(books));
    syncToCloud('Books', books);
  },
  getMembers: (): Member[] => {
    const data = localStorage.getItem(KEYS.MEMBERS);
    return data ? JSON.parse(data) : INITIAL_MEMBERS;
  },
  saveMembers: (members: Member[]) => {
    localStorage.setItem(KEYS.MEMBERS, JSON.stringify(members));
    syncToCloud('Members', members);
  },
  getLoans: (): Loan[] => {
    const data = localStorage.getItem(KEYS.LOANS);
    return data ? JSON.parse(data) : INITIAL_LOANS;
  },
  saveLoans: (loans: Loan[]) => {
    localStorage.setItem(KEYS.LOANS, JSON.stringify(loans));
    syncToCloud('Loans', loans);
  },
  
  /**
   * Menyimpan riwayat laporan naratif AI ke Cloud Spreadsheet
   * Data dikirim ke sheet bernama 'Reports'
   */
  saveReport: (report: { timestamp: string, librarian: string, filter: string, content: string }) => {
    const existing = JSON.parse(localStorage.getItem(KEYS.REPORTS) || '[]');
    // Simpan maksimal 50 riwayat laporan terakhir di cloud agar spreadsheet tidak terlalu berat
    const updated = [report, ...existing].slice(0, 50); 
    localStorage.setItem(KEYS.REPORTS, JSON.stringify(updated));
    syncToCloud('Reports', updated);
  },

  fetchFullData: async () => {
    if (GOOGLE_SCRIPT_URL.includes('YOUR_SCRIPT_ID') || !GOOGLE_SCRIPT_URL) return null;
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL);
      const cloudData = await response.json();
      return cloudData;
    } catch (error) {
      console.error("Gagal mengambil data dari Cloud (Spreadsheet)", error);
      return null;
    }
  }
};
