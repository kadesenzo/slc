
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
    <div className="space-y-16 animate-ios-slide p-8 md:p-16 pb-40 max-w-[1400px] mx-auto flex flex-col items-center">
      
      <div className="flex flex-col items-center text-center gap-12 w-full">
        <div className="animate-in fade-in zoom-in duration-1000 space-y-6">
          <h1 className="text-6xl md:text-[9rem] font-black text-white italic uppercase tracking-tighter leading-[0.8]">
            SINERGIA <span className="text-[#FF2D55]">CENTRAL</span>
          </h1>
          <p className="text-zinc-700 font-bold text-[10px] md:text-xs uppercase tracking-[0.8em] flex items-center justify-center gap-6 italic">
            <Calendar size={16} className="text-[#FF2D55]" /> WORKSPACE NEURAL ATIVO • V 26.0
          </p>
        </div>
        
        <button 
          onClick={() => navigate('/orders/new')} 
          className="bg-[#FF2D55] text-white w-full md:w-auto px-20 py-8 rounded-ios font-black uppercase text-[13px] tracking-[0.6em] flex items-center justify-center gap-6 shadow-[0_25px_60px_rgba(255,45,85,0.4)] active-glow transition-all italic"
        >
          <PlusCircle size={30} /> LANÇAR NOVA NOTA
        </button>
      </div>

      <div className="w-full glass-card p-12 md:p-16 rounded-ios relative overflow-hidden border-white/10 shadow-[0_80px_150px_rgba(0,0,0,0.8)] text-center flex flex-col items-center">
        <div className="absolute -top-40 -right-40 p-40 text-[#FF2D55]/10 opacity-5 pointer-events-none">
          <Sparkles size={400}/>
        </div>
        <div className="flex flex-col items-center gap-8 mb-10">
          <div className="p-6 bg-white/5 rounded-ios-inner border border-white/10">
            <Sparkles size={32} className="text-[#FF2D55] animate-pulse"/>
          </div>
          <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.8em] italic">ANÁLISE DE INTELIGÊNCIA</h3>
        </div>
        
        {isAiLoading ? (
          <div className="flex flex-col items-center gap-8 text-zinc-700 italic">
            <Loader2 className="animate-spin" size={40}/> 
            <span className="text-lg font-black uppercase tracking-[0.4em]">SINTETIZANDO TELEMETRIA...</span>
          </div>
        ) : (
          <p className="text-3xl md:text-5xl font-black text-white italic leading-[1.1] max-w-5xl tracking-tighter uppercase">
            {aiInsight || 'LINK ESTABELECIDO. AGUARDANDO FLUXO DE DADOS OPERACIONAIS...'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
        <div className="glass-card p-10 rounded-ios shadow-2xl flex flex-col items-center text-center border border-white/5">
          <p className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.4em] mb-10 italic">FATURAMENTO</p>
          <p className="text-5xl font-black text-white italic tracking-tighter leading-none mb-4">
            R$ {dailyRevenue.toLocaleString('pt-BR')}
          </p>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-8">
            <div className="h-full bg-emerald-500 w-[75%] shadow-[0_0_20px_#10B981]"></div>
          </div>
        </div>
        
        <div className="glass-card p-10 rounded-ios shadow-2xl flex flex-col items-center text-center border border-white/5">
          <p className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.4em] mb-10 italic">CONCLUÍDOS</p>
          <p className="text-6xl font-black text-white italic tracking-tighter leading-none">{dailyFinished.length}</p>
          <p className="text-[9px] text-zinc-800 font-bold uppercase mt-10 tracking-[0.4em] italic">SERVIÇOS FINALIZADOS</p>
        </div>

        <div className="glass-card p-10 rounded-ios shadow-2xl flex flex-col items-center text-center border border-white/5">
          <p className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.4em] mb-10 italic">EM PÁTIO</p>
          <p className="text-6xl font-black text-white italic tracking-tighter leading-none">
            {orders.filter(o => o.status === OSStatus.EM_ANDAMENTO).length}
          </p>
          <p className="text-[9px] text-zinc-800 font-bold uppercase mt-10 tracking-[0.4em] italic">EM EXECUÇÃO</p>
        </div>

        <div className="glass-card p-10 rounded-ios shadow-2xl border border-[#FF2D55]/10 flex flex-col items-center text-center">
          <p className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.4em] mb-10 italic">ESTOQUE</p>
          <p className={`text-6xl font-black italic tracking-tighter leading-none ${criticalStock > 0 ? 'text-[#FF2D55]' : 'text-white'}`}>
            {criticalStock}
          </p>
          <p className="text-[9px] text-zinc-800 font-bold uppercase mt-10 tracking-[0.4em] italic">ALERTAS CRÍTICOS</p>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
