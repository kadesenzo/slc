
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Trash2, Wrench, ChevronLeft, X,
  User, Car, Search, Loader2, Download, DollarSign,
  Printer, Save, MessageCircle, ArrowRight, CheckCircle2,
  Share2, Image as ImageIcon
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
    setItems(items.filter(id !== id));
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
        problem: obs || 'Serviço Geral',
        items,
        laborValue: parseFloat(labor) || 0,
        discount: parseFloat(discount) || 0,
        totalValue,
        status: OSStatus.FINALIZADO,
        paymentStatus: paymentStatus,
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
    const text = `*KAEN MECÂNICA - COMPROVANTE DE SERVIÇO*\n\nNota: #${finalOs.osNumber}\nCliente: ${finalOs.clientName}\nVeículo: ${finalOs.vehiclePlate}\nTotal: R$ ${finalOs.totalValue.toLocaleString('pt-BR')}\nStatus: ${finalOs.paymentStatus}\n\nObrigado pela preferência!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0B0B] text-white overflow-hidden">
      {/* Header Fixo */}
      <div className="p-6 border-b border-zinc-800 flex items-center justify-between sticky top-0 bg-[#0B0B0B] z-20 print:hidden">
        <button onClick={() => navigate(-1)} className="p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white transition-all">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-sm font-black uppercase tracking-widest italic">Nova <span className="text-[#E11D48]">Nota Pro</span></h2>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar pb-32 print:p-0 print:overflow-visible print:bg-white">
        {step === 'CLIENT' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-300 print:hidden">
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
          <div className="space-y-6 animate-in slide-in-from-right duration-300 print:hidden">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block ml-1">Forma</label>
                  <select 
                    value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-xs font-black uppercase italic shadow-inner outline-none"
                  >
                    {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block ml-1">Status Pagamento</label>
                  <select 
                    value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-xs font-black uppercase italic shadow-inner outline-none"
                  >
                    <option value={PaymentStatus.PENDENTE}>Pendente</option>
                    <option value={PaymentStatus.PAGO}>Pago</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block ml-1">Observações</label>
                <textarea 
                  value={obs} onChange={(e) => setObs(e.target.value)}
                  placeholder="Garantia ou avisos..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-xs font-bold text-zinc-400 min-h-[100px]"
                />
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
                Gerar Nota Profissional
              </button>
            </div>
          </div>
        )}

        {step === 'FINAL' && finalOs && (
          <div className="space-y-8 animate-in zoom-in duration-300 flex flex-col items-center print:block print:space-y-0 print:m-0">
            {/* NOTA REPRODUZINDO A IMAGEM SOLICITADA */}
            <div 
              ref={invoiceRef}
              id="print-area"
              className="w-full max-w-[800px] bg-white text-zinc-900 rounded-[1.5rem] overflow-hidden shadow-2xl flex flex-col p-10 border border-zinc-100 print:shadow-none print:border-none print:rounded-none print:max-w-none print:p-8"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-12">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-black rounded-xl flex items-center justify-center text-white shrink-0">
                    <Wrench size={32} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight uppercase leading-none mb-1">KAEN MECÂNICA</h1>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Rua Joaquim Marques Alves, 765</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-zinc-400 uppercase mb-1">OS Nº</p>
                  <p className="text-2xl font-black text-zinc-900 leading-none mb-1">{finalOs.osNumber}</p>
                  <p className="text-[10px] font-bold text-zinc-400">{new Date(finalOs.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {/* Info Blocks */}
              <div className="grid grid-cols-2 gap-6 mb-12">
                <div className="bg-[#fcfcfc] border border-zinc-100 p-6 rounded-[1.5rem] shadow-sm">
                  <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest mb-2">PROPRIETÁRIO</p>
                  <p className="text-xl font-black uppercase italic mb-1">{finalOs.clientName}</p>
                  <p className="text-[10px] font-bold text-zinc-400">{selectedClient?.phone}</p>
                </div>
                <div className="bg-[#fcfcfc] border border-zinc-100 p-6 rounded-[1.5rem] shadow-sm relative">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest mb-2">VEÍCULO</p>
                      <p className="text-xl font-black uppercase italic">{finalOs.vehiclePlate}</p>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">{finalOs.vehicleModel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest mb-2">KM ATUAL</p>
                      <p className="text-xl font-black uppercase italic">{finalOs.vehicleKm || '0'} km</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="flex-1">
                <table className="w-full text-left text-[11px] mb-8">
                  <thead>
                    <tr className="text-[8px] font-black text-zinc-300 uppercase tracking-widest border-b border-zinc-50">
                      <th className="pb-4 pt-4">DESCRIÇÃO</th>
                      <th className="pb-4 pt-4 text-right">QTD</th>
                      <th className="pb-4 pt-4 text-right">UNITÁRIO</th>
                      <th className="pb-4 pt-4 text-right">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 font-bold text-zinc-800">
                    {finalOs.items.map((i,idx)=>(
                      <tr key={idx}>
                        <td className="py-4 uppercase">{i.description}</td>
                        <td className="py-4 text-right">{i.quantity.toString().padStart(2, '0')}</td>
                        <td className="py-4 text-right text-zinc-400">R$ {i.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-4 text-right font-black">R$ {(i.quantity*i.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                    {finalOs.laborValue > 0 && (
                      <tr>
                        <td className="py-4 uppercase">Mão de Obra Especializada</td>
                        <td className="py-4 text-right">01</td>
                        <td className="py-4 text-right text-zinc-400">R$ {finalOs.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-4 text-right font-black">R$ {finalOs.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    )}
                    {/* Linhas vazias para manter o estilo da imagem se necessário */}
                    {[...Array(Math.max(0, 4 - finalOs.items.length))].map((_, i) => (
                      <tr key={`empty-${i}`}><td className="py-4">&nbsp;</td><td className="py-4">&nbsp;</td><td className="py-4">&nbsp;</td><td className="py-4">&nbsp;</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Totals and Payment */}
              <div className="flex justify-between items-end mt-12 mb-16">
                <div className="flex flex-col gap-6">
                  {/* Payment Status Badge */}
                  <div className={`px-5 py-2.5 rounded-full border-2 text-[10px] font-black uppercase tracking-widest ${finalOs.paymentStatus === PaymentStatus.PAGO ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                    PAGAMENTO: {finalOs.paymentStatus}
                  </div>
                  
                  {/* Signature */}
                  <div className="w-64 pt-4 border-t border-zinc-200">
                    <p className="text-[8px] font-black text-zinc-300 uppercase text-center tracking-widest">ASSINATURA DO RESPONSÁVEL</p>
                  </div>
                </div>

                {/* Total Box - Estilo Imagem */}
                <div className="bg-[#f5f5f5] rounded-[2rem] px-10 py-6 flex flex-col items-end min-w-[240px]">
                  <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1 italic">TOTAL DA NOTA</p>
                  <p className="text-3xl font-black italic text-zinc-900 leading-none">R$ {finalOs.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-8 border-t border-zinc-50">
                 <p className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.5em] italic">
                   KAEN MECÂNICA • CONFIANÇA EM CADA KM
                 </p>
              </div>
            </div>

            {/* Ações Mobile */}
            <div className="w-full space-y-4 pt-4 print:hidden">
              <button onClick={shareWhatsApp} className="w-full bg-[#25D366] py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                <MessageCircle size={22} /> Enviar no WhatsApp
              </button>
              
              <div className="grid grid-cols-2 gap-4">
                <button onClick={downloadInvoice} className="bg-zinc-900 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-zinc-800 shadow-lg active:scale-95 transition-all">
                  <ImageIcon size={18} /> Baixar como Imagem
                </button>
                <button onClick={handlePrint} className="bg-zinc-900 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 border border-zinc-800 shadow-lg active:scale-95 transition-all">
                  <Printer size={18} /> Imprimir em Retrato
                </button>
              </div>
              
              <button onClick={() => navigate('/orders')} className="w-full bg-zinc-800 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest text-zinc-500 hover:text-white transition-all">
                Finalizar e Voltar ao Histórico
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Estilos de Impressão específicos */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: portrait;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default NewServiceOrder;
