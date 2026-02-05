
import React, { useMemo } from 'react';
import { 
  BookOpen, 
  Users, 
  ArrowLeftRight, 
  CheckCircle, 
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Book, Loan, Member, LoanStatus } from '../types';

interface DashboardPageProps {
  books: Book[];
  loans: Loan[];
  members: Member[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({ books, loans, members }) => {
  const stats = useMemo(() => {
    const totalBooks = books.reduce((acc, curr) => acc + curr.count, 0);
    const available = books.reduce((acc, curr) => acc + curr.available, 0);
    const borrowed = loans.filter(l => l.status === LoanStatus.DIPINJAM || l.status === LoanStatus.TERLAMBAT).length;
    
    return {
      totalBooks,
      available,
      borrowed,
      totalMembers: members.length
    };
  }, [books, loans, members]);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    books.forEach(b => {
      cats[b.category] = (cats[b.category] || 0) + 1;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [books]);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const recentLoans = useMemo(() => {
    return [...loans].sort((a, b) => new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime()).slice(0, 5);
  }, [loans]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Utama</h1>
        <p className="text-slate-500">Selamat datang kembali di sistem manajemen perpustakaan.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<BookOpen className="text-blue-600" />} 
          label="Total Koleksi Buku" 
          value={stats.totalBooks} 
          color="bg-blue-50" 
        />
        <StatCard 
          icon={<CheckCircle className="text-emerald-600" />} 
          label="Buku Tersedia" 
          value={stats.available} 
          color="bg-emerald-50" 
        />
        <StatCard 
          icon={<ArrowLeftRight className="text-amber-600" />} 
          label="Buku Sedang Dipinjam" 
          value={stats.borrowed} 
          color="bg-amber-50" 
        />
        <StatCard 
          icon={<Users className="text-indigo-600" />} 
          label="Total Anggota" 
          value={stats.totalMembers} 
          color="bg-indigo-50" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-600" />
              Kategori Buku
            </h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold mb-4">Peminjaman Terbaru</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-500">
                    <th className="pb-3 font-medium">Peminjam</th>
                    <th className="pb-3 font-medium">Buku</th>
                    <th className="pb-3 font-medium">Tgl Pinjam</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentLoans.map((loan) => (
                    <tr key={loan.id} className="group">
                      <td className="py-4 font-medium text-slate-700">{loan.memberName}</td>
                      <td className="py-4 text-slate-600">{loan.bookTitle}</td>
                      <td className="py-4 text-slate-500">{loan.loanDate}</td>
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                          loan.status === LoanStatus.DIPINJAM ? 'bg-blue-100 text-blue-700' : 
                          loan.status === LoanStatus.TERLAMBAT ? 'bg-red-100 text-red-700' : 
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {loan.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Info Column */}
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full">
            <h3 className="text-lg font-semibold mb-6">Status Koleksi</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Tersedia', value: stats.available },
                      { name: 'Dipinjam', value: stats.borrowed }
                    ]}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span>Tersedia</span>
                </div>
                <span className="font-bold">{stats.available}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span>Dipinjam</span>
                </div>
                <span className="font-bold">{stats.borrowed}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: number, color: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`p-4 rounded-xl ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

export default DashboardPage;
