
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  FileText, 
  Printer, 
  Share2,
  Trash2,
  Eye,
  X,
  Wrench,
  Package,
  ClipboardList,
  AlertTriangle,
  Image as ImageIcon,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ServiceOrder, PaymentStatus, UserSession } from '../types';
import html2canvas from 'html2canvas';

interface ServiceOrdersProps {
  role?: 'Dono' | 'Funcionário' | 'Recepção';
  session?: UserSession;
  syncData?: (key: string, data: any) => Promise<void>;
}

const ServiceOrders: React.FC<ServiceOrdersProps> = ({ role = 'Dono', session, syncData }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOS, setSelectedOS] = useState<ServiceOrder | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  useEffect(() => {
    if (session) {
      const userOrders = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_orders`) || '[]');
      setOrders(userOrders);
    }
  }, [session]);

  const handleDelete = async (id: string, osNumber: string) => {
    if (role !== 'Dono' || !session || !syncData) {
      alert("⚠️ ACESSO NEGADO: Apenas administradores podem remover notas.");
      return;
    }

    if (confirm(`⚠️ EXCLUSÃO PERMANENTE: Deseja apagar a nota #${osNumber}?`)) {
      const updated = orders.filter(o => o.id !== id);
      setOrders(updated);
      await syncData('orders', updated);
      if (selectedOS?.id === id) setSelectedOS(null);
    }
  };

  const shareWhatsApp = (os: ServiceOrder) => {
    const msg = `*KAEN MECÂNICA - NOTA #${os.osNumber}*\n*Veículo:* ${os.vehiclePlate}\n*Total: R$ ${os.totalValue.toLocaleString('pt-BR')}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filtered = orders.filter(o => 
    o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.vehiclePlate.includes(searchTerm) || 
    o.osNumber.includes(searchTerm)
  ).reverse();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 no-print">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Histórico de <span className="text-[#E11D48]">Serviços</span></h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Base de dados: <span className="text-white">{session?.username}</span></p>
        </div>
        <button 
          onClick={() => navigate('/orders/new')}
          className="bg-[#E11D48] px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-red-900/10 active:scale-95 glow-red"
        >
          <Plus size={20} />
          Nova Nota Fiscal
        </button>
      </div>

      <div className="bg-[#0F0F0F] border border-[#1F1F1F] p-2 rounded-[2rem] flex items-center shadow-lg">
        <div className="relative flex-1">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por cliente, placa ou número da OS..." 
            className="w-full bg-transparent border-none py-5 pl-16 pr-6 focus:ring-0 text-white font-bold placeholder-zinc-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(os => (
          <div key={os.id} className="bg-[#0F0F0F] border border-[#1F1F1F] rounded-[2.5rem] p-8 hover:border-[#E11D48]/40 transition-all group flex flex-col shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-black text-[#E11D48] tracking-[0.2em] uppercase">NOT-# {os.osNumber}</span>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${os.paymentStatus === PaymentStatus.PAGO ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {os.paymentStatus}
                </span>
                {role === 'Dono' && (
                  <button onClick={() => handleDelete(os.id, os.osNumber)} className="p-2 text-zinc-800 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                )}
              </div>
            </div>
            
            <h3 className="text-lg font-black text-white group-hover:text-zinc-100 uppercase tracking-tight italic mb-1">{os.clientName}</h3>
            <p className="text-xs font-black text-zinc-600 mb-8 uppercase tracking-widest">{os.vehiclePlate} • {os.vehicleModel}</p>
            
            <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50 mt-auto">
              <div>
                <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-1">Total</p>
                <p className="text-xl font-black text-white">R$ {os.totalValue.toLocaleString('pt-BR')}</p>
              </div>
              <button onClick={() => setSelectedOS(os)} className="px-5 py-3 bg-zinc-900 text-white text-[10px] font-black uppercase rounded-2xl hover:bg-[#E11D48] transition-all shadow-lg flex items-center gap-2">
                <Eye size={14} /> Abrir
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-32 text-center bg-zinc-950/30 border-2 border-dashed border-zinc-800 rounded-[3rem]">
            <FileText size={48} className="mx-auto text-zinc-900 mb-6 opacity-20" />
            <p className="text-zinc-700 font-black uppercase tracking-[0.3em] text-xs italic">Sem registros para esta busca</p>
          </div>
        )}
      </div>

      {/* VIEWER DE NOTA (Reutiliza modal de NewServiceOrder se necessário ou simplificado) */}
      {selectedOS && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/98 p-0 sm:p-4 overflow-y-auto no-scrollbar">
           <div className="bg-white w-full max-w-[210mm] min-h-screen sm:min-h-0 sm:rounded-[2rem] p-0 text-zinc-900 shadow-2xl relative flex flex-col">
             <div className="no-print bg-zinc-100 p-6 flex flex-wrap gap-3 justify-between items-center border-b border-zinc-200 sticky top-0 z-[210]">
               <div className="flex flex-wrap gap-2">
                 <button onClick={() => window.print()} className="bg-zinc-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2">
                   <Printer size={18} /> Imprimir A4
                 </button>
                 <button onClick={() => shareWhatsApp(selectedOS)} className="bg-emerald-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase flex items-center gap-2">
                   <Share2 size={18} /> WhatsApp
                 </button>
               </div>
               <button onClick={() => setSelectedOS(null)} className="p-3 text-zinc-400 hover:text-zinc-900"><X size={32} /></button>
             </div>

             <div className="p-10 md:p-20 flex flex-col flex-1 bg-white">
                <div className="flex justify-between items-start mb-10 pb-8 border-b-2 border-zinc-100">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white">
                      <Wrench size={36} />
                    </div>
                    <div>
                      <h1 className="text-3xl font-black tracking-tighter uppercase">KAEN <span className="text-zinc-500">MECÂNICA</span></h1>
                      <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em]">SISTEMA DE GESTÃO ELITE</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">OS Nº</p>
                    <p className="text-3xl font-black">{selectedOS.osNumber}</p>
                    <p className="text-xs font-bold text-zinc-500">{new Date(selectedOS.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10">
                   <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100">
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Proprietário</p>
                      <p className="text-xl font-black">{selectedOS.clientName}</p>
                   </div>
                   <div className="bg-zinc-50 p-6 rounded-[2rem] border border-zinc-100">
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Veículo / KM</p>
                      <p className="text-lg font-black uppercase">{selectedOS.vehiclePlate} • {selectedOS.vehicleModel}</p>
                      <p className="text-base font-black text-[#E11D48]">{selectedOS.vehicleKm} KM</p>
                   </div>
                </div>

                <div className="flex-1">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="border-b-2 border-zinc-100">
                      <tr className="text-zinc-400 uppercase font-black text-[10px] tracking-widest">
                        <th className="py-4">Descrição do Item/Serviço</th>
                        <th className="py-4 text-center w-20">Qtd</th>
                        <th className="py-4 text-right w-32">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {selectedOS.items.map((item, i) => (
                        <tr key={i}>
                          <td className="py-5 font-bold text-zinc-800">{item.description}</td>
                          <td className="py-5 text-center font-black text-zinc-400">{item.quantity}</td>
                          <td className="py-5 text-right font-black text-zinc-900">R$ {(item.quantity * item.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                      {selectedOS.laborValue > 0 && (
                        <tr className="bg-zinc-50/50">
                          <td className="py-5 font-black text-zinc-900">MÃO DE OBRA TÉCNICA ESPECIALIZADA</td>
                          <td className="py-5 text-center font-black text-zinc-400">01</td>
                          <td className="py-5 text-right font-black text-zinc-900">R$ {selectedOS.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-10 pt-10 border-t-2 border-zinc-100 text-right">
                   <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Geral</p>
                   <p className="text-5xl font-black text-zinc-900 leading-none">R$ {selectedOS.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                <div className="mt-16 text-center text-[10px] font-black text-zinc-300 uppercase tracking-[0.5em]">
                  KAEN MECÂNICA • CONFIANÇA EM CADA KM
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceOrders;
