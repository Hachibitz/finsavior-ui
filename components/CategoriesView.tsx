import React, { useState } from 'react';
import { Category } from '../types';
import { getCategoryIcon, AVAILABLE_ICONS, AVAILABLE_COLORS } from '../constants';
import { Plus, Edit2, Trash2, X, Check, Search } from 'lucide-react';

interface CategoriesViewProps {
  categories: Category[];
  onAdd: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}

const CategoriesView: React.FC<CategoriesViewProps> = ({ categories, onAdd, onEdit, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [search, setSearch] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(AVAILABLE_ICONS[0]);
  const [color, setColor] = useState(AVAILABLE_COLORS[0]);

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setIcon(category.icon);
      setColor(category.color);
    } else {
      setEditingCategory(null);
      setName('');
      setIcon(AVAILABLE_ICONS[0]);
      setColor(AVAILABLE_COLORS[0]);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const newCategory: Category = {
      id: editingCategory ? editingCategory.id : Math.random().toString(36).substr(2, 9),
      name,
      icon,
      color
    };

    if (editingCategory) {
      onEdit(newCategory);
    } else {
      onAdd(newCategory);
    }
    setIsModalOpen(false);
  };

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Categorias</h1>
          <p className="text-slate-400 text-sm">Gerencie suas categorias personalizadas</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary/90 text-white p-3 rounded-full shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar categorias..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-surface border border-slate-700/50 text-slate-200 pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => (
          <div key={cat.id} className="glass-card p-4 rounded-2xl flex flex-col items-center text-center gap-3 relative group overflow-hidden">
            <div 
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg"
              style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
            >
              {getCategoryIcon(cat.icon, 24)}
            </div>
            
            <span className="font-semibold text-white text-sm">{cat.name}</span>
            
            {/* Action Overlay */}
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
              <button 
                onClick={() => handleOpenModal(cat)}
                className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-colors"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => onDelete(cat.id)}
                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
            
            {/* Color Indicator */}
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-surface w-full max-w-md rounded-3xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-700/50 flex justify-between items-center bg-white/5">
              <h3 className="text-xl font-bold text-white">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Nome</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Assinaturas"
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Ícone</label>
                <div className="grid grid-cols-6 gap-2">
                  {AVAILABLE_ICONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setIcon(iconName)}
                      className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                        icon === iconName 
                          ? 'bg-primary text-white shadow-lg shadow-primary/30 ring-2 ring-primary ring-offset-2 ring-offset-surface' 
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {getCategoryIcon(iconName, 18)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Cor</label>
                <div className="grid grid-cols-6 gap-3">
                  {AVAILABLE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-full aspect-square rounded-full transition-all ${
                         color === c 
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-surface scale-110' 
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-3.5 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
              >
                <Check size={20} />
                Salvar Categoria
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesView;