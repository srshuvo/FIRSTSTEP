import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppData, Product, Category } from '../types';

interface InventoryProps {
  data: AppData;
  onAdd: (p: Product) => void;
  onUpdate: (p: Product) => void;
  onDelete: (id: string) => void;
  onAddCategory: (c: Category) => void;
  onUpdateCategory: (c: Category) => void;
  onDeleteCategory: (id: string) => void;
  onBulkCategoryUpdate: (catId: string | undefined, productIds: string[]) => void;
  lang: 'bn' | 'en';
}

const Inventory: React.FC<InventoryProps> = ({ data, onAdd, onUpdate, onDelete, onAddCategory, onUpdateCategory, onDeleteCategory, onBulkCategoryUpdate, lang }) => {
  const [showModal, setShowModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string; type: 'product' | 'category' } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const [formData, setFormData] = useState({ 
    name: '', 
    categoryId: '',
    stock: 0, 
    unit: 'Pcs', 
    costPrice: 0, 
    salePrice: 0,
    lowStockThreshold: 10
  });

  const [catFormData, setCatFormData] = useState({ name: '' });

  const filteredProducts = useMemo(() => {
    return data.products
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCat = selectedCatId === 'all' ? true : (selectedCatId === 'none' ? !p.categoryId : p.categoryId === selectedCatId);
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.products, searchTerm, selectedCatId]);

  const currentStockStats = useMemo(() => {
    const totalVal = filteredProducts.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
    const totalStock = filteredProducts.reduce((sum, p) => sum + p.stock, 0);
    return { totalVal, totalStock };
  }, [filteredProducts]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT';
    const isSelect = target.tagName === 'SELECT';
    const isButton = target.tagName === 'BUTTON';

    const elements = Array.from(formRef.current?.elements || []).filter(el => {
      const tag = (el as HTMLElement).tagName;
      return (tag === 'INPUT' || tag === 'SELECT' || tag === 'BUTTON') && !(el as any).disabled;
    }) as HTMLElement[];
    const index = elements.indexOf(target);

    if (index === -1) return;

    if (e.key === 'Enter') {
      if (isButton && (target as HTMLButtonElement).type === 'submit') return;
      e.preventDefault();
      if (index < elements.length - 1) elements[index + 1].focus();
    } else if (e.key === 'ArrowDown') {
      if (isSelect) return;
      e.preventDefault();
      if (index < elements.length - 1) elements[index + 1].focus();
    } else if (e.key === 'ArrowUp') {
      if (isSelect) return;
      e.preventDefault();
      if (index > 0) elements[index - 1].focus();
    } else if (e.key === 'ArrowRight') {
      const isText = isInput && ['text', 'number', 'date'].includes((target as HTMLInputElement).type);
      if (isText) {
        const input = target as HTMLInputElement;
        if (input.selectionStart !== input.value.length) return;
      }
      if (index < elements.length - 1) {
        e.preventDefault();
        elements[index + 1].focus();
      }
    } else if (e.key === 'ArrowLeft') {
      const isText = isInput && ['text', 'number', 'date'].includes((target as HTMLInputElement).type);
      if (isText) {
        const input = target as HTMLInputElement;
        if (input.selectionStart !== 0) return;
      }
      if (index > 0) {
        e.preventDefault();
        elements[index - 1].focus();
      }
    }
  };

  const getCatSummary = (catId: string | 'all' | 'none') => {
    let prods = [];
    if (catId === 'all') prods = data.products;
    else if (catId === 'none') prods = data.products.filter(p => !p.categoryId);
    else prods = data.products.filter(p => p.categoryId === catId);
    const value = prods.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
    return { count: prods.length, totalStock: prods.reduce((sum, p) => sum + p.stock, 0), value };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) onUpdate({ ...editing, ...formData });
    else onAdd({ id: Math.random().toString(36).substr(2, 9), ...formData });
    setShowModal(false);
    setEditing(null);
  };

  const handleCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCat) onUpdateCategory({ ...editingCat, ...catFormData });
    else onAddCategory({ id: Math.random().toString(36).substr(2, 9), ...catFormData });
    setShowCatModal(false);
    setEditingCat(null);
    setCatFormData({ name: '' });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-80 space-y-4 no-print">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-fit sticky top-4 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-emerald-900 uppercase text-[10px] tracking-widest">{lang === 'bn' ? 'ক্যাটাগরি' : 'Categories'}</h3>
            <button onClick={() => setShowCatModal(true)} className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 border border-emerald-100"><i className="fas fa-folder-tree"></i></button>
          </div>
          <div className="space-y-1 max-h-[70vh] overflow-y-auto custom-scrollbar pr-1">
            {['all', 'none', ...data.categories.map(c => c.id)].map(id => {
              const summary = getCatSummary(id);
              const label = id === 'all' ? (lang === 'bn' ? 'সব ক্যাটাগরি' : 'All') : id === 'none' ? (lang === 'bn' ? 'ক্যাটাগরি ছাড়া' : 'Uncategorized') : data.categories.find(c => c.id === id)?.name;
              const isActive = selectedCatId === id;
              return (
                <button key={id} onClick={() => setSelectedCatId(id)} className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-black uppercase transition flex justify-between items-center ${isActive ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:bg-emerald-50'}`}>
                  <div className="flex flex-col min-w-0 pr-2">
                    <span className="truncate">{label}</span>
                    <span className={`text-[8px] font-bold ${isActive ? 'text-emerald-200' : 'text-emerald-600'}`}>৳{summary.value.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className={`text-[9px] opacity-70`}>{summary.count} {lang === 'bn' ? 'আইটেম' : 'Items'}</span>
                    <span className={`text-[8px] font-bold opacity-80`}>{summary.totalStock} {lang === 'bn' ? 'ইউনিট' : 'Units'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
          <div className="relative w-full md:w-80">
            <i className="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder={lang === 'bn' ? 'খুঁজুন... (Alt+S)' : 'Search... (Alt+S)'} 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold" 
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={handlePrint} className="flex-1 bg-gray-50 text-gray-600 px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest border border-gray-100 hover:bg-gray-100 transition flex items-center justify-center gap-2"><i className="fas fa-print"></i> {lang === 'bn' ? 'প্রিন্ট রিপোর্ট' : 'Print'}</button>
            <button onClick={() => { setEditing(null); setFormData({ name: '', categoryId: '', stock: 0, unit: 'Pcs', costPrice: 0, salePrice: 0, lowStockThreshold: 10 }); setShowModal(true); }} className="flex-1 bg-emerald-600 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-emerald-700 transition">{lang === 'bn' ? 'নতুন পণ্য' : 'Add Product'}</button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 no-print">
            <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-[2rem] flex flex-col">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">{lang === 'bn' ? 'মোট স্টক মূল্য' : 'Stock Value'}</span>
                <span className="text-xl font-black text-emerald-700">৳{currentStockStats.totalVal.toLocaleString()}</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-[2rem] flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'bn' ? 'মোট মাল (স্টক)' : 'Total Stock Qty'}</span>
                <span className="text-xl font-black text-slate-700">{currentStockStats.totalStock} <span className="text-xs">{lang === 'bn' ? 'ইউনিট' : 'Units'}</span></span>
            </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print-area">
          <div className="hidden print:block p-8 text-center border-b-2 border-emerald-500 bg-emerald-50/20">
             <h2 className="text-3xl font-black text-emerald-900">FIRST STEP - STOCK REPORT</h2>
             <p className="text-xs font-bold text-emerald-600 mt-1 uppercase tracking-[0.2em]">
                {selectedCatId === 'all' ? (lang === 'bn' ? 'সকল পণ্যের খতিয়ান' : 'Full Stock Inventory') : (lang === 'bn' ? `ক্যাটাগরি: ${getCatSummary(selectedCatId).count} পণ্য` : `Category View`)}
             </p>
             <div className="flex justify-center gap-6 mt-4 text-xs font-black">
                <span className="bg-white px-4 py-1 rounded-full border">Total Stock: {currentStockStats.totalStock}</span>
                <span className="bg-white px-4 py-1 rounded-full border text-emerald-700">Value: ৳{currentStockStats.totalVal.toLocaleString()}</span>
             </div>
          </div>

          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">{lang === 'bn' ? 'পণ্যের নাম' : 'Name'}</th>
                <th className="px-6 py-4">{lang === 'bn' ? 'স্টক' : 'Stock'}</th>
                <th className="px-6 py-4">{lang === 'bn' ? 'কেনা দাম' : 'Cost'}</th>
                <th className="px-6 py-4">{lang === 'bn' ? 'স্টক ভ্যালু' : 'Stock Val'}</th>
                <th className="px-6 py-4">{lang === 'bn' ? 'বিক্রি দাম' : 'Sale Price'}</th>
                <th className="px-6 py-4 text-center no-print">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-emerald-50/20 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-black text-gray-800 leading-tight">{p.name}</p>
                    <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-tighter">
                      <i className="fas fa-hashtag mr-1 opacity-50"></i>
                      {p.categoryId ? data.categories.find(c => c.id === p.categoryId)?.name : (lang === 'bn' ? 'ক্যাটাগরি ছাড়া' : 'Uncategorized')}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full font-black text-xs border ${p.stock <= (p.lowStockThreshold || 10) ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                      {p.stock} {p.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 font-bold">৳{p.costPrice.toLocaleString()}</td>
                  <td className="px-6 py-4 font-black text-slate-700">৳{(p.stock * p.costPrice).toLocaleString()}</td>
                  <td className="px-6 py-4 font-black text-emerald-600">৳{p.salePrice.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center no-print">
                    <button onClick={() => { setEditing(p); setFormData({ ...p, categoryId: p.categoryId || '', lowStockThreshold: p.lowStockThreshold || 10 }); setShowModal(true); }} className="text-blue-500 p-2"><i className="fas fa-edit"></i></button>
                    <button onClick={() => setConfirmDelete({ id: p.id, name: p.name, type: 'product' })} className="text-red-500 p-2"><i className="fas fa-trash-can"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-100 font-black">
                <tr>
                    <td colSpan={3} className="px-6 py-4 text-[10px] uppercase text-gray-400">{lang === 'bn' ? 'মোট ভ্যালু:' : 'Grand Total:'}</td>
                    <td className="px-6 py-4 text-lg text-emerald-700">৳{currentStockStats.totalVal.toLocaleString()}</td>
                    <td colSpan={2} className="no-print"></td>
                </tr>
            </tfoot>
          </table>
          {filteredProducts.length === 0 && <div className="p-10 text-center text-gray-400 italic font-bold">{lang === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}</div>}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form ref={formRef} onKeyDown={handleKeyDown} onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-md space-y-5 animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-2xl font-black text-emerald-900">{editing ? (lang === 'bn' ? 'এডিট পণ্য' : 'Edit Product') : (lang === 'bn' ? 'নতুন পণ্য' : 'New Product')}</h3>
            <div className="space-y-4">
              <input required placeholder={lang === 'bn' ? 'পণ্যের নাম' : 'Product Name'} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border p-3.5 rounded-2xl font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500" />
              <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full border p-3.5 rounded-2xl font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500">
                 <option value="">{lang === 'bn' ? '-- ক্যাটাগরি ছাড়া --' : '-- Uncategorized --'}</option>
                 {data.categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder={lang === 'bn' ? 'স্টক পরিমাণ' : 'Stock'} value={formData.stock || ''} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="w-full border p-3.5 rounded-2xl font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500" />
                <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full border p-3.5 rounded-2xl font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="Pcs">Pcs</option><option value="Box">Box</option><option value="Kg">Kg</option><option value="Ltr">Ltr</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder={lang === 'bn' ? 'কেনা দাম' : 'Cost'} value={formData.costPrice || ''} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} className="w-full border p-3.5 rounded-2xl font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500" />
                <input type="number" placeholder={lang === 'bn' ? 'বিক্রি দাম' : 'Price'} value={formData.salePrice || ''} onChange={e => setFormData({...formData, salePrice: Number(e.target.value)})} className="w-full border p-3.5 rounded-2xl font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{lang === 'bn' ? 'স্টক এলার্ট লিমিট (Stock Alert)' : 'Stock Alert Threshold'}</label>
                <input type="number" placeholder={lang === 'bn' ? 'স্টক এলার্ট লিমিট' : 'Alert at stock level...'} value={formData.lowStockThreshold || ''} onChange={e => setFormData({...formData, lowStockThreshold: Number(e.target.value)})} className="w-full border p-3.5 rounded-2xl font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-xs tracking-widest">{lang === 'bn' ? 'বাতিল' : 'Cancel'}</button>
              <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">{lang === 'bn' ? 'সেভ' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}

      {showCatModal && (
        <div className="fixed inset-0 bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-lg space-y-6">
             <h3 className="font-black text-2xl text-emerald-900">{lang === 'bn' ? 'ক্যাটাগরি ম্যানেজ' : 'Manage Categories'}</h3>
             <form onSubmit={handleCatSubmit} className="flex gap-3">
                <input required placeholder={lang === 'bn' ? 'ক্যাটাগরি নাম' : 'Category Name'} value={catFormData.name} onChange={e => setCatFormData({ name: e.target.value })} className="flex-1 border p-3.5 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-2xl font-black shadow-lg"><i className="fas fa-plus"></i></button>
             </form>
             <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {data.categories.map(cat => (
                  <div key={cat.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 group hover:border-emerald-200 transition-colors">
                    <span className="font-black text-gray-700">{cat.name}</span>
                    <button onClick={() => setConfirmDelete({ id: cat.id, name: cat.name, type: 'category' })} className="text-red-500 p-1 hover:text-red-700 transition"><i className="fas fa-trash-can"></i></button>
                  </div>
                ))}
             </div>
             <button onClick={() => setShowCatModal(false)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest">{lang === 'bn' ? 'বন্ধ করুন' : 'Close'}</button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-sm text-center space-y-5 animate-scale-in">
            <h3 className="text-2xl font-black text-gray-900">{lang === 'bn' ? 'মুছে ফেলতে চান?' : 'Delete?'}</h3>
            <p className="text-gray-500 font-bold italic">"{confirmDelete.name}"</p>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
              <button onClick={() => { if (confirmDelete.type === 'product') onDelete(confirmDelete.id); else onDeleteCategory(confirmDelete.id); setConfirmDelete(null); }} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;