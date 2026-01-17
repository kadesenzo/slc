
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Car, 
  Package, 
  PlusCircle, 
  Sparkles,
  Loader2,
  Calendar,
  ArrowUpRight
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
      setAiInsight('Intelligence: Dynamic stock rotation needed to maximize today\'s turnover.');
      return;
    }
    
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analise os dados desta oficina mecânica: ${currentOrders.length} ordens de serviço e ${currentParts.length} itens no estoque. Forneça um insight estratégico de 2 frases para o dono da oficina aumentar o lucro hoje em estilo executivo Apple.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setAiInsight(response.text || 'Operational synergy detected. Converge on pending work orders.');
    } catch (err) {
      setAiInsight('Optimization alert: High-velocity parts require immediate audit for demand spike.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const dailyFinished = orders.filter(o => new Date(o.updatedAt).toDateString() === new Date().toDateString() && o.status === OSStatus.FINALIZADO);
  const dailyRevenue = dailyFinished.reduce((acc, curr) => acc + curr.totalValue, 0);
  const criticalStock = parts.filter(p => p.stock <= p.minStock).length;

  return (
    <div className="space-y-12 animate-ios-slide p-6 md:p-12 pb-32 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-5xl md:text-7xl font-black text-white italic uppercase tracking-tighter leading-none">
            Core <span className="text-[#FF2D55]">Synergy</span>
          </h1>
          <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.4em] flex items-center gap-3 mt-4">
            <Calendar size={14} className="text-[#FF2D55]" /> Neural Dashboard • v 26.0
          </p>
        </div>
        <button 
          onClick={() => navigate('/orders/new')} 
          className="bg-[#FF2D55] text-white px-10 py-5 rounded-ios font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-4 shadow-2xl shadow-[#FF2D55]/30 hover:scale-105 active:scale-95 transition-all"
        >
          <PlusCircle size={20} /> Deploy New Order
        </button>
      </div>

      {/* AI INSIGHT CARD */}
      <div className="glass-card p-10 rounded-ios relative overflow-hidden group">
        <div className="absolute -top-20 -right-20 p-20 text-white/5 opacity-10 group-hover:scale-125 transition-transform duration-1000">
          <Sparkles size={240}/>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <Sparkles size={22} className="text-[#FF2D55]"/>
          </div>
          <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] italic">Bionic Intelligence</h3>
        </div>
        {isAiLoading ? (
          <div className="flex items-center gap-4 text-zinc-600 italic">
            <Loader2 className="animate-spin" size={24}/> 
            <span className="text-base font-bold uppercase tracking-widest">Synthesizing telemetry...</span>
          </div>
        ) : (
          <p className="text-2xl md:text-3xl font-black text-white italic leading-[1.1] max-w-4xl tracking-tight">
            {aiInsight || 'Link established. Awaiting data stream...'}
          </p>
        )}
      </div>

      {/* STATS TILES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-10 rounded-ios hover:scale-[1.02] transition-all group relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Daily Volume</p>
            <ArrowUpRight size={20} className="text-emerald-500 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </div>
          <p className="text-4xl font-black text-white italic tracking-tighter">
            R$ {dailyRevenue.toLocaleString('pt-BR')}
          </p>
          <div className="mt-6 h-[2px] bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-[72%] shadow-[0_0_10px_#10B981]"></div>
          </div>
        </div>
        
        <div className="glass-card p-10 rounded-ios hover:scale-[1.02] transition-all group">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Neural Handover</p>
          <p className="text-4xl font-black text-white italic tracking-tighter">{dailyFinished.length}</p>
          <p className="text-[9px] text-zinc-600 font-bold uppercase mt-4 tracking-widest">Completed Shifts</p>
        </div>

        <div className="glass-card p-10 rounded-ios hover:scale-[1.02] transition-all group">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Active Telemetry</p>
          <p className="text-4xl font-black text-white italic tracking-tighter">
            {orders.filter(o => o.status === OSStatus.EM_ANDAMENTO).length}
          </p>
          <p className="text-[9px] text-zinc-600 font-bold uppercase mt-4 tracking-widest">In Progress</p>
        </div>

        <div className="glass-card p-10 rounded-ios hover:scale-[1.02] transition-all group hover:border-[#FF2D55]/30">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-6">Supply Variance</p>
          <p className={`text-4xl font-black italic tracking-tighter ${criticalStock > 0 ? 'text-[#FF2D55]' : 'text-white'}`}>
            {criticalStock}
          </p>
          <p className="text-[9px] text-zinc-600 font-bold uppercase mt-4 tracking-widest">Inventory Delta</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
