
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Wrench, ChevronLeft, X,
  User, Car, Search, Loader2, Download, DollarSign,
  Printer, Save, MessageCircle, ArrowRight
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
      const osNumber = `NT-${Date.now().toString().slice(-6)}`;
      const osId = Math.random().toString(36).substr(2, 9);

      const os: ServiceOrder = {
        id: osId,
        osNumber,
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        vehicleId: selectedVehicle.id,
        vehiclePlate: selectedVehicle.plate,
        vehicleModel: selectedVehicle.model,
        problem: obs || 'Serviço Geral',
        items,
        laborValue: parseFloat(labor) || 0,
        discount: parseFloat(discount) || 0,
        totalValue,
        status: OSStatus.FINALIZADO,
        paymentStatus: PaymentStatus.PAGO,
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
    const canvas = await html2canvas(invoiceRef.current, { scale: 3, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `Nota_${finalOs?.osNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const shareWhatsApp = () => {
    if (!finalOs) return;
    const text = `*KAENPRO - COMPROVANTE DE SERVIÇO*\n\nNota: #${finalOs.osNumber}\nCliente: ${finalOs.clientName}\nVeículo: ${finalOs.vehiclePlate}\nTotal: R$ ${finalOs.totalValue.toLocaleString('pt-BR')}\n\nObrigado pela preferência!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0B0B] text-white overflow-hidden">
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-[#0B0B0B] z-20">
        <button onClick={() => navigate(-1)} className="p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-sm font-black uppercase tracking-widest italic">Nova <span className="text-[#E11D48]">Nota Pro</span></h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-32">
        {step === 'CLIENT' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-300">
            <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800 shadow-xl">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 mb-6 tracking-widest italic">1. Identificação do Cliente</h3>
              {!selectedClient ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input 
                      type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Pesquisar Nome ou Celular..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-5 pl-14 pr-6 text-sm font-bold outline-none focus:border-[#E11D48] transition-all"
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 no-scrollbar">
                    {filteredClients.map(c => (
                      <button key={c.id} onClick={() => setSelectedClient(c)} className="w-full p-5 bg-zinc-950 rounded-2xl flex items-center justify-between border border-transparent hover:border-[#E11D48] transition-all">
                        <div className="text-left">
                            <span className="font-black text-xs uppercase italic block">{c.name}</span>
                            <span className="text-[9px] text-zinc-600 font-bold tracking-widest">{c.phone}</span>
                        </div>
                        <Plus size={16} className="text-[#E11D48]" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-zinc-950 p-6 rounded-2xl border border-emerald-500/20 shadow-inner">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500"><User size={20} /></div>
                    <span className="font-black text-xs uppercase italic">{selectedClient.name}</span>
                  </div>
                  <button onClick={() => { setSelectedClient(null); setSelectedVehicle(null); }} className="p-2 text-zinc-600 hover:text-white transition-colors"><X size={20}/></button>
                </div>
              )}
            </div>

            {selectedClient && (
              <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800 animate-in fade-in shadow-xl">
                <h3 className="text-[10px] font-black uppercase text-zinc-500 mb-6 tracking-widest italic">2. Veículo</h3>
                <div className="grid grid-cols-2 gap-3">
                  {clientVehicles.map(v => (
                    <button 
                      key={v.id} onClick={() => setSelectedVehicle(v)}
                      className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${selectedVehicle?.id === v.id ? 'border-[#E11D48] bg-[#E11D48]/10 text-white shadow-lg' : 'border-zinc-800 bg-zinc-950 text-zinc-600'}`}
                    >
                      <Car size={24} />
                      <span className="font-black text-[10px] tracking-widest uppercase italic">{v.plate}</span>
                    </button>
                  ))}
                </div>
                {selectedVehicle && (
                  <button onClick={() => setStep('ITEMS')} className="w-full mt-8 bg-[#E11D48] py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">
                    Próximo: Itens da Nota
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {step === 'ITEMS' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
            <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800 space-y-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic">3. Serviços e Peças</h3>
                <button onClick={addItem} className="p-3 bg-zinc-800 text-[#E11D48] rounded-xl hover:bg-[#E11D48] hover:text-white transition-all shadow-md"><Plus size={18}/></button>
              </div>

              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="bg-zinc-950 p-5 rounded-[1.5rem] border border-zinc-800 space-y-4 shadow-inner">
                    <input 
                      type="text" placeholder="Descrição do item..." value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value.toUpperCase())}
                      className="w-full bg-transparent border-none text-xs font-black text-white outline-none p-0 placeholder-zinc-800 uppercase italic"
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-zinc-900 rounded-xl px-3 flex-1 border border-zinc-800/50">
                         <span className="text-[8px] font-black text-zinc-600 uppercase">Qtd</span>
                         <input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-xs font-black py-3 outline-none" />
                      </div>
                      <div className="flex items-center gap-2 bg-zinc-900 rounded-xl px-3 flex-1 border border-zinc-800/50">
                         <span className="text-[8px] font-black text-zinc-600 uppercase">R$</span>
                         <input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-xs font-black py-3 outline-none" />
                      </div>
                      <button onClick={() => removeItem(item.id)} className="p-3 text-zinc-700 hover:text-red-500 transition-all"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800 space-y-6 shadow-xl">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic">4. Resumo e Pagamento</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block ml-1">Mão de Obra</label>
                  <input type="number" value={labor} onChange={(e) => setLabor(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-sm font-black text-white" />
                </div>
                <div>
                  <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block ml-1">Desconto</label>
                  <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-sm font-black text-[#E11D48]" />
                </div>
              </div>

              <div>
                <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block ml-1">Garantia / Obs.</label>
                <textarea 
                  value={obs} onChange={(e) => setObs(e.target.value)}
                  placeholder="Garantia de 90 dias nos serviços..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-xs font-bold text-zinc-400 min-h-[100px]"
                />
              </div>

              <div>
                <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block ml-1">Forma de Pagamento</label>
                <select 
                  value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-xs font-black uppercase italic shadow-inner outline-none focus:border-[#E11D48]"
                >
                  {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="p-6 bg-[#E11D48] rounded-[2rem] flex justify-between items-center shadow-xl">
                 <span className="text-[10px] font-black text-white/60 uppercase tracking-widest italic">Total Líquido</span>
                 <span className="text-2xl font-black text-white italic">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              <button 
                onClick={handleFinalize} disabled={isSaving}
                className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-[#E11D48] hover:text-white transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                Gerar Nota e Lançar Financeiro
              </button>
            </div>
          </div>
        )}

        {step === 'FINAL' && finalOs && (
          <div className="space-y-8 animate-in zoom-in duration-300 flex flex-col items-center">
            <div 
              ref={invoiceRef}
              className="w-full max-w-[360px] aspect-[9/16] bg-white text-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col p-8 border-[10px] border-zinc-50"
            >
              <div className="flex justify-between items-start mb-8 border-b-2 border-zinc-100 pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white"><Wrench size={20}/></div>
                  <h1 className="text-lg font-black tracking-tighter uppercase leading-none italic">KAEN<span className="text-[#E11D48]">PRO</span></h1>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest leading-none mb-1">NOTA #{finalOs.osNumber}</p>
                  <p className="text-[9px] font-black text-zinc-900">{new Date(finalOs.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                  <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1 italic">Proprietário(a)</p>
                  <p className="text-[11px] font-black uppercase italic">{finalOs.clientName}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                    <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1 italic">Veículo</p>
                    <p className="text-[10px] font-black uppercase italic truncate">{finalOs.vehicleModel}</p>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                    <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1 italic">Placa</p>
                    <p className="text-[10px] font-black uppercase italic text-[#E11D48]">{finalOs.vehiclePlate}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-hidden">
                <table className="w-full text-left text-[9px]">
                  <thead className="border-b border-zinc-100">
                    <tr className="font-black text-zinc-300 uppercase italic"><th className="pb-2">Serviço/Peça</th><th className="pb-2 text-right">Subtotal</th></tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 font-bold text-zinc-800">
                    {finalOs.items.map((i,idx)=>(
                      <tr key={idx}><td className="py-3 uppercase italic">{i.description}</td><td className="py-3 text-right font-black italic">R$ {(i.quantity*i.unitPrice).toLocaleString()}</td></tr>
                    ))}
                    {finalOs.laborValue > 0 && (
                      <tr><td className="py-3 font-black uppercase italic">Mão de Obra</td><td className="py-3 text-right font-black italic">R$ {finalOs.laborValue.toLocaleString()}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 pt-6 border-t-2 border-zinc-100">
                <div className="flex justify-between items-center mb-1 text-[8px] opacity-30 uppercase font-black italic">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toLocaleString()}</span>
                </div>
                {finalOs.discount > 0 && (
                  <div className="flex justify-between items-center mb-2 text-[8px] text-[#E11D48] font-black uppercase italic">
                    <span>Desconto</span>
                    <span>- R$ {finalOs.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-end mt-4">
                   <div className="text-left">
                     <p className="text-[7px] font-black text-zinc-400 uppercase italic mb-1">Pago via</p>
                     <p className="text-[9px] font-black uppercase bg-zinc-900 text-white px-3 py-1 rounded-lg leading-none italic">{finalOs.paymentMethod}</p>
                   </div>
                   <p className="text-3xl font-black italic text-zinc-900 leading-none tracking-tighter">R$ {finalOs.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              <div className="mt-6 pt-2">
                 <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1 italic">Observações:</p>
                 <p className="text-[8px] text-zinc-600 italic leading-relaxed">{finalOs.observations || 'Nenhuma observação.'}</p>
              </div>

              <div className="mt-8 text-center">
                 <p className="text-[7px] font-black text-zinc-300 uppercase tracking-[0.4em] italic">Obrigado pela preferência!</p>
              </div>
            </div>

            <div className="w-full space-y-4 pt-4">
              <button onClick={shareWhatsApp} className="w-full bg-[#25D366] py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                <MessageCircle size={22} /> Compartilhar WhatsApp
              </button>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={downloadInvoice} className="bg-zinc-900 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-zinc-800 shadow-lg active:scale-95 transition-all">
                  <Download size={18} /> Salvar Imagem
                </button>
                <button onClick={() => window.print()} className="bg-zinc-900 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-zinc-800 shadow-lg active:scale-95 transition-all">
                  <Printer size={18} /> Imprimir Nota
                </button>
              </div>
              <button onClick={() => navigate('/orders')} className="w-full bg-zinc-800 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest text-zinc-500 hover:text-white transition-all">
                Ver Histórico de Notas
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewServiceOrder;
