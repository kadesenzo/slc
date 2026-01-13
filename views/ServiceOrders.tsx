
import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, FileText, Trash2, Edit3, Smartphone, ExternalLink, RefreshCw, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ServiceOrder, UserSession, OSStatus } from '../types';

const ServiceOrders: React.FC<{ role?: string; session?: UserSession; syncData?: (key: string, data: any) => Promise<void> }> = ({ role = 'Dono', session, syncData }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<OSStatus | 'ALL'>('ALL');

  useEffect(() => {
    if (session) {
      const saved = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_orders`) || '[]');
      setOrders(saved);
    }
  }, [session]);

  const handleDelete = async (id: string, osNumber: string) => {
    if (role !== 'Dono' || !session || !syncData) {
      alert("Apenas o Administrador pode excluir notas.");
      return;
    }
    if (!confirm(`⚠️ APAGAR NOTA #${osNumber}? Esta ação removerá o registro do histórico.`)) return;
    
    const updated = orders.filter(o => o.id !== id);
    setOrders(updated);
    await syncData('orders', updated);
    
    // Also remove related financial transaction if it exists
    const currentTransactions = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_transactions`) || '[]');
    const updatedTransactions = currentTransactions.filter((t: any) => t.relatedId !== id);
    await syncData('transactions', updatedTransactions);
  };

  const filtered = orders.filter(o => {
    const matchesSearch = o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.vehiclePlate.includes(searchTerm) || 
                          o.osNumber.includes(searchTerm);
    const matchesFilter = filter === 'ALL' || o.status === filter;
    return matchesSearch && matchesFilter;
  }).reverse();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 h-full overflow-y-auto no-scrollbar scroll-smooth px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Histórico de <span className="text-[#E11D48]">Notas</span></h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest italic mt-1">Base de Dados Sincronizada</p>
        </div>
        <button 
          onClick={() => navigate('/orders/new')}
          className="bg-[#E11D48] px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
        >
          <Plus size={18} /> Nova Nota
        </button>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 p-2 rounded-2xl flex items-center shadow-lg">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
          <input 
            type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Placa, Cliente ou Nº da Nota..." 
            className="w-full bg-transparent border-none py-4 pl-12 pr-4 focus:ring-0 text-white font-bold text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(os => (
          <div key={os.id} className="bg-[#121214] border border-zinc-800 rounded-[2rem] p-6 hover:border-[#E11D48]/30 transition-all group relative overflow-hidden shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[9px] font-black text-[#E11D48] tracking-widest uppercase italic">Nº {os.osNumber}</span>
              <span className="text-[8px] font-black text-zinc-600 uppercase">{new Date(os.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            
            <div className="space-y-1 mb-6">
              <h3 className="text-lg font-black text-white uppercase italic tracking-tighter">{os.clientName}</h3>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{os.vehiclePlate} • {os.vehicleModel}</p>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
              <div>
                <p className="text-xl font-black text-white italic">R$ {os.totalValue.toLocaleString('pt-BR')}</p>
                <p className="text-[8px] font-black text-zinc-700 uppercase">{os.paymentMethod}</p>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => handleDelete(os.id, os.osNumber)} className="p-3 bg-zinc-900 text-zinc-600 hover:text-red-500 rounded-xl transition-all border border-zinc-800 shadow-md">
                    <Trash2 size={16}/>
                 </button>
                 <button onClick={() => navigate(`/orders/new`)} className="p-3 bg-zinc-900 text-zinc-600 hover:text-white rounded-xl transition-all border border-zinc-800 shadow-md">
                    <Edit3 size={16}/>
                 </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-20 text-center space-y-4">
             <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center mx-auto text-zinc-800 shadow-inner"><FileText size={32}/></div>
             <p className="text-zinc-600 font-black uppercase text-[10px] tracking-widest italic">Nenhuma nota encontrada no servidor</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceOrders;
