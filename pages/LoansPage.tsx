
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  RotateCcw, 
  User as UserIcon,
  Book as BookIcon,
  Search,
  CheckCircle2
} from 'lucide-react';
import { Loan, LoanStatus, Book, Member, UserRole, User } from '../types';
import { FINE_PER_DAY } from '../constants';

interface LoansPageProps {
  loans: Loan[];
  books: Book[];
  members: Member[];
  onAddLoan: (loan: Omit<Loan, 'id' | 'fine' | 'status'>) => void;
  onReturnBook: (loanId: string) => void;
  user: User | null;
}

const LoansPage: React.FC<LoansPageProps> = ({ loans, books, members, onAddLoan, onReturnBook, user }) => {
  const [showModal, setShowModal] = useState(false);
  const [newLoan, setNewLoan] = useState({
    memberId: '',
    bookId: '',
    loanDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const activeLoans = useMemo(() => {
    return loans.map(loan => {
      const isOverdue = loan.status === LoanStatus.DIPINJAM && new Date() > new Date(loan.dueDate);
      let fine = 0;
      if (isOverdue) {
        const diffTime = Math.abs(new Date().getTime() - new Date(loan.dueDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        fine = diffDays * FINE_PER_DAY;
      }
      return { ...loan, fine: isOverdue ? fine : loan.fine, status: isOverdue ? LoanStatus.TERLAMBAT : loan.status };
    });
  }, [loans]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const member = members.find(m => m.id === newLoan.memberId);
    const book = books.find(b => b.id === newLoan.bookId);
    
    if (member && book) {
      onAddLoan({
        ...newLoan,
        memberName: member.name,
        bookTitle: book.title
      });
      setShowModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Peminjaman & Pengembalian</h1>
          <p className="text-slate-500">Pantau transaksi sirkulasi buku perpustakaan.</p>
        </div>
        {user?.role === UserRole.ADMIN && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={20} />
            Transaksi Baru
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Status Filtering etc can go here, for now just show all list */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Peminjam</th>
                  <th className="px-6 py-4">Buku</th>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Denda</th>
                  {user?.role === UserRole.ADMIN && <th className="px-6 py-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {activeLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          <UserIcon size={14} />
                        </div>
                        <div className="font-semibold text-slate-800">{loan.memberName}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <BookIcon size={14} className="text-slate-400" />
                        <span className="text-slate-700">{loan.bookTitle}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar size={12} />
                          {loan.loanDate} s/d {loan.dueDate}
                        </div>
                        {loan.returnDate && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                            <CheckCircle2 size={12} />
                            Kembali: {loan.returnDate}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                        loan.status === LoanStatus.DIPINJAM ? 'bg-blue-100 text-blue-700' : 
                        loan.status === LoanStatus.TERLAMBAT ? 'bg-red-100 text-red-700' : 
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {loan.status === LoanStatus.DIPINJAM && <Clock size={10} />}
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-red-600">
                      {loan.fine > 0 ? `Rp ${loan.fine.toLocaleString()}` : '-'}
                    </td>
                    {user?.role === UserRole.ADMIN && (
                      <td className="px-6 py-4 text-right">
                        {loan.status !== LoanStatus.KEMBALI && (
                          <button 
                            onClick={() => onReturnBook(loan.id)}
                            className="text-indigo-600 hover:text-indigo-800 font-bold text-xs uppercase flex items-center gap-1 ml-auto"
                          >
                            <RotateCcw size={14} />
                            Kembalikan
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Loan */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Buka Transaksi Peminjaman</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Pilih Anggota</label>
                <select 
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                  value={newLoan.memberId}
                  onChange={e => setNewLoan({...newLoan, memberId: e.target.value})}
                >
                  <option value="">-- Pilih Anggota --</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.className})</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Pilih Buku</label>
                <select 
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                  value={newLoan.bookId}
                  onChange={e => setNewLoan({...newLoan, bookId: e.target.value})}
                >
                  <option value="">-- Pilih Buku --</option>
                  {books.filter(b => b.available > 0).map(b => <option key={b.id} value={b.id}>{b.title} ({b.code})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tanggal Pinjam</label>
                  <input 
                    required 
                    type="date" 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20" 
                    value={newLoan.loanDate}
                    onChange={e => setNewLoan({...newLoan, loanDate: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Batas Kembali</label>
                  <input 
                    required 
                    type="date" 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20" 
                    value={newLoan.dueDate}
                    onChange={e => setNewLoan({...newLoan, dueDate: e.target.value})}
                  />
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3 mt-4">
                <div className="bg-blue-200 p-1.5 rounded text-blue-700">
                  <Clock size={16} />
                </div>
                <div className="text-xs text-blue-800 leading-relaxed">
                  <strong>Pemberitahuan:</strong> Peminjaman standar adalah 7 hari. Denda keterlambatan sebesar <strong>Rp {FINE_PER_DAY.toLocaleString()}/hari</strong> akan otomatis terhitung setelah tanggal jatuh tempo.
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Proses Pinjam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoansPage;
