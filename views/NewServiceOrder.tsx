
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Wrench, ChevronLeft, ChevronRight, X,
  User, Search, Loader2, Printer, Check, ImageIcon, MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Client, Vehicle, OSItem, OSStatus, ServiceOrder, PaymentStatus, UserSession } from '../types';
import html2canvas from 'html2canvas';

const NewServiceOrder: React.FC<{ session?: UserSession; syncData?: (key: string, data: any) => Promise<void> }> = ({ session, syncData }) => {
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const [step, setStep] = useState<'CLIENTE' | 'ITENS' | 'FINAL'>('CLIENTE');
  
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  const [items, setItems] = useState<OSItem[]>([]);
  const [labor, setLabor] = useState<string>('0');
  const [discount, setDiscount] = useState<string>('0');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PENDENTE);
  
  const [finalOs, setFinalOs] = useState<ServiceOrder | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (session) {
      const savedClients = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_clients`) || '[]');
      const savedVehicles = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_vehicles`) || '[]');
      setClients(savedClients);
      setVehicles(savedVehicles);
    }
  }, [session]);

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return [];
    return clients.filter(c => 
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
      c.phone.includes(clientSearch)
    );
  }, [clientSearch, clients]);

  const clientVehicles = useMemo(() => {
    return selectedClient ? vehicles.filter(v => v.clientId === selectedClient.id) : [];
  }, [selectedClient, vehicles]);

  const totalValue = useMemo(() => {
    const itemsTotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
    const subtotal = itemsTotal + (parseFloat(labor) || 0);
    return Math.max(0, subtotal - (parseFloat(discount) || 0));
  }, [items, labor, discount]);

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, unitPrice: 0, type: 'SERVICE' }]);
  };

  const updateItem = (id: string, field: keyof OSItem, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleFinalize = async () => {
    if (!selectedClient || !selectedVehicle || !session || !syncData) return;
    
    setIsSaving(true);
    try {
      const osNumber = `KP-${Math.floor(100000 + Math.random() * 900000)}`;
      const osId = Math.random().toString(36).substr(2, 9);

      const os: ServiceOrder = {
        id: osId,
        osNumber,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        vehicleId: selectedVehicle.id,
        vehiclePlate: selectedVehicle.plate,
        vehicleModel: selectedVehicle.model,
        vehicleKm: selectedVehicle.km.toString(),
        problem: 'Serviços de Manutenção Bionica',
        items,
        laborValue: parseFloat(labor) || 0,
        discount: parseFloat(discount) || 0,
        totalValue,
        status: OSStatus.FINALIZADO,
        paymentStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const currentOrders = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_orders`) || '[]');
      await syncData('orders', [...currentOrders, os]);

      setFinalOs(os);
      setStep('FINAL');
    } catch (error) {
      alert("Erro na sincronização.");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadImage = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 3, backgroundColor: '#ffffff', useCORS: true, windowWidth: 800, height: invoiceRef.current.offsetHeight });
    const link = document.createElement('a');
    link.download = `Kaenpro_Nota_${finalOs?.osNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleWhatsApp = () => {
    if (!finalOs) return;
    const text = `*KAENPRO MOTORS*\nNota: #${finalOs.osNumber}\nVeículo: ${finalOs.vehiclePlate}\nTotal: R$ ${finalOs.totalValue.toLocaleString('pt-BR')}\nStatus: ${finalOs.paymentStatus}\n\nLink para detalhes: https://kaenpro.cloud/check/${finalOs.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const isCompact = items.length > 8;
  const itemFontSize = isCompact ? 'text-[10px]' : 'text-[12px]';
  const itemPadding = isCompact ? 'py-1.5' : 'py-3.5';

  return (
    <div className="flex flex-col h-full bg-black text-white selection:bg-[#FF2D55]">
      {/* Header Centralizado */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between glass-card sticky top-0 z-50 print:hidden">
        <button onClick={() => navigate(-1)} className="p-4 bg-white/5 rounded-full text-zinc-500 active-glow border border-white/10">
          <ChevronLeft size={22} />
        </button>
        <h2 className="text-[11px] font-black uppercase tracking-[0.6em] italic">Gerador <span className="text-[#FF2D55]">Square</span></h2>
        <div className="w-14"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-12 no-scrollbar print:p-0 print:overflow-visible scroll-smooth">
        {step !== 'FINAL' ? (
          <div className="max-w-2xl mx-auto space-y-12 pb-32 flex flex-col items-center">
            {/* Step 1: Identificação */}
            <div className="glass-card p-10 rounded-ios border border-white/10 space-y-10 shadow-3xl animate-ios-slide w-full flex flex-col items-center text-center">
               <div className="flex flex-col items-center gap-5">
                 <div className="w-12 h-12 bg-[#FF2D55]/10 rounded-2xl flex items-center justify-center text-[#FF2D55] border border-[#FF2D55]/20 shadow-inner"><User size={24}/></div>
                 <h3 className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.5em] italic">Unidade de Registro</h3>
               </div>
               
               {!selectedClient ? (
                  <div className="relative group w-full">
                    <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-[#FF2D55] transition-colors" size={26} />
                    <input 
                      type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="NOME DO PROPRIETÁRIO..."
                      className="w-full bg-black/50 border-2 border-white/5 rounded-[2.2rem] py-8 pl-22 pr-8 text-sm font-black outline-none focus:border-[#FF2D55]/40 transition-all placeholder-zinc-900 text-center uppercase tracking-widest"
                    />
                    {filteredClients.length > 0 && (
                       <div className="mt-6 space-y-3 max-h-64 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-6 w-full">
                         {filteredClients.map(c => (
                           <button key={c.id} onClick={() => setSelectedClient(c)} className="w-full p-8 bg-white/5 hover:bg-[#FF2D55] rounded-[2.2rem] flex items-center justify-between border border-white/5 transition-all group shadow-xl">
                             <span className="text-xs font-black uppercase italic group-hover:text-white tracking-widest">{c.name}</span>
                             <Plus size={20} className="text-[#FF2D55] group-hover:text-white" />
                           </button>
                         ))}
                       </div>
                    )}
                  </div>
               ) : (
                  <div className="bg-white/5 p-10 rounded-ios border border-[#FF2D55]/20 flex flex-col items-center justify-center animate-in zoom-in w-full gap-4 relative">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-2 italic">Cliente Ativo</span>
                      <span className="text-2xl font-black uppercase italic text-white tracking-tighter">{selectedClient.name}</span>
                    </div>
                    <button onClick={() => {setSelectedClient(null); setSelectedVehicle(null);}} className="p-4 bg-black/50 rounded-full text-zinc-500 hover:text-white transition-all absolute top-6 right-6 border border-white/5"><X size={24}/></button>
                  </div>
               )}

               {selectedClient && !selectedVehicle && (
                  <div className="grid grid-cols-1 gap-5 w-full animate-in slide-in-from-bottom-8">
                    <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em] mb-2 italic">Selecione o Veículo</p>
                    {clientVehicles.map(v => (
                      <button key={v.id} onClick={() => setSelectedVehicle(v)} className="p-10 bg-white/5 border border-white/5 rounded-ios hover:border-[#FF2D55]/50 transition-all group shadow-2xl flex flex-col items-center text-center">
                        <span className="text-4xl font-black text-white group-hover:text-[#FF2D55] transition-colors italic tracking-tighter uppercase mb-2">{v.plate}</span>
                        <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-[0.4em]">{v.model}</span>
                      </button>
                    ))}
                  </div>
               )}

               {selectedVehicle && (
                 <div className="bg-white/5 p-10 rounded-ios border border-white/10 flex flex-col items-center justify-center animate-in zoom-in shadow-inner w-full relative">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-2 italic">Veículo Alvo</span>
                      <span className="text-2xl font-black uppercase italic text-[#FF2D55] tracking-tighter">{selectedVehicle.plate} • {selectedVehicle.model}</span>
                    </div>
                    <button onClick={() => setSelectedVehicle(null)} className="p-4 bg-black/50 rounded-full text-zinc-500 hover:text-white absolute top-6 right-6 border border-white/5"><X size={22}/></button>
                 </div>
               )}
            </div>

            {/* Step 2: Itens Centrados */}
            {selectedVehicle && (
               <div className="glass-card p-10 rounded-ios border border-white/10 space-y-12 shadow-3xl animate-ios-slide w-full flex flex-col items-center">
                  <div className="flex flex-col items-center gap-6">
                    <div className="w-12 h-12 bg-[#FF2D55]/10 rounded-2xl flex items-center justify-center text-[#FF2D55] border border-[#FF2D55]/20 shadow-inner"><Wrench size={24}/></div>
                    <h3 className="text-[11px] font-black uppercase text-zinc-500 tracking-[0.5em] italic">Anatomia do Serviço</h3>
                    <button onClick={addItem} className="p-6 bg-[#FF2D55] rounded-3xl text-white shadow-3xl hover:scale-110 active-glow transition-all flex items-center gap-3 px-10">
                        <Plus size={24}/> <span className="font-black uppercase text-[10px] tracking-widest">Incluir Componente</span>
                    </button>
                  </div>
                  
                  <div className="space-y-6 w-full">
                    {items.map(item => (
                      <div key={item.id} className="bg-black/50 p-8 rounded-[2.5rem] border border-white/5 space-y-8 hover:border-white/10 transition-all group flex flex-col items-center text-center shadow-xl">
                        <input 
                          type="text" placeholder="DESCRIÇÃO TÉCNICA..." 
                          value={item.description} 
                          onChange={(e)=>updateItem(item.id, 'description', e.target.value.toUpperCase())} 
                          className="w-full bg-transparent text-[13px] font-black outline-none uppercase italic text-white placeholder-zinc-900 tracking-[0.1em] text-center"
                        />
                        <div className="flex gap-4 w-full">
                           <div className="flex-1 flex bg-black/70 p-2 rounded-2xl border border-white/5 shadow-inner">
                             <input type="number" placeholder="QTD" value={item.quantity} onChange={(e)=>updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full bg-transparent p-4 text-center text-sm font-black text-white outline-none placeholder-zinc-800"/>
                           </div>
                           <div className="flex-[2] flex bg-black/70 p-2 rounded-2xl border border-white/5 shadow-inner">
                             <span className="flex items-center pl-6 text-zinc-700 font-black italic tracking-widest">R$</span>
                             <input type="number" placeholder="0,00" value={item.unitPrice} onChange={(e)=>updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full bg-transparent p-4 text-sm font-black text-white outline-none placeholder-zinc-800"/>
                           </div>
                           <button onClick={()=>removeItem(item.id)} className="p-6 text-zinc-800 hover:text-[#FF2D55] transition-colors"><Trash2 size={26}/></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                    <div className="space-y-4 flex flex-col items-center">
                      <label className="text-[10px] font-black text-zinc-700 tracking-[0.4em] italic uppercase">Mão de Obra</label>
                      <input type="number" value={labor} onChange={(e)=>setLabor(e.target.value)} className="w-full bg-black/70 border border-white/10 p-7 rounded-[2.2rem] text-xl font-black outline-none focus:border-[#FF2D55] shadow-inner text-center uppercase tracking-tighter"/>
                    </div>
                    <div className="space-y-4 flex flex-col items-center">
                      <label className="text-[10px] font-black text-zinc-700 tracking-[0.4em] italic uppercase">Liquidação</label>
                      <select value={paymentStatus} onChange={(e)=>setPaymentStatus(e.target.value as PaymentStatus)} className="w-full bg-black/70 border border-white/10 p-7 rounded-[2.2rem] text-[11px] font-black uppercase outline-none focus:border-[#FF2D55] shadow-inner text-center tracking-widest">
                        <option value={PaymentStatus.PENDENTE}>AGUARDANDO PIX</option>
                        <option value={PaymentStatus.PAGO}>CONFIRMADO</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-14 bg-[#FF2D55]/5 rounded-ios border border-[#FF2D55]/10 flex flex-col items-center gap-4 shadow-3xl w-full">
                    <span className="text-[11px] font-black uppercase text-zinc-600 tracking-[0.6em]">Montante Neural</span>
                    <span className="text-6xl font-black text-white italic tracking-tighter">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <button 
                    onClick={handleFinalize} 
                    disabled={isSaving} 
                    className="w-full bg-[#FF2D55] py-9 rounded-ios font-black uppercase text-[12px] tracking-[0.5em] shadow-3xl shadow-[#FF2D55]/50 flex items-center justify-center gap-5 active-glow transition-all hover:scale-[1.02]"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={30}/> : <Check size={30}/>}
                    Sincronizar Nota Cloud
                  </button>
               </div>
            )}
          </div>
        ) : (
          <div className="max-w-[800px] mx-auto flex flex-col items-center gap-14 print:block print:max-w-none pb-40">
             {/* NOTA QUADRADA BIONIC SQUARE - ANTI-CORTE */}
             <div className="w-full overflow-visible print:overflow-visible flex justify-center">
               <div 
                 ref={invoiceRef}
                 className="w-full max-w-[550px] bg-white text-zinc-950 p-10 sm:p-16 flex flex-col rounded-ios shadow-[0_80px_160px_-40px_rgba(0,0,0,0.9)] print:shadow-none print:p-12 print:max-w-none print:rounded-none overflow-visible border border-zinc-100"
                 style={{ 
                    minHeight: isCompact ? 'auto' : '550px',
                    aspectRatio: isCompact ? 'auto' : '1 / 1',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                 }}
               >
                  {/* Cabeçalho */}
                  <div className="flex justify-between items-start mb-12">
                    <div className="flex gap-6 items-center">
                      <div className="w-20 h-20 bg-black rounded-[2rem] flex items-center justify-center text-white shrink-0 shadow-3xl">
                        <Wrench size={44} />
                      </div>
                      <div>
                        <h1 className={`${isCompact ? 'text-2xl' : 'text-4xl'} font-black tracking-tighter uppercase leading-none mb-2 italic`}>KAENPRO</h1>
                        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest leading-none">Bionic Precision Unit • v26.1</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-[10px] font-black text-zinc-300 uppercase mb-2 tracking-[0.3em] italic">REGISTRO ID</p>
                      <p className={`${isCompact ? 'text-3xl' : 'text-5xl'} font-black leading-none mb-2 italic tracking-tighter`}>#{finalOs.osNumber}</p>
                      <p className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest">{new Date(finalOs.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="grid grid-cols-2 gap-6 mb-12">
                    <div className="bg-[#FAFAFA] p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex flex-col justify-center">
                      <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em] mb-4 italic">CITIZEN OWNER</p>
                      <p className="text-2xl font-black uppercase italic leading-none truncate tracking-tighter">{finalOs.clientName}</p>
                      <p className="text-[12px] font-bold text-zinc-400 mt-3 tracking-widest">{selectedClient?.phone}</p>
                    </div>
                    <div className="bg-[#FAFAFA] p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm flex justify-between items-center">
                         <div>
                          <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em] mb-4 italic">PLATE</p>
                          <p className="text-2xl font-black uppercase italic leading-none tracking-tighter">{finalOs.vehiclePlate}</p>
                          <p className="text-[11px] font-bold text-zinc-400 mt-3 uppercase truncate tracking-widest">{finalOs.vehicleModel}</p>
                         </div>
                         <div className="text-right">
                          <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em] mb-4 italic">DISTANCE</p>
                          <p className="text-2xl font-black uppercase italic leading-none tracking-tighter">{finalOs.vehicleKm || '0'} <span className="text-zinc-200 text-xs">KM</span></p>
                         </div>
                    </div>
                  </div>

                  {/* Tabela de Itens */}
                  <div className="flex-1 mb-10">
                     <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.5em] border-b-2 border-zinc-100">
                            <th className="pb-5">DATA COMPONENT DESCRIPTION</th>
                            <th className="pb-5 text-center">QTY</th>
                            <th className="pb-5 text-right">CREDIT</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 text-zinc-950 font-bold">
                          {finalOs.items.map((i,idx)=>(
                            <tr key={idx} className="break-inside-avoid">
                              <td className={`${itemFontSize} ${itemPadding} uppercase italic leading-tight pr-8 tracking-tight`}>{i.description}</td>
                              <td className={`${itemFontSize} ${itemPadding} text-center`}>{i.quantity.toString().padStart(2, '0')}</td>
                              <td className={`${itemFontSize} ${itemPadding} text-right font-black tracking-tighter`}>R$ {(i.quantity*i.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                          {finalOs.laborValue > 0 && (
                            <tr className="break-inside-avoid">
                              <td className={`${itemFontSize} ${itemPadding} uppercase italic font-black text-zinc-600`}>Specialized Bionic Labor (Precision)</td>
                              <td className={`${itemFontSize} ${itemPadding} text-center`}>01</td>
                              <td className={`${itemFontSize} ${itemPadding} text-right font-black tracking-tighter`}>R$ {finalOs.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          )}
                        </tbody>
                     </table>
                  </div>

                  {/* Rodapé Bionic */}
                  <div className="pt-12 border-t-2 border-zinc-100 flex justify-between items-end gap-10 break-inside-avoid mt-auto">
                    <div className="space-y-10 flex-1">
                       <div className={`inline-flex px-8 py-3 rounded-full border-2 text-[11px] font-black uppercase tracking-[0.4em] shadow-sm ${finalOs.paymentStatus === PaymentStatus.PAGO ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                          {finalOs.paymentStatus === PaymentStatus.PAGO ? 'SYNCED / PAGO' : 'PENDING / AGUARDANDO'}
                       </div>
                       <div className="w-72 pt-8 border-t-2 border-zinc-200">
                          <p className="text-[10px] font-black text-zinc-300 uppercase text-center tracking-[0.6em] leading-none italic">AUTH SIGNATURE</p>
                       </div>
                    </div>

                    <div className="bg-[#0A0A0A] px-14 py-12 rounded-[3.5rem] flex flex-col items-end min-w-[280px] shadow-3xl text-white">
                      <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.5em] mb-4 italic text-right">TOTAL VALUATION</p>
                      <p className={`${isCompact ? 'text-4xl' : 'text-6xl'} font-black italic tracking-tighter leading-none`}>R$ {finalOs.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  <div className="mt-16 text-center break-inside-avoid opacity-40">
                     <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[1.5em] italic">KAENPRO MOTORSPORT • PERFORMANCE GUARANTEED</p>
                  </div>
               </div>
             </div>

             {/* Painel de Ações Centrado */}
             <div className="w-full max-w-[550px] space-y-6 print:hidden px-6 mb-32 flex flex-col items-center">
                <button onClick={handleWhatsApp} className="w-full bg-[#25D366] py-8 rounded-ios font-black uppercase text-[12px] tracking-[0.5em] flex items-center justify-center gap-5 shadow-3xl active-glow transition-all hover:scale-[1.02]">
                  <MessageCircle size={32}/> Enviar Comprovante Cloud
                </button>
                <div className="grid grid-cols-2 gap-6 w-full">
                   <button onClick={downloadImage} className="glass-card py-8 rounded-ios font-black uppercase text-[11px] tracking-[0.4em] flex items-center justify-center gap-4 active-glow transition-all hover:bg-white/5 border-white/10">
                      <ImageIcon size={24} className="text-[#FF2D55]"/> Imagem 4K
                   </button>
                   <button onClick={() => window.print()} className="glass-card py-8 rounded-ios font-black uppercase text-[11px] tracking-[0.4em] flex items-center justify-center gap-4 active-glow transition-all hover:bg-white/5 border-white/10">
                      <Printer size={24} className="text-[#FF2D55]"/> Impressão A4
                   </button>
                </div>
                <button onClick={() => navigate('/dashboard')} className="w-full bg-white/5 text-zinc-700 py-7 rounded-ios font-black uppercase text-[11px] tracking-[0.8em] mt-12 hover:text-white transition-colors border border-white/5">
                   Sair do Workspace
                </button>
             </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body { background: white !important; margin: 0 !important; }
          #root { display: block !important; }
          .print\\:hidden { display: none !important; }
          div[ref] {
            visibility: visible !important;
            width: 100% !important;
            max-width: none !important;
            padding: 25mm !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            min-height: 0 !important;
            height: auto !important;
            aspect-ratio: auto !important;
          }
          @page { size: portrait; margin: 0; }
          .break-inside-avoid { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default NewServiceOrder;
