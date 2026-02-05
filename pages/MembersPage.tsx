
import React, { useState } from 'react';
import { Plus, Search, User, Trash2, Edit, GraduationCap, Briefcase } from 'lucide-react';
import { Member, MemberType } from '../types';

interface MembersPageProps {
  members: Member[];
  onAddMember: (member: Omit<Member, 'id'>) => void;
  onDeleteMember: (id: string) => void;
}

const MembersPage: React.FC<MembersPageProps> = ({ members, onAddMember, onDeleteMember }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newMember, setNewMember] = useState({
    nomorInduk: '',
    name: '',
    className: '',
    type: MemberType.SISWA
  });

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.nomorInduk.includes(searchTerm)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMember(newMember);
    setShowModal(false);
    setNewMember({
      nomorInduk: '',
      name: '',
      className: '',
      type: MemberType.SISWA
    });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Database Anggota</h1>
          <p className="text-slate-500">Kelola data siswa dan guru terdaftar.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={20} />
          Tambah Anggota
        </button>
      </header>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nama atau nomor induk..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
          {filteredMembers.map(member => (
            <div key={member.id} className="p-5 border border-slate-100 rounded-xl hover:shadow-md transition-shadow group relative bg-white">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  member.type === MemberType.GURU ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {member.type === MemberType.GURU ? <Briefcase size={24} /> : <GraduationCap size={24} />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 leading-tight">{member.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{member.type} • {member.className}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Nomor Induk</p>
                  <p className="text-sm font-mono font-medium text-slate-600">{member.nomorInduk}</p>
                </div>
                <div className="flex gap-1">
                  <button className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg"><Edit size={16} /></button>
                  <button 
                    onClick={() => onDeleteMember(member.id)}
                    className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
                  ><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Add Member */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Tambah Anggota Baru</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nomor Induk (NIS/NIP)</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20" 
                  value={newMember.nomorInduk}
                  onChange={e => setNewMember({...newMember, nomorInduk: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nama Lengkap</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20" 
                  value={newMember.name}
                  onChange={e => setNewMember({...newMember, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Kelas / Jabatan</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="Contoh: 8-A atau Guru Matematika"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20" 
                    value={newMember.className}
                    onChange={e => setNewMember({...newMember, className: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Tipe Anggota</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                    value={newMember.type}
                    onChange={e => setNewMember({...newMember, type: e.target.value as MemberType})}
                  >
                    <option value={MemberType.SISWA}>Siswa</option>
                    <option value={MemberType.GURU}>Guru</option>
                  </select>
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
                  Simpan Anggota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPage;
