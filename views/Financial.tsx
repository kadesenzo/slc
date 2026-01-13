
import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, ArrowUpCircle, ArrowDownCircle, TrendingUp, PieChart as PieChartIcon, 
  Plus, Calendar, Filter, Download, Search, X, Wallet, Smartphone, CreditCard, 
  Package, FileText, Trash2, Edit3
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { FinancialTransaction, TransactionType, PaymentMethod, UserSession } from '../types';

const Financial: React.FC<{ session?: UserSession; syncData?: (key: string, data: any) => Promise<void> }> = ({ session, syncData }) => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    description: '',
    category: 'Aluguel',
    amount: '',
    method: PaymentMethod.PIX,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (session) {
      setTransactions(JSON.parse(localStorage.getItem(`kaenpro_${session.username}_transactions`) || '[]'));
    }
  }, [session]);

  const handleSave = async () => {
    if (!form.description || !form.amount || !session || !syncData) return;

    let updated: FinancialTransaction[];
    
    if (editingId) {
      updated = transactions.map(t => t.id === editingId ? {
        ...t,
        description: form.description,
        category: form.category,
        amount: parseFloat(form.amount),
        method: form.method,
        date: new Date(form.date).toISOString()
      } : t);
    } else {
      const transaction: FinancialTransaction = {
        id: Math.random().toString(36).substr(2, 9),
        type: TransactionType.EXPENSE,
        category: form.category,
        amount: parseFloat(form.amount),
        method: form.method,
        description: form.description,
        date: new Date(form.date).toISOString()
      };
      updated = [...transactions, transaction];
    }

    setTransactions(updated);
    await syncData('transactions', updated);
    setShowExpenseModal(false);
    setEditingId(null);
    setForm({ description: '', category: 'Aluguel', amount: '', method: PaymentMethod.PIX, date: new Date().toISOString().split('T')[0] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Confirmar exclusão desta transação?")) return;
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    await syncData('transactions', updated);
  };

  const handleEdit = (t: FinancialTransaction) => {
    setEditingId(t.id);
    setForm({
      description: t.description,
      category: t.category,
      amount: t.amount.toString(),
      method: t.method,
      date: new Date(t.date).toISOString().split('T')[0]
    });
    setShowExpenseModal(true);
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
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || t.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  }).reverse();

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-24 h-full overflow-y-auto no-scrollbar scroll-smooth">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 md:px-0">
        <div>
          <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Fluxo de <span className="text-[#E11D48]">Caixa Cloud</span></h1>
          <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 mt-2">
            <TrendingUp size={12} className="text-[#E11D48]" /> Gestão Financeira Elite
          </p>
        </div>
        <button 
          onClick={() => setShowExpenseModal(true)}
          className="bg-zinc-800 text-white px-8 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-700 transition-all shadow-xl active:scale-95"
        >
          <Plus size={18} className="text-[#E11D48]" /> Registrar Movimentação
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 md:px-0">
        <div className="bg-[#121214] border border-zinc-800/60 p-8 rounded-[2.5rem] relative overflow-hidden border-l-4 border-l-emerald-500 shadow-xl">
           <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">Entradas</p>
           <p className="text-3xl font-black text-emerald-500 italic">R$ {totals.income.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-[#121214] border border-zinc-800/60 p-8 rounded-[2.5rem] relative overflow-hidden border-l-4 border-l-[#E11D48] shadow-xl">
           <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">Saídas</p>
           <p className="text-3xl font-black text-[#E11D48] italic">R$ {totals.expense.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-[#121214] border border-zinc-800/60 p-8 rounded-[2.5rem] relative overflow-hidden border-l-4 border-l-blue-500 shadow-xl">
           <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest mb-1">Saldo Líquido</p>
           <p className="text-3xl font-black text-white italic">R$ {totals.balance.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* Extrato com Botões de Ação */}
      <div className="bg-[#121214] border border-zinc-800/60 rounded-[2.5rem] shadow-xl overflow-hidden mx-4 md:mx-0">
        <div className="p-8 border-b border-zinc-800 bg-zinc-950/20 flex flex-col md:flex-row justify-between items-center gap-6">
           <h3 className="text-sm font-black italic uppercase tracking-widest text-white">Histórico de Transações</h3>
           <div className="relative w-full md:w-64">
             <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
             <input type="text" value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} placeholder="Pesquisar..." className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-[10px] font-bold outline-none focus:border-[#E11D48]"/>
           </div>
        </div>

        <div className="divide-y divide-zinc-800/50">
           {filteredTransactions.map(t => (
             <div key={t.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-zinc-800/20 transition-all group">
                <div className="flex gap-4 items-center">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${t.type === TransactionType.INCOME ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-[#E11D48]/10 border-[#E11D48]/20 text-[#E11D48]'}`}>
                      {t.type === TransactionType.INCOME ? <ArrowUpCircle size={22}/> : <ArrowDownCircle size={22}/>}
                   </div>
                   <div>
                      <p className="text-sm font-black text-white uppercase italic tracking-tight">{t.description}</p>
                      <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">{new Date(t.date).toLocaleDateString('pt-BR')} • {t.category}</p>
                   </div>
                </div>
                
                <div className="flex items-center justify-between sm:justify-end gap-10">
                   <div className="text-right">
                      <p className={`text-lg font-black italic ${t.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-[#E11D48]'}`}>
                        {t.type === TransactionType.INCOME ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR')}
                      </p>
                      <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">{t.method}</p>
                   </div>
                   <div className="flex gap-2">
                      <button onClick={()=>handleEdit(t)} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all"><Edit3 size={16}/></button>
                      <button onClick={()=>handleDelete(t.id)} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>

      {/* Modal Reutilizável para Edit/Add */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
           <div className="bg-[#0c0c0e] border border-zinc-800 w-full max-w-lg p-10 rounded-[3rem] shadow-2xl relative animate-in zoom-in">
              <button onClick={() => { setShowExpenseModal(false); setEditingId(null); }} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"><X size={28} /></button>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-10">{editingId ? 'Editar Registro' : 'Lançar Despesa'}</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-zinc-600 uppercase mb-2 block ml-1">Descrição</label>
                  <input type="text" value={form.description} onChange={(e)=>setForm({...form, description: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-bold outline-none focus:border-[#E11D48]"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                    <label className="text-[10px] font-black text-zinc-600 uppercase mb-2 block ml-1">Valor (R$)</label>
                    <input type="number" value={form.amount} onChange={(e)=>setForm({...form, amount: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-black"/>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-zinc-600 uppercase mb-2 block ml-1">Data</label>
                    <input type="date" value={form.date} onChange={(e)=>setForm({...form, date: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-bold text-xs"/>
                  </div>
                </div>
                <button onClick={handleSave} className="w-full bg-[#E11D48] py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl mt-4 active:scale-95 transition-all">
                  Confirmar e Sincronizar
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Financial;
