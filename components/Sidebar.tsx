
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
      {/* Overlay Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-[140] animate-in fade-in duration-500 lg:hidden" 
          onClick={onClose} 
        />
      )}

      {/* Sidebar Flutuante iOS 26 */}
      <aside className={`
        fixed inset-y-6 left-6 z-[150] w-[20rem] glass-card rounded-ios transition-all duration-700 transform ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border-white/10
        ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0 pointer-events-none lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto'}
        lg:relative lg:inset-y-0 lg:left-0 lg:m-6 lg:mr-0
      `}>
        <div className="p-10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-[#FF2D55] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF2D55]/30 group transition-transform duration-700 hover:rotate-12 border border-white/20">
              <Wrench className="text-white w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-white uppercase italic leading-none">
                KAEN<span className="text-[#FF2D55]">PRO</span>
              </span>
              <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-[0.3em] mt-1">PROTOCOLO ELITE</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 bg-white/5 hover:bg-[#FF2D55] rounded-full text-zinc-500 hover:text-white transition-all active:scale-90 lg:hidden"
          >
            <X size={20}/>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-6 space-y-3 no-scrollbar scroll-smooth pb-12">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path} to={item.path} onClick={onClose}
              className={({ isActive }) => `
                flex items-center justify-between px-6 py-5 rounded-[2.2rem] transition-all duration-500 group relative
                ${isActive 
                  ? 'bg-[#FF2D55] text-white shadow-[0_20px_50px_rgba(255,45,85,0.3)]' 
                  : 'text-zinc-500 hover:bg-white/5 hover:text-white'}
              `}
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center space-x-5">
                    <item.icon 
                      size={22} 
                      className={isActive ? 'text-white' : 'text-zinc-600 group-hover:text-[#FF2D55] transition-colors'} 
                    />
                    <span className="font-black text-[11px] uppercase tracking-[0.15em] italic">
                      {item.name}
                    </span>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_15px_white] animate-pulse"></div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Rodapé do Sidebar */}
        <div className="p-8 mt-auto border-t border-white/5 bg-white/[0.01]">
          <div className="flex items-center space-x-5 p-5 rounded-[2rem] hover:bg-white/5 cursor-pointer text-zinc-600 group transition-all duration-500 border border-transparent hover:border-white/5 shadow-inner">
            <div className="p-3 bg-white/5 rounded-2xl group-hover:text-white group-hover:rotate-90 transition-all duration-700 shadow-md">
              <Settings size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest italic text-zinc-400">CONFIGURAÇÃO</span>
              <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-[0.2em]">NÚCLEO V26.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
