
import React, { useState } from 'react';
import { Lock, Wrench, Eye, EyeOff, RefreshCw, Cloud } from 'lucide-react';

interface LoginPageProps {
  onLogin: (username: string, role: 'Dono' | 'Funcionário' | 'Recepção') => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('Rafael');
  const [password, setPassword] = useState('enzo1234');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');

    // Simulação de autenticação em servidor e busca de banco de dados
    await new Promise(r => setTimeout(r, 1500));

    if (username === 'Rafael' && password === 'enzo1234') {
      onLogin(username, 'Dono');
    } else if (username === 'Mecanico' && password === '1234') {
      onLogin(username, 'Funcionário');
    } else {
      setError('Credenciais inválidas ou conta não encontrada.');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center p-6 selection:bg-[#A32121]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 -right-24 w-[500px] h-[500px] bg-[#A32121]/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 -left-24 w-[500px] h-[500px] bg-[#A32121]/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-700 relative z-10">
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-[#A32121] rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-red-900/40 transform rotate-12">
            <Wrench size={48} className="text-white -rotate-12" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Kaen<span className="text-[#A32121]">pro</span></h1>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-3">Cloud Synchronization Engine</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden">
          {isLoggingIn && (
            <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4">
              <RefreshCw size={40} className="text-[#A32121] animate-spin" />
              <p className="text-[10px] font-black text-white uppercase tracking-widest">Sincronizando seus dados...</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-black text-white uppercase">Acesso à Oficina</h2>
              <p className="text-xs text-zinc-500 font-medium">Os dados serão sincronizados com seu login.</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] p-4 rounded-2xl text-center font-black uppercase tracking-wider">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Identificação</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-5 text-white focus:outline-none focus:ring-2 focus:ring-[#A32121]/30 focus:border-[#A32121] transition-all font-bold" 
                  placeholder="Nome de usuário"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Senha de Acesso</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-5 text-white focus:outline-none focus:ring-2 focus:ring-[#A32121]/30 focus:border-[#A32121] transition-all font-bold" 
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-[#A32121] py-6 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-[#8B1A1A] transition-all transform active:scale-95 shadow-xl shadow-red-900/30 flex items-center justify-center space-x-3 group"
              >
                <span>Entrar e Sincronizar</span>
                <Cloud size={18} className="group-hover:translate-y-[-2px] transition-transform" />
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 text-center space-y-4">
           <p className="text-[10px] text-zinc-700 font-black uppercase tracking-[0.3em]">
            © 2024 Kaenpro Motors • v 3.0 Cloud Ready
          </p>
          <div className="flex items-center justify-center gap-6 opacity-30 grayscale">
            <img src="https://img.icons8.com/color/48/000000/google-cloud.png" className="h-6" alt="Cloud" />
            <img src="https://img.icons8.com/color/48/000000/amazon-web-services.png" className="h-6" alt="AWS" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
