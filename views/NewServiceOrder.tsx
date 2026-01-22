
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

  const totalValue = useMemo(() => {
    const itemsTotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
    return itemsTotal + (parseFloat(labor) || 0);
  }, [items, labor]);

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
        problem: 'MANUTENÇÃO TÉCNICA ESPECIALIZADA',
        items,
        laborValue: parseFloat(labor) || 0,
        discount: 0,
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
      alert("ERRO NA GERAÇÃO.");
    } finally {
      setIsSaving(false);
    }
  };

  const downloadImage = async () => {
    if (!invoiceRef.current) return;
    const hiddenArea = document.getElementById('render-hidden-os');
    if (!hiddenArea) return;

    // LIMPEZA E CLONAGEM PURA (SEM CSS TRANSFORMS)
    hiddenArea.innerHTML = '';
    const clone = invoiceRef.current.cloneNode(true) as HTMLDivElement;
    clone.style.transform = 'none';
    clone.style.margin = '0';
    clone.style.position = 'static';
    hiddenArea.appendChild(clone);

    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
        letterRendering: true,
        width: 800,
        height: 1130
      });
      const link = document.createElement('a');
      link.download = `KAEN_OS_${finalOs?.osNumber}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      hiddenArea.innerHTML = '';
    } catch (err) {
      alert("Erro ao gerar imagem.");
    }
  };

  // LÓGICA DE DENSIDADE PARA AJUSTE DE FONTE
  const densityClass = useMemo(() => {
    const count = items.length + (parseFloat(labor) > 0 ? 1 : 0);
    if (count > 15) return 'density-high';
    if (count > 8) return 'density-medium';
    return '';
  }, [items, labor]);

  return (
    <div className="flex flex-col min-h-screen bg-black text-white items-center w-full">
      {/* Header do Gerador */}
      <div className="w-full p-6 border-b border-white/5 flex items-center justify-between glass-card sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="p-3 bg-white/5 rounded-full text-zinc-500 hover:text-white border border-white/10 transition-all">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-[10px] font-black uppercase tracking-[0.5em] italic">GERADOR <span className="text-[#FF2D55]">KAEN</span></h2>
        <div className="w-12"></div>
      </div>

      <div className="flex-1 w-full max-w-4xl p-6 md:p-8 space-y-10 pb-40 flex flex-col items-center">
        
        {step === 'CLIENTE' && (
          <div className="w-full max-w-2xl space-y-8 animate-in slide-in-from-bottom-4 duration-500 flex flex-col items-center">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">CLIENTE</h1>
            <div className="relative glass-card p-1 rounded-full border-white/10 w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700" size={20} />
              <input 
                type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)}
                placeholder="BUSCAR NOME OU WHATSAPP..."
                className="w-full bg-transparent border-none py-5 pl-16 pr-8 text-white font-black text-[11px] uppercase outline-none placeholder-zinc-800"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 w-full">
              {clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).slice(0, 5).map(c => (
                <button key={c.id} onClick={() => { setSelectedClient(c); setStep('VEICULO'); }} className="w-full p-6 glass-card border-white/5 rounded-[2rem] flex items-center justify-between hover:border-[#FF2D55]/50 transition-all group">
                   <div className="text-left">
                    <p className="text-xl font-black italic uppercase group-hover:text-[#FF2D55]">{c.name}</p>
                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{c.phone}</p>
                  </div>
                  <User size={24} className="text-zinc-800" />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'VEICULO' && selectedClient && (
          <div className="w-full max-w-2xl space-y-8 animate-in slide-in-from-right-4 duration-500 flex flex-col items-center">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">VEÍCULO</h1>
            <div className="grid grid-cols-1 gap-4 w-full">
              {vehicles.filter(v => v.clientId === selectedClient.id).map(v => (
                <button key={v.id} onClick={() => { setSelectedVehicle(v); setStep('ITENS'); }} className="p-6 glass-card border-white/5 rounded-[2.5rem] flex items-center justify-between hover:border-[#FF2D55]/50 transition-all group">
                  <div className="text-left">
                    <p className="text-xl font-black italic uppercase text-white tracking-widest">{v.plate}</p>
                    <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{v.model}</p>
                  </div>
                  <Car size={24} className="text-zinc-800" />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'ITENS' && selectedVehicle && (
          <div className="w-full max-w-3xl space-y-10 animate-in slide-in-from-right-4 duration-500 flex flex-col items-center">
            <div className="glass-card p-8 rounded-ios border-white/10 space-y-10 w-full">
               <div className="flex items-center justify-between border-b border-white/5 pb-6">
                 <div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-[#FF2D55]">{selectedVehicle.plate}</h3>
                    <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{selectedVehicle.model}</p>
                 </div>
                 <button onClick={() => setItems([...items, { id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, unitPrice: 0, type: 'SERVICE' }])} className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-white font-black uppercase text-[9px] tracking-widest hover:bg-[#FF2D55] transition-all">
                   ADICIONAR ITEM
                 </button>
               </div>

               <div className="space-y-4">
                 {items.map(item => (
                   <div key={item.id} className="bg-black p-5 rounded-[2rem] border border-white/5 flex flex-col gap-4">
                     <input type="text" placeholder="DESCRIÇÃO DO ITEM..." value={item.description} onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, description: e.target.value.toUpperCase()} : i))} className="w-full bg-transparent text-[11px] font-black outline-none uppercase italic text-white tracking-widest"/>
                     <div className="flex gap-4">
                        <input type="number" placeholder="QTD" value={item.quantity || ''} onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, quantity: parseFloat(e.target.value) || 0} : i))} className="w-20 bg-white/5 border border-white/5 p-4 rounded-xl text-center text-[11px] font-black text-white outline-none"/>
                        <input type="number" placeholder="UNITÁRIO" value={item.unitPrice || ''} onChange={(e) => setItems(items.map(i => i.id === item.id ? {...i, unitPrice: parseFloat(e.target.value) || 0} : i))} className="flex-1 bg-white/5 border border-white/5 p-4 rounded-xl text-[11px] font-black text-white outline-none"/>
                        <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="p-4 text-zinc-800 hover:text-[#FF2D55]"><Trash2 size={20}/></button>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[8px] font-black text-zinc-700 tracking-widest uppercase block mb-2">MÃO DE OBRA</label>
                    <input type="number" value={labor} onChange={(e) => setLabor(e.target.value)} className="w-full bg-black border border-white/5 p-6 rounded-[1.8rem] text-xl font-black outline-none text-white italic"/>
                  </div>
                  <div>
                    <label className="text-[8px] font-black text-zinc-700 tracking-widest uppercase block mb-2">KM ATUAL</label>
                    <input type="number" value={selectedVehicle.km} onChange={(e) => setSelectedVehicle({...selectedVehicle, km: parseFloat(e.target.value) || 0})} className="w-full bg-black border border-white/5 p-6 rounded-[1.8rem] text-xl font-black outline-none text-[#FF2D55] italic"/>
                  </div>
               </div>

               <button onClick={handleFinalize} disabled={isSaving} className="w-full bg-[#FF2D55] py-6 rounded-ios font-black uppercase text-[10px] tracking-[0.5em] flex items-center justify-center gap-5 active:scale-95 italic transition-all shadow-[0_20px_60px_rgba(255,45,85,0.3)]">
                 {isSaving ? <Loader2 className="animate-spin" /> : 'GERAR NOTA FISCAL ELITE'}
               </button>
            </div>
          </div>
        )}

        {step === 'FINAL' && finalOs && (
          <div className="w-full flex flex-col items-center gap-12 animate-in fade-in duration-700">
             <div className="invoice-preview-container">
               <div className="invoice-scale-wrapper">
                 <div ref={invoiceRef} className={`kaen-invoice shadow-[0_40px_100px_rgba(0,0,0,0.5)] ${densityClass}`}>
                    
                    {/* Header Profissional */}
                    <div className="flex justify-between items-start mb-10 border-b-2 border-zinc-100 pb-10 invoice-header">
                       <div className="flex gap-5 items-center">
                          <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center text-white">
                            <Wrench size={32} />
                          </div>
                          <div>
                            <h1 className="text-2xl font-black tracking-tighter uppercase leading-none mb-1">KAEN MECÂNICA</h1>
                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">ESTABELECIMENTO TÉCNICO V26.0</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">PROTOCOLO</p>
                          <p className="text-3xl font-black leading-none mb-1 tracking-tighter">KP-{finalOs.osNumber}</p>
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{new Date().toLocaleDateString('pt-BR')}</p>
                       </div>
                    </div>

                    {/* Blocos de Dados - GRID FIXO */}
                    <div className="grid grid-cols-2 gap-5 mb-8">
                       <div className="bg-zinc-50 p-6 rounded-[1.5rem] border border-zinc-100">
                          <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2">PROPRIETÁRIO</p>
                          <p className="text-lg font-black uppercase leading-tight">{finalOs.clientName}</p>
                       </div>
                       <div className="bg-zinc-50 p-6 rounded-[1.5rem] border border-zinc-100 flex justify-between">
                          <div>
                            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2">VEÍCULO</p>
                            <p className="text-lg font-black uppercase leading-none tracking-widest">{finalOs.vehiclePlate}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-2">KM</p>
                            <p className="text-lg font-black italic">{finalOs.vehicleKm || '0'} KM</p>
                          </div>
                       </div>
                    </div>

                    {/* TABELA DE ITENS - MOTOR DE GRID FIXO */}
                    <div className="flex-1">
                       <table className="os-table">
                          <thead>
                            <tr>
                              <th className="w-desc">ESPECIFICAÇÃO DOS ITENS E SERVIÇOS</th>
                              <th className="w-qtd">QTD</th>
                              <th className="w-unit">UNIT.</th>
                              <th className="w-total">TOTAL</th>
                            </tr>
                          </thead>
                          <tbody>
                            {finalOs.items.map((i, idx) => (
                              <tr key={idx}>
                                <td className="w-desc uppercase tracking-tight">{i.description}</td>
                                <td className="w-qtd text-zinc-400">{i.quantity.toString().padStart(2, '0')}</td>
                                <td className="w-unit text-zinc-400">R$ {i.unitPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td className="w-total">R$ {(i.quantity * i.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              </tr>
                            ))}
                            {finalOs.laborValue > 0 && (
                              <tr className="bg-zinc-50/50">
                                <td className="w-desc uppercase italic">MÃO DE OBRA TÉCNICA ESPECIALIZADA</td>
                                <td className="w-qtd text-zinc-400">01</td>
                                <td className="text-right text-zinc-400">R$ {finalOs.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                <td className="w-total">R$ {finalOs.laborValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              </tr>
                            )}
                          </tbody>
                       </table>
                    </div>

                    {/* Footer com Total Elegante (Não gigante) */}
                    <div className="mt-auto pt-8 border-t-2 border-zinc-100 flex justify-between items-end">
                       <div className="flex flex-col gap-5">
                          <div className={`inline-flex px-5 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest italic ${finalOs.paymentStatus === PaymentStatus.PAGO ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                            {finalOs.paymentStatus === PaymentStatus.PAGO ? 'RECEBIDO' : 'PAGAMENTO PENDENTE'}
                          </div>
                          <div className="w-40 border-t border-zinc-100 pt-2">
                             <p className="text-[7px] font-black text-zinc-300 uppercase text-center tracking-widest">ASSINATURA DO CLIENTE</p>
                          </div>
                       </div>

                       <div className="bg-black px-10 py-6 rounded-[2rem] text-right shadow-lg">
                          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">VALOR TOTAL LÍQUIDO</p>
                          <p className="text-2xl font-black text-white italic">R$ {finalOs.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                       </div>
                    </div>

                    <div className="absolute bottom-5 left-0 w-full text-center">
                       <p className="text-[8px] font-black text-zinc-200 uppercase tracking-[0.6em] italic">KAEN MECÂNICA • PERFORMANCE V26 • PROTOCOLO DE EXCELÊNCIA</p>
                    </div>
                 </div>
               </div>
             </div>

             <div className="w-full max-w-[500px] flex flex-col gap-4 px-4">
                <button onClick={downloadImage} className="w-full bg-white text-black py-6 rounded-ios font-black uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-4 shadow-2xl active:scale-95 italic transition-all">
                   <ImageIcon size={24}/> SALVAR PARA WHATSAPP
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
