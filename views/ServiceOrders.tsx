
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Trash2, X, Eye, 
  Printer, ImageIcon, Wrench, Calendar, CreditCard, ChevronRight, Car
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
    o.osNumber.includes(searchTerm) ||
    o.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="animate-in fade-in duration-700 space-y-12 p-6 md:p-12 pb-40 max-w-[1200px] mx-auto flex flex-col items-center w-full">
      <div className="flex flex-col items-center text-center gap-12 w-full mt-8">
        <h1 className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-[0.8] text-center">
          HISTÓRICO <span className="text-[#FF2D55]">GERAL</span>
        </h1>
      </div>

      <div className="w-full glass-card p-4 rounded-full flex items-center shadow-2xl border-white/10 max-w-4xl">
        <Search className="ml-8 text-zinc-700" size={24} />
        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="BUSCAR POR PLACA, CARRO OU CLIENTE..." className="w-full bg-transparent border-none py-6 px-8 text-white font-black text-xs outline-none uppercase tracking-[0.2em] placeholder-zinc-800" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {filtered.map(os => (
          <div key={os.id} className="glass-card rounded-ios p-8 hover:border-[#FF2D55]/50 transition-all group relative overflow-hidden flex flex-col justify-between h-[420px]">
            <div>
              <div className="flex justify-between items-start mb-6">
                <span className="text-[10px] font-black text-[#FF2D55] tracking-[0.4em] uppercase italic">OS #{os.osNumber}</span>
                <span className="text-[10px] font-black text-zinc-800 uppercase italic">{new Date(os.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white/5 rounded-2xl text-zinc-700 group-hover:text-[#FF2D55] transition-colors">
                  <Car size={20} />
                </div>
                <div>
                   <p className="text-xl font-black text-white uppercase italic tracking-tighter">{os.vehiclePlate}</p>
                   <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{os.vehicleModel}</p>
                </div>
              </div>

              <h3 className="text-3xl font-black text-white/50 uppercase italic tracking-tighter leading-none group-hover:text-white transition-colors">{os.clientName}</h3>
            </div>

            <div className="pt-8 border-t border-white/5 flex items-center justify-between">
              <div>
                 <p className="text-[9px] font-black text-zinc-800 uppercase italic mb-1">TOTAL LÍQUIDO</p>
                 <p className="text-3xl font-black text-white italic tracking-tighter leading-none">R$ {os.totalValue.toLocaleString('pt-BR')}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setSelectedOrder(os)} className="p-4 bg-white/5 text-[#FF2D55] rounded-2xl border border-white/10 hover:bg-[#FF2D55] hover:text-white transition-all shadow-xl active:scale-90"><Eye size={22}/></button>
                {role === 'Dono' && <button onClick={() => handleDelete(os.id)} className="p-4 bg-white/5 text-zinc-800 hover:text-[#FF2D55] rounded-2xl border border-white/10 transition-all active:scale-90"><Trash2 size={22}/></button>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-3xl overflow-y-auto no-scrollbar animate-in fade-in duration-500">
          <div className="w-full max-w-[850px] flex flex-col items-center gap-12 my-20 px-4">
             <button onClick={() => setSelectedOrder(null)} className="fixed top-10 right-10 text-white bg-white/10 p-5 rounded-full hover:bg-[#FF2D55] transition-all z-[210] border border-white/10 active:scale-90"><X size={32}/></button>
             
             <div className="invoice-preview-container">
               <div className="invoice-scale-wrapper">
                 <div ref={invoiceRef} className="kaen-invoice shadow-[0_40px_120px_rgba(0,0,0,0.8)]">
                    <div className="flex justify-between items-start mb-12 border-b-2 border-zinc-100 pb-10">
                       <div className="flex gap-6 items-center">
                          <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center text-white">
                            <Wrench size={40} />
                          </div>
                          <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase leading-none mb-2">KAEN MECÂNICA</h1>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] italic">RUA JOAQUIM MARQUES ALVES, 765</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">ORDEM DE SERVIÇO</p>
                          <p className="text-5xl font-black leading-none mb-2 tracking-tighter">KP-{selectedOrder.osNumber}</p>
                          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest italic">{new Date(selectedOrder.createdAt).toLocaleDateString('pt-BR')}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-12">
                      <div className="bg-zinc-50 p-10 rounded-[3rem] border border-zinc-100">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 italic">CLIENTE / PROPRIETÁRIO</p>
                        <p className="text-3xl font-black uppercase leading-tight tracking-tighter">{selectedOrder.clientName}</p>
                      </div>
                      <div className="bg-zinc-50 p-10 rounded-[3rem] border border-zinc-100 flex flex-col justify-between">
                         <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 italic">VEÍCULO</p>
                            <p className="text-3xl font-black uppercase leading-none tracking-tighter">{selectedOrder.vehiclePlate}</p>
                            <p className="text-[14px] font-bold text-zinc-500 uppercase mt-3 italic">{selectedOrder.vehicleModel}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 italic">KM NO SERVIÇO</p>
                            <p className="text-2xl font-black tracking-tighter italic">{selectedOrder.vehicleKm || '0'} KM</p>
                          </div>
                         </div>
                      </div>
                    </div>

                    <div className="flex-1 mb-12 overflow-visible">
                       <table className="w-full text-left">
                          <thead>
                            <tr className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] border-b-2 border-zinc-100 pb-4">
                              <th className="pb-5 italic">ESPECIFICAÇÃO DO ITEM / SERVIÇO</th>
                              <th className="pb-5 text-center px-6">QTD</th>
                              <th className="pb-5 text-right px-6">UNITÁRIO</th>
                              <th className="pb-5 text-right">TOTAL</th>
                            </tr>
                          </thead>
                          <tbody className="font-bold text-zinc-800">
                            {selectedOrder.items.map((i,idx)=>(
                              <tr key={idx} className="border-b border-zinc-50">
                                <td className="text-[13px] py-6 uppercase leading-tight pr-10 font-black tracking-tight">{i.description}</td>
                                <td className="text-[13px] py-6 text-center text-zinc-400 px-6 italic">{i.quantity.toString().padStart(2, '0')}</td>
                                <td className="text-[13px] py-6 text-right text-zinc-400 px-6">R$ {i.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td className="text-[13px] py-6 text-right font-black">R$ {(i.quantity*i.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              </tr>
                            ))}
                            {selectedOrder.laborValue > 0 && (
                              <tr className="bg-zinc-50/50">
                                <td className="text-[13px] py-6 uppercase font-black italic">SERVIÇOS TÉCNICOS ESPECIALIZADOS (MÃO DE OBRA)</td>
                                <td className="text-[13px] py-6 text-center text-zinc-400 px-6 italic">01</td>
                                <td className="text-[13px] py-6 text-right text-zinc-400 px-6">R$ {selectedOrder.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td className="text-[13px] py-6 text-right font-black">R$ {selectedOrder.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              </tr>
                            )}
                          </tbody>
                       </table>
                    </div>

                    <div className="mt-auto border-t-2 border-zinc-100 pt-10">
                       <div className="flex justify-between items-end">
                          <div className="flex flex-col gap-10">
                             <div className={`inline-flex px-10 py-3 rounded-2xl border text-[11px] font-black uppercase tracking-[0.2em] italic ${selectedOrder.paymentStatus === PaymentStatus.PAGO ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                                STATUS: {selectedOrder.paymentStatus === PaymentStatus.PAGO ? 'PAGAMENTO EFETUADO' : 'AGUARDANDO PAGAMENTO'}
                             </div>
                             <div className="w-64 pt-6 border-t border-zinc-100">
                                <p className="text-[9px] font-black text-zinc-300 uppercase text-center tracking-[0.5em] italic">AUTORIZAÇÃO / CLIENTE</p>
                             </div>
                          </div>
                          <div className="bg-zinc-950 px-12 py-8 rounded-[3rem] flex flex-col items-end min-w-[300px] shadow-xl">
                             <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-2 italic">VALOR TOTAL LÍQUIDO</p>
                             <p className="text-5xl font-black text-white leading-none tracking-tighter italic">R$ {selectedOrder.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                       </div>
                    </div>
                    <div className="absolute bottom-10 left-0 w-full text-center">
                       <p className="text-[10px] font-black text-zinc-200 uppercase tracking-[0.8em] italic">PROTOCOLO ELITE • KAEN MECÂNICA • EXCELÊNCIA EM PERFORMANCE</p>
                    </div>
                 </div>
               </div>
             </div>

             <div className="w-full max-w-[500px] flex flex-col gap-4 px-4 pb-20">
                <button onClick={downloadImage} className="w-full bg-white text-black py-6 rounded-ios font-black uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-4 shadow-2xl active:scale-95 italic transition-all">
                   <ImageIcon size={24}/> SALVAR IMAGEM (WHATSAPP)
                </button>
                <button onClick={() => window.print()} className="glass-card py-6 rounded-ios font-black uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-white/5 italic transition-all border-white/10 text-white">
                   <Printer size={24}/> IMPRIMIR EM A4
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceOrders;
