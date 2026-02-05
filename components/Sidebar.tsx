
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  ArrowLeftRight, 
  FileText, 
  LogOut,
  Library,
  CloudCheck
} from 'lucide-react';
import { User, UserRole } from '../types';

interface SidebarProps {
  user: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.USER] },
    { to: '/books', label: 'Data Buku', icon: BookOpen, roles: [UserRole.ADMIN, UserRole.USER] },
    { to: '/members', label: 'Anggota', icon: Users, roles: [UserRole.ADMIN] },
    { to: '/loans', label: 'Peminjaman', icon: ArrowLeftRight, roles: [UserRole.ADMIN, UserRole.USER] },
    { to: '/reports', label: 'Laporan', icon: FileText, roles: [UserRole.ADMIN] },
  ];

  return (
    <div className="h-screen w-64 bg-indigo-900 text-white flex flex-col fixed left-0 top-0 z-40 shadow-xl">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-white p-2 rounded-lg">
          <Library className="text-indigo-900" size={24} />
        </div>
        <div>
          <h1 className="font-bold text-sm leading-tight">E-PUSTAKA</h1>
          <p className="text-[10px] text-indigo-200">SMPN 4 Mappedeceng</p>
        </div>
      </div>

      <nav className="flex-1 mt-6 px-4">
        {navItems.filter(item => item.roles.includes(user?.role || UserRole.USER)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 mb-2 ${
                isActive ? 'bg-indigo-700 text-white shadow-inner' : 'text-indigo-300 hover:bg-indigo-800 hover:text-white'
              }`
            }
          >
            <item.icon size={20} />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-indigo-800">
        <div className="mb-4 px-4 flex items-center gap-2 text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          Cloud Sync Active
        </div>
        
        <div className="flex items-center gap-3 px-4 py-2 mb-4 bg-indigo-800/50 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold uppercase border border-indigo-400">
            {user?.name.charAt(0)}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold truncate">{user?.name}</p>
            <p className="text-[10px] text-indigo-300 uppercase">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-all text-sm font-medium"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
