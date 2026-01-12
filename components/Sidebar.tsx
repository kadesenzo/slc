
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  PlusSquare, 
  FileText, 
  Package, 
  UserCheck,
  Settings,
  Wrench,
  ChevronRight,
  DollarSign,
  Smartphone,
  X,
  PieChart,
  CalendarDays
} from 'lucide-react';

interface SidebarProps {
  role: 'Dono' | 'Funcionário' | 'Recepção';
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, isOpen, onClose }) => {
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['Dono', 'Funcionário', 'Recepção'] },
    { name: 'Agenda Pro', icon: CalendarDays, path: '/calendar', roles: ['Dono', 'Recepção', 'Funcionário'] },
    { name: 'Terminal Mecânico', icon: Smartphone, path: '/terminal', roles: ['Dono', 'Funcionário'] },
    { name: 'Criar Nota', icon: PlusSquare, path: '/orders/new', roles: ['Dono', 'Recepção', 'Funcionário'] },
    { name: 'Notas Geradas', icon: FileText, path: '/orders', roles: ['Dono', 'Recepção', 'Funcionário'] },
    { name: 'Financeiro', icon: PieChart, path: '/financial', roles: ['Dono'] },
    { name: 'Cobranças', icon: DollarSign, path: '/billing', roles: ['Dono', 'Recepção'] },
    { name: 'Clientes', icon: Users, path: '/clients', roles: ['Dono', 'Recepção'] },
    { name: 'Veículos', icon: Car, path: '/vehicles', roles: ['Dono', 'Recepção', 'Funcionário'] },
    { name: 'Estoque', icon: Package, path: '/inventory', roles: ['Dono', 'Recepção'] },
    { name: 'Equipe', icon: UserCheck, path: '/employees', roles: ['Dono'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-[150] w-72 bg-[#0c0c0e] border-r border-zinc-800/50 transition-all duration-300 transform
      md:relative md:translate-x-0 shadow-2xl
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="p-8 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#E11D48] rounded-xl flex items-center justify-center glow-red">
            <Wrench className="text-white w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tighter text-white leading-none uppercase italic">
              KAEN<span className="text-[#E11D48]">PRO</span>
            </span>
            <span className="text-[8px] font-bold uppercase text-zinc-500 tracking-[0.2em] mt-1">Elite Garage</span>
          </div>
        </div>
        
        <button 
          onClick={onClose}
          className="md:hidden p-2 text-zinc-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto no-scrollbar pb-10">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group
              ${isActive 
                ? 'bg-[#E11D48] text-white active-glow translate-x-1' 
                : 'text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-200'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center space-x-3">
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-zinc-600 group-hover:text-[#E11D48]'} />
                  <span className="font-bold text-[11px] uppercase tracking-wider">{item.name}</span>
                </div>
                {isActive && <ChevronRight size={14} className="opacity-50" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 mt-auto border-t border-zinc-800/50 bg-[#0a0a0b]">
        <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-zinc-900 transition-colors cursor-pointer text-zinc-500 group">
          <div className="p-2 bg-zinc-900 rounded-lg group-hover:text-white transition-colors">
            <Settings size={16} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Ajustes</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
