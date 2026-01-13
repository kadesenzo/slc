
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, FileText, Printer, Share2, Trash2, Eye, X, Wrench, Package, 
  ClipboardList, AlertTriangle, ImageIcon, Loader2, ChevronRight, Edit3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ServiceOrder, PaymentStatus, UserSession } from '../types';

const ServiceOrders: React.FC<{ role?: string; session?: UserSession; syncData?: (key: string, data: any) => Promise<void> }> = ({ role = 'Dono', session, syncData }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (session) {
      setOrders(JSON.parse(localStorage.getItem(`kaenpro_${session.username}_orders`) || '[]'));
    }
  }, [session]);

  const handleDelete = async (id: string, osNumber: string) => {
    if (role !== 'Dono' || !session || !syncData) return;
    if (!confirm(`⚠️ APAGAR NOTA #${osNumber}? Esta ação é permanente.`)) return;
    
    const updated = orders.filter(o => o.id !== id);
    setOrders(updated);
    await syncData('orders', updated);
  };

  const filtered = orders.filter(o => 
    o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.vehiclePlate.includes(searchTerm) || 
    o.osNumber.includes(searchTerm)
  ).reverse();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24 h-full overflow-y-auto no-scrollbar scroll-smooth px-4 md:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Notas <span className="text-[#E11D48]">Geradas</span></h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Base de Dados Sincronizada</p>
        </div>
        <button 
          onClick={() => navigate('/orders/new')}
          className="bg-[#E11D48] px-10 py-5 rounded-[2.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl glow-red active:scale-95 transition-all"
        >
          <Plus size={20} /> Criar Nova Nota
        </button>
      </div>

      <div className="bg-[#0F0F0F] border border-[#1F1F1F] p-2 rounded-[2.5rem] flex items-center shadow-lg">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
          <input 
            type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por placa, cliente ou nº da nota..." 
            className="w-full bg-transparent border-none py-6 pl-16 pr-6 focus:ring-0 text-white font-bold placeholder-zinc-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(os => (
          <div key={os.id} className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-[3rem] p-8 hover:border-[#E11D48]/40 transition-all group shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 h-full w-20 bg-zinc-900/10 -skew-x-12 translate-x-10"></div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <span className="text-[9px] font-black text-[#E11D48] tracking-[0.3em] uppercase italic">Nº {os.osNumber}</span>
              <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20`}>
                Sincronizada
              </span>
            </div>
            
            <div className="space-y-1 mb-8 relative z-10">
              <h3 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">{os.clientName}</h3>
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{os.vehiclePlate} • {os.vehicleModel}</p>
            </div>
            
            <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50 mt-auto relative z-10">
              <div>
                <p className="text-[8px] font-black text-zinc-700 uppercase italic tracking-widest mb-1">Total Nota</p>
                <p className="text-xl font-black text-white italic">R$ {os.totalValue.toLocaleString('pt-BR')}</p>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => handleDelete(os.id, os.osNumber)} className="p-3 bg-zinc-900 text-zinc-600 hover:text-red-500 rounded-xl transition-all border border-zinc-800"><Trash2 size={16}/></button>
                 <button onClick={() => navigate(`/orders/new`)} className="p-3 bg-zinc-900 text-zinc-600 hover:text-white rounded-xl transition-all border border-zinc-800"><Edit3 size={16}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceOrders;
