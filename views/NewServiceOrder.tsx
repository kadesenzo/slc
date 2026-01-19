
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Wrench, ChevronLeft, X,
  User, Search, Loader2, Check, ImageIcon, Car, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Client, Vehicle, OSItem, OSStatus, ServiceOrder, PaymentStatus, UserSession } from '../types';
import html2canvas from 'html2canvas';

const NewServiceOrder: React.FC<{ session?: UserSession; syncData?: (key: string, data: any) => Promise<void> }> = ({ session, syncData }) => {
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const [step, setStep] = useState<'CLIENTE' | 'VEICULO' | 'ITENS' | 'FINAL'>('CLIENTE');
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  const [items, setItems] = useState<OSItem[]>([]);
  const [labor, setLabor] = useState<string>('0');
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
    return itemsTotal + (parseFloat(labor) || 0);
  }, [items, labor]);

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
      const osNumber = `${Math.floor(100000 + Math.random() * 899999)}`;
      const os: ServiceOrder = {
        id: Math.random().toString(36).substr(2, 9),
        osNumber,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        vehicleId: selectedVehicle.id,
        vehiclePlate: selectedVehicle.plate,
        vehicleModel: selectedVehicle.model,
        vehicleKm: selectedVehicle.km.toString(),
        problem: 'MANUTENÇÃO KAEN MECÂNICA',
        items,
        laborValue: parseFloat(labor) || 0,
        discount: 0,
        totalValue,
        status: OSStatus.FINALIZADO,
        paymentStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Salvar a O.S.
      const currentOrders = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_orders`) || '[]');
      await syncData('orders', [...currentOrders, os]);

      // 2. Sincronizar KM com a Frota (Veículos)
      const updatedVehicles = vehicles.map(v => 
        v.id === selectedVehicle.id ? { ...v, km: parseFloat(selectedVehicle.km.toString()) } : v
      );
      await syncData('vehicles', updatedVehicles);

      setFinalOs(os);
      setStep('FINAL');
    } catch (error) {
      alert("ERRO NA GERAÇÃO.");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadImage = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { 
      scale: 3, 
      backgroundColor: '#FFFFFF', 
      useCORS: true,
      logging: false
    });
    const link = document.createElement('a');
    link.download = `KAEN_MECANICA_${finalOs?.osNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white items-center w-full">
      {/* Header Centralizado */}
      <div className="w-full p-6 md:p-8 border-b border-white/5 flex items-center justify-between glass-card sticky top-0 z-50 print:hidden">
        <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-full text-zinc-500 hover:text-white border border-white/10 transition-all">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-[10px] font-black uppercase tracking-[0.5em] italic text-center">GERADOR <span className="text-[#FF2D55]">KAEN</span></h2>
        <div className="w-12"></div>
      </div>

      <div className="flex-1 w-full max-w-4xl p-6 md:p-8 space-y-10 pb-40 flex flex-col items-center">
        
        {step === 'CLIENTE' && (
          <div className="w-full max-w-2xl space-y-8 animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-center">CLIENTE</h1>
            <div className="relative glass-card p-1 rounded-full border-white/10 w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700" size={20} />
              <input 
                type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)}
                placeholder="BUSCAR NOME OU WHATSAPP..."
                className="w-full bg-transparent border-none py-5 pl-16 pr-8 text-white font-black text-[11px] uppercase outline-none placeholder-zinc-800"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 w-full">
              {filteredClients.map(c => (
                <button key={c.id} onClick={() => { setSelectedClient(c); setStep('VEICULO'); }} className="w-full p-6 glass-card border-white/5 rounded-[2rem] flex items-center justify-between hover:border-[#FF2D55]/50 transition-all group">
                  <div className="text-left">
                    <p className="text-xl font-black italic uppercase group-hover:text-[#FF2D55]">{c.name}</p>
                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{c.phone}</p>
                  </div>
                  <User size={24} className="text-zinc-800 group-hover:text-[#FF2D55]" />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'VEICULO' && selectedClient && (
          <div className="w-full max-w-2xl space-y-8 animate-in slide-in-from-right-4 duration-500 flex flex-col items-center">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-black italic uppercase">FROTA</h1>
              <p className="text-zinc-600 font-black uppercase tracking-widest text-[10px] mt-2">SELECIONE O CARRO DE {selectedClient.name}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 w-full">
              {clientVehicles.map(v => (
                <button key={v.id} onClick={() => { setSelectedVehicle(v); setStep('ITENS'); }} className="p-6 glass-card border-white/5 rounded-[2.5rem] flex items-center justify-between hover:border-[#FF2D55]/50 transition-all group text-left">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-zinc-700 group-hover:text-[#FF2D55]">
                       <Car size={24} />
                    </div>
                    <div>
                      <p className="text-xl font-black italic uppercase group-hover:text-white">{v.plate}</p>
                      <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{v.model} • {v.brand}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-zinc-800 uppercase italic">Último Registro</p>
                    <p className="text-xs font-black text-zinc-500">{v.km.toLocaleString()} KM</p>
                  </div>
                </button>
              ))}
              {clientVehicles.length === 0 && (
                <div className="text-center p-10 border-2 border-dashed border-zinc-900 rounded-ios opacity-30">
                  <Car size={32} className="mx-auto mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest">Nenhum veículo vinculado a este cliente</p>
                </div>
              )}
            </div>
            <button onClick={() => setStep('CLIENTE')} className="w-full py-4 text-zinc-700 font-black uppercase text-[9px] tracking-widest italic hover:text-white">VOLTAR PARA CLIENTES</button>
          </div>
        )}

        {step === 'ITENS' && selectedVehicle && (
          <div className="w-full max-w-3xl space-y-10 animate-in slide-in-from-right-4 duration-500 flex flex-col items-center">
            <div className="glass-card p-8 rounded-ios border-white/10 space-y-10 w-full">
               <div className="flex items-center justify-between border-b border-white/5 pb-6">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#FF2D55]/10 rounded-xl flex items-center justify-center text-[#FF2D55]">
                      <Car size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black italic uppercase tracking-tighter">{selectedVehicle.plate}</h3>
                      <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{selectedVehicle.model} • {selectedClient?.name}</p>
                    </div>
                 </div>
                 <button onClick={addItem} className="px-6 py-3 bg-[#FF2D55] rounded-full text-white font-black uppercase text-[9px] tracking-widest flex items-center gap-2 active:scale-90 transition-all">
                   <Plus size={16}/> ADICIONAR ITEM
                 </button>
               </div>

               <div className="space-y-4">
                 {items.map(item => (
                   <div key={item.id} className="bg-black p-5 rounded-[2rem] border border-white/5 space-y-4">
                     <input type="text" placeholder="DESCRIÇÃO DA PEÇA OU SERVIÇO..." value={item.description} onChange={(e)=>updateItem(item.id, 'description', e.target.value.toUpperCase())} className="w-full bg-transparent text-[11px] font-black outline-none uppercase italic text-white tracking-widest"/>
                     <div className="flex gap-4">
                        <input type="number" placeholder="QTD" value={item.quantity || ''} onChange={(e)=>updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-20 bg-white/5 border border-white/5 p-4 rounded-xl text-center text-[11px] font-black text-white outline-none"/>
                        <div className="relative flex-1">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-800 text-[10px] font-black">R$</span>
                           <input type="number" placeholder="UNITÁRIO" value={item.unitPrice || ''} onChange={(e)=>updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full bg-white/5 border border-white/5 p-4 pl-10 rounded-xl text-[11px] font-black text-white outline-none"/>
                        </div>
                        <button onClick={()=>removeItem(item.id)} className="p-4 text-zinc-800 hover:text-[#FF2D55]"><Trash2 size={20}/></button>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div>
                   <label className="text-[8px] font-black text-zinc-700 tracking-widest uppercase block mb-1.5 ml-1">MÃO DE OBRA</label>
                   <input type="number" value={labor} onChange={(e)=>setLabor(e.target.value)} className="w-full bg-black border border-white/5 p-6 rounded-[1.8rem] text-xl font-black outline-none text-white italic"/>
                 </div>
                 <div>
                   <label className="text-[8px] font-black text-zinc-700 tracking-widest uppercase block mb-1.5 ml-1">KM ATUAL</label>
                   <input 
                      type="number" 
                      value={selectedVehicle.km} 
                      onChange={(e) => setSelectedVehicle({...selectedVehicle, km: parseFloat(e.target.value) || 0})}
                      className="w-full bg-black border border-white/5 p-6 rounded-[1.8rem] text-xl font-black outline-none text-[#FF2D55] italic"
                    />
                 </div>
                 <div>
                   <label className="text-[8px] font-black text-zinc-700 tracking-widest uppercase block mb-1.5 ml-1">PAGAMENTO</label>
                   <select value={paymentStatus} onChange={(e)=>setPaymentStatus(e.target.value as PaymentStatus)} className="w-full h-[74px] bg-black border border-white/5 px-6 rounded-[1.8rem] text-[10px] font-black uppercase outline-none text-white italic cursor-pointer">
                     <option value={PaymentStatus.PENDENTE}>PENDENTE</option>
                     <option value={PaymentStatus.PAGO}>PAGO</option>
                   </select>
                 </div>
               </div>

               <div className="p-10 bg-white/5 rounded-ios border border-white/5 flex flex-col items-center gap-1">
                 <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest italic">VALOR TOTAL LÍQUIDO</span>
                 <span className="text-5xl font-black italic">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
               </div>

               <button onClick={handleFinalize} disabled={isSaving} className="w-full bg-[#FF2D55] py-6 rounded-ios font-black uppercase text-[10px] tracking-[0.5em] flex items-center justify-center gap-5 active:scale-95 italic transition-all shadow-[0_20px_60px_rgba(255,45,85,0.3)]">
                 {isSaving ? <Loader2 className="animate-spin" size={24}/> : <Check size={24}/>} GERAR NOTA FISCAL
               </button>
            </div>
          </div>
        )}

        {step === 'FINAL' && finalOs && (
          <div className="w-full flex flex-col items-center gap-12 animate-in fade-in duration-700">
             <div className="invoice-preview-container">
               <div className="invoice-scale-wrapper">
                 <div ref={invoiceRef} className="kaen-invoice shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
                    {/* Header Kaen */}
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
                          <p className="text-5xl font-black leading-none mb-2 tracking-tighter">KP-{finalOs.osNumber}</p>
                          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest italic">{new Date(finalOs.createdAt).toLocaleDateString('pt-BR')}</p>
                       </div>
                    </div>

                    {/* Info Blocks Kaen */}
                    <div className="grid grid-cols-2 gap-8 mb-12">
                      <div className="bg-zinc-50 p-10 rounded-[3rem] border border-zinc-100">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 italic">CLIENTE / PROPRIETÁRIO</p>
                        <p className="text-3xl font-black uppercase leading-tight tracking-tighter">{finalOs.clientName}</p>
                        <p className="text-[14px] font-bold text-zinc-500 mt-2 italic">{selectedClient?.phone}</p>
                      </div>
                      <div className="bg-zinc-50 p-10 rounded-[3rem] border border-zinc-100 flex flex-col justify-between">
                         <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 italic">VEÍCULO</p>
                            <p className="text-3xl font-black uppercase leading-none tracking-tighter">{finalOs.vehiclePlate}</p>
                            <p className="text-[14px] font-bold text-zinc-500 uppercase mt-3 italic">{finalOs.vehicleModel}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4 italic">KM ATUAL</p>
                            <p className="text-2xl font-black tracking-tighter italic">{finalOs.vehicleKm || '0'} KM</p>
                          </div>
                         </div>
                      </div>
                    </div>

                    {/* Tabela de Itens Vertical e Ampla */}
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
                            {finalOs.items.map((i,idx)=>(
                              <tr key={idx} className="border-b border-zinc-50">
                                <td className="text-[13px] py-6 uppercase leading-tight pr-10 font-black tracking-tight">{i.description}</td>
                                <td className="text-[13px] py-6 text-center text-zinc-400 px-6 italic">{i.quantity.toString().padStart(2, '0')}</td>
                                <td className="text-[13px] py-6 text-right text-zinc-400 px-6">R$ {i.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td className="text-[13px] py-6 text-right font-black">R$ {(i.quantity*i.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              </tr>
                            ))}
                            {finalOs.laborValue > 0 && (
                              <tr className="bg-zinc-50/50">
                                <td className="text-[13px] py-6 uppercase font-black italic">SERVIÇOS TÉCNICOS ESPECIALIZADOS (MÃO DE OBRA)</td>
                                <td className="text-[13px] py-6 text-center text-zinc-400 px-6 italic">01</td>
                                <td className="text-[13px] py-6 text-right text-zinc-400 px-6">R$ {finalOs.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td className="text-[13px] py-6 text-right font-black">R$ {finalOs.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              </tr>
                            )}
                          </tbody>
                       </table>
                    </div>

                    {/* Footer Kaen Equilibrado - Proporção Vertical */}
                    <div className="mt-auto border-t-2 border-zinc-100 pt-10">
                       <div className="flex justify-between items-end">
                          <div className="flex flex-col gap-10">
                             <div className={`inline-flex px-10 py-3 rounded-2xl border text-[11px] font-black uppercase tracking-[0.2em] italic ${finalOs.paymentStatus === PaymentStatus.PAGO ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                                STATUS: {finalOs.paymentStatus === PaymentStatus.PAGO ? 'PAGAMENTO EFETUADO' : 'AGUARDANDO PAGAMENTO'}
                             </div>
                             <div className="w-64 pt-6 border-t border-zinc-100">
                                <p className="text-[9px] font-black text-zinc-300 uppercase text-center tracking-[0.5em] italic">AUTORIZAÇÃO / CLIENTE</p>
                             </div>
                          </div>
                          
                          <div className="bg-zinc-950 px-12 py-8 rounded-[3rem] flex flex-col items-end min-w-[300px] shadow-xl">
                             <p className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-2 italic">VALOR TOTAL LÍQUIDO</p>
                             <p className="text-5xl font-black text-white leading-none tracking-tighter italic">R$ {finalOs.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                       </div>
                    </div>

                    <div className="absolute bottom-10 left-0 w-full text-center">
                       <p className="text-[10px] font-black text-zinc-200 uppercase tracking-[0.8em] italic">PROTOCOLO ELITE • KAEN MECÂNICA • EXCELÊNCIA EM PERFORMANCE</p>
                    </div>
                 </div>
               </div>
             </div>

             <div className="w-full max-w-[500px] flex flex-col gap-4 px-4">
                <button onClick={downloadImage} className="w-full bg-white text-black py-6 rounded-ios font-black uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-4 shadow-2xl active:scale-95 italic transition-all">
                   <ImageIcon size={24}/> SALVAR IMAGEM (WHATSAPP)
                </button>
                <button onClick={() => navigate('/dashboard')} className="glass-card py-5 rounded-ios font-black uppercase text-[9px] tracking-[0.4em] flex items-center justify-center hover:bg-white/5 italic transition-all">VOLTAR AO PAINEL</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewServiceOrder;
