
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Wrench, 
  Package, 
  ChevronLeft,
  X,
  PlusCircle,
  Car,
  User,
  Search,
  ChevronRight,
  Loader2,
  Download,
  DollarSign,
  Sparkles,
  CreditCard,
  Wallet,
  Smartphone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Client, Vehicle, OSItem, OSStatus, ServiceOrder, PaymentStatus, UserSession, PaymentMethod, TransactionType, FinancialTransaction } from '../types';
import { GoogleGenAI } from "@google/genai";
import html2canvas from 'html2canvas';

const NewServiceOrder: React.FC<{ session?: UserSession; syncData?: (key: string, data: any) => Promise<void> }> = ({ session, syncData }) => {
  const navigate = useNavigate();
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  const [clients, setClients] = useState<Client[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientVehicles, setClientVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  const [currentKm, setCurrentKm] = useState('');
  const [problem, setProblem] = useState('');
  const [items, setItems] = useState<OSItem[]>([]);
  const [labor, setLabor] = useState<string>('0');
  const [discount, setDiscount] = useState<string>('0');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PAGO);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>(PaymentMethod.PIX);
  
  const [showInvoice, setShowInvoice] = useState(false);
  const [osData, setOsData] = useState<ServiceOrder | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (session) {
      const userClients = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_clients`) || '[]');
      const userVehicles = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_vehicles`) || '[]');
      setClients(userClients);
      setAllVehicles(userVehicles);
    }
  }, [session]);

  const filteredClients = useMemo(() => {
    const term = clientSearch.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!term) return [];
    return clients.filter(c => {
      const name = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return name.includes(term) || c.phone.includes(term);
    });
  }, [clientSearch, clients]);

  const handleAiSuggest = async () => {
    if (!problem || !selectedVehicle) {
      alert("Descreva os sintomas do veículo para a IA ajudar.");
      return;
    }

    if (!process.env.API_KEY) {
      alert("IA indisponível no momento. Por favor, adicione os itens manualmente.");
      return;
    }

    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Como um mecânico especialista de elite da Kaenpro, analise o seguinte problema: "${problem}" no veículo ${selectedVehicle.model}. Sugira 3 peças prováveis e um valor estimado de mão de obra. Responda em JSON puro seguindo o formato: {"items": [{"desc": "nome peça", "price": 100}], "labor": 200, "explanation": "breve explicação"}`,
      });
      
      const text = response.text || '';
      const data = JSON.parse(text.replace(/```json|```/g, "").trim());
      
      const newItems: OSItem[] = data.items.map((i: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        description: i.desc.toUpperCase(),
        quantity: 1,
        unitPrice: i.price,
        type: 'PART'
      }));

      setItems([...items, ...newItems]);
      setLabor(data.labor.toString());
      alert(`IA Kaenpro: ${data.explanation}`);
    } catch (err) {
      console.error(err);
      alert("Erro ao consultar assistente de IA.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setClientSearch('');
    setSelectedVehicle(null);
    setClientVehicles(allVehicles.filter(v => v.clientId === client.id));
  };

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(36).substr(2, 9), description: '', quantity: 1, unitPrice: 0, type: 'PART' }]);
  };

  const updateItem = (id: string, field: keyof OSItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const totalValue = useMemo(() => {
    const itemsSum = items.reduce((acc, curr) => acc + (curr.quantity * curr.unitPrice), 0);
    const final = itemsSum + (parseFloat(labor) || 0) - (parseFloat(discount) || 0);
    return final > 0 ? final : 0;
  }, [items, labor, discount]);

  const handleFinalize = async () => {
    if (!selectedClient || !selectedVehicle || !session || !syncData) return;
    
    const osId = Math.random().toString(36).substr(2, 9);
    const osNumber = `KP-${Date.now().toString().slice(-6)}`;
    
    const newOs: ServiceOrder = {
      id: osId,
      osNumber: osNumber,
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      vehicleId: selectedVehicle.id,
      vehiclePlate: selectedVehicle.plate,
      vehicleModel: selectedVehicle.model,
      vehicleKm: currentKm,
      problem,
      items,
      laborValue: parseFloat(labor) || 0,
      discount: parseFloat(discount) || 0,
      totalValue,
      status: OSStatus.FINALIZADO,
      paymentStatus,
      paymentMethod: selectedPaymentMethod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // REGISTRO FINANCEIRO AUTOMÁTICO
    const newTransaction: FinancialTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: TransactionType.INCOME,
      category: 'Serviço Automotivo',
      amount: totalValue,
      method: selectedPaymentMethod,
      description: `OS #${osNumber} - ${selectedVehicle.plate}`,
      relatedId: osId,
      date: new Date().toISOString()
    };

    // Salvar Ordens
    const existingOrders = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_orders`) || '[]');
    await syncData('orders', [...existingOrders, newOs]);
    
    // Salvar Transações
    const existingTransactions = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_transactions`) || '[]');
    await syncData('transactions', [...existingTransactions, newTransaction]);
    
    setOsData(newOs);
    setShowInvoice(true);
  };

  const downloadAsImage = async () => {
    if (!invoiceRef.current) return;
    setIsGeneratingImage(true);
    const canvas = await html2canvas(invoiceRef.current, { scale: 3, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `Nota_${osData?.osNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setIsGeneratingImage(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-32 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-4 md:px-0">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
          <ChevronLeft size={20} />
          <span className="font-black uppercase text-[10px] tracking-widest">Voltar</span>
        </button>
        <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">Gerar <span className="text-[#E11D48]">Nota Pro</span></h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-0">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0F0F0F] border border-[#1F1F1F] p-8 rounded-[2.5rem] shadow-2xl">
            {!selectedClient ? (
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic ml-1">1. Localizar Cliente</label>
                <div className="relative">
                   <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700" size={20} />
                   <input 
                    type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="BUSCAR CLIENTE..."
                    className="w-full bg-[#050505] border-2 border-[#1F1F1F] rounded-[2rem] pl-16 pr-6 py-6 text-white font-black outline-none focus:border-[#E11D48] transition-all"
                   />
                </div>
                {filteredClients.map(c => (
                  <button key={c.id} onClick={() => handleSelectClient(c)} className="w-full p-6 flex justify-between bg-zinc-900/50 rounded-3xl mb-2 hover:bg-[#E11D48] group transition-all text-left">
                    <span className="font-black text-white uppercase">{c.name}</span>
                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-5 bg-[#050505] border border-zinc-800 rounded-[2rem]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#E11D48]/10 text-[#E11D48] rounded-xl flex items-center justify-center"><User size={24} /></div>
                    <div><h3 className="text-lg font-black text-white uppercase italic">{selectedClient.name}</h3></div>
                  </div>
                  <button onClick={() => setSelectedClient(null)} className="p-3 bg-zinc-900 rounded-xl text-zinc-500 hover:text-white"><X size={20}/></button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {clientVehicles.map(v => (
                    <button key={v.id} onClick={() => setSelectedVehicle(v)} className={`p-6 rounded-[2rem] border-2 transition-all text-left ${selectedVehicle?.id === v.id ? 'bg-[#E11D48]/10 border-[#E11D48]' : 'bg-zinc-950 border-zinc-800'}`}>
                      <Car size={22} className="mb-2" />
                      <p className="font-black text-white">{v.plate}</p>
                      <p className="text-[10px] text-zinc-500 font-bold">{v.model}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selectedVehicle && (
            <div className="bg-[#0F0F0F] border border-[#1F1F1F] p-8 rounded-[2.5rem] shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                 <h3 className="text-[10px] font-black text-zinc-600 uppercase flex items-center gap-2 italic">
                  <Wrench size={16} className="text-[#E11D48]" /> Relatório do Problema
                 </h3>
                 <button 
                  onClick={handleAiSuggest} 
                  disabled={isAiLoading}
                  className="bg-zinc-950 border border-[#E11D48] text-[#E11D48] px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#E11D48] hover:text-white transition-all text-[9px] font-black uppercase tracking-widest disabled:opacity-50"
                 >
                   {isAiLoading ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>}
                   IA: Diagnóstico Smart
                 </button>
              </div>
              <textarea 
                value={problem} onChange={(e) => setProblem(e.target.value)} rows={4}
                placeholder="DETALHE O QUE O CLIENTE RELATOU OU O QUE FOI ENCONTRADO..."
                className="w-full bg-[#050505] border-2 border-[#1F1F1F] rounded-[2rem] p-6 text-sm text-white focus:border-[#E11D48] outline-none font-bold"
              />
              
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-zinc-600 uppercase italic">Itens e Peças</h3>
                <button onClick={addItem} className="bg-zinc-800 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"><Plus size={14}/> Add Peça</button>
              </div>
              
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4 p-4 bg-[#050505] border border-zinc-900 rounded-3xl items-center">
                    <input type="text" placeholder="DESCRIÇÃO..." value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value.toUpperCase())} className="flex-1 bg-transparent border-none text-xs text-white font-bold outline-none" />
                    <input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))} className="w-12 bg-zinc-900 rounded-lg py-2 text-center text-xs font-black" />
                    <input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value))} className="w-20 bg-zinc-900 rounded-lg py-2 text-center text-xs font-black" />
                    <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-zinc-800 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#0F0F0F] border border-[#1F1F1F] p-8 rounded-[2.5rem] shadow-2xl space-y-8 h-fit sticky top-6">
           <div className="p-8 bg-[#E11D48] rounded-[2.5rem] shadow-xl relative overflow-hidden">
              <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1 italic">Total Líquido</p>
              <p className="text-4xl font-black text-white italic">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <DollarSign className="absolute top-1/2 -right-4 -translate-y-1/2 text-white/10" size={100} />
           </div>

           <div className="space-y-6">
              <div>
                <label className="text-[9px] font-black text-zinc-600 uppercase ml-2 italic block mb-3">Mão de Obra Técnica (R$)</label>
                <input type="number" value={labor} onChange={(e) => setLabor(e.target.value)} className="w-full bg-[#050505] border-2 border-zinc-900 rounded-2xl px-6 py-5 text-white font-black text-xl outline-none focus:border-[#E11D48]" />
              </div>

              <div>
                <label className="text-[9px] font-black text-zinc-600 uppercase ml-2 italic block mb-3">Forma de Pagamento</label>
                <div className="grid grid-cols-2 gap-3">
                   <button 
                    onClick={() => setSelectedPaymentMethod(PaymentMethod.PIX)}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${selectedPaymentMethod === PaymentMethod.PIX ? 'border-[#E11D48] bg-[#E11D48]/10 text-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                   >
                     <Smartphone size={20} />
                     <span className="text-[10px] font-black">PIX</span>
                   </button>
                   <button 
                    onClick={() => setSelectedPaymentMethod(PaymentMethod.CARTAO_CREDITO)}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${selectedPaymentMethod === PaymentMethod.CARTAO_CREDITO ? 'border-[#E11D48] bg-[#E11D48]/10 text-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                   >
                     <CreditCard size={20} />
                     <span className="text-[10px] font-black">CARTÃO</span>
                   </button>
                   <button 
                    onClick={() => setSelectedPaymentMethod(PaymentMethod.DINHEIRO)}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${selectedPaymentMethod === PaymentMethod.DINHEIRO ? 'border-[#E11D48] bg-[#E11D48]/10 text-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                   >
                     <Wallet size={20} />
                     <span className="text-[10px] font-black">DINHEIRO</span>
                   </button>
                </div>
              </div>

              <button 
                onClick={handleFinalize} 
                disabled={!selectedVehicle} 
                className="w-full bg-white text-black py-7 rounded-[2.5rem] font-black uppercase text-[10px] tracking-[0.3em] hover:bg-[#E11D48] hover:text-white transition-all disabled:opacity-20 italic shadow-xl"
              >
                Processar Nota Cloud
              </button>
           </div>
        </div>
      </div>

      {showInvoice && osData && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/98 overflow-y-auto p-4">
          <div className="bg-white w-full max-w-[210mm] rounded-[2rem] p-0 text-zinc-900 shadow-2xl relative">
             <div className="no-print bg-zinc-50 p-6 flex justify-between border-b sticky top-0 rounded-t-[2rem]">
               <button onClick={downloadAsImage} className="bg-[#E11D48] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                 {isGeneratingImage ? <Loader2 className="animate-spin"/> : <Download/>} Salvar Imagem
               </button>
               <button onClick={() => { setShowInvoice(false); navigate('/orders'); }} className="text-zinc-400 hover:text-black"><X size={28}/></button>
             </div>
             <div ref={invoiceRef} className="p-16 bg-white">
                <div className="flex justify-between border-b-4 border-black pb-8 mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center text-white"><Wrench size={32}/></div>
                    <h1 className="text-3xl font-black tracking-tighter italic uppercase">KAEN <span className="text-[#E11D48]">PRO</span></h1>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-400 uppercase italic">OS NÚMERO</p>
                    <p className="text-3xl font-black">{osData.osNumber}</p>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase">{osData.paymentMethod} • {osData.paymentStatus}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8 mb-10">
                   <div className="bg-zinc-50 p-6 rounded-3xl border">
                      <p className="text-[10px] font-black text-zinc-400 uppercase italic">Cliente</p>
                      <p className="text-xl font-black uppercase italic">{osData.clientName}</p>
                   </div>
                   <div className="bg-zinc-50 p-6 rounded-3xl border">
                      <p className="text-[10px] font-black text-zinc-400 uppercase italic">Veículo</p>
                      <p className="text-xl font-black uppercase italic">{osData.vehiclePlate} • {osData.vehicleModel}</p>
                   </div>
                </div>
                <table className="w-full text-left mb-10">
                  <thead className="border-b-2 border-black">
                    <tr className="text-[10px] font-black uppercase text-zinc-400"><th className="py-4">Item</th><th className="py-4 text-center">Qtd</th><th className="py-4 text-right italic">Subtotal</th></tr>
                  </thead>
                  <tbody>
                    {osData.items.map((i,idx)=>(<tr key={idx}><td className="py-4 font-black uppercase italic text-xs">{i.description}</td><td className="py-4 text-center font-bold">{i.quantity}</td><td className="py-4 text-right font-black italic">R$ {(i.quantity*i.unitPrice).toLocaleString()}</td></tr>))}
                    {osData.laborValue > 0 && (<tr><td className="py-4 font-black uppercase italic text-xs">Mão de Obra Especializada</td><td className="py-4 text-center">1</td><td className="py-4 text-right font-black italic">R$ {osData.laborValue.toLocaleString()}</td></tr>)}
                  </tbody>
                </table>
                <div className="text-right pt-10 border-t-4 border-black">
                  <p className="text-[10px] font-black text-zinc-400 italic">Total Geral Recebido</p>
                  <p className="text-6xl font-black italic">R$ {osData.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewServiceOrder;
