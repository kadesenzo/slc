
import React from 'react';
import { Bell, LogOut, UserCircle, Menu, RefreshCw } from 'lucide-react';
import { SyncStatus } from '../types';

interface HeaderProps {
  onLogout: () => void;
  onToggleSidebar: () => void;
  role: string;
  username: string;
  syncStatus: SyncStatus;
}

// Fixed: Added missing export for Header component
const Header: React.FC<HeaderProps> = ({ onLogout, onToggleSidebar, role, username, syncStatus }) => {
  return (
    <header className="h-20 border-b border-zinc-800/50 bg-[#0c0c0e] flex items-center justify-between px-6 md:px-10 z-30 shadow-sm">
      <div className="flex items-center gap-6">
        {/* BOTÃO DE 3 BARRAS - AGORA VISÍVEL NO DESKTOP TAMBÉM */}
        <button 
          onClick={onToggleSidebar}
          className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:border-[#E11D48] transition-all active:scale-95 flex items-center gap-2 group"
          title="Abrir Menu Principal"
        >
          <Menu size={20} />
          <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest group-hover:text-[#E11D48]">Menu Geral</span>
        </button>

        <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-full">
          {syncStatus === SyncStatus.SYNCING ? (
            <RefreshCw size={12} className="text-[#E11D48] animate-spin" />
          ) : (
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            {syncStatus === SyncStatus.SYNCING ? 'Cloud Syncing...' : 'Sincronizado'}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <button className="relative p-2 text-zinc-500 hover:text-white transition-colors hidden sm:block">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#E11D48] rounded-full ring-2 ring-[#0c0c0e]"></span>
        </button>

        <div className="flex items-center space-x-4 border-l border-zinc-800/50 pl-6">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white uppercase tracking-tight">{username}</p>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{role}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 shadow-inner">
            <UserCircle size={22} />
          </div>
          <button 
            onClick={onLogout}
            className="p-2 text-zinc-500 hover:text-[#E11D48] transition-all"
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
