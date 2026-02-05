
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import BooksPage from './pages/BooksPage';
import MembersPage from './pages/MembersPage';
import LoansPage from './pages/LoansPage';
import ReportsPage from './pages/ReportsPage';
import LoginPage from './pages/LoginPage';
import { User, Book, Member, Loan, LoanStatus, UserRole } from './types';
import { storageService } from './services/storageService';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      // 1. Load dari LocalStorage dulu agar cepat muncul
      setBooks(storageService.getBooks());
      setMembers(storageService.getMembers());
      setLoans(storageService.getLoans());
      
      // 2. Coba sinkronisasi dari Cloud (Google Sheets)
      try {
        const cloudData = await storageService.fetchFullData();
        if (cloudData) {
          if (Array.isArray(cloudData.Books)) {
            setBooks(cloudData.Books);
            localStorage.setItem('lib_books', JSON.stringify(cloudData.Books));
          }
          if (Array.isArray(cloudData.Members)) {
            setMembers(cloudData.Members);
            localStorage.setItem('lib_members', JSON.stringify(cloudData.Members));
          }
          if (Array.isArray(cloudData.Loans)) {
            setLoans(cloudData.Loans);
            localStorage.setItem('lib_loans', JSON.stringify(cloudData.Loans));
          }
        }
      } catch (err) {
        console.warn("Cloud sync deferred:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleAddBook = (newBook: Omit<Book, 'id' | 'available'>) => {
    const bookWithId: Book = {
      ...newBook,
      id: Math.random().toString(36).substr(2, 9),
      available: newBook.count
    };
    const updated = [...books, bookWithId];
    setBooks(updated);
    storageService.saveBooks(updated);
  };

  const handleDeleteBook = (id: string) => {
    const updated = books.filter(b => b.id !== id);
    setBooks(updated);
    storageService.saveBooks(updated);
  };

  const handleAddMember = (newMember: Omit<Member, 'id'>) => {
    const memberWithId: Member = {
      ...newMember,
      id: 'M' + Math.random().toString(36).substr(2, 4).toUpperCase()
    };
    const updated = [...members, memberWithId];
    setMembers(updated);
    storageService.saveMembers(updated);
  };

  const handleDeleteMember = (id: string) => {
    const updated = members.filter(m => m.id !== id);
    setMembers(updated);
    storageService.saveMembers(updated);
  };

  const handleAddLoan = (newLoan: Omit<Loan, 'id' | 'fine' | 'status'>) => {
    const loanWithId: Loan = {
      ...newLoan,
      id: 'L' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      status: LoanStatus.DIPINJAM,
      fine: 0
    };
    
    const updatedLoans = [...loans, loanWithId];
    setLoans(updatedLoans);
    storageService.saveLoans(updatedLoans);

    const updatedBooks = books.map(b => 
      b.id === newLoan.bookId ? { ...b, available: b.available - 1 } : b
    );
    setBooks(updatedBooks);
    storageService.saveBooks(updatedBooks);
  };

  const handleReturnBook = (loanId: string) => {
    const targetLoan = loans.find(l => l.id === loanId);
    if (!targetLoan) return;

    const updatedLoans = loans.map(l => 
      l.id === loanId ? { ...l, status: LoanStatus.KEMBALI, returnDate: new Date().toISOString().split('T')[0] } : l
    );
    setLoans(updatedLoans);
    storageService.saveLoans(updatedLoans);

    const updatedBooks = books.map(b => 
      b.id === targetLoan.bookId ? { ...b, available: (b.available || 0) + 1 } : b
    );
    setBooks(updatedBooks);
    storageService.saveBooks(updatedBooks);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-slate-500 font-medium">Menghubungkan ke Database...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return (
    <HashRouter>
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar user={user} onLogout={() => setUser(null)} />
        
        <main className="flex-1 ml-64 p-8">
          <Routes>
            <Route path="/" element={<DashboardPage books={books} loans={loans} members={members} />} />
            <Route path="/books" element={<BooksPage books={books} onAddBook={handleAddBook} onDeleteBook={handleDeleteBook} role={user.role} />} />
            
            {user.role === UserRole.ADMIN && (
              <>
                <Route path="/members" element={<MembersPage members={members} onAddMember={handleAddMember} onDeleteMember={handleDeleteMember} />} />
                <Route path="/reports" element={<ReportsPage books={books} loans={loans} />} />
              </>
            )}
            
            <Route path="/loans" element={<LoansPage user={user} loans={loans} books={books} members={members} onAddLoan={handleAddLoan} onReturnBook={handleReturnBook} />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
