
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Wrench, ChevronLeft, X,
  User, Car, Search, Loader2, Download, 
  Printer, Save, MessageCircle, Check, ImageIcon
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
      alert("Selecione cliente e veículo.");
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
        problem: obs || 'Serviços Mecânicos',
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

      const currentOrders = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_orders`) || '[]');
      await syncData('orders', [...currentOrders, os]);

      setFinalOs(os);
      setStep('FINAL');
    } catch (error) {
      alert("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadImage = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { 
      scale: 2, 
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true
    });
    const link = document.createElement('a');
    link.download = `Nota_${finalOs?.osNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    if (!finalOs) return;
    const text = `*KAEN MECÂNICA - COMPROVANTE*\n\nNota: #${finalOs.osNumber}\nVeículo: ${finalOs.vehiclePlate}\nTotal: R$ ${finalOs.totalValue.toLocaleString('pt-BR')}\nStatus: ${finalOs.paymentStatus}\n\nObrigado pela preferência!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0B0B] text-white">
      {/* Header Fixo */}
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-[#0B0B0B] z-20 print:hidden">
        <button onClick={() => navigate(-1)} className="p-2 bg-zinc-900 rounded-xl text-zinc-400">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-sm font-black uppercase tracking-widest italic">Nova <span className="text-[#E11D48]">Nota Pro</span></h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 no-scrollbar print:p-0 print:overflow-visible">
        {step !== 'FINAL' ? (
          <div className="max-w-xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-300">
            {/* Form Steps */}
            <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-800 space-y-6 shadow-xl">
               <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic">1. Identificação</h3>
               {!selectedClient ? (
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input 
                      type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Pesquisar Cliente..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold outline-none focus:border-[#E11D48]"
                    />
                    {filteredClients.length > 0 && (
                       <div className="mt-2 space-y-1">
                         {filteredClients.map(c => (
                           <button key={c.id} onClick={() => setSelectedClient(c)} className="w-full p-4 bg-zinc-950 rounded-xl flex items-center justify-between border border-zinc-800">
                             <span className="text-xs font-black uppercase">{c.name}</span>
                             <Plus size={14} className="text-[#E11D48]" />
                           </button>
                         ))}
                       </div>
                    )}
                  </div>
               ) : (
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                    <span className="text-xs font-black uppercase italic text-[#E11D48]">{selectedClient.name}</span>
                    <button onClick={() => {setSelectedClient(null); setSelectedVehicle(null);}}><X size={18}/></button>
                  </div>
               )}

               {selectedClient && !selectedVehicle && (
                  <div className="grid grid-cols-2 gap-3">
                    {clientVehicles.map(v => (
                      <button key={v.id} onClick={() => setSelectedVehicle(v)} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-[10px] font-black uppercase hover:border-[#E11D48]">
                        {v.plate}
                      </button>
                    ))}
                  </div>
               )}

               {selectedVehicle && (
                 <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                    <span className="text-xs font-black uppercase italic text-zinc-400">{selectedVehicle.plate} • {selectedVehicle.model}</span>
                    <button onClick={() => setSelectedVehicle(null)}><X size={16}/></button>
                 </div>
               )}
            </div>

            {selectedVehicle && (
               <div className="bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-800 space-y-6 shadow-xl">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">2. Itens</h3>
                    <button onClick={addItem} className="p-2 bg-[#E11D48] rounded-lg text-white"><Plus size={16}/></button>
                  </div>
                  <div className="space-y-3">
                    {items.map(item => (
                      <div key={item.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3">
                        <input type="text" placeholder="Descrição..." value={item.description} onChange={(e)=>updateItem(item.id, 'description', e.target.value.toUpperCase())} className="w-full bg-transparent text-[11px] font-black outline-none uppercase italic"/>
                        <div className="flex gap-2">
                           <input type="number" placeholder="Qtd" value={item.quantity} onChange={(e)=>updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-16 bg-zinc-900 p-2 rounded-lg text-xs font-bold text-center"/>
                           <input type="number" placeholder="R$" value={item.unitPrice} onChange={(e)=>updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="flex-1 bg-zinc-900 p-2 rounded-lg text-xs font-bold"/>
                           <button onClick={()=>removeItem(item.id)} className="text-red-500"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase text-zinc-600">Mão de Obra</label>
                      <input type="number" value={labor} onChange={(e)=>setLabor(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-xs font-black"/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase text-zinc-600">Pagamento</label>
                      <select value={paymentStatus} onChange={(e)=>setPaymentStatus(e.target.value as PaymentStatus)} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-xl text-[10px] font-black uppercase">
                        <option value={PaymentStatus.PENDENTE}>Pendente</option>
                        <option value={PaymentStatus.PAGO}>Pago</option>
                      </select>
                    </div>
                  </div>

                  <button onClick={handleFinalize} disabled={isSaving} className="w-full bg-[#E11D48] py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3">
                    {isSaving ? <Loader2 className="animate-spin"/> : <Check size={20}/>}
                    Finalizar Nota
                  </button>
               </div>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto flex flex-col items-center gap-8 print:block print:max-w-none">
             {/* PREVISUALIZAÇÃO DA NOTA COM SCROLL SE FOR GRANDE */}
             <div className="w-full max-w-[800px] overflow-x-auto no-scrollbar print:overflow-visible">
               <div 
                 ref={invoiceRef}
                 className="w-full bg-white text-zinc-900 p-8 sm:p-12 flex flex-col min-h-[1100px] h-auto rounded-lg shadow-2xl print:shadow-none print:p-10 print:min-h-0 print:h-auto"
               >
                  {/* Cabeçalho Profissional */}
                  <div className="flex justify-between items-start mb-12">
                    <div className="flex gap-5">
                      <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center text-white shrink-0">
                        <Wrench size={36} />
                      </div>
                      <div>
                        <h1 className="text-2xl font-black tracking-tight uppercase leading-none mb-1">KAEN MECÂNICA</h1>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Rua Joaquim Marques Alves, 765</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-zinc-300 uppercase mb-1">OS Nº</p>
                      <p className="text-3xl font-black leading-none mb-1">{finalOs.osNumber}</p>
                      <p className="text-[10px] font-bold text-zinc-400">{new Date(finalOs.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  {/* Blocos de Dados */}
                  <div className="grid grid-cols-2 gap-6 mb-12">
                    <div className="bg-[#f8f8f8] p-6 rounded-2xl border border-zinc-100">
                      <p className="text-[7px] font-black text-zinc-300 uppercase tracking-widest mb-2">PROPRIETÁRIO</p>
                      <p className="text-lg font-black uppercase italic leading-none mb-1">{finalOs.clientName}</p>
                      <p className="text-[10px] font-bold text-zinc-400">{selectedClient?.phone}</p>
                    </div>
                    <div className="bg-[#f8f8f8] p-6 rounded-2xl border border-zinc-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[7px] font-black text-zinc-300 uppercase tracking-widest mb-2">VEÍCULO</p>
                          <p className="text-lg font-black uppercase italic leading-none mb-1">{finalOs.vehiclePlate}</p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase">{finalOs.vehicleModel}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[7px] font-black text-zinc-300 uppercase tracking-widest mb-2">KM ATUAL</p>
                           <p className="text-lg font-black uppercase italic leading-none">{finalOs.vehicleKm || '0'} km</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tabela de Itens (Expansível) */}
                  <div className="flex-1">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="text-[8px] font-black text-zinc-300 uppercase tracking-widest border-b border-zinc-100">
                          <th className="pb-4">DESCRIÇÃO DOS SERVIÇOS / PEÇAS</th>
                          <th className="pb-4 text-center">QTD</th>
                          <th className="pb-4 text-right">UNITÁRIO</th>
                          <th className="pb-4 text-right">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50 font-bold text-zinc-800">
                        {finalOs.items.map((i, idx) => (
                          <tr key={idx} className="break-inside-avoid">
                            <td className="py-4 uppercase italic leading-tight pr-4">{i.description}</td>
                            <td className="py-4 text-center font-black">{i.quantity.toString().padStart(2, '0')}</td>
                            <td className="py-4 text-right text-zinc-300">R$ {i.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-4 text-right font-black">R$ {(i.quantity * i.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                        {finalOs.laborValue > 0 && (
                          <tr className="break-inside-avoid">
                            <td className="py-4 uppercase italic font-black">Mão de Obra Especializada</td>
                            <td className="py-4 text-center font-black">01</td>
                            <td className="py-4 text-right text-zinc-300">R$ {finalOs.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-4 text-right font-black">R$ {finalOs.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Rodapé Dinâmico */}
                  <div className="mt-12 pt-10 border-t-2 border-zinc-100 flex justify-between items-end gap-10 break-inside-avoid">
                    <div className="space-y-8 flex-1">
                       <div className={`inline-flex px-5 py-2 rounded-full border-2 text-[10px] font-black uppercase tracking-widest ${finalOs.paymentStatus === PaymentStatus.PAGO ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                          PAGAMENTO: {finalOs.paymentStatus}
                       </div>
                       <div className="w-64 pt-4 border-t border-zinc-200">
                          <p className="text-[8px] font-black text-zinc-300 uppercase text-center tracking-widest">ASSINATURA DO RESPONSÁVEL</p>
                       </div>
                    </div>

                    <div className="bg-[#f5f5f5] px-12 py-8 rounded-[2.5rem] flex flex-col items-end min-w-[280px]">
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2 italic">TOTAL DA NOTA</p>
                      <p className="text-4xl font-black text-zinc-900 leading-none italic tracking-tighter">R$ {finalOs.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  <div className="mt-12 text-center break-inside-avoid">
                    <p className="text-[8px] font-black text-zinc-200 uppercase tracking-[0.6em] italic">KAEN MECÂNICA • CONFIANÇA EM CADA KM</p>
                  </div>
               </div>
             </div>

             {/* Ações */}
             <div className="w-full max-w-[500px] grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden px-4">
                <button onClick={handleWhatsApp} className="sm:col-span-2 bg-[#25D366] py-5 rounded-3xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95">
                  <MessageCircle size={22}/> Enviar Cobrança WhatsApp
                </button>
                <button onClick={downloadImage} className="bg-zinc-900 border border-zinc-800 py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-800">
                  <ImageIcon size={20}/> Baixar Imagem
                </button>
                <button onClick={handlePrint} className="bg-zinc-900 border border-zinc-800 py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-800">
                  <Printer size={20}/> Imprimir (Retrato)
                </button>
                <button onClick={() => navigate('/orders')} className="sm:col-span-2 bg-zinc-800 text-zinc-500 py-4 rounded-3xl font-black uppercase text-[10px] tracking-widest mt-4">
                  Finalizar e Sair
                </button>
             </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body { background: white !important; padding: 0 !important; margin: 0 !important; }
          #root { display: block !important; }
          .print\\:hidden { display: none !important; }
          div[ref] {
            visibility: visible !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20mm !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page { size: portrait; margin: 0; }
          .break-inside-avoid { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default NewServiceOrder;
