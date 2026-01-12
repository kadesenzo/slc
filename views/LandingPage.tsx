
import React, { useState } from 'react';
import { 
  Wrench, 
  ShieldCheck, 
  Clock, 
  Award, 
  MapPin, 
  Phone, 
  MessageCircle,
  Menu,
  X,
  Lock,
  ArrowRight,
  Search,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC<{ onLogin: () => void }> = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchPlate, setSearchPlate] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);

  const services = [
    { title: 'Revisão Premium', icon: ShieldCheck, desc: 'Checkup preventivo computadorizado em mais de 60 itens.' },
    { title: 'Lubrificantes', icon: Clock, desc: 'Troca de óleo e filtros com as marcas homologadas.' },
    { title: 'Injeção Eletrônica', icon: Wrench, desc: 'Diagnóstico avançado com scanners de última geração.' },
    { title: 'Freios e Suspensão', icon: Award, desc: 'Segurança absoluta para você e sua família na estrada.' },
  ];

  const handleConsult = () => {
    if (!searchPlate) return;
    const orders = JSON.parse(localStorage.getItem('kaenpro_orders') || '[]');
    const found = orders.find((o: any) => o.vehiclePlate.replace('-', '') === searchPlate.toUpperCase().replace('-', ''));
    
    if (found) {
      setSearchResult(found);
    } else {
      alert("Nenhum serviço em andamento encontrado para esta placa.");
    }
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#A32121] font-['Inter']">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-[100] bg-[#0B0B0B]/95 backdrop-blur-md border-b border-zinc-800/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-[#A32121] rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
              <Wrench size={20} className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter">KAEN<span className="text-[#A32121]">PRO</span></span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-10 text-xs font-black uppercase tracking-widest">
            <a href="#services" className="text-zinc-400 hover:text-white transition-colors">Serviços</a>
            <a href="#consult" className="text-zinc-400 hover:text-white transition-colors">Consultar Placa</a>
            <a href="#location" className="text-zinc-400 hover:text-white transition-colors">Localização</a>
            <button 
              onClick={() => navigate('/login')}
              className="bg-white text-black px-6 py-2.5 rounded-full hover:bg-[#A32121] hover:text-white transition-all flex items-center space-x-2"
            >
              <Lock size={14} />
              <span>Acesso Oficina</span>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-zinc-400 hover:text-white transition-colors" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-20 bg-[#0B0B0B] z-[90] md:hidden animate-in fade-in slide-in-from-top duration-300">
            <div className="flex flex-col p-8 space-y-8 text-center">
              <a 
                href="#services" 
                onClick={closeMenu}
                className="text-lg font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-[#A32121] transition-colors"
              >
                Serviços
              </a>
              <a 
                href="#consult" 
                onClick={closeMenu}
                className="text-lg font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-[#A32121] transition-colors"
              >
                Consultar Placa
              </a>
              <a 
                href="#location" 
                onClick={closeMenu}
                className="text-lg font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-[#A32121] transition-colors"
              >
                Localização
              </a>
              
              <div className="pt-8 border-t border-zinc-800">
                <button 
                  onClick={() => {
                    closeMenu();
                    navigate('/login');
                  }}
                  className="w-full bg-[#A32121] py-6 rounded-3xl font-black uppercase text-sm tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-red-900/20 active:scale-95 transition-transform"
                >
                  <Lock size={20} />
                  Acesso Oficina
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-48 md:pt-60 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#A32121]/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center space-x-2 bg-zinc-900/50 border border-zinc-800 px-4 py-2 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Atendimento Aberto até 18:00</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black leading-none tracking-tighter">
              Performance <br />
              <span className="text-zinc-600">sem limites.</span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-md leading-relaxed">
              Mecânica de precisão para quem não aceita menos que a perfeição. Diagnóstico digital e equipe certificada.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a 
                href="https://wa.me/5511999999999" 
                className="bg-[#A32121] px-10 py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-[#8B1A1A] transition-all transform active:scale-95 shadow-xl shadow-red-900/30"
              >
                <MessageCircle size={20} />
                Agendar WhatsApp
              </a>
              <a href="#services" className="bg-zinc-900 border border-zinc-800 px-10 py-5 rounded-[1.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center hover:bg-zinc-800 transition-all">
                Nossos Serviços
              </a>
            </div>
          </div>
          <div className="relative group hidden md:block">
            <div className="absolute -inset-4 bg-[#A32121]/20 rounded-[3rem] blur-2xl group-hover:bg-[#A32121]/30 transition-all"></div>
            <img 
              src="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1200&auto=format&fit=crop" 
              alt="Engine repair" 
              className="relative rounded-[2.5rem] border border-zinc-800 shadow-2xl grayscale hover:grayscale-0 transition-all duration-700"
            />
          </div>
        </div>
      </section>

      {/* Consulta de Placa */}
      <section id="consult" className="py-24 px-6 bg-zinc-950">
        <div className="max-w-4xl mx-auto bg-zinc-900 border border-zinc-800 p-8 md:p-16 rounded-[3rem] shadow-2xl text-center">
            <h2 className="text-3xl font-black mb-4 uppercase tracking-tighter">Consulte seu Veículo</h2>
            <p className="text-zinc-500 mb-10 font-bold uppercase text-[10px] tracking-widest">Acompanhe o status do serviço em tempo real</p>
            
            <div className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto mb-10">
                <input 
                  type="text" 
                  value={searchPlate}
                  onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
                  placeholder="DIGITE A PLACA (Ex: ABC1D23)" 
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-center text-xl font-black tracking-widest focus:border-[#A32121] outline-none transition-all uppercase"
                />
                <button 
                  onClick={handleConsult}
                  className="bg-[#A32121] p-4 rounded-2xl hover:bg-[#8B1A1A] transition-all flex items-center justify-center"
                >
                  <Search size={24} />
                </button>
            </div>

            {searchResult && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 animate-in zoom-in duration-300 text-left">
                  <div className="flex justify-between items-start mb-6 border-b border-zinc-800 pb-4">
                      <div>
                          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Veículo</p>
                          <h4 className="text-xl font-black">{searchResult.vehicleModel}</h4>
                      </div>
                      <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {searchResult.status}
                      </span>
                  </div>
                  <div className="space-y-4">
                      <div className="flex items-center gap-3">
                          <CheckCircle2 size={18} className="text-emerald-500" />
                          <p className="text-sm font-bold text-zinc-400">Diagnóstico finalizado e autorizado.</p>
                      </div>
                      <div className="flex items-center gap-3">
                          <Clock size={18} className="text-amber-500" />
                          <p className="text-sm font-bold text-zinc-400">Entrega prevista para hoje às 17h.</p>
                      </div>
                  </div>
              </div>
            )}
        </div>
      </section>

      {/* Services Grid */}
      <section id="services" className="py-24 px-6 bg-[#0B0B0B]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-black text-[#A32121] uppercase tracking-[0.4em] mb-4">Excelência Técnica</h2>
            <h3 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">Serviços Especializados</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((s, i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem] hover:bg-zinc-900 transition-all group">
                <div className="w-12 h-12 bg-[#A32121]/10 text-[#A32121] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#A32121] group-hover:text-white transition-all">
                  <s.icon size={24} />
                </div>
                <h4 className="text-xl font-black mb-3 uppercase tracking-tight">{s.title}</h4>
                <p className="text-zinc-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="location" className="py-20 px-6 border-t border-zinc-900 bg-black">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-16">
          <div className="space-y-6">
             <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#A32121] rounded-xl flex items-center justify-center">
                <Wrench size={18} className="text-white" />
              </div>
              <span className="text-xl font-black">KAEN<span className="text-[#A32121]">PRO</span></span>
            </div>
            <p className="text-zinc-600 text-sm font-medium leading-relaxed">
              Elevando o padrão de manutenção automotiva. Tecnologia alemã aplicada à frota brasileira.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#A32121]">Onde Estamos</h4>
            <p className="text-zinc-500 text-sm font-bold">Rua dos Motores, 1234 - São Paulo, SP</p>
            <p className="text-zinc-500 text-sm font-bold">(11) 99999-9999 • contato@kaenpro.com</p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Siga-nos</h4>
            <div className="flex space-x-4">
               <a href="#" className="p-3 bg-zinc-900 rounded-full hover:bg-[#A32121] transition-all"><MapPin size={18} /></a>
               <a href="#" className="p-3 bg-zinc-900 rounded-full hover:bg-[#A32121] transition-all"><MessageCircle size={18} /></a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-zinc-900 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">© 2024 Kaenpro Motors • Powered by HighTech Auto</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
