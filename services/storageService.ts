
import { Book, Member, Loan } from '../types';
import { INITIAL_BOOKS, INITIAL_MEMBERS, INITIAL_LOANS } from '../constants';

// GANTI URL DI BAWAH INI DENGAN URL WEB APP HASIL DEPLOY GOOGLE APPS SCRIPT
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxj5QGSU6ob3SSSVjzJJxU5zKPKujbXYAGJgMoVIOdXqL0cNGZRqDYeSRQBhW24jbw/exec';

const KEYS = {
  BOOKS: 'lib_books',
  MEMBERS: 'lib_members',
  LOANS: 'lib_loans',
  REPORTS: 'lib_reports_history'
};

/**
 * Fungsi pembantu untuk mengubah Array of Objects menjadi 2D Array (Tabel)
 * agar Google Sheets mengenali header dengan benar.
 */
const formatForSheet = (data: any[]) => {
  if (!data || data.length === 0) return [];
  // Ambil kunci dari objek pertama sebagai header
  const headers = Object.keys(data[0]);
  // Map data menjadi baris-baris
  const rows = data.map(obj => headers.map(header => obj[header] ?? ''));
  return [headers, ...rows];
};

const syncToCloud = async (sheetName: string, rawData: any[]) => {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
    console.warn(`Sinkronisasi [${sheetName}] tertunda: URL Google Script belum diset.`);
    return;
  }
  
  try {
    const formattedData = formatForSheet(rawData);
    
    await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ 
        sheetName, 
        data: formattedData,
        isTableFormat: true
      })
    });
    console.log(`Cloud Sync Berhasil: ${sheetName}`);
  } catch (error) {
    console.error(`Cloud Sync Gagal [${sheetName}]:`, error);
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
  
  saveReport: (report: { timestamp: string, librarian: string, filter: string, content: string }) => {
    const existingStr = localStorage.getItem(KEYS.REPORTS);
    const existing = existingStr ? JSON.parse(existingStr) : [];
    const updated = [report, ...existing].slice(0, 50); 
    localStorage.setItem(KEYS.REPORTS, JSON.stringify(updated));
    syncToCloud('Reports', updated);
  },

  fetchFullData: async () => {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) return null;
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL);
      const cloudData = await response.json();
      return cloudData;
    } catch (error) {
      console.error("Fetch Cloud Data Error:", error);
      return null;
    }
  }
};
