import { useState, useEffect } from 'react';
import {
  Plus,
  LogOut,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AddTransactionModal from './AddTransactionModal';
import TransactionList from './TransactionList';
import CategoryManager from './CategoryManager';

const API_URL = import.meta.env.VITE_API_BASE_URL; // ✅ Your backend URL

interface Transaction {
  id: string;
  amount: number;
  type: 'expense' | 'income';
  description: string;
  date: string;
  category_id: string | null;
  category?: {
    name: string;
    color: string;
  } | null;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filterType, selectedMonth]);

  // ✅ Fetch from backend instead of Supabase
  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/transactions`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...transactions];
    if (filterType !== 'all') filtered = filtered.filter((t) => t.type === filterType);
    if (selectedMonth) filtered = filtered.filter((t) => t.date.startsWith(selectedMonth));
    setFilteredTransactions(filtered);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await fetch(`${API_URL}/api/transactions/${id}`, { method: 'DELETE' });
      loadTransactions();
    }
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditTransaction(transaction);
    setIsModalOpen(true);
  };

  const calculateTotals = () => {
    const income = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  };

  const { income, expenses, balance } = calculateTotals();

  const formatAmount = (amount: number) =>
    amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Wallet className="w-6 h-6 text-emerald-400" />
            <h1 className="text-xl font-bold text-white">Expense Tracker</h1>
          </div>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg"
          >
            <LogOut className="w-4 h-4 inline mr-2" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SummaryCard title="Income" icon={TrendingUp} value={income} color="emerald" />
          <SummaryCard title="Expenses" icon={TrendingDown} value={expenses} color="red" />
          <SummaryCard title="Balance" icon={Wallet} value={balance} color="slate" />
        </div>

        <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Transactions</h2>
            <button
              onClick={() => {
                setEditTransaction(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
            >
              <Plus className="w-4 h-4 inline mr-2" /> Add
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <p className="text-slate-400 text-center">Loading transactions...</p>
            ) : (
              <TransactionList
                transactions={filteredTransactions}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// Small summary card component
function SummaryCard({
  title,
  icon: Icon,
  value,
  color,
}: {
  title: string;
  icon: any;
  value: number;
  color: string;
}) {
  const colorClass =
    color === 'emerald'
      ? 'from-emerald-600 to-emerald-700'
      : color === 'red'
      ? 'from-red-600 to-red-700'
      : 'from-slate-700 to-slate-800';
  return (
    <div
      className={`bg-gradient-to-br ${colorClass} rounded-2xl p-6 shadow-xl border border-${color}-500/20`}
    >
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5 text-white" />
        <h3 className="text-white font-medium">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-white">
        ${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}
