
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Wrench, Package, ChevronLeft, X, Smartphone,
  User, Car, Search, Loader2, Download, DollarSign, Sparkles,
  CreditCard, Wallet, Share2, Printer, CheckCircle2, FileText,
  MessageCircle, Edit3, Save
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Client, Vehicle, OSItem, OSStatus, ServiceOrder, PaymentStatus, UserSession, PaymentMethod, TransactionType, FinancialTransaction } from '../types';
import { GoogleGenAI } from "@google/genai";
import html2canvas from 'html2canvas';

const NewServiceOrder: React.FC<{ session?: UserSession; syncData?: (key: string, data: any) => Promise<void> }> = ({ session, syncData }) => {
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  // States
  const [step, setStep] = useState<'CLIENT' | 'ITEMS' | 'REVIEW'>('CLIENT');
  const [clients, setClients] = useState<Client[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  const [items, setItems] = useState<OSItem[]>([]);
  const [labor, setLabor] = useState<string>('0');
  const [discount, setDiscount] = useState<string>('0');
  const [km, setKm] = useState('');
  const [obs, setObs] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.PIX);
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [finalOs, setFinalOs] = useState<ServiceOrder | null>(null);

  useEffect(() => {
    if (session) {
      setClients(JSON.parse(localStorage.getItem(`kaenpro_${session.username}_clients`) || '[]'));
      setAllVehicles(JSON.parse(localStorage.getItem(`kaenpro_${session.username}_vehicles`) || '[]'));
    }
  }, [session]);

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return [];
    return clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.phone.includes(clientSearch));
  }, [clientSearch, clients]);

  const clientVehicles = useMemo(() => {
    return selectedClient ? allVehicles.filter(v => v.clientId === selectedClient.id) : [];
  }, [selectedClient, allVehicles]);

  const subtotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0) + (parseFloat(labor) || 0);
  const totalValue = Math.max(0, subtotal - (parseFloat(discount) || 0));

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
    if (!selectedClient || !selectedVehicle || !session || !syncData) return;

    const osNumber = `NOT-${Date.now().toString().slice(-6)}`;
    const osId = Math.random().toString(36).substr(2, 9);

    const os: ServiceOrder = {
      id: osId,
      osNumber,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      vehicleId: selectedVehicle.id,
      vehiclePlate: selectedVehicle.plate,
      vehicleModel: selectedVehicle.model,
      vehicleKm: km,
      problem: obs, // Usando obs como descrição principal
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
      category: 'Serviço Automotivo',
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
    setStep('REVIEW');
  };

  const shareWhatsApp = () => {
    if (!finalOs) return;
    const text = `*COMPROVANTE KAENPRO*\nNota: #${finalOs.osNumber}\nVeículo: ${finalOs.vehiclePlate}\nTotal: R$ ${finalOs.totalValue.toLocaleString('pt-BR')}\nAcesse sua nota digital aqui: [Link]`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const downloadImage = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 3, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `Nota_${finalOs?.osNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0B0B] text-white">
      {/* Header Fixo */}
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-[#0B0B0B] z-10">
        <button onClick={() => navigate(-1)} className="p-2 bg-zinc-900 rounded-xl text-zinc-400">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-sm font-black uppercase tracking-widest italic">Criar <span className="text-[#E11D48]">Nota Pro</span></h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {step === 'CLIENT' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
            <div className="bg-zinc-900/50 p-8 rounded-[2rem] border border-zinc-800 shadow-xl">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 mb-6 tracking-widest italic">1. Identificação do Cliente</h3>
              {!selectedClient ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                    <input 
                      type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Pesquisar Nome ou Tel..."
                      className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-2xl py-5 pl-14 pr-6 font-bold outline-none focus:border-[#E11D48] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    {filteredClients.map(c => (
                      <button key={c.id} onClick={() => setSelectedClient(c)} className="w-full p-5 bg-zinc-900 rounded-2xl flex items-center justify-between border border-transparent hover:border-[#E11D48] transition-all">
                        <span className="font-bold uppercase text-xs">{c.name}</span>
                        <Plus size={16} className="text-[#E11D48]" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-zinc-950 p-4 rounded-2xl border border-emerald-500/30">
                  <div className="flex items-center gap-3">
                    <User className="text-emerald-500" size={20} />
                    <span className="font-black uppercase text-xs italic">{selectedClient.name}</span>
                  </div>
                  <button onClick={() => { setSelectedClient(null); setSelectedVehicle(null); }} className="text-zinc-500"><X size={18}/></button>
                </div>
              )}
            </div>

            {selectedClient && (
              <div className="bg-zinc-900/50 p-8 rounded-[2rem] border border-zinc-800 shadow-xl animate-in fade-in">
                <h3 className="text-[10px] font-black uppercase text-zinc-500 mb-6 tracking-widest italic">2. Selecionar Veículo</h3>
                <div className="grid grid-cols-2 gap-3">
                  {clientVehicles.map(v => (
                    <button 
                      key={v.id} onClick={() => setSelectedVehicle(v)}
                      className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${selectedVehicle?.id === v.id ? 'border-[#E11D48] bg-[#E11D48]/10 text-white' : 'border-zinc-800 bg-zinc-950 text-zinc-600'}`}
                    >
                      <Car size={20} />
                      <span className="font-black text-[10px] tracking-widest">{v.plate}</span>
                    </button>
                  ))}
                </div>
                {selectedVehicle && (
                  <button onClick={() => setStep('ITEMS')} className="w-full mt-8 bg-[#E11D48] py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl glow-red">
                    Próximo: Itens e Valores
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {step === 'ITEMS' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <div className="bg-zinc-900/50 p-8 rounded-[2rem] border border-zinc-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic">3. Itens do Serviço</h3>
                <button onClick={addItem} className="p-2 bg-zinc-800 text-white rounded-lg hover:bg-[#E11D48] transition-all"><Plus size={16}/></button>
              </div>

              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-3 relative group">
                    <input 
                      type="text" placeholder="Descrição do Item..." value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value.toUpperCase())}
                      className="w-full bg-transparent border-none text-xs font-bold text-white outline-none p-0"
                    />
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 bg-zinc-900 rounded-lg px-2">
                         <span className="text-[8px] font-black text-zinc-600 uppercase">Qtd</span>
                         <input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-10 bg-transparent text-center text-xs font-black py-2 outline-none" />
                      </div>
                      <div className="flex-1 flex items-center gap-2 bg-zinc-900 rounded-lg px-3">
                         <span className="text-[8px] font-black text-zinc-600 uppercase">R$</span>
                         <input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full bg-transparent text-xs font-black py-2 outline-none" />
                      </div>
                      <button onClick={() => removeItem(item.id)} className="p-2 text-zinc-800 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && <p className="text-center py-4 text-zinc-600 text-[10px] font-bold uppercase italic">Nenhum item adicionado ainda.</p>}
              </div>
            </div>

            <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-zinc-800 shadow-xl space-y-6">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic">4. Resumo de Fechamento</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block ml-2">Mão de Obra</label>
                  <input type="number" value={labor} onChange={(e) => setLabor(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-black" />
                </div>
                <div>
                  <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block ml-2">Desconto (R$)</label>
                  <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-black text-[#E11D48]" />
                </div>
                <div className="col-span-2">
                  <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block ml-2">Quilometragem (KM)</label>
                  <input type="number" value={km} onChange={(e) => setKm(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-black" />
                </div>
              </div>

              <div>
                <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block ml-2">Garantia / Obs. Técnicas</label>
                <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-xs font-medium outline-none focus:border-[#E11D48]" placeholder="Ex: Garantia de 3 meses para serviços..." />
              </div>

              <div className="p-6 bg-[#E11D48] rounded-3xl shadow-xl flex justify-between items-center">
                 <span className="text-[10px] font-black text-white/50 uppercase italic tracking-widest">Total Líquido</span>
                 <span className="text-2xl font-black text-white italic">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              <button onClick={handleFinalize} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-[#E11D48] hover:text-white transition-all">
                Finalizar e Gerar Comprovante
              </button>
            </div>
          </div>
        )}

        {step === 'REVIEW' && finalOs && (
          <div className="space-y-8 animate-in zoom-in duration-500 flex flex-col items-center">
            {/* COMPROVANTE 9:16 PROFISSIONAL */}
            <div 
              ref={invoiceRef} 
              className="w-full max-w-[360px] aspect-[9/16] bg-white text-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col p-10 border-[12px] border-zinc-100"
            >
              {/* Cabeçalho Pro */}
              <div className="flex justify-between items-start mb-8 border-b-2 border-zinc-100 pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-white"><Wrench size={24}/></div>
                  <div>
                    <h1 className="text-xl font-black tracking-tighter uppercase leading-none">KAEN<span className="text-[#E11D48]">PRO</span></h1>
                    <p className="text-[7px] font-black uppercase text-zinc-400 tracking-[0.2em] mt-1">Elite Automotive Management</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-zinc-400 uppercase italic">Nº {finalOs.osNumber}</p>
                  <p className="text-[9px] font-black text-zinc-900 mt-1">{new Date(finalOs.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {/* Dados Cliente e Carro */}
              <div className="space-y-4 mb-8">
                <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                  <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1 italic">Proprietário(a)</p>
                  <p className="text-sm font-black uppercase italic">{finalOs.clientName}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                    <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1 italic">Veículo</p>
                    <p className="text-[10px] font-black uppercase italic">{finalOs.vehicleModel}</p>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                    <p className="text-[7px] font-black text-zinc-400 uppercase tracking-widest mb-1 italic">Placa / KM</p>
                    <p className="text-[10px] font-black uppercase italic text-[#E11D48]">{finalOs.vehiclePlate} • {finalOs.vehicleKm || 0}k</p>
                  </div>
                </div>
              </div>

              {/* Tabela de Itens */}
              <div className="flex-1 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="border-b border-zinc-100">
                    <tr className="text-[7px] font-black text-zinc-400 uppercase"><th className="py-2">Item/Serviço</th><th className="py-2 text-right">Subtotal</th></tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {finalOs.items.map((i,idx)=>(
                      <tr key={idx}><td className="py-3 text-[9px] font-bold text-zinc-800 uppercase italic">{i.description}</td><td className="py-3 text-right text-[9px] font-black italic">R$ {(i.quantity*i.unitPrice).toLocaleString()}</td></tr>
                    ))}
                    {finalOs.laborValue > 0 && (
                      <tr><td className="py-3 text-[9px] font-black text-zinc-900 uppercase italic">Mão de Obra Técnica</td><td className="py-3 text-right text-[9px] font-black italic">R$ {finalOs.laborValue.toLocaleString()}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totais Finais */}
              <div className="mt-6 pt-6 border-t-2 border-zinc-100">
                <div className="flex justify-between items-center mb-1 opacity-40">
                  <span className="text-[8px] font-black uppercase">Subtotal</span>
                  <span className="text-[9px] font-black">R$ {subtotal.toLocaleString()}</span>
                </div>
                {finalOs.discount > 0 && (
                  <div className="flex justify-between items-center mb-1 text-[#E11D48] opacity-60">
                    <span className="text-[8px] font-black uppercase">Desconto</span>
                    <span className="text-[9px] font-black">- R$ {finalOs.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between items-end mt-4">
                   <div className="text-left">
                     <p className="text-[7px] font-black text-zinc-400 uppercase italic leading-none mb-1">Total Pago</p>
                     <p className="text-[9px] font-black uppercase italic bg-zinc-900 text-white px-2 py-0.5 rounded">{finalOs.paymentMethod}</p>
                   </div>
                   <p className="text-4xl font-black italic text-zinc-900 leading-none tracking-tighter">R$ {finalOs.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Obs e Rodapé */}
              <div className="mt-8 space-y-4">
                 <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 text-[7px] font-bold text-zinc-500 uppercase italic leading-relaxed text-center">
                    "{finalOs.observations || 'Obrigado pela confiança em nossos serviços de alta performance!'}"
                 </div>
                 <div className="text-center">
                    <p className="text-[6px] font-black text-zinc-300 uppercase tracking-[0.4em]">KAENPRO MOTORSPORT • EXCELLENCE SERVICE</p>
                 </div>
              </div>
            </div>

            {/* Ações Mobile */}
            <div className="w-full space-y-4 pt-4">
              <button onClick={shareWhatsApp} className="w-full bg-[#25D366] py-5 rounded-3xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl">
                <Share2 size={20} /> Compartilhar WhatsApp
              </button>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={downloadImage} className="bg-zinc-900 border border-zinc-800 py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                  <Download size={18} /> Salvar Imagem
                </button>
                <button onClick={() => window.print()} className="bg-zinc-900 border border-zinc-800 py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                  <Printer size={18} /> Imprimir A4
                </button>
              </div>
              <button onClick={() => navigate('/orders')} className="w-full bg-zinc-800 py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest text-zinc-400">
                Voltar ao Histórico
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewServiceOrder;
