
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Car, PlusSquare, FileText, Package, UserCheck,
  Settings, Wrench, ChevronRight, DollarSign, Smartphone, X, PieChart, CalendarDays
} from 'lucide-react';

interface SidebarProps {
  role: 'Dono' | 'Funcionário' | 'Recepção';
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, isOpen, onClose }) => {
  const menuItems = [
    { name: 'Painel Central', icon: LayoutDashboard, path: '/dashboard', roles: ['Dono', 'Funcionário', 'Recepção'] },
    { name: 'Agenda Pro', icon: CalendarDays, path: '/calendar', roles: ['Dono', 'Recepção', 'Funcionário'] },
    { name: 'Terminal Técnico', icon: Smartphone, path: '/terminal', roles: ['Dono', 'Funcionário'] },
    { name: 'Lançar Nota', icon: PlusSquare, path: '/orders/new', roles: ['Dono', 'Recepção', 'Funcionário'] },
    { name: 'Histórico de Notas', icon: FileText, path: '/orders', roles: ['Dono', 'Recepção', 'Funcionário'] },
    { name: 'Fluxo de Caixa', icon: PieChart, path: '/financial', roles: ['Dono'] },
    { name: 'Central de Cobrança', icon: DollarSign, path: '/billing', roles: ['Dono', 'Recepção'] },
    { name: 'Base de Clientes', icon: Users, path: '/clients', roles: ['Dono', 'Recepção'] },
    { name: 'Frota de Veículos', icon: Car, path: '/vehicles', roles: ['Dono', 'Recepção', 'Funcionário'] },
    { name: 'Gestão de Estoque', icon: Package, path: '/inventory', roles: ['Dono', 'Recepção'] },
    { name: 'Equipe Kaen', icon: UserCheck, path: '/employees', roles: ['Dono'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[140] animate-in fade-in duration-300" 
          onClick={onClose} 
        />
      )}

      <aside className={`
        fixed inset-y-4 left-4 z-[150] w-[18rem] glass-card rounded-ios transition-all duration-500 transform ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col overflow-hidden
        ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-[110%] opacity-0 pointer-events-none'}
      `}>
        <div className="p-8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 bg-[#FF2D55] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF2D55]/30">
              <Wrench className="text-white w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white uppercase italic leading-none">
                KAEN<span className="text-[#FF2D55]">PRO</span>
              </span>
              <span className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest">Bionic OS 26</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 transition-colors"
          >
            <X size={18}/>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-2 no-scrollbar scroll-smooth pb-10">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path} to={item.path} onClick={onClose}
              className={({ isActive }) => `
                flex items-center justify-between px-5 py-4 rounded-[1.8rem] transition-all duration-300 group
                ${isActive 
                  ? 'bg-[#FF2D55] text-white shadow-xl shadow-[#FF2D55]/20' 
                  : 'text-zinc-500 hover:bg-white/5 hover:text-white'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center space-x-4">
                    <item.icon 
                      size={20} 
                      className={isActive ? 'text-white' : 'text-zinc-600 group-hover:text-[#FF2D55] transition-colors'} 
                    />
                    <span className="font-bold text-[10px] uppercase tracking-[0.12em] italic">
                      {item.name}
                    </span>
                  </div>
                  {isActive && <ChevronRight size={14} className="opacity-50" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-white/5 bg-white/[0.02]">
          <div className="flex items-center space-x-4 p-4 rounded-3xl hover:bg-white/5 cursor-pointer text-zinc-500 group transition-all">
            <div className="p-2 bg-white/5 rounded-xl group-hover:text-white group-hover:rotate-45 transition-all duration-500">
              <Settings size={18} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest italic">Ajustes do Núcleo</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
