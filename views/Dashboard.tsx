
import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Sparkles,
  Loader2,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ServiceOrder, Part, OSStatus, UserSession } from '../types';
import { GoogleGenAI } from "@google/genai";

const Dashboard: React.FC<{ session?: UserSession }> = ({ session }) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (session) {
      const savedOrders = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_orders`) || '[]');
      const savedParts = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_parts`) || '[]');
      setOrders(savedOrders);
      setParts(savedParts);
      fetchAiInsights(savedOrders, savedParts);
    }
  }, [session]);

  const fetchAiInsights = async (currentOrders: ServiceOrder[], currentParts: Part[]) => {
    if (!process.env.API_KEY) {
      setAiInsight('LINK NEURAL: FOCO TOTAL NA PRODUTIVIDADE HOJE. REVISE ORDENS PENDENTES PARA LIBERAR ESPAÇO NO PÁTIO.');
      return;
    }
    
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analise os dados desta oficina mecânica: ${currentOrders.length} ordens de serviço e ${currentParts.length} itens no estoque. Forneça um insight estratégico de 2 frases para o dono da oficina aumentar o lucro hoje em estilo executivo. Em português e letras maiúsculas.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setAiInsight(response.text?.toUpperCase() || 'SINERGIA OPERACIONAL DETECTADA. FOCO TOTAL EM ORDENS PENDENTES.');
    } catch (err) {
      setAiInsight('ALERTA DE OTIMIZAÇÃO: PEÇAS DE ALTA VELOCIDADE REQUEREM AUDITORIA IMEDIATA PARA PICO DE DEMANDA.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const dailyFinished = orders.filter(o => new Date(o.updatedAt).toDateString() === new Date().toDateString() && o.status === OSStatus.FINALIZADO);
  const dailyRevenue = dailyFinished.reduce((acc, curr) => acc + curr.totalValue, 0);
  const criticalStock = parts.filter(p => p.stock <= p.minStock).length;

  return (
    <div className="space-y-16 p-6 md:p-16 pb-40 flex flex-col items-center w-full animate-ios-slide max-w-[1200px] mx-auto">
      
      {/* Hero Centralizado */}
      <div className="flex flex-col items-center text-center gap-12 w-full mt-8">
        <div className="animate-in fade-in zoom-in duration-1000 space-y-6 flex flex-col items-center">
          <h1 className="text-6xl md:text-[10rem] font-black text-white italic uppercase tracking-tighter leading-[0.8] text-center">
            SINERGIA <span className="text-[#FF2D55]">CENTRAL</span>
          </h1>
          <p className="text-zinc-600 font-black text-[11px] md:text-sm uppercase tracking-[0.8em] flex items-center justify-center gap-6 italic">
            <Calendar size={18} className="text-[#FF2D55]" /> PROTOCOLO V26.0 • ONLINE
          </p>
        </div>
        
        <button 
          onClick={() => navigate('/orders/new')} 
          className="bg-[#FF2D55] text-white w-full md:w-auto px-16 py-8 md:px-24 md:py-10 rounded-ios font-black uppercase text-[12px] md:text-[14px] tracking-[0.6em] flex items-center justify-center gap-8 shadow-[0_30px_80px_rgba(255,45,85,0.4)] hover:scale-105 active:scale-95 transition-all italic active-glow"
        >
          <PlusCircle size={36} className="hidden md:block" /> LANÇAR NOTA
        </button>
      </div>

      {/* IA Insight Card */}
      <div className="w-full glass-card p-10 md:p-20 rounded-ios relative overflow-hidden border-white/10 shadow-[0_80px_200px_rgba(0,0,0,0.9)] text-center flex flex-col items-center">
        <div className="absolute -top-60 -right-60 p-60 text-[#FF2D55]/10 opacity-10 pointer-events-none">
          <Sparkles size={600}/>
        </div>
        
        <div className="flex flex-col items-center gap-8 mb-10">
          <div className="p-6 md:p-8 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <Sparkles size={32} className="text-[#FF2D55] animate-pulse"/>
          </div>
          <h3 className="text-[10px] md:text-[12px] font-black text-zinc-500 uppercase tracking-[1em] italic">ANÁLISE DE INTELIGÊNCIA</h3>
        </div>
        
        {isAiLoading ? (
          <div className="flex flex-col items-center gap-8 text-zinc-700 italic">
            <Loader2 className="animate-spin" size={40}/> 
            <span className="text-lg font-black uppercase tracking-[0.5em]">SINTETIZANDO...</span>
          </div>
        ) : (
          <p className="text-3xl md:text-6xl font-black text-white italic leading-[1.1] max-w-6xl tracking-tighter uppercase selection:bg-[#FF2D55] text-center">
            {aiInsight || 'LINK ESTABELECIDO. AGUARDANDO FLUXO...'}
          </p>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 w-full">
        <div className="glass-card p-8 md:p-12 rounded-ios shadow-2xl flex flex-col items-center text-center border-white/5 hover:border-[#FF2D55]/30 transition-all">
          <p className="text-zinc-600 text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] mb-8 md:mb-12 italic">FATURAMENTO</p>
          <p className="text-4xl md:text-6xl font-black text-white italic tracking-tighter leading-none mb-4 md:mb-6">
            R$ {dailyRevenue.toLocaleString('pt-BR')}
          </p>
          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-6 md:mt-8">
            <div className="h-full bg-emerald-500 w-[75%] shadow-[0_0_25px_#10B981]"></div>
          </div>
        </div>
        
        <div className="glass-card p-8 md:p-12 rounded-ios shadow-2xl flex flex-col items-center text-center border-white/5 hover:border-[#FF2D55]/30 transition-all">
          <p className="text-zinc-600 text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] mb-8 md:mb-12 italic">CONCLUÍDOS</p>
          <p className="text-5xl md:text-7xl font-black text-white italic tracking-tighter leading-none">{dailyFinished.length}</p>
          <p className="text-[9px] md:text-[10px] text-zinc-800 font-black uppercase mt-8 md:mt-12 tracking-[0.5em] italic">HOJE</p>
        </div>

        <div className="glass-card p-8 md:p-12 rounded-ios shadow-2xl flex flex-col items-center text-center border-white/5 hover:border-[#FF2D55]/30 transition-all">
          <p className="text-zinc-600 text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] mb-8 md:mb-12 italic">EM PÁTIO</p>
          <p className="text-5xl md:text-7xl font-black text-white italic tracking-tighter leading-none">
            {orders.filter(o => o.status === OSStatus.EM_ANDAMENTO).length}
          </p>
          <p className="text-[9px] md:text-[10px] text-zinc-800 font-black uppercase mt-8 md:mt-12 tracking-[0.5em] italic">ATIVAS</p>
        </div>

        <div className="glass-card p-8 md:p-12 rounded-ios shadow-2xl border border-[#FF2D55]/20 flex flex-col items-center text-center">
          <p className="text-zinc-600 text-[10px] md:text-[11px] font-black uppercase tracking-[0.5em] mb-8 md:mb-12 italic">ESTOQUE</p>
          <p className={`text-5xl md:text-7xl font-black italic tracking-tighter leading-none ${criticalStock > 0 ? 'text-[#FF2D55]' : 'text-white'}`}>
            {criticalStock}
          </p>
          <p className="text-[9px] md:text-[10px] text-zinc-800 font-black uppercase mt-8 md:mt-12 tracking-[0.5em] italic">ALERTAS</p>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
