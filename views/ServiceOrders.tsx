
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, FileText, Trash2, Edit3, X, Eye, 
  Printer, MessageCircle, Wrench, ImageIcon, ChevronRight
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

  const handleDelete = async (id: string, osNumber: string) => {
    if (role !== 'Dono' || !session || !syncData) {
      alert("Acesso Negado.");
      return;
    }
    if (!confirm(`Excluir permanentemente o Registro #${osNumber}?`)) return;
    const updated = orders.filter(o => o.id !== id);
    setOrders(updated);
    await syncData('orders', updated);
  };

  const handlePrint = () => { window.print(); };

  const downloadImage = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 3, backgroundColor: '#ffffff', windowWidth: 800 });
    const link = document.createElement('a');
    link.download = `Nota_Kaen_${selectedOrder?.osNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const filtered = orders.filter(o => 
    o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.vehiclePlate.includes(searchTerm.toUpperCase()) || 
    o.osNumber.includes(searchTerm.toUpperCase())
  ).reverse();

  // Escala dinâmica para o modal
  const getScaleStyles = (count: number) => {
    const isCompact = count > 8;
    const fontSize = isCompact ? 'text-[9px]' : 'text-[12px]';
    const padding = isCompact ? 'py-1.5' : 'py-3.5';
    return { fontSize, padding, isCompact };
  };

  return (
    <div className="animate-ios-slide space-y-8 p-6 md:p-12 pb-32 h-full overflow-y-auto no-scrollbar scroll-smooth">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 print:hidden">
        <div>
          <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
            Arquivo <span className="text-[#FF2D55]">Cloud</span>
          </h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-4 italic">Link de Histórico Neural Ativo</p>
        </div>
        <button 
          onClick={() => navigate('/orders/new')} 
          className="bg-[#FF2D55] px-10 py-5 rounded-ios font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 shadow-2xl shadow-[#FF2D55]/30 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={18} /> Lançar Nova Nota
        </button>
      </div>

      <div className="glass-card p-3 rounded-full flex items-center print:hidden shadow-xl">
        <Search className="ml-6 text-zinc-500" size={20} />
        <input 
          type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Escanear placa ou ID de registro..." 
          className="w-full bg-transparent border-none py-5 px-6 text-white font-black text-xs outline-none uppercase tracking-[0.1em] placeholder-zinc-700"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
        {filtered.map(os => (
          <div key={os.id} className="glass-card rounded-ios p-8 hover:scale-[1.02] hover:border-[#FF2D55]/40 transition-all shadow-2xl relative group overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-black text-[#FF2D55] tracking-[0.3em] uppercase italic">ID: {os.osNumber}</span>
              <span className="text-[9px] font-black text-zinc-600 uppercase">{new Date(os.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2 truncate group-hover:text-[#FF2D55] transition-colors">
              {os.clientName}
            </h3>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-10">{os.vehiclePlate} • {os.vehicleModel}</p>
            
            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <div>
                <p className="text-2xl font-black text-white italic tracking-tight">R$ {os.totalValue.toLocaleString('pt-BR')}</p>
                <div className={`text-[8px] font-black uppercase inline-block px-3 py-1 rounded-full mt-2 ${os.paymentStatus === PaymentStatus.PAGO ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                   {os.paymentStatus === PaymentStatus.PAGO ? 'PAGO' : 'PENDENTE'}
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setSelectedOrder(os)} 
                  className="p-4 bg-white/5 text-[#FF2D55] rounded-3xl border border-white/5 hover:bg-[#FF2D55] hover:text-white transition-all shadow-lg active:scale-90"
                >
                  <Eye size={20}/>
                </button>
                <button 
                  onClick={() => handleDelete(os.id, os.osNumber)} 
                  className="p-4 bg-white/5 text-zinc-600 hover:text-[#FF2D55] rounded-3xl border border-white/5 transition-all active:scale-90"
                >
                  <Trash2 size={20}/>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE VISUALIZAÇÃO BIONIC SQUARE */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-8 bg-black/90 backdrop-blur-2xl overflow-y-auto no-scrollbar print:p-0 print:bg-white animate-in fade-in duration-500">
          <div className="w-full max-w-[900px] flex flex-col items-center gap-8 my-12 print:my-0">
             <button 
              onClick={() => setSelectedOrder(null)} 
              className="fixed top-10 right-10 text-white bg-white/10 p-4 rounded-full hover:bg-[#FF2D55] print:hidden z-[210] transition-all active:scale-90"
             >
              <X size={28}/>
             </button>
             
             {/* TEMPLATE KAEN MECÂNICA - VERSÃO BIONIC SQUARE */}
             <div 
              ref={invoiceRef} 
              className="w-full max-w-[550px] bg-white text-zinc-900 p-8 sm:p-10 flex flex-col rounded-[3.5rem] print:p-8 print:max-w-none print:rounded-none shadow-[0_40px_100px_rgba(0,0,0,0.5)] print:shadow-none"
              style={{ 
                minHeight: selectedOrder.items.length > 8 ? 'auto' : '550px',
                aspectRatio: selectedOrder.items.length > 8 ? 'auto' : '1 / 1'
              }}
             >
                <div className="flex justify-between items-start mb-8">
                   <div className="flex gap-4">
                      <div className="w-14 h-14 bg-black rounded-[1.8rem] flex items-center justify-center text-white shrink-0 shadow-xl">
                        <Wrench size={32} />
                      </div>
                      <div>
                         <h1 className="text-2xl font-black tracking-tighter uppercase leading-none mb-1">KAEN MECÂNICA</h1>
                         <p className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">Unidade de Precisão • Marques Alves, 765</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-zinc-200 uppercase mb-1 tracking-[0.2em]">ID REGISTRO</p>
                      <p className="text-3xl font-black leading-none mb-1 italic tracking-tighter">#{selectedOrder.osNumber}</p>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">{new Date(selectedOrder.createdAt).toLocaleDateString('pt-BR')}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                   <div className="bg-[#fcfcfc] p-5 rounded-[2.2rem] border border-zinc-100">
                      <p className="text-[7px] font-black text-zinc-300 uppercase tracking-[0.3em] mb-2">PROPRIETÁRIO</p>
                      <p className="text-lg font-black uppercase italic leading-none">{selectedOrder.clientName}</p>
                   </div>
                   <div className="bg-[#fcfcfc] p-5 rounded-[2.2rem] border border-zinc-100 flex justify-between">
                      <div>
                         <p className="text-[7px] font-black text-zinc-300 uppercase tracking-[0.3em] mb-2">PLACA</p>
                         <p className="text-lg font-black uppercase italic leading-none">{selectedOrder.vehiclePlate}</p>
                         <p className="text-[9px] font-bold text-zinc-400 uppercase truncate">{selectedOrder.vehicleModel}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[7px] font-black text-zinc-300 uppercase tracking-[0.3em] mb-2">KM</p>
                         <p className="text-lg font-black uppercase italic leading-none">{selectedOrder.vehicleKm || '0'}</p>
                      </div>
                   </div>
                </div>

                <div className="flex-1">
                   <table className="w-full text-left text-[11px]">
                      <thead>
                         <tr className="text-[8px] font-black text-zinc-200 uppercase tracking-[0.4em] border-b border-zinc-100">
                            <th className="pb-4">DESCRIÇÃO DOS COMPONENTES</th>
                            <th className="pb-4 text-center">QTD</th>
                            <th className="pb-4 text-right">TOTAL</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50 font-bold text-zinc-800">
                         {selectedOrder.items.map((i, idx) => (
                            <tr key={idx} className="break-inside-avoid">
                               <td className={`${getScaleStyles(selectedOrder.items.length).fontSize} ${getScaleStyles(selectedOrder.items.length).padding} uppercase italic leading-tight pr-6`}>{i.description}</td>
                               <td className={`${getScaleStyles(selectedOrder.items.length).fontSize} ${getScaleStyles(selectedOrder.items.length).padding} text-center`}>{i.quantity.toString().padStart(2, '0')}</td>
                               <td className={`${getScaleStyles(selectedOrder.items.length).fontSize} ${getScaleStyles(selectedOrder.items.length).padding} text-right font-black`}>R$ {(i.quantity * i.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                         ))}
                         {selectedOrder.laborValue > 0 && (
                            <tr className="break-inside-avoid">
                               <td className={`${getScaleStyles(selectedOrder.items.length).fontSize} ${getScaleStyles(selectedOrder.items.length).padding} uppercase italic font-black`}>MÃO DE OBRA ESPECIALIZADA</td>
                               <td className={`${getScaleStyles(selectedOrder.items.length).fontSize} ${getScaleStyles(selectedOrder.items.length).padding} text-center`}>01</td>
                               <td className={`${getScaleStyles(selectedOrder.items.length).fontSize} ${getScaleStyles(selectedOrder.items.length).padding} text-right font-black`}>R$ {selectedOrder.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                </div>

                <div className={`${getScaleStyles(selectedOrder.items.length).isCompact ? 'mt-4' : 'mt-10'} pt-10 border-t-2 border-zinc-100 flex justify-between items-end gap-10 break-inside-avoid`}>
                   <div className="space-y-6">
                      <div className={`px-5 py-2 rounded-full border-2 text-[10px] font-black uppercase tracking-[0.3em] ${selectedOrder.paymentStatus === PaymentStatus.PAGO ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                          STATUS: {selectedOrder.paymentStatus === PaymentStatus.PAGO ? 'PAGO' : 'PENDENTE'}
                      </div>
                      <div className="w-56 pt-5 border-t border-zinc-200">
                          <p className="text-[9px] font-black text-zinc-300 text-center uppercase tracking-[0.5em]">ASSINATURA TÉCNICA</p>
                      </div>
                   </div>
                   <div className="bg-[#f7f7f7] px-12 py-8 rounded-[3rem] flex flex-col items-end shadow-inner">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-2 italic">VALORAÇÃO TOTAL</p>
                      <p className="text-4xl font-black italic text-zinc-900 leading-none tracking-tighter">R$ {selectedOrder.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                   </div>
                </div>
                
                <div className="mt-10 text-center">
                   <p className="text-[9px] font-black text-zinc-100 uppercase tracking-[1em] italic">PRECISÃO KAEN • PERFORMANCE GARANTIDA</p>
                </div>
             </div>

             <div className="w-full max-w-[600px] grid grid-cols-2 gap-4 print:hidden px-4 mb-20">
                <button 
                  onClick={() => downloadImage()} 
                  className="glass-card py-6 rounded-ios font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/10 active:scale-95 transition-all"
                >
                   <ImageIcon size={22} className="text-[#FF2D55]"/> Salvar Imagem
                </button>
                <button 
                  onClick={() => handlePrint()} 
                  className="glass-card py-6 rounded-ios font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/10 active:scale-95 transition-all"
                >
                   <Printer size={22} className="text-[#FF2D55]"/> Imprimir (A4)
                </button>
             </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          div[ref] {
            visibility: visible !important;
            position: relative !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20mm !important;
            aspect-ratio: auto !important;
            min-height: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            height: auto !important;
          }
          @page { size: portrait; margin: 0; }
        }
      `}</style>
    </div>
  );
};

export default ServiceOrders;
