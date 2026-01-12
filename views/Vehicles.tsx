
import React, { useState, useEffect } from 'react';
import { Car, Search, Trash2, User, Info, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Vehicle, Client, UserSession } from '../types';

interface VehiclesProps {
  session?: UserSession;
  syncData?: (key: string, data: any) => Promise<void>;
}

const Vehicles: React.FC<VehiclesProps> = ({ session, syncData }) => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (session) {
      const userVehicles = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_vehicles`) || '[]');
      const userClients = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_clients`) || '[]');
      setVehicles(userVehicles);
      setClients(userClients);
    }
  }, [session]);

  const handleDelete = async (id: string) => {
    if (!session || !syncData) return;
    if (confirm("⚠️ DESEJA REALMENTE EXCLUIR ESTE VEÍCULO?")) {
      const updated = vehicles.filter(v => v.id !== id);
      setVehicles(updated);
      await syncData('vehicles', updated);
    }
  };

  const getOwnerName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Desconhecido';
  };

  const filtered = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getOwnerName(v.clientId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Frota <span className="text-[#E11D48]">Global</span></h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Todos os veículos de <span className="text-white">{session?.username}</span></p>
        </div>
      </div>

      <div className="bg-[#0F0F0F] border border-[#1F1F1F] p-2 rounded-[2rem] flex items-center shadow-xl">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por placa, modelo ou proprietário..." 
            className="w-full bg-transparent border-none py-5 pl-16 pr-6 focus:ring-0 text-white font-bold placeholder-zinc-800"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-zinc-950/30 border-2 border-dashed border-zinc-800 rounded-[3rem] p-32 text-center">
          <Car size={48} className="mx-auto text-zinc-900 mb-6 opacity-20" />
          <p className="text-zinc-700 font-black uppercase tracking-[0.3em] text-xs italic">Frota Vazia</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(v => (
            <div key={v.id} className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-[2.5rem] p-8 hover:border-[#E11D48]/40 transition-all group relative overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <div className="bg-[#050505] px-4 py-2 rounded-xl border border-zinc-800 group-hover:border-[#E11D48]/50 transition-all">
                  <span className="text-sm font-black text-white uppercase tracking-[0.2em]">{v.plate}</span>
                </div>
                <div className="p-3 bg-zinc-900 text-zinc-600 rounded-2xl group-hover:text-white transition-all">
                  <Car size={20} />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight italic">{v.model}</h3>
                  <p className="text-xs text-zinc-600 font-bold uppercase tracking-widest">{v.brand} {v.year ? `• ${v.year}` : ''}</p>
                </div>

                <div className="pt-6 border-t border-[#1F1F1F] space-y-3">
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <User size={16} className="text-[#E11D48]" />
                    <span className="font-black uppercase tracking-widest text-[9px]">{getOwnerName(v.clientId)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <Info size={16} className="text-[#E11D48]" />
                    <span className="font-black text-white">{v.km.toLocaleString('pt-BR')} <span className="text-zinc-700 text-[8px] uppercase">KM</span></span>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                 <button 
                  onClick={() => handleDelete(v.id)}
                  className="p-4 bg-zinc-950 text-zinc-800 hover:text-red-500 rounded-2xl transition-all border border-zinc-900"
                >
                  <Trash2 size={20} />
                </button>
                <button 
                  onClick={() => navigate(`/vehicles/${v.id}`)}
                  className="flex-1 bg-zinc-900 text-white font-black text-[10px] uppercase tracking-widest py-4 rounded-2xl hover:bg-[#E11D48] transition-all flex items-center justify-center gap-3 shadow-lg"
                >
                  Visualizar Histórico
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Vehicles;
