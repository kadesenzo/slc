
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Wrench, ChevronLeft, ChevronRight, X,
  User, Car, Search, Loader2, Download, 
  Printer, Save, MessageCircle, Check, ImageIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Client, Vehicle, OSItem, OSStatus, ServiceOrder, PaymentStatus, UserSession, PaymentMethod } from '../types';
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
  const [obs, setObs] = useState('');
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

  const subtotal = useMemo(() => {
    const itemsTotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
    return itemsTotal + (parseFloat(labor) || 0);
  }, [items, labor]);

  const totalValue = useMemo(() => {
    return Math.max(0, subtotal - (parseFloat(discount) || 0));
  }, [subtotal, discount]);

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
    if (!selectedClient || !selectedVehicle || !session || !syncData) {
      alert("Selecione cliente e veículo para continuar.");
      return;
    }
    
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
        problem: obs || 'Serviços Automotivos',
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
      alert("Erro ao salvar dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadImage = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { 
      scale: 3, 
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      windowWidth: 800
    });
    const link = document.createElement('a');
    link.download = `Nota_Kaen_${finalOs?.osNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleWhatsApp = () => {
    if (!finalOs) return;
    const text = `*KAEN MECÂNICA - COMPROVANTE*\n\nNota: #${finalOs.osNumber}\nVeículo: ${finalOs.vehiclePlate}\nTotal: R$ ${finalOs.totalValue.toLocaleString('pt-BR')}\nStatus: ${finalOs.paymentStatus}\n\nObrigado pela confiança!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Lógica de Achatamento (Compression)
  const isCompact = items.length > 8;
  const itemFontSize = isCompact ? 'text-[9px]' : 'text-[12px]';
  const itemPadding = isCompact ? 'py-1.5' : 'py-3.5';
  const footerMargin = isCompact ? 'mt-4' : 'mt-10';

  return (
    <div className="flex flex-col h-full bg-[#000000] text-white selection:bg-[#FF2D55]">
      {/* Header Bionic */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between glass-card sticky top-0 z-50 print:hidden">
        <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-full text-zinc-400 active:scale-90 transition-transform">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] italic">Nova <span className="text-[#FF2D55]">Nota Bionic</span></h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 no-scrollbar print:p-0 print:overflow-visible scroll-smooth">
        {step !== 'FINAL' ? (
          <div className="max-w-xl mx-auto space-y-8 animate-ios-slide pb-32">
            {/* Step 1: Identificação */}
            <div className="glass-card p-8 rounded-ios border border-white/10 space-y-6 shadow-2xl">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 bg-[#FF2D55]/10 rounded-full flex items-center justify-center text-[#FF2D55]"><User size={16}/></div>
                 <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] italic">Registro de Unidade</h3>
               </div>
               
               {!selectedClient ? (
                  <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#FF2D55] transition-colors" size={20} />
                    <input 
                      type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Pesquisar Nome do Cliente..."
                      className="w-full bg-black/40 border border-white/5 rounded-full py-6 pl-16 pr-8 text-sm font-bold outline-none focus:border-[#FF2D55]/50 transition-all placeholder-zinc-800"
                    />
                    {filteredClients.length > 0 && (
                       <div className="mt-4 space-y-2 max-h-60 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-4">
                         {filteredClients.map(c => (
                           <button key={c.id} onClick={() => setSelectedClient(c)} className="w-full p-5 bg-white/5 hover:bg-[#FF2D55] rounded-3xl flex items-center justify-between border border-white/5 transition-all group">
                             <span className="text-xs font-black uppercase italic group-hover:text-white">{c.name}</span>
                             <Plus size={16} className="text-[#FF2D55] group-hover:text-white" />
                           </button>
                         ))}
                       </div>
                    )}
                  </div>
               ) : (
                  <div className="bg-white/5 p-6 rounded-[2.2rem] border border-[#FF2D55]/20 flex justify-between items-center animate-in zoom-in">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Proprietário Ativo</span>
                      <span className="text-sm font-black uppercase italic text-white">{selectedClient.name}</span>
                    </div>
                    <button onClick={() => {setSelectedClient(null); setSelectedVehicle(null);}} className="p-2 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all"><X size={20}/></button>
                  </div>
               )}

               {selectedClient && !selectedVehicle && (
                  <div className="grid grid-cols-1 gap-3 animate-in slide-in-from-bottom-4">
                    {clientVehicles.map(v => (
                      <button key={v.id} onClick={() => setSelectedVehicle(v)} className="p-6 bg-white/5 border border-white/5 rounded-3xl text-left hover:border-[#FF2D55]/50 transition-all group">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-lg font-black text-white group-hover:text-[#FF2D55] transition-colors italic tracking-tighter">{v.plate}</span>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase">{v.model}</span>
                          </div>
                          <ChevronRight size={18} className="text-zinc-700"/>
                        </div>
                      </button>
                    ))}
                  </div>
               )}

               {selectedVehicle && (
                 <div className="bg-white/5 p-6 rounded-[2.2rem] border border-white/5 flex justify-between items-center animate-in zoom-in">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Veículo Alvo</span>
                      <span className="text-sm font-black uppercase italic text-[#FF2D55]">{selectedVehicle.plate} • {selectedVehicle.model}</span>
                    </div>
                    <button onClick={() => setSelectedVehicle(null)} className="p-2 bg-white/5 rounded-full text-zinc-500 hover:text-white"><X size={18}/></button>
                 </div>
               )}
            </div>

            {/* Step 2: Itens */}
            {selectedVehicle && (
               <div className="glass-card p-8 rounded-ios border border-white/10 space-y-8 shadow-2xl animate-in slide-in-from-bottom-10">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#FF2D55]/10 rounded-full flex items-center justify-center text-[#FF2D55]"><Wrench size={16}/></div>
                      <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] italic">Itens da Nota</h3>
                    </div>
                    <button onClick={addItem} className="p-4 bg-[#FF2D55] rounded-2xl text-white shadow-lg active:scale-90 transition-transform"><Plus size={20}/></button>
                  </div>
                  
                  <div className="space-y-4">
                    {items.map(item => (
                      <div key={item.id} className="bg-black/40 p-5 rounded-3xl border border-white/5 space-y-4 hover:border-white/10 transition-all">
                        <input 
                          type="text" placeholder="Descrição do componente..." 
                          value={item.description} 
                          onChange={(e)=>updateItem(item.id, 'description', e.target.value.toUpperCase())} 
                          className="w-full bg-transparent text-xs font-black outline-none uppercase italic text-white placeholder-zinc-800"
                        />
                        <div className="flex gap-4">
                           <div className="flex-1 flex bg-black/60 p-1 rounded-2xl border border-white/5">
                             <input type="number" placeholder="Qtd" value={item.quantity} onChange={(e)=>updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full bg-transparent p-3 text-center text-xs font-black text-white outline-none"/>
                           </div>
                           <div className="flex-[2] flex bg-black/60 p-1 rounded-2xl border border-white/5">
                             <span className="flex items-center pl-4 text-zinc-600 text-[10px] font-black italic">R$</span>
                             <input type="number" placeholder="Preço" value={item.unitPrice} onChange={(e)=>updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full bg-transparent p-3 text-xs font-black text-white outline-none"/>
                           </div>
                           <button onClick={()=>removeItem(item.id)} className="p-4 text-zinc-700 hover:text-[#FF2D55] transition-colors"><Trash2 size={20}/></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest ml-2 italic">Mão de Obra</label>
                      <input type="number" value={labor} onChange={(e)=>setLabor(e.target.value)} className="w-full bg-black/60 border border-white/5 p-5 rounded-3xl text-sm font-black outline-none focus:border-[#FF2D55]"/>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest ml-2 italic">Status de Pagamento</label>
                      <select value={paymentStatus} onChange={(e)=>setPaymentStatus(e.target.value as PaymentStatus)} className="w-full bg-black/60 border border-white/5 p-5 rounded-3xl text-[10px] font-black uppercase outline-none focus:border-[#FF2D55]">
                        <option value={PaymentStatus.PENDENTE}>Pendente</option>
                        <option value={PaymentStatus.PAGO}>Pago</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-8 bg-[#FF2D55]/5 rounded-[2.5rem] border border-[#FF2D55]/10 flex flex-col items-center gap-2">
                    <span className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.4em]">Valoração Final</span>
                    <span className="text-4xl font-black text-white italic tracking-tighter">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <button 
                    onClick={handleFinalize} 
                    disabled={isSaving} 
                    className="w-full bg-[#FF2D55] py-7 rounded-ios font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-[#FF2D55]/40 flex items-center justify-center gap-4 active:scale-95 transition-all"
                  >
                    {isSaving ? <Loader2 className="animate-spin"/> : <Check size={24}/>}
                    Gerar Nota Kaen
                  </button>
               </div>
            )}
          </div>
        ) : (
          <div className="max-w-[800px] mx-auto flex flex-col items-center gap-10 print:block print:max-w-none pb-20">
             {/* NOTA QUADRADA BIONIC */}
             <div className="w-full overflow-x-auto no-scrollbar print:overflow-visible flex justify-center">
               <div 
                 ref={invoiceRef}
                 className="w-full max-w-[550px] bg-white text-zinc-900 p-8 sm:p-10 flex flex-col rounded-[3.5rem] shadow-2xl print:shadow-none print:p-8 print:max-w-none print:rounded-none"
                 style={{ 
                    minHeight: isCompact ? 'auto' : '550px',
                    aspectRatio: isCompact ? 'auto' : '1 / 1'
                 }}
               >
                  {/* Cabeçalho */}
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 bg-black rounded-[1.8rem] flex items-center justify-center text-white shrink-0 shadow-xl">
                        <Wrench size={32} />
                      </div>
                      <div>
                        <h1 className="text-2xl font-black tracking-tighter uppercase leading-none mb-1">KAEN MECÂNICA</h1>
                        <p className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">Unidade de Precisão • Rua J. M. Alves, 765</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-zinc-200 uppercase mb-1 tracking-[0.2em]">ID REGISTRO</p>
                      <p className="text-3xl font-black leading-none mb-1 italic tracking-tighter">#{finalOs.osNumber}</p>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">{new Date(finalOs.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  {/* Dados do Cliente & Veículo */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-[#F9F9F9] p-5 rounded-[2.2rem] border border-zinc-50">
                      <p className="text-[7px] font-black text-zinc-300 uppercase tracking-[0.3em] mb-2">PROPRIETÁRIO</p>
                      <p className="text-lg font-black uppercase italic leading-none truncate">{finalOs.clientName}</p>
                      <p className="text-[10px] font-bold text-zinc-400 mt-1">{selectedClient?.phone}</p>
                    </div>
                    <div className="bg-[#F9F9F9] p-5 rounded-[2.2rem] border border-zinc-50">
                      <div className="flex justify-between">
                         <div>
                          <p className="text-[7px] font-black text-zinc-300 uppercase tracking-[0.3em] mb-2">PLACA</p>
                          <p className="text-lg font-black uppercase italic leading-none">{finalOs.vehiclePlate}</p>
                          <p className="text-[9px] font-bold text-zinc-400 mt-1 uppercase truncate">{finalOs.vehicleModel}</p>
                         </div>
                         <div className="text-right">
                          <p className="text-[7px] font-black text-zinc-300 uppercase tracking-[0.3em] mb-2">KM</p>
                          <p className="text-lg font-black uppercase italic leading-none">{finalOs.vehicleKm || '0'}</p>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabela de Itens Condensada */}
                  <div className="flex-1 mb-6">
                     <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-[8px] font-black text-zinc-200 uppercase tracking-[0.4em] border-b border-zinc-50">
                            <th className="pb-4">DESCRIÇÃO DOS COMPONENTES</th>
                            <th className="pb-4 text-center">QTD</th>
                            <th className="pb-4 text-right">VALOR</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 text-zinc-800 font-bold">
                          {finalOs.items.map((i,idx)=>(
                            <tr key={idx} className="break-inside-avoid">
                              <td className={`${itemFontSize} ${itemPadding} uppercase italic leading-tight pr-4`}>{i.description}</td>
                              <td className={`${itemFontSize} ${itemPadding} text-center`}>{i.quantity.toString().padStart(2, '0')}</td>
                              <td className={`${itemFontSize} ${itemPadding} text-right font-black`}>R$ {(i.quantity*i.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                          {finalOs.laborValue > 0 && (
                            <tr className="break-inside-avoid">
                              <td className={`${itemFontSize} ${itemPadding} uppercase italic font-black`}>Mão de Obra Especializada</td>
                              <td className={`${itemFontSize} ${itemPadding} text-center`}>01</td>
                              <td className={`${itemFontSize} ${itemPadding} text-right font-black`}>R$ {finalOs.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          )}
                        </tbody>
                     </table>
                  </div>

                  {/* Rodapé Achatado */}
                  <div className={`${footerMargin} pt-8 border-t-2 border-zinc-50 flex justify-between items-end gap-6 break-inside-avoid`}>
                    <div className="space-y-6 flex-1">
                       <div className={`inline-flex px-5 py-2 rounded-full border-2 text-[9px] font-black uppercase tracking-[0.3em] ${finalOs.paymentStatus === PaymentStatus.PAGO ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                          STATUS: {finalOs.paymentStatus}
                       </div>
                       <div className="w-56 pt-4 border-t border-zinc-100">
                          <p className="text-[8px] font-black text-zinc-200 uppercase text-center tracking-[0.5em]">ASSINATURA DO TÉCNICO</p>
                       </div>
                    </div>

                    <div className="bg-[#f5f5f5] px-10 py-8 rounded-[2.5rem] flex flex-col items-end min-w-[220px] shadow-sm">
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-2 italic text-right">TOTAL DA NOTA</p>
                      <p className="text-3xl font-black text-zinc-900 leading-none italic tracking-tighter">R$ {finalOs.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  <div className="mt-8 text-center break-inside-avoid">
                     <p className="text-[8px] font-black text-zinc-100 uppercase tracking-[1em] italic">PRECISÃO KAEN • GARANTIA DE PERFORMANCE</p>
                  </div>
               </div>
             </div>

             {/* Botões de Ação */}
             <div className="w-full max-w-[550px] space-y-4 print:hidden px-4">
                <button onClick={handleWhatsApp} className="w-full bg-[#25D366] py-6 rounded-ios font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all">
                  <MessageCircle size={24}/> Compartilhar WhatsApp
                </button>
                <div className="grid grid-cols-2 gap-4">
                   <button onClick={downloadImage} className="glass-card py-6 rounded-ios font-black uppercase text-[9px] tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all">
                      <ImageIcon size={20} className="text-[#FF2D55]"/> Baixar Imagem
                   </button>
                   <button onClick={() => window.print()} className="glass-card py-6 rounded-ios font-black uppercase text-[9px] tracking-[0.3em] flex items-center justify-center gap-3 active:scale-95 transition-all">
                      <Printer size={20} className="text-[#FF2D55]"/> Imprimir (A4)
                   </button>
                </div>
                <button onClick={() => navigate('/orders')} className="w-full bg-white/5 text-zinc-500 py-4 rounded-ios font-black uppercase text-[9px] tracking-[0.4em] mt-6">
                   Finalizar e Sair
                </button>
             </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body { 
            background: white !important; 
            margin: 0 !important;
            padding: 0 !important;
          }
          #root { display: block !important; }
          .print\\:hidden { display: none !important; }
          div[ref] {
            visibility: visible !important;
            position: relative !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 20mm !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            min-height: 0 !important;
            height: auto !important;
            aspect-ratio: auto !important;
            display: flex !important;
            flex-direction: column !important;
          }
          @page { 
            size: portrait; 
            margin: 0; 
          }
          .break-inside-avoid {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default NewServiceOrder;
