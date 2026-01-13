
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Wrench, ChevronLeft, X,
  User, Car, Search, Loader2, Download, DollarSign,
  Printer, Save, MessageCircle, Share2, ImageIcon, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Client, Vehicle, OSItem, OSStatus, ServiceOrder, PaymentStatus, UserSession, PaymentMethod, TransactionType, FinancialTransaction } from '../types';
import html2canvas from 'html2canvas';

const NewServiceOrder: React.FC<{ session?: UserSession; syncData?: (key: string, data: any) => Promise<void> }> = ({ session, syncData }) => {
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const [step, setStep] = useState<'CLIENT' | 'ITEMS' | 'FINAL'>('CLIENT');
  
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  const [items, setItems] = useState<OSItem[]>([]);
  const [labor, setLabor] = useState<string>('0');
  const [discount, setDiscount] = useState<string>('0');
  const [obs, setObs] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.PIX);
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
    setItems([...items, { id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, unitPrice: 0, type: 'PART' }]);
  };

  const updateItem = (id: string, field: keyof OSItem, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleFinalize = async () => {
    if (!selectedClient || !selectedVehicle || !session || !syncData) {
      alert("Por favor, selecione um cliente e um veículo.");
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
        problem: obs || 'Manutenção Corretiva',
        items,
        laborValue: parseFloat(labor) || 0,
        discount: parseFloat(discount) || 0,
        totalValue,
        status: OSStatus.FINALIZADO,
        paymentStatus,
        paymentMethod,
        observations: obs,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const transaction: FinancialTransaction = {
        id: Math.random().toString(36).substr(2, 9),
        type: TransactionType.INCOME,
        category: 'Serviço/Peças',
        amount: totalValue,
        method: paymentMethod,
        description: `Nota #${osNumber} - ${selectedVehicle.plate}`,
        relatedId: osId,
        date: new Date().toISOString()
      };

      const currentOrders = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_orders`) || '[]');
      const currentTransactions = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_transactions`) || '[]');

      await syncData('orders', [...currentOrders, os]);
      await syncData('transactions', [...currentTransactions, transaction]);

      setFinalOs(os);
      setStep('FINAL');
    } catch (error) {
      console.error(error);
      alert("Erro ao criar nota.");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadInvoice = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { 
      scale: 2, 
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      scrollY: -window.scrollY
    });
    const link = document.createElement('a');
    link.download = `Nota_${finalOs?.osNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const shareWhatsApp = () => {
    if (!finalOs) return;
    const text = `*KAEN MECÂNICA - COMPROVANTE*\n\nNota: #${finalOs.osNumber}\nVeículo: ${finalOs.vehiclePlate}\nTotal: R$ ${finalOs.totalValue.toLocaleString('pt-BR')}\nStatus: ${finalOs.paymentStatus}\n\nObrigado pela preferência!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0B0B] text-white overflow-hidden">
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-[#0B0B0B] z-20 print:hidden">
        <button onClick={() => navigate(-1)} className="p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-sm font-black uppercase tracking-widest italic">Nova <span className="text-[#E11D48]">Nota Pro</span></h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 no-scrollbar pb-32 print:p-0 print:overflow-visible">
        {step !== 'FINAL' && (
           <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-300 print:hidden">
             {/* SELEÇÃO DE CLIENTE E VEÍCULO */}
             <div className="bg-zinc-900/50 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-zinc-800 shadow-xl space-y-6">
                <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic">1. Identificação</h3>
                {!selectedClient ? (
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input 
                      type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Pesquisar por Nome ou Telefone..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold outline-none focus:border-[#E11D48] transition-all"
                    />
                    {filteredClients.length > 0 && (
                       <div className="mt-4 space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                         {filteredClients.map(c => (
                           <button key={c.id} onClick={() => setSelectedClient(c)} className="w-full p-4 bg-zinc-950 rounded-xl flex items-center justify-between border border-transparent hover:border-[#E11D48]">
                             <span className="text-xs font-black uppercase italic text-left">{c.name}</span>
                             <Plus size={14} className="text-[#E11D48]" />
                           </button>
                         ))}
                       </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <User size={18} className="text-[#E11D48]"/>
                      <span className="text-xs font-black uppercase italic">{selectedClient.name}</span>
                    </div>
                    <button onClick={() => {setSelectedClient(null); setSelectedVehicle(null);}}><X size={18}/></button>
                  </div>
                )}

                {selectedClient && !selectedVehicle && (
                   <div className="grid grid-cols-2 gap-3">
                     {clientVehicles.map(v => (
                       <button key={v.id} onClick={() => setSelectedVehicle(v)} className="p-4 bg-zinc-950 border-2 border-zinc-800 rounded-2xl hover:border-[#E11D48] transition-all flex flex-col items-center gap-2">
                         <Car size={20} className="text-zinc-600"/>
                         <span className="text-[10px] font-black uppercase">{v.plate}</span>
                       </button>
                     ))}
                   </div>
                )}
                
                {selectedVehicle && (
                   <div className="bg-zinc-950 p-5 rounded-2xl border border-zinc-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Car size={18} className="text-[#E11D48]"/>
                      <span className="text-xs font-black uppercase italic">{selectedVehicle.plate} • {selectedVehicle.model}</span>
                    </div>
                    <button onClick={() => setSelectedVehicle(null)}><X size={18}/></button>
                  </div>
                )}
             </div>

             {/* ITENS DA NOTA */}
             {selectedVehicle && (
               <div className="bg-zinc-900/50 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-zinc-800 shadow-xl space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic">2. Serviços e Peças</h3>
                    <button onClick={addItem} className="p-2 bg-[#E11D48] rounded-lg text-white"><Plus size={16}/></button>
                  </div>
                  <div className="space-y-3">
                    {items.map(item => (
                      <div key={item.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                        <input type="text" placeholder="Descrição do serviço..." value={item.description} onChange={(e)=>updateItem(item.id, 'description', e.target.value.toUpperCase())} className="w-full bg-transparent border-none text-[11px] font-black uppercase outline-none text-white italic"/>
                        <div className="flex gap-2">
                           <input type="number" placeholder="Qtd" value={item.quantity} onChange={(e)=>updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-20 bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-xs font-bold text-center"/>
                           <input type="number" placeholder="Valor" value={item.unitPrice} onChange={(e)=>updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="flex-1 bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-xs font-bold"/>
                           <button onClick={()=>removeItem(item.id)} className="text-red-500 p-2"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block">Mão de Obra</label>
                      <input type="number" value={labor} onChange={(e)=>setLabor(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-black outline-none focus:border-[#E11D48]"/>
                    </div>
                    <div>
                      <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block">Pagamento</label>
                      <select value={paymentStatus} onChange={(e)=>setPaymentStatus(e.target.value as PaymentStatus)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-[10px] font-black uppercase outline-none">
                        <option value={PaymentStatus.PENDENTE}>Pendente</option>
                        <option value={PaymentStatus.PAGO}>Pago</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-zinc-500">Valor Final</span>
                    <span className="text-xl font-black text-white italic">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>

                  <button onClick={handleFinalize} className="w-full bg-[#E11D48] py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                    {isSaving ? <Loader2 className="animate-spin"/> : <Check size={20}/>}
                    Finalizar e Gerar Nota
                  </button>
               </div>
             )}
           </div>
        )}

        {step === 'FINAL' && finalOs && (
          <div className="animate-in zoom-in duration-300 flex flex-col items-center print:block print:w-full">
             {/* NOTA COM RESPONSIVIDADE PARA CONTEÚDO GRANDE */}
             <div className="w-full max-w-[500px] overflow-hidden sm:overflow-visible print:w-full print:max-w-none">
               <div 
                 ref={invoiceRef}
                 className="w-full bg-white text-zinc-900 p-6 sm:p-10 flex flex-col min-h-[700px] h-auto rounded-sm shadow-2xl print:shadow-none print:p-8 print:min-h-0 print:h-auto"
               >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-8 sm:mb-10">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-black rounded-lg flex items-center justify-center text-white shrink-0">
                        <Wrench size={28} />
                      </div>
                      <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tighter uppercase leading-none mb-1">KAEN MECÂNICA</h1>
                        <p className="text-[8px] sm:text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Rua Joaquim Marques Alves, 765</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[7px] sm:text-[8px] font-black text-zinc-300 uppercase mb-1">OS Nº</p>
                      <p className="text-xl sm:text-2xl font-black leading-none mb-1">{finalOs.osNumber}</p>
                      <p className="text-[8px] sm:text-[9px] font-bold text-zinc-400">{new Date(finalOs.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  {/* Cards Info */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-10">
                    <div className="bg-[#F8F8F8] p-4 sm:p-5 rounded-2xl border border-zinc-100">
                      <p className="text-[6px] sm:text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-2">PROPRIETÁRIO</p>
                      <p className="text-sm sm:text-base font-black uppercase italic leading-none">{finalOs.clientName}</p>
                      <p className="text-[8px] sm:text-[9px] font-bold text-zinc-400 mt-1">{selectedClient?.phone}</p>
                    </div>
                    <div className="bg-[#F8F8F8] p-4 sm:p-5 rounded-2xl border border-zinc-100">
                      <div className="flex justify-between flex-wrap gap-2">
                         <div>
                          <p className="text-[6px] sm:text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-2">VEÍCULO</p>
                          <p className="text-sm sm:text-base font-black uppercase italic leading-none">{finalOs.vehiclePlate}</p>
                          <p className="text-[8px] sm:text-[9px] font-bold text-zinc-400 mt-1 uppercase truncate max-w-[100px]">{finalOs.vehicleModel}</p>
                         </div>
                         <div className="text-right">
                          <p className="text-[6px] sm:text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-2">KM ATUAL</p>
                          <p className="text-sm sm:text-base font-black uppercase italic leading-none">{finalOs.vehicleKm || '0'} km</p>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabela com ajuste de fonte para listas longas */}
                  <div className="flex-1">
                     <table className="w-full text-left text-[10px] sm:text-[11px] border-collapse">
                        <thead>
                          <tr className="text-[7px] sm:text-[8px] font-black text-zinc-300 uppercase tracking-widest border-b border-zinc-50">
                            <th className="pb-4">DESCRIÇÃO</th>
                            <th className="pb-4 text-center">QTD</th>
                            <th className="pb-4 text-right">UNITÁRIO</th>
                            <th className="pb-4 text-right">TOTAL</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50 text-zinc-800 font-bold">
                          {finalOs.items.map((i,idx)=>(
                            <tr key={idx} className="break-inside-avoid">
                              <td className="py-3 sm:py-4 uppercase italic leading-tight pr-2">{i.description}</td>
                              <td className="py-3 sm:py-4 text-center">{i.quantity.toString().padStart(2, '0')}</td>
                              <td className="py-3 sm:py-4 text-right text-zinc-300">R$ {i.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              <td className="py-3 sm:py-4 text-right font-black">R$ {(i.quantity*i.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                          {finalOs.laborValue > 0 && (
                            <tr className="break-inside-avoid">
                              <td className="py-3 sm:py-4 uppercase italic">Mão de Obra Especializada</td>
                              <td className="py-3 sm:py-4 text-center">01</td>
                              <td className="py-3 sm:py-4 text-right text-zinc-300">R$ {finalOs.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              <td className="py-3 sm:py-4 text-right font-black">R$ {finalOs.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          )}
                        </tbody>
                     </table>
                  </div>

                  {/* Rodapé da Nota - Sempre empurrado para o fim do conteúdo */}
                  <div className="mt-8 pt-8 border-t border-zinc-100 flex justify-between items-end gap-4 break-inside-avoid">
                    <div className="space-y-6">
                       <div className={`inline-block px-4 py-1.5 rounded-full border text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${finalOs.paymentStatus === PaymentStatus.PAGO ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                          PAGAMENTO: {finalOs.paymentStatus}
                       </div>
                       <div className="w-40 sm:w-56 pt-3 border-t border-zinc-200">
                          <p className="text-[7px] sm:text-[8px] font-black text-zinc-300 text-center uppercase tracking-widest">Assinatura do Responsável</p>
                       </div>
                    </div>

                    <div className="bg-[#F5F5F5] px-6 sm:px-10 py-4 sm:py-6 rounded-3xl flex flex-col items-end min-w-[150px] sm:min-w-[200px]">
                      <p className="text-[7px] sm:text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1 italic">Total da Nota</p>
                      <p className="text-2xl sm:text-3xl font-black text-zinc-900 leading-none italic">R$ {finalOs.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  <div className="mt-8 text-center break-inside-avoid">
                     <p className="text-[7px] font-black text-zinc-300 uppercase tracking-[0.5em] italic">KAEN MECÂNICA • CONFIANÇA EM CADA KM</p>
                  </div>
               </div>
             </div>

             {/* Botões de Ação */}
             <div className="w-full max-w-[500px] mt-8 space-y-4 print:hidden px-2">
                <button onClick={shareWhatsApp} className="w-full bg-[#25D366] py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                  <MessageCircle size={20}/> Enviar no WhatsApp
                </button>
                <div className="grid grid-cols-2 gap-3">
                   <button onClick={downloadInvoice} className="bg-zinc-900 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-zinc-800 shadow-lg active:scale-95 transition-all">
                      <ImageIcon size={18}/> Baixar Imagem
                   </button>
                   <button onClick={() => window.print()} className="bg-zinc-900 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-zinc-800 shadow-lg active:scale-95 transition-all">
                      <Printer size={18}/> Imprimir Retrato
                   </button>
                </div>
                <button onClick={() => navigate('/orders')} className="w-full bg-zinc-800 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest text-zinc-500 hover:text-white transition-all">
                   Finalizar e Voltar
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
