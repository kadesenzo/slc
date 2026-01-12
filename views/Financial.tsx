
import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Plus, 
  Calendar,
  Filter,
  Download,
  Search,
  X,
  Wallet,
  Smartphone,
  CreditCard,
  Package,
  FileText
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { FinancialTransaction, TransactionType, PaymentMethod, UserSession } from '../types';

const Financial: React.FC<{ session?: UserSession; syncData?: (key: string, data: any) => Promise<void> }> = ({ session, syncData }) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [newExpense, setNewExpense] = useState({
    description: '',
    category: 'Aluguel',
    amount: '',
    method: PaymentMethod.PIX,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (session) {
      const saved = JSON.parse(localStorage.getItem(`kaenpro_${session.username}_transactions`) || '[]');
      setTransactions(saved);
    }
  }, [session]);

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount || !session || !syncData) return;

    const transaction: FinancialTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      type: TransactionType.EXPENSE,
      category: newExpense.category,
      amount: parseFloat(newExpense.amount),
      method: newExpense.method,
      description: newExpense.description,
      date: new Date(newExpense.date).toISOString()
    };

    const updated = [...transactions, transaction];
    setTransactions(updated);
    await syncData('transactions', updated);
    setShowExpenseModal(false);
    setNewExpense({
      description: '',
      category: 'Aluguel',
      amount: '',
      method: PaymentMethod.PIX,
      date: new Date().toISOString().split('T')[0]
    });
  };

  const totals = useMemo(() => {
    const income = transactions.filter(t => t.type === TransactionType.INCOME).reduce((a, b) => a + b.amount, 0);
    const expense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((a, b) => a + b.amount, 0);
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentYear = new Date().getFullYear();
    
    return months.map((m, idx) => {
      const filtered = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === idx && d.getFullYear() === currentYear;
      });
      
      return {
        name: m,
        income: filtered.filter(t => t.type === TransactionType.INCOME).reduce((a, b) => a + b.amount, 0),
        expense: filtered.filter(t => t.type === TransactionType.EXPENSE).reduce((a, b) => a + b.amount, 0)
      };
    });
  }, [transactions]);

  const filteredTransactions = transactions.filter(t => {
    const matchesType = filterType === 'ALL' || t.type === filterType;
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  }).reverse();

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Fluxo de <span className="text-[#E11D48]">Caixa Cloud</span></h1>
          <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 mt-2">
            <TrendingUp size={12} className="text-[#E11D48]" /> Gestão Financeira Integrada às Ordens de Serviço
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowExpenseModal(true)}
            className="bg-zinc-800 text-white px-6 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-zinc-700 transition-all border border-zinc-700 shadow-xl"
          >
            <ArrowDownCircle size={18} className="text-[#E11D48]" /> Lançar Despesa
          </button>
          <button className="bg-white text-black px-6 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-zinc-200 transition-all shadow-xl">
            <Download size={18} /> Relatório PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121214] border border-zinc-800/60 p-8 rounded-[2.5rem] relative overflow-hidden border-l-4 border-l-emerald-500 shadow-xl">
           <ArrowUpCircle className="absolute -right-4 -top-4 text-emerald-500/10" size={100} />
           <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Faturamento Total (Entradas)</p>
           <p className="text-3xl font-black text-emerald-500 italic">R$ {totals.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-[#121214] border border-zinc-800/60 p-8 rounded-[2.5rem] relative overflow-hidden border-l-4 border-l-[#E11D48] shadow-xl">
           <ArrowDownCircle className="absolute -right-4 -top-4 text-[#E11D48]/10" size={100} />
           <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Despesas Totais (Saídas)</p>
           <p className="text-3xl font-black text-[#E11D48] italic">R$ {totals.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-[#121214] border border-zinc-800/60 p-8 rounded-[2.5rem] relative overflow-hidden border-l-4 border-l-blue-500 shadow-xl">
           <DollarSign className="absolute -right-4 -top-4 text-blue-500/10" size={100} />
           <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">Lucro Líquido Real</p>
           <p className="text-3xl font-black text-white italic">R$ {totals.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-[#121214] border border-zinc-800/60 p-8 rounded-[2.5rem] shadow-xl">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">Performance Anual</h3>
                 <div className="flex gap-4 text-[10px] font-black uppercase text-zinc-600">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Entradas</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#E11D48]"></div> Saídas</div>
                 </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E11D48" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#E11D48" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f23" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 10, fontWeight: 'bold'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 10, fontWeight: 'bold'}} />
                    <Tooltip 
                      contentStyle={{backgroundColor: '#121214', border: '1px solid #27272a', borderRadius: '12px'}}
                      itemStyle={{fontSize: '10px', fontWeight: '900', textTransform: 'uppercase'}}
                    />
                    <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                    <Area type="monotone" dataKey="expense" stroke="#E11D48" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>

           <div className="bg-[#121214] border border-zinc-800/60 rounded-[2.5rem] shadow-xl overflow-hidden">
              <div className="p-8 border-b border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-6">
                 <h3 className="text-lg font-black italic uppercase tracking-tighter text-white">Extrato Consolidado</h3>
                 <div className="flex bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-800">
                    <button 
                      onClick={() => setFilterType('ALL')}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'ALL' ? 'bg-[#E11D48] text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >Tudo</button>
                    <button 
                      onClick={() => setFilterType('INCOME')}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'INCOME' ? 'bg-emerald-500 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >Entradas</button>
                    <button 
                      onClick={() => setFilterType('EXPENSE')}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'EXPENSE' ? 'bg-[#E11D48] text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                    >Saídas</button>
                 </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="bg-zinc-950/40 text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em] border-b border-zinc-800/50">
                        <th className="px-8 py-5">Data / Identificador</th>
                        <th className="px-8 py-5">Categoria</th>
                        <th className="px-8 py-5">Método</th>
                        <th className="px-8 py-5 text-right">Valor Líquido</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-800/50">
                      {filteredTransactions.map(t => (
                        <tr key={t.id} className="hover:bg-zinc-800/20 transition-all group">
                          <td className="px-8 py-6">
                             <div className="flex flex-col">
                               <span className="text-sm font-black text-zinc-100 group-hover:text-white transition-colors">{t.description}</span>
                               <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter mt-1">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6">
                             <span className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-lg text-[9px] font-black text-zinc-500 uppercase">
                               {t.category}
                             </span>
                          </td>
                          <td className="px-8 py-6">
                             <div className="flex items-center gap-2 text-zinc-500">
                                {t.method === PaymentMethod.PIX && <Smartphone size={14}/>}
                                {t.method === PaymentMethod.DINHEIRO && <Wallet size={14}/>}
                                {t.method === PaymentMethod.CARTAO_CREDITO && <CreditCard size={14}/>}
                                <span className="text-[10px] font-bold uppercase">{t.method}</span>
                             </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <span className={`text-sm font-black italic ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-[#E11D48]'}`}>
                                {t.type === TransactionType.INCOME ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                             </span>
                          </td>
                        </tr>
                      ))}
                      {filteredTransactions.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-8 py-20 text-center">
                            <FileText className="mx-auto text-zinc-800 mb-4 opacity-20" size={48} />
                            <p className="text-zinc-600 font-black uppercase text-[10px] tracking-widest italic">Nenhum registro financeiro nesta visualização</p>
                          </td>
                        </tr>
                      )}
                   </tbody>
                </table>
              </div>
           </div>
        </div>

        <div className="space-y-8">
           <div className="bg-[#121214] border border-zinc-800/60 p-8 rounded-[2.5rem] shadow-xl">
              <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6 flex items-center gap-2 italic">
                <PieChartIcon size={18} className="text-[#E11D48]" /> Distribuição Mensal
              </h3>
              <div className="h-[250px] w-full flex items-center justify-center">
                 <div className="text-zinc-700 font-bold uppercase text-[9px] italic text-center">
                   Gráfico de categorias em processamento automático baseado nas transações cloud.
                 </div>
              </div>
           </div>

           <div className="bg-[#121214] border border-zinc-800/60 p-8 rounded-[2.5rem] shadow-xl">
              <h3 className="text-sm font-black uppercase tracking-widest text-white mb-6 italic">Relatório de Insumos</h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                    <div className="flex items-center gap-3">
                       <Package size={16} className="text-[#E11D48]" />
                       <span className="text-[10px] font-black text-white uppercase italic">Peças Compradas</span>
                    </div>
                    <span className="text-xs font-black text-zinc-400">R$ {transactions.filter(t => t.category === 'Peças').reduce((a,b)=>a+b.amount,0).toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                    <div className="flex items-center gap-3">
                       <Wallet size={16} className="text-emerald-500" />
                       <span className="text-[10px] font-black text-white uppercase italic">Mão de Obra</span>
                    </div>
                    <span className="text-xs font-black text-zinc-400">Consolidando...</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* MODAL LANÇAR DESPESA */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
           <div className="bg-[#0c0c0e] border border-zinc-800 w-full max-w-lg p-10 rounded-[3rem] shadow-2xl relative animate-in zoom-in duration-300">
              <button onClick={() => setShowExpenseModal(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"><X size={28} /></button>
              
              <div className="flex items-center gap-4 mb-10">
                <div className="w-14 h-14 bg-[#E11D48] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-900/20">
                  <ArrowDownCircle size={28} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Lançar Despesa</h2>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Controle de Saída de Caixa</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2 ml-1">Descrição do Pagamento</label>
                  <input 
                    type="text" 
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    placeholder="Ex: Aluguel do Galpão - Ref Jan/24"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-[#E11D48] outline-none font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2 ml-1">Categoria</label>
                    <select 
                      value={newExpense.category}
                      onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-[#E11D48] outline-none font-bold text-xs"
                    >
                      <option value="Aluguel">Aluguel</option>
                      <option value="Peças">Compra de Peças</option>
                      <option value="Energia/Água">Contas (Luz/Água)</option>
                      <option value="Salários">Folha de Pagamento</option>
                      <option value="Ferramentas">Equipamentos</option>
                      <option value="Marketing">Propaganda</option>
                      <option value="Outros">Diversos</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2 ml-1">Valor (R$)</label>
                    <input 
                      type="number" 
                      value={newExpense.amount}
                      onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                      placeholder="0,00"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-[#E11D48] outline-none font-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2 ml-1">Forma de Saída</label>
                    <select 
                      value={newExpense.method}
                      onChange={(e: any) => setNewExpense({...newExpense, method: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-[#E11D48] outline-none font-bold text-xs"
                    >
                      <option value={PaymentMethod.PIX}>PIX</option>
                      <option value={PaymentMethod.DINHEIRO}>DINHEIRO</option>
                      <option value={PaymentMethod.CARTAO_DEBITO}>DÉBITO</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-2 ml-1">Data Competência</label>
                    <input 
                      type="date" 
                      value={newExpense.date}
                      onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-[#E11D48] outline-none font-bold text-xs"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleAddExpense}
                  className="w-full bg-[#E11D48] py-6 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-red-900/30 active:scale-95 transition-all mt-4"
                >
                  Registrar Saída no Caixa
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Financial;
