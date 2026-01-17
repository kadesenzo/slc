
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
      alert("Access Denied.");
      return;
    }
    if (!confirm(`Permanently purge Record #${osNumber}?`)) return;
    const updated = orders.filter(o => o.id !== id);
    setOrders(updated);
    await syncData('orders', updated);
  };

  const handlePrint = () => { window.print(); };

  const downloadImage = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 2, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `Registry_${selectedOrder?.osNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const filtered = orders.filter(o => 
    o.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.vehiclePlate.includes(searchTerm.toUpperCase()) || 
    o.osNumber.includes(searchTerm.toUpperCase())
  ).reverse();

  return (
    <div className="animate-ios-slide space-y-8 p-6 md:p-12 pb-32 h-full overflow-y-auto no-scrollbar scroll-smooth">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 print:hidden">
        <div>
          <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
            Registry <span className="text-[#FF2D55]">Cloud</span>
          </h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-4 italic">Neural History Link Active</p>
        </div>
        <button 
          onClick={() => navigate('/orders/new')} 
          className="bg-[#FF2D55] px-10 py-5 rounded-ios font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 shadow-2xl shadow-[#FF2D55]/30 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={18} /> Deploy Record
        </button>
      </div>

      <div className="glass-card p-3 rounded-full flex items-center print:hidden shadow-xl">
        <Search className="ml-6 text-zinc-500" size={20} />
        <input 
          type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Scan license plate or registry ID..." 
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
                   {os.paymentStatus}
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

      {/* MODAL DE VISUALIZAÇÃO COM DESIGN PREMIUM */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 sm:p-8 bg-black/90 backdrop-blur-2xl overflow-y-auto no-scrollbar print:p-0 print:bg-white animate-in fade-in duration-500">
          <div className="w-full max-w-[900px] flex flex-col items-center gap-8 my-12 print:my-0">
             <button 
              onClick={() => setSelectedOrder(null)} 
              className="fixed top-10 right-10 text-white bg-white/10 p-4 rounded-full hover:bg-[#FF2D55] print:hidden z-[210] transition-all active:scale-90"
             >
              <X size={28}/>
             </button>
             
             {/* TEMPLATE KAEN MECÂNICA - BIONIC VERSION */}
             <div 
              ref={invoiceRef} 
              className="w-full bg-white text-zinc-900 p-10 sm:p-16 flex flex-col min-h-[1100px] h-auto rounded-[3.5rem] print:p-10 print:min-h-0 shadow-[0_40px_100px_rgba(0,0,0,0.5)]"
             >
                <div className="flex justify-between items-start mb-16">
                   <div className="flex gap-6">
                      <div className="w-20 h-20 bg-black rounded-[2rem] flex items-center justify-center text-white shrink-0 shadow-2xl">
                        <Wrench size={40} />
                      </div>
                      <div>
                         <h1 className="text-3xl font-black tracking-tighter uppercase leading-none mb-2">KAEN MECÂNICA</h1>
                         <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em]">BIONIC REPAIR DIVISION • SINCE 2024</p>
                         <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1 italic">Marques Alves, 765</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-zinc-300 uppercase mb-2 tracking-[0.4em]">REGISTRY ID</p>
                      <p className="text-4xl font-black leading-none mb-2 italic tracking-tighter">#{selectedOrder.osNumber}</p>
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{new Date(selectedOrder.createdAt).toLocaleDateString('pt-BR')}</p>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-16">
                   <div className="bg-[#fcfcfc] p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm">
                      <p className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.4em] mb-4">CITIZEN / OWNER</p>
                      <p className="text-2xl font-black uppercase italic leading-none">{selectedOrder.clientName}</p>
                   </div>
                   <div className="bg-[#fcfcfc] p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex justify-between">
                      <div>
                         <p className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.4em] mb-4">UNIT TELEMETRY</p>
                         <p className="text-2xl font-black uppercase italic leading-none">{selectedOrder.vehiclePlate}</p>
                         <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{selectedOrder.vehicleModel}</p>
                      </div>
                      <div className="text-right">
                         <p className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.4em] mb-4">TOTAL MILEAGE</p>
                         <p className="text-2xl font-black uppercase italic leading-none">{selectedOrder.vehicleKm || '0'} <span className="text-zinc-300">KM</span></p>
                      </div>
                   </div>
                </div>

                <div className="flex-1">
                   <table className="w-full text-left text-[12px]">
                      <thead>
                         <tr className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em] border-b border-zinc-100">
                            <th className="pb-6">TASK / COMPONENT DESCRIPTION</th>
                            <th className="pb-6 text-center">QTY</th>
                            <th className="pb-6 text-right">TOTAL CREDIT</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50 font-bold text-zinc-800">
                         {selectedOrder.items.map((i, idx) => (
                            <tr key={idx} className="break-inside-avoid">
                               <td className="py-6 uppercase italic leading-tight pr-6">{i.description}</td>
                               <td className="py-6 text-center">{i.quantity.toString().padStart(2, '0')}</td>
                               <td className="py-6 text-right font-black">R$ {(i.quantity * i.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                         ))}
                         {selectedOrder.laborValue > 0 && (
                            <tr className="break-inside-avoid">
                               <td className="py-6 uppercase italic font-black">SPECIALIZED TECHNICAL LABOR</td>
                               <td className="py-6 text-center">01</td>
                               <td className="py-6 text-right font-black">R$ {selectedOrder.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                         )}
                      </tbody>
                   </table>
                </div>

                <div className="mt-16 pt-12 border-t-2 border-zinc-100 flex justify-between items-end gap-10 break-inside-avoid">
                   <div className="space-y-8">
                      <div className={`px-6 py-2 rounded-full border-2 text-[10px] font-black uppercase tracking-[0.3em] ${selectedOrder.paymentStatus === PaymentStatus.PAGO ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                          STATUS: {selectedOrder.paymentStatus}
                      </div>
                      <div className="w-64 pt-5 border-t border-zinc-200">
                          <p className="text-[9px] font-black text-zinc-300 text-center uppercase tracking-[0.5em]">AUTH SIGNATURE</p>
                      </div>
                   </div>
                   <div className="bg-[#f7f7f7] px-14 py-10 rounded-[3rem] flex flex-col items-end shadow-inner">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] mb-2 italic">VALUATION TOTAL</p>
                      <p className="text-4xl font-black italic text-zinc-900 leading-none tracking-tighter">R$ {selectedOrder.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                   </div>
                </div>
                
                <div className="mt-16 text-center">
                   <p className="text-[9px] font-black text-zinc-200 uppercase tracking-[1em] italic">PRECISION REPAIR • GUARANTEED PERFORMANCE</p>
                </div>
             </div>

             <div className="w-full max-w-[600px] grid grid-cols-2 gap-4 print:hidden px-4 mb-20">
                <button 
                  onClick={() => downloadImage()} 
                  className="glass-card py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/10 active:scale-95 transition-all"
                >
                   <ImageIcon size={22} className="text-[#FF2D55]"/> Encrypt Image
                </button>
                <button 
                  onClick={() => handlePrint()} 
                  className="glass-card py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/10 active:scale-95 transition-all"
                >
                   <Printer size={22} className="text-[#FF2D55]"/> Neural Print
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceOrders;
