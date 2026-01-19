
import React, { useState } from 'react';
import { Wrench, Eye, EyeOff, RefreshCw, Cloud, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
  onLogin: (username: string, role: 'Dono' | 'Funcionário' | 'Recepção') => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('Rafael');
  const [password, setPassword] = useState('enzo1234');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    await new Promise(r => setTimeout(r, 1200));

    if (username === 'Rafael' && password === 'enzo1234') {
      onLogin(username, 'Dono');
    } else if (username === 'Mecanico' && password === '1234') {
      onLogin(username, 'Funcionário');
    } else {
      setError('ACESSO NEGADO: UNIDADE NÃO RECONHECIDA.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 selection:bg-[#FF2D55]">
      {/* Botão de Voltar */}
      <button 
        onClick={() => navigate('/')}
        className="fixed top-8 left-8 text-zinc-700 hover:text-white transition-all flex items-center gap-3 group text-[10px] font-black uppercase tracking-[0.3em] italic"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-2 transition-transform" /> VOLTAR
      </button>

      <div className="w-full max-w-md animate-ios-slide space-y-12 flex flex-col items-center">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-[#FF2D55] rounded-ios flex items-center justify-center mx-auto shadow-[0_20px_50px_rgba(255,45,85,0.4)] transform rotate-12 hover:rotate-0 transition-transform duration-700 border border-white/20">
            <Wrench size={44} className="text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">KAEN<span className="text-[#FF2D55]">PRO</span></h1>
            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.6em] italic">AUTHENTICATION ENGINE</p>
          </div>
        </div>

        <div className="w-full glass-card p-10 md:p-14 rounded-ios shadow-[0_60px_120px_rgba(0,0,0,0.8)] relative overflow-hidden">
          {isLoggingIn && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl z-20 flex flex-col items-center justify-center gap-8 px-8 text-center">
              <RefreshCw size={50} className="text-[#FF2D55] animate-spin" />
              <p className="text-[11px] font-black text-white uppercase tracking-[0.5em] italic">SINCRONIZANDO WORKSPACE ELITE...</p>
            </div>
          )}

          <form className="space-y-10" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] p-6 rounded-ios text-center font-black uppercase tracking-widest animate-pulse italic">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-6 italic">CREDENCIAL DE ACESSO</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-ios px-8 py-7 text-white text-center focus:border-[#FF2D55]/50 outline-none transition-all font-black text-sm uppercase tracking-widest shadow-inner" 
                placeholder="USUÁRIO"
              />
            </div>

            <div className="space-y-4">
              <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] ml-6 italic">CHAVE DE SEGURANÇA</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-ios px-8 py-7 text-white text-center focus:border-[#FF2D55]/50 outline-none transition-all font-black text-sm tracking-widest shadow-inner" 
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full btn-elite py-8 rounded-ios font-black uppercase text-[11px] tracking-[0.6em] text-white flex items-center justify-center gap-5 active-glow"
            >
              <span>ESTABELECER LINK</span>
              <Cloud size={24} />
            </button>
          </form>
        </div>

        <p className="text-[9px] text-zinc-900 font-black uppercase tracking-[0.6em] pt-12 italic">
            © KAENPRO MOTORS • PRECISION CLOUD v26.0
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
