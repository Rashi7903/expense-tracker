import { Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  type: 'expense' | 'income';
  description: string;
  date: string;
  category?: {
    name: string;
    color: string;
  } | null;
}

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export default function TransactionList({
  transactions,
  onEdit,
  onDelete,
}: TransactionListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No transactions yet. Add your first one!</p>
      </div>
    );
  }

  const groupedTransactions = transactions.reduce((acc, transaction) => {
    const date = transaction.date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) =>
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-6">
      {sortedDates.map((date) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-slate-400 mb-3">
            {formatDate(date)}
          </h3>
          <div className="space-y-2">
            {groupedTransactions[date].map((transaction) => (
              <div
                key={transaction.id}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        transaction.type === 'income'
                          ? 'bg-emerald-600/20'
                          : 'bg-red-600/20'
                      }`}
                    >
                      {transaction.type === 'income' ? (
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {transaction.description}
                      </p>
                      {transaction.category && (
                        <span
                          className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: `${transaction.category.color}20`,
                            color: transaction.category.color,
                          }}
                        >
                          {transaction.category.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          transaction.type === 'income'
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}$
                        {formatAmount(transaction.amount)}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => onEdit(transaction)}
                        className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded-lg transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(transaction.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
