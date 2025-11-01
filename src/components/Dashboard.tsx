import { useState, useEffect } from 'react';
import {
  Plus,
  LogOut,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Tag,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AddTransactionModal from './AddTransactionModal';
import TransactionList from './TransactionList';
import CategoryManager from './CategoryManager';

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
    initializeDefaultCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filterType, selectedMonth]);

  const initializeDefaultCategories = async () => {
    if (!user) return;

    const { data: existingCategories } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (!existingCategories || existingCategories.length === 0) {
      const defaultCategories = [
        { name: 'Food & Dining', type: 'expense', color: '#ef4444', icon: 'utensils' },
        { name: 'Transportation', type: 'expense', color: '#f97316', icon: 'car' },
        { name: 'Shopping', type: 'expense', color: '#ec4899', icon: 'shopping-bag' },
        { name: 'Entertainment', type: 'expense', color: '#8b5cf6', icon: 'film' },
        { name: 'Bills & Utilities', type: 'expense', color: '#06b6d4', icon: 'receipt' },
        { name: 'Healthcare', type: 'expense', color: '#10b981', icon: 'heart' },
        { name: 'Salary', type: 'income', color: '#22c55e', icon: 'banknote' },
        { name: 'Freelance', type: 'income', color: '#3b82f6', icon: 'briefcase' },
        { name: 'Investments', type: 'income', color: '#14b8a6', icon: 'trending-up' },
        { name: 'Other Income', type: 'income', color: '#84cc16', icon: 'plus' },
      ];

      await supabase.from('categories').insert(
        defaultCategories.map((cat) => ({
          ...cat,
          user_id: user.id,
        }))
      );
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories(name, color)
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (data) {
      setTransactions(data);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (filterType !== 'all') {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    if (selectedMonth) {
      filtered = filtered.filter((t) => t.date.startsWith(selectedMonth));
    }

    setFilteredTransactions(filtered);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await supabase.from('transactions').delete().eq('id', id);
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

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Expense Tracker</h1>
                <p className="text-sm text-slate-400">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 shadow-xl border border-emerald-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-emerald-100 font-medium">Income</h3>
            </div>
            <p className="text-3xl font-bold text-white">${formatAmount(income)}</p>
          </div>

          <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 shadow-xl border border-red-500/20">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-red-100 font-medium">Expenses</h3>
            </div>
            <p className="text-3xl font-bold text-white">${formatAmount(expenses)}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl p-6 shadow-xl border border-slate-600">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-slate-300 font-medium">Balance</h3>
            </div>
            <p
              className={`text-3xl font-bold ${
                balance >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              ${formatAmount(Math.abs(balance))}
            </p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-white">Transactions</h2>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 bg-slate-700 rounded-lg p-1">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      filterType === 'all'
                        ? 'bg-slate-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterType('income')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      filterType === 'income'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Income
                  </button>
                  <button
                    onClick={() => setFilterType('expense')}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      filterType === 'expense'
                        ? 'bg-red-600 text-white'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Expenses
                  </button>
                </div>

                <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-transparent text-white text-sm focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => setIsCategoryManagerOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white font-medium rounded-lg hover:bg-slate-600 transition-all"
                >
                  <Tag className="w-4 h-4" />
                  <span className="hidden sm:inline">Categories</span>
                </button>

                <button
                  onClick={() => {
                    setEditTransaction(null);
                    setIsModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-slate-400">Loading transactions...</p>
              </div>
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

      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditTransaction(null);
        }}
        onSuccess={loadTransactions}
        editTransaction={editTransaction}
      />

      <CategoryManager
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
      />
    </div>
  );
}
