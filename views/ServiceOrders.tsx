
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, FileText, Trash2, Edit3, X, Eye, 
  Printer, MessageCircle, Wrench, ImageIcon
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
      alert("Permissão negada.");
      return;
    }
    if (!confirm(`Excluir Nota #${osNumber}?`)) return;
    const updated = orders.filter(o => o.id !== id);
    setOrders(updated);
    await syncData('orders', updated);
  };

  const handlePrint = () => { window.print(); };

  const downloadImage = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 2, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `Nota_${selectedOrder?.osNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const filtered = orders.filter(o => 
    o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.vehiclePlate.includes(searchTerm.toUpperCase()) || 
    o.osNumber.includes(searchTerm.toUpperCase())
  ).reverse();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 h-full overflow-y-auto no-scrollbar px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Histórico de <span className="text-[#E11D48]">Notas</span></h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-1 italic">Arquivo Cloud Ativo</p>
        </div>
        <button onClick={() => navigate('/orders/new')} className="bg-[#E11D48] px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
          <Plus size={18} /> Nova Nota
        </button>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 p-2 rounded-2xl flex items-center print:hidden">
        <Search className="ml-4 text-zinc-600" size={18} />
        <input 
          type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Pesquisar placa ou nota..." 
          className="w-full bg-transparent border-none py-4 px-4 text-white font-bold text-xs outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
        {filtered.map(os => (
          <div key={os.id} className="bg-[#121214] border border-zinc-800 rounded-[2rem] p-6 hover:border-[#E11D48]/30 transition-all shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[9px] font-black text-[#E11D48] tracking-widest uppercase italic">#{os.osNumber}</span>
              <span className="text-[8px] font-black text-zinc-600 uppercase">{new Date(os.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            <h3 className="text-lg font-black text-white uppercase italic tracking-tighter mb-1 truncate">{os.clientName}</h3>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6">{os.vehiclePlate} • {os.vehicleModel}</p>
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
              <p className="text-xl font-black text-white italic">R$ {os.totalValue.toLocaleString('pt-BR')}</p>
              <div className="flex gap-2">
                <button onClick={() => setSelectedOrder(os)} className="p-3 bg-zinc-900 text-[#E11D48] rounded-xl border border-zinc-800"><Eye size={18}/></button>
                <button onClick={() => handleDelete(os.id, os.osNumber)} className="p-3 bg-zinc-900 text-zinc-600 rounded-xl border border-zinc-800"><Trash2 size={18}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE VISUALIZAÇÃO COM SCROLL E ESCALA */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-md overflow-y-auto no-scrollbar print:p-0 print:bg-white">
          <div className="w-full max-w-[850px] flex flex-col items-center gap-6 my-10 print:my-0">
             <button onClick={() => setSelectedOrder(null)} className="fixed top-8 right-8 text-white bg-zinc-900/50 p-2 rounded-full print:hidden z-[210]"><X size={32}/></button>
             
             {/* TEMPLATE KAEN MECÂNICA */}
             <div ref={invoiceRef} className="w-full bg-white text-zinc-900 p-8 sm:p-12 flex flex-col min-h-[1100px] h-auto rounded-sm print:p-8 print:min-h-0">
                <div className="flex justify-between items-start mb-12">
                   <div className="flex gap-4">
                      <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center text-white shrink-0"><Wrench size={32} /></div>
                      <div>
                         <h1 className="text-2xl font-black tracking-tight uppercase leading-none mb-1">KAEN MECÂNICA</h1>
                         <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Rua Joaquim Marques Alves, 765</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[8px] font-black text-zinc-300 uppercase mb-1">OS Nº</p>
                      <p className="text-3xl font-black leading-none mb-1">{selectedOrder.osNumber}</p>
                      <p className="text-[9px] font-bold text-zinc-400">{new Date(selectedOrder.createdAt).toLocaleDateString('pt-BR')}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-12">
                   <div className="bg-[#f8f8f8] p-6 rounded-2xl border border-zinc-100">
                      <p className="text-[7px] font-black text-zinc-300 uppercase tracking-widest mb-2">PROPRIETÁRIO</p>
                      <p className="text-lg font-black uppercase italic leading-none">{selectedOrder.clientName}</p>
                   </div>
                   <div className="bg-[#f8f8f8] p-6 rounded-2xl border border-zinc-100 flex justify-between">
                      <div>
                         <p className="text-[7px] font-black text-zinc-300 uppercase tracking-widest mb-2">VEÍCULO</p>
                         <p className="text-lg font-black uppercase italic leading-none">{selectedOrder.vehiclePlate}</p>
                         <p className="text-[9px] font-bold text-zinc-400 uppercase">{selectedOrder.vehicleModel}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[7px] font-black text-zinc-300 uppercase tracking-widest mb-2">KM ATUAL</p>
                         <p className="text-lg font-black uppercase italic leading-none">{selectedOrder.vehicleKm || '0'} km</p>
                      </div>
                   </div>
                </div>

                <div className="flex-1">
                   <table className="w-full text-left text-[11px]">
                      <thead>
                         <tr className="text-[8px] font-black text-zinc-300 uppercase tracking-widest border-b border-zinc-50">
                            <th className="pb-4">DESCRIÇÃO</th>
                            <th className="pb-4 text-center">QTD</th>
                            <th className="pb-4 text-right">TOTAL</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50 font-bold text-zinc-800">
                         {selectedOrder.items.map((i, idx) => (
                            <tr key={idx} className="break-inside-avoid">
                               <td className="py-4 uppercase italic leading-tight pr-4">{i.description}</td>
                               <td className="py-4 text-center">{i.quantity.toString().padStart(2, '0')}</td>
                               <td className="py-4 text-right font-black">R$ {(i.quantity * i.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                         ))}
                         {selectedOrder.laborValue > 0 && (
                            <tr className="break-inside-avoid">
                               <td className="py-4 uppercase italic font-black">Mão de Obra Especializada</td>
                               <td className="py-4 text-center">01</td>
                               <td className="py-4 text-right font-black">R$ {selectedOrder.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                </div>

                <div className="mt-12 pt-10 border-t-2 border-zinc-100 flex justify-between items-end gap-10 break-inside-avoid">
                   <div className={`px-5 py-2 rounded-full border-2 text-[10px] font-black uppercase tracking-widest ${selectedOrder.paymentStatus === PaymentStatus.PAGO ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                      PAGAMENTO: {selectedOrder.paymentStatus}
                   </div>
                   <div className="bg-[#f5f5f5] px-12 py-8 rounded-[2.5rem] flex flex-col items-end min-w-[280px]">
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2 italic">TOTAL DA NOTA</p>
                      <p className="text-3xl font-black italic text-zinc-900 leading-none">R$ {selectedOrder.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                   </div>
                </div>
             </div>

             <div className="w-full max-w-[500px] grid grid-cols-2 gap-4 print:hidden px-4 mb-10">
                <button onClick={downloadImage} className="bg-zinc-900 border border-zinc-800 py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                   <ImageIcon size={20}/> Salvar Imagem
                </button>
                <button onClick={handlePrint} className="bg-zinc-900 border border-zinc-800 py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                   <Printer size={20}/> Imprimir
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
            position: absolute !important;
            left: 0 !important; top: 0 !important; width: 100% !important;
            margin: 0 !important; padding: 20mm !important;
          }
          @page { size: portrait; margin: 0; }
        }
      `}</style>
    </div>
  );
};

export default ServiceOrders;
