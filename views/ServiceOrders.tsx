
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Trash2, X, Eye, 
  Printer, ImageIcon, Wrench, Calendar, CreditCard, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ServiceOrder, UserSession, OSStatus, PaymentStatus } from '../types';
import html2canvas from 'html2canvas';

const ServiceOrders: React.FC<{ role?: string; session?: UserSession; syncData?: (key: string, data: any) => Promise<void> }> = ({ role = 'Dono', session, syncData }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session) {
      const saved = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_orders`) || '[]');
      setOrders(saved);
    }
  }, [session]);

  const handleDelete = async (id: string) => {
    if (role !== 'Dono' || !session || !syncData) return;
    if (!confirm("CONFIRMA EXCLUSÃO?")) return;
    const updated = orders.filter(o => o.id !== id);
    setOrders(updated);
    await syncData('orders', updated);
  };

  const downloadImage = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 3, backgroundColor: '#FFFFFF', useCORS: true });
    const link = document.createElement('a');
    link.download = `KAEN_MECANICA_NOTA_${selectedOrder?.osNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const filtered = orders.filter(o => 
    o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.vehiclePlate.includes(searchTerm.toUpperCase()) || 
    o.osNumber.includes(searchTerm)
  ).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="animate-in fade-in duration-700 space-y-12 p-6 md:p-12 pb-40 max-w-[1400px] mx-auto flex flex-col items-center w-full">
      <div className="flex flex-col items-center text-center gap-12 w-full mt-8">
        <h1 className="text-6xl md:text-[8rem] font-black text-white italic uppercase tracking-tighter leading-[0.8] text-center">
          ARQUIVO <span className="text-[#FF2D55]">KAEN</span>
        </h1>
      </div>

      <div className="w-full glass-card p-4 rounded-full flex items-center shadow-2xl border-white/10 max-w-4xl">
        <Search className="ml-8 text-zinc-700" size={24} />
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="BUSCAR NOTA..." className="w-full bg-transparent border-none py-6 px-8 text-white font-black text-xs outline-none uppercase tracking-[0.2em] placeholder-zinc-800" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
        {filtered.map(os => (
          <div key={os.id} className="glass-card rounded-ios p-10 hover:border-[#FF2D55]/50 transition-all group relative overflow-hidden flex flex-col justify-between h-[450px]">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black text-[#FF2D55] tracking-[0.4em] uppercase italic">ID #{os.osNumber}</span>
              <span className="text-[10px] font-black text-zinc-800 uppercase italic">{new Date(os.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none group-hover:text-[#FF2D55] transition-colors">{os.clientName}</h3>
            <div className="mt-12 pt-10 border-t border-white/5 flex items-center justify-between">
              <p className="text-3xl font-black text-white italic tracking-tighter">R$ {os.totalValue.toLocaleString('pt-BR')}</p>
              <div className="flex gap-2">
                <button onClick={() => setSelectedOrder(os)} className="p-5 bg-white/5 text-[#FF2D55] rounded-3xl border border-white/10 hover:bg-[#FF2D55] hover:text-white transition-all"><Eye size={24}/></button>
                {role === 'Dono' && <button onClick={() => handleDelete(os.id)} className="p-5 bg-white/5 text-zinc-800 hover:text-[#FF2D55] rounded-3xl border border-white/10 transition-all"><Trash2 size={24}/></button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-3xl overflow-y-auto no-scrollbar animate-in fade-in duration-500">
          <div className="w-full max-w-[850px] flex flex-col items-center gap-12 my-20 px-4">
             <button onClick={() => setSelectedOrder(null)} className="fixed top-10 right-10 text-white bg-white/10 p-5 rounded-full hover:bg-[#FF2D55] transition-all z-[210] border border-white/10"><X size={32}/></button>
             
             <div className="invoice-preview-scale">
               <div ref={invoiceRef} className="invoice-container shadow-2xl">
                  <div className="flex justify-between items-start mb-12 border-b border-zinc-100 pb-8">
                     <div className="flex gap-4 items-center">
                        <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white"><Wrench size={32} /></div>
                        <div>
                          <h1 className="text-3xl font-black tracking-tighter uppercase leading-none mb-1">KAEN MECÂNICA</h1>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-4xl font-black leading-none mb-1 tracking-tighter">KP-{selectedOrder.osNumber}</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{new Date(selectedOrder.createdAt).toLocaleDateString('pt-BR')}</p>
                     </div>
                  </div>

                  <div className="bg-zinc-50 p-6 rounded-[2.5rem] border border-zinc-100 mb-8">
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-2">PROPRIETÁRIO</p>
                    <p className="text-2xl font-black uppercase leading-tight tracking-tighter">{selectedOrder.clientName}</p>
                  </div>

                  <div className="flex-1 overflow-visible mb-10">
                     <table className="w-full text-left">
                        <thead>
                          <tr className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest border-b border-zinc-50">
                            <th className="pb-4 italic">DESCRIÇÃO</th>
                            <th className="pb-4 text-center">QTD</th>
                            <th className="pb-4 text-right">TOTAL</th>
                          </tr>
                        </thead>
                        <tbody className="font-bold text-zinc-800">
                          {selectedOrder.items.map((i,idx)=>(
                            <tr key={idx} className="border-b border-zinc-50 last:border-none">
                              <td className="text-[12px] py-4 uppercase leading-tight pr-6">{i.description}</td>
                              <td className="text-[12px] py-4 text-center text-zinc-400 px-4">{i.quantity}</td>
                              <td className="text-[12px] py-4 text-right">R$ {(i.quantity*i.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                          {selectedOrder.laborValue > 0 && (
                            <tr className="bg-zinc-50/50">
                              <td className="text-[12px] py-5 uppercase font-black">Mão de Obra</td>
                              <td className="text-[12px] py-5 text-center text-zinc-400">01</td>
                              <td className="text-[12px] py-5 text-right font-black">R$ {selectedOrder.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          )}
                        </tbody>
                     </table>
                  </div>

                  <div className="mt-auto flex justify-between items-center border-t border-zinc-100 pt-8">
                     <div className={`px-8 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest ${selectedOrder.paymentStatus === PaymentStatus.PAGO ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>SITUAÇÃO: {selectedOrder.paymentStatus}</div>
                     <div className="bg-zinc-50 px-8 py-6 rounded-[2.5rem] flex flex-col items-end min-w-[240px] border border-zinc-100">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">TOTAL DA NOTA</p>
                        <p className="text-3xl font-black text-black leading-none tracking-tighter">R$ {selectedOrder.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                     </div>
                  </div>
               </div>
             </div>

             <div className="w-full max-w-[600px] grid grid-cols-2 gap-4 px-4">
                <button onClick={downloadImage} className="bg-white text-black py-8 rounded-ios font-black uppercase text-[11px] tracking-[0.4em] flex items-center justify-center gap-5 italic shadow-2xl">
                   <ImageIcon size={28}/> SALVAR IMAGEM
                </button>
                <button onClick={() => window.print()} className="glass-card py-8 rounded-ios font-black uppercase text-[11px] tracking-[0.4em] flex items-center justify-center gap-5 italic border-white/10 shadow-2xl text-white">
                   <Printer size={28}/> IMPRIMIR A4
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceOrders;
