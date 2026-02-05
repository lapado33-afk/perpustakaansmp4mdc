
import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { Book, UserRole } from '../types';

interface BooksPageProps {
  books: Book[];
  onAddBook: (book: Omit<Book, 'id' | 'available'>) => void;
  onDeleteBook: (id: string) => void;
  role: UserRole;
}

const BooksPage: React.FC<BooksPageProps> = ({ books, onAddBook, onDeleteBook, role }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newBook, setNewBook] = useState({
    code: '',
    title: '',
    author: '',
    publisher: '',
    year: new Date().getFullYear(),
    category: '',
    count: 1
  });

  // Tambahkan pengaman (book.field || '') agar tidak crash jika ada data null
  const filteredBooks = books.filter(book => {
    const term = searchTerm.toLowerCase();
    return (
      (book.title || '').toLowerCase().includes(term) ||
      (book.author || '').toLowerCase().includes(term) ||
      (book.code || '').toLowerCase().includes(term)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddBook(newBook);
    setShowModal(false);
    setNewBook({
      code: '',
      title: '',
      author: '',
      publisher: '',
      year: new Date().getFullYear(),
      category: '',
      count: 1
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Koleksi Buku</h1>
          <p className="text-slate-500">Kelola database buku perpustakaan UPT SMPN 4 Mappedeceng.</p>
        </div>
        {role === UserRole.ADMIN && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus size={20} />
            Tambah Buku Baru
          </button>
        )}
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari judul, pengarang, atau kode..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-white transition-colors">
              <Filter size={16} />
              Filter
            </button>
            <button className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-white transition-colors">
              <ArrowUpDown size={16} />
              Urutkan
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Kode</th>
                <th className="px-6 py-4">Judul & Detail</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4 text-center">Tahun</th>
                <th className="px-6 py-4 text-center">Stok</th>
                <th className="px-6 py-4 text-center">Tersedia</th>
                {role === UserRole.ADMIN && <th className="px-6 py-4 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredBooks.map((book) => (
                <tr key={book.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-indigo-600 font-bold">{book.code}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{book.title}</div>
                    <div className="text-slate-500 text-xs">{book.author} | {book.publisher}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[11px] font-bold">
                      {book.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600">{book.year}</td>
                  <td className="px-6 py-4 text-center font-semibold">{book.count}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${
                      (book.available || 0) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {book.available || 0}
                    </span>
                  </td>
                  {role === UserRole.ADMIN && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => onDeleteBook(book.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredBooks.length === 0 && (
                <tr>
                  <td colSpan={role === UserRole.ADMIN ? 7 : 6} className="px-6 py-12 text-center text-slate-500 italic">
                    Tidak ada buku ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Book */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Tambah Koleksi Baru</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Kode Buku</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20" 
                    value={newBook.code}
                    onChange={e => setNewBook({...newBook, code: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Kategori</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20" 
                    value={newBook.category}
                    onChange={e => setNewBook({...newBook, category: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Judul Buku</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20" 
                  value={newBook.title}
                  onChange={e => setNewBook({...newBook, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Pengarang</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20" 
                    value={newBook.author}
                    onChange={e => setNewBook({...newBook, author: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Penerbit</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20" 
                    value={newBook.publisher}
                    onChange={e => setNewBook({...newBook, publisher: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tahun Terbit</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20" 
                    value={newBook.year}
                    onChange={e => setNewBook({...newBook, year: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Jumlah Stok</label>
                  <input 
                    required 
                    type="number" 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20" 
                    value={newBook.count}
                    onChange={e => setNewBook({...newBook, count: parseInt(e.target.value)})}
                  />
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
                  Simpan Buku
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BooksPage;
