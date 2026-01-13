
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, FileText, Trash2, Edit3, Smartphone, ExternalLink, RefreshCw, X, Eye, 
  Download, Printer, MessageCircle, Wrench, ImageIcon
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
      alert("Apenas o Administrador pode excluir notas.");
      return;
    }
    if (!confirm(`⚠️ APAGAR NOTA #${osNumber}? Esta ação removerá o registro do histórico.`)) return;
    
    const updated = orders.filter(o => o.id !== id);
    setOrders(updated);
    await syncData('orders', updated);
    
    const currentTransactions = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_transactions`) || '[]');
    const updatedTransactions = currentTransactions.filter((t: any) => t.relatedId !== id);
    await syncData('transactions', updatedTransactions);
  };

  const downloadInvoice = async (os: ServiceOrder) => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { 
      scale: 2, 
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      scrollY: -window.scrollY
    });
    const link = document.createElement('a');
    link.download = `Nota_${os.osNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const shareWhatsApp = (os: ServiceOrder) => {
    const text = `*KAEN MECÂNICA - COMPROVANTE*\n\nNota: #${os.osNumber}\nVeículo: ${os.vehiclePlate}\nTotal: R$ ${os.totalValue.toLocaleString('pt-BR')}\nStatus: ${os.paymentStatus}\n\nObrigado pela preferência!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filtered = orders.filter(o => {
    return o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           o.vehiclePlate.includes(searchTerm.toUpperCase()) || 
           o.osNumber.includes(searchTerm.toUpperCase());
  }).reverse();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 h-full overflow-y-auto no-scrollbar scroll-smooth px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Histórico de <span className="text-[#E11D48]">Notas</span></h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest italic mt-1">Sincronizado com a Cloud</p>
        </div>
        <button 
          onClick={() => navigate('/orders/new')}
          className="bg-[#E11D48] px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
        >
          <Plus size={18} /> Nova Nota
        </button>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 p-2 rounded-2xl flex items-center shadow-lg print:hidden">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
          <input 
            type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Placa, Cliente ou Nº da Nota..." 
            className="w-full bg-transparent border-none py-4 pl-12 pr-4 focus:ring-0 text-white font-bold text-xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:hidden">
        {filtered.map(os => (
          <div key={os.id} className="bg-[#121214] border border-zinc-800 rounded-[2rem] p-6 hover:border-[#E11D48]/30 transition-all group shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[9px] font-black text-[#E11D48] tracking-widest uppercase italic">#{os.osNumber}</span>
              <span className="text-[8px] font-black text-zinc-600 uppercase">{new Date(os.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
            
            <div className="space-y-1 mb-6">
              <h3 className="text-lg font-black text-white uppercase italic tracking-tighter truncate">{os.clientName}</h3>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{os.vehiclePlate} • {os.vehicleModel}</p>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
              <div>
                <p className="text-xl font-black text-white italic">R$ {os.totalValue.toLocaleString('pt-BR')}</p>
                <div className={`text-[8px] font-black uppercase inline-block px-2 py-0.5 rounded mt-1 ${os.paymentStatus === PaymentStatus.PAGO ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                   {os.paymentStatus}
                </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => setSelectedOrder(os)} className="p-3 bg-zinc-900 text-[#E11D48] hover:text-white rounded-xl border border-zinc-800 shadow-md">
                    <Eye size={18}/>
                 </button>
                 <button onClick={() => handleDelete(os.id, os.osNumber)} className="p-3 bg-zinc-900 text-zinc-600 hover:text-red-500 rounded-xl border border-zinc-800 shadow-md">
                    <Trash2 size={18}/>
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE VISUALIZAÇÃO DA NOTA COM SUPORTE A SCROLL PARA CONTEÚDO GRANDE */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-md overflow-y-auto no-scrollbar print:p-0 print:bg-white">
           <div className="w-full max-w-[500px] flex flex-col items-center gap-6 my-4 sm:my-10 print:my-0">
             <button onClick={() => setSelectedOrder(null)} className="fixed top-6 right-6 sm:top-8 sm:right-8 text-white bg-zinc-900/50 p-2 rounded-full hover:bg-zinc-800 print:hidden z-[210]"><X size={28}/></button>
             
             {/* A NOTA EM SI */}
             <div 
               ref={invoiceRef}
               className="w-full bg-white text-zinc-900 p-6 sm:p-10 flex flex-col min-h-[700px] h-auto rounded-sm shadow-2xl print:shadow-none print:p-8"
             >
                <div className="flex justify-between items-start mb-10">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black rounded-lg flex items-center justify-center text-white"><Wrench size={28} /></div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black tracking-tighter uppercase leading-none mb-1">KAEN MECÂNICA</h1>
                      <p className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Rua Joaquim Marques Alves, 765</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[7px] sm:text-[8px] font-black text-zinc-300 uppercase mb-1">OS Nº</p>
                    <p className="text-xl sm:text-2xl font-black leading-none mb-1">{selectedOrder.osNumber}</p>
                    <p className="text-[8px] sm:text-[9px] font-bold text-zinc-400">{new Date(selectedOrder.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="bg-[#F8F8F8] p-5 rounded-2xl border border-zinc-100">
                    <p className="text-[6px] sm:text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-2">PROPRIETÁRIO</p>
                    <p className="text-sm sm:text-base font-black uppercase italic leading-none">{selectedOrder.clientName}</p>
                  </div>
                  <div className="bg-[#F8F8F8] p-5 rounded-2xl border border-zinc-100">
                    <div className="flex justify-between flex-wrap gap-2">
                       <div>
                        <p className="text-[6px] sm:text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-2">VEÍCULO</p>
                        <p className="text-sm sm:text-base font-black uppercase italic leading-none">{selectedOrder.vehiclePlate}</p>
                        <p className="text-[8px] sm:text-[9px] font-bold text-zinc-400 mt-1 uppercase truncate max-w-[100px]">{selectedOrder.vehicleModel}</p>
                       </div>
                       <div className="text-right">
                        <p className="text-[6px] sm:text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-2">KM ATUAL</p>
                        <p className="text-sm sm:text-base font-black uppercase italic leading-none">{selectedOrder.vehicleKm || '0'} km</p>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                   <table className="w-full text-left text-[10px] sm:text-[11px] border-collapse">
                      <thead>
                        <tr className="text-[7px] sm:text-[8px] font-black text-zinc-300 uppercase tracking-widest border-b border-zinc-50">
                          <th className="pb-4">DESCRIÇÃO</th>
                          <th className="pb-4 text-center">QTD</th>
                          <th className="pb-4 text-right">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50 text-zinc-800 font-bold">
                        {selectedOrder.items.map((i,idx)=>(
                          <tr key={idx} className="break-inside-avoid">
                            <td className="py-4 uppercase italic leading-tight pr-2">{i.description}</td>
                            <td className="py-4 text-center">{i.quantity.toString().padStart(2, '0')}</td>
                            <td className="py-4 text-right font-black">R$ {(i.quantity*i.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                        {selectedOrder.laborValue > 0 && (
                          <tr className="break-inside-avoid">
                            <td className="py-4 uppercase italic">Mão de Obra Especializada</td>
                            <td className="py-4 text-center">01</td>
                            <td className="py-4 text-right font-black">R$ {selectedOrder.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        )}
                      </tbody>
                   </table>
                </div>

                <div className="mt-8 pt-8 border-t border-zinc-100 flex justify-between items-end gap-4 break-inside-avoid">
                   <div className={`px-4 py-1.5 rounded-full border text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${selectedOrder.paymentStatus === PaymentStatus.PAGO ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                      PAGAMENTO: {selectedOrder.paymentStatus}
                   </div>
                   <div className="bg-[#F5F5F5] px-6 sm:px-10 py-4 sm:py-6 rounded-3xl flex flex-col items-end min-w-[150px] sm:min-w-[200px]">
                    <p className="text-[7px] sm:text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1 italic">Total da Nota</p>
                    <p className="text-xl sm:text-2xl font-black text-zinc-900 leading-none italic">R$ {selectedOrder.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
             </div>

             {/* Ações Modal */}
             <div className="w-full space-y-4 print:hidden px-4 mb-10">
                <button onClick={() => shareWhatsApp(selectedOrder)} className="w-full bg-[#25D366] py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 active:scale-95 shadow-xl">
                  <MessageCircle size={20}/> Compartilhar WhatsApp
                </button>
                <div className="grid grid-cols-2 gap-3">
                   <button onClick={() => downloadInvoice(selectedOrder)} className="bg-zinc-900 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-zinc-800 shadow-lg active:scale-95 transition-all">
                      <ImageIcon size={18}/> Salvar Imagem
                   </button>
                   <button onClick={() => window.print()} className="bg-zinc-900 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-zinc-800 shadow-lg active:scale-95 transition-all">
                      <Printer size={18}/> Imprimir
                   </button>
                </div>
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
          }
          @page { size: portrait; margin: 0; }
          .break-inside-avoid {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default ServiceOrders;
