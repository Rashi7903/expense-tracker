import { useState, useEffect } from 'react';
import { X, Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  color: string;
  icon: string;
}

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
];

export default function CategoryManager({ isOpen, onClose }: CategoryManagerProps) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'expense' | 'income',
    color: PRESET_COLORS[0],
  });

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('type')
      .order('name');

    if (data) {
      setCategories(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingId) {
        await supabase
          .from('categories')
          .update({
            name: formData.name,
            type: formData.type,
            color: formData.color,
          })
          .eq('id', editingId);
      } else {
        await supabase.from('categories').insert({
          user_id: user.id,
          name: formData.name,
          type: formData.type,
          color: formData.color,
          icon: 'circle',
        });
      }

      setFormData({ name: '', type: 'expense', color: PRESET_COLORS[0] });
      setIsAdding(false);
      setEditingId(null);
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleEdit = (category: Category) => {
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color,
    });
    setEditingId(category.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure? Transactions with this category will be updated.')) {
      await supabase.from('categories').delete().eq('id', id);
      loadCategories();
    }
  };

  const cancelForm = () => {
    setFormData({ name: '', type: 'expense', color: PRESET_COLORS[0] });
    setIsAdding(false);
    setEditingId(null);
  };

  if (!isOpen) return null;

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-700 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Manage Categories</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isAdding ? (
            <form onSubmit={handleSubmit} className="bg-slate-700 rounded-xl p-4 mb-6">
              <h3 className="text-white font-medium mb-4">
                {editingId ? 'Edit Category' : 'Add New Category'}
              </h3>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense' })}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                      formData.type === 'expense'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-600 text-slate-300'
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income' })}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                      formData.type === 'income'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-600 text-slate-300'
                    }`}
                  >
                    Income
                  </button>
                </div>

                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Category name"
                  required
                  className="w-full px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Color
                  </label>
                  <div className="grid grid-cols-8 gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-lg transition-all ${
                          formData.color === color
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-700 scale-110'
                            : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="flex-1 py-2 bg-slate-600 text-white font-medium rounded-lg hover:bg-slate-500 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all"
                  >
                    {editingId ? 'Update' : 'Add'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-3 mb-6 bg-slate-700 text-white font-medium rounded-xl hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Category
            </button>
          )}

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                Expense Categories ({expenseCategories.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {expenseCategories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-slate-700 rounded-lg p-3 flex items-center justify-between gap-3 group hover:bg-slate-600 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-8 h-8 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-white font-medium truncate">
                        {category.name}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 rounded transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                Income Categories ({incomeCategories.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {incomeCategories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-slate-700 rounded-lg p-3 flex items-center justify-between gap-3 group hover:bg-slate-600 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-8 h-8 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-white font-medium truncate">
                        {category.name}
                      </span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-1.5 text-slate-400 hover:text-emerald-400 rounded transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
