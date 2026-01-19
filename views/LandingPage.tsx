
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

interface LandingPageProps {
  onLogin?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = () => {
  const navigate = useNavigate();
  const [splashStep, setSplashStep] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setSplashStep(1), 2200);
    const timer2 = setTimeout(() => setSplashStep(2), 4400);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (splashStep === 0) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[1000] p-6">
        <div className="splash-text flex flex-col items-center text-center">
          <p className="text-zinc-700 text-[9px] font-black uppercase tracking-[0.8em] mb-4 italic">INICIANDO ECOSSISTEMA</p>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white">
            KAEN<span className="text-[#FF2D55]">PRO</span>
          </h1>
        </div>
      </div>
    );
  }

  if (splashStep === 1) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[1000] p-6">
        <div className="splash-text flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">BEM-VINDO À</h1>
          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-[#FF2D55]">NETWORK</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-black overflow-hidden selection:bg-[#FF2D55]">
      
      <header className="fixed top-0 left-0 w-full p-8 md:p-12 flex justify-between items-center z-50">
        <div className="reveal-node flex items-center gap-2" style={{ animationDelay: '0.2s' }}>
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
            <span className="text-white font-black text-sm italic">K<span className="text-[#FF2D55]">P</span></span>
          </div>
        </div>
        <button 
          onClick={() => navigate('/login')}
          className="reveal-node btn-elite px-8 py-3.5 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest shadow-2xl italic"
          style={{ animationDelay: '0.4s' }}
        >
          ACESSO ELITE
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 md:px-12 relative z-10 w-full">
        
        <div className="reveal-node mb-10" style={{ animationDelay: '0.6s' }}>
          <div className="bg-white/5 border border-white/10 px-8 py-2.5 rounded-full flex items-center gap-4">
            <div className="w-6 h-[1.5px] bg-[#FF2D55]"></div>
            <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.5em] italic">PROTOCOLO DE ELITE V26.0</span>
            <div className="w-6 h-[1.5px] bg-[#FF2D55]"></div>
          </div>
        </div>

        <h1 className="reveal-node text-[18vw] md:text-[11rem] font-black italic uppercase tracking-tighter text-white leading-[0.8] mb-10 select-none" style={{ animationDelay: '0.8s' }}>
          KAEN<br className="md:hidden" /><span className="text-[#FF2D55]">PRO</span>
          <span className="block md:inline text-[10vw] md:text-[11rem] text-zinc-900 md:text-white md:opacity-100 opacity-20"> NETWORK</span>
        </h1>

        <div className="reveal-node max-w-2xl mb-16 px-4" style={{ animationDelay: '1s' }}>
          <p className="text-zinc-500 font-bold text-sm md:text-lg uppercase tracking-widest leading-relaxed italic">
            Ecossistema proprietário de alta performance para formação e gestão de oficinas digitais.
          </p>
        </div>

        <div className="reveal-node flex justify-center gap-12 md:gap-20 mb-16 text-zinc-800 font-black text-[10px] uppercase tracking-[0.6em] italic" style={{ animationDelay: '1.2s' }}>
          <span>PROTOCOLO</span>
          <span>SISTEMA</span>
          <span>REDE</span>
        </div>

        <div className="reveal-node w-full flex justify-center" style={{ animationDelay: '1.4s' }}>
          <button 
            onClick={() => navigate('/login')}
            className="glass-card px-16 py-8 rounded-ios text-white font-black uppercase text-xs tracking-[0.6em] hover:bg-white hover:text-black transition-all active:scale-95 shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-white/10 italic"
          >
            ACESSAR SISTEMA
          </button>
        </div>

        <div className="reveal-node absolute bottom-12 flex flex-col items-center gap-3 opacity-10" style={{ animationDelay: '1.8s' }}>
           <span className="text-[8px] font-black uppercase tracking-[0.8em]">SCROLL DOWN</span>
           <ChevronDown size={22} className="animate-bounce" />
        </div>
      </main>

      <footer className="fixed bottom-8 left-0 w-full text-center px-8">
        <p className="reveal-node text-[8px] font-bold text-zinc-900 uppercase tracking-[0.5em] italic" style={{ animationDelay: '2s' }}>
          © 2024 KAENPRO NETWORK • CORE ENGINE • PROTOCOLO ELITE
        </p>
      </footer>

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[160%] bg-[radial-gradient(circle_at_center,rgba(255,45,85,0.04)_0%,transparent_70%)]"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>
    </div>
  );
};

export default LandingPage;
