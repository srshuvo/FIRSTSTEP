
import React, { useState, useMemo } from 'react';
import { AppData, Product } from '../types';

interface InventoryProps {
  data: AppData;
  onAdd: (p: Product) => void;
  onUpdate: (p: Product) => void;
  onDelete: (id: string) => void;
  lang: 'bn' | 'en';
}

const Inventory: React.FC<InventoryProps> = ({ data, onAdd, onUpdate, onDelete, lang }) => {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    stock: 0, 
    unit: 'Pcs', 
    costPrice: 0, 
    salePrice: 0,
    lowStockThreshold: 10
  });

  const filteredProducts = useMemo(() => {
    return data.products
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.products, searchTerm]);

  const t = {
    title: lang === 'bn' ? 'পণ্যের তালিকা (Stock)' : 'Inventory List',
    new: lang === 'bn' ? 'নতুন পণ্য' : 'New Product',
    name: lang === 'bn' ? 'পণ্যের নাম' : 'Product Name',
    stock: lang === 'bn' ? 'বর্তমান স্টক' : 'Current Stock',
    buy: lang === 'bn' ? 'কেনা দাম' : 'Cost Price',
    sell: lang === 'bn' ? 'বিক্রয় মূল্য' : 'Sale Price',
    action: lang === 'bn' ? 'অ্যাকশন' : 'Action',
    unit: lang === 'bn' ? 'একক (Unit)' : 'Unit',
    save: lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes',
    cancel: lang === 'bn' ? 'বাতিল' : 'Cancel',
    search: lang === 'bn' ? 'নাম দিয়ে খুঁজুন...' : 'Search by name...',
    deleteConfirm: lang === 'bn' ? 'আপনি কি নিশ্চিত?' : 'Are you sure?',
    deleteBody: lang === 'bn' ? 'আপনি এই পণ্যটি মুছে ফেলতে চাইছেন:' : 'You are about to delete this product:',
    deleteWarning: lang === 'bn' ? 'এই কাজটি পরে আর ফেরানো যাবে না।' : 'This action cannot be easily undone.',
    confirmDeleteBtn: lang === 'bn' ? 'হ্যাঁ, ডিলিট করুন' : 'Yes, Delete It',
    alertLimit: lang === 'bn' ? 'অ্যালার্ট সীমা (Low Stock)' : 'Low Stock Alert',
    print: lang === 'bn' ? 'প্রিন্ট / PDF' : 'Print / PDF'
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) onUpdate({ ...editing, ...formData });
    else onAdd({ id: Math.random().toString(36).substr(2, 9), ...formData });
    setShowModal(false);
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <div className="relative w-full md:w-96">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            placeholder={t.search} 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => window.print()} className="flex-1 md:flex-none bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 border border-emerald-100 hover:bg-emerald-100 transition">
            <i className="fas fa-print"></i> {t.print}
          </button>
          <button onClick={() => { 
            setEditing(null); 
            setFormData({ name: '', stock: 0, unit: 'Pcs', costPrice: 0, salePrice: 0, lowStockThreshold: 10 }); 
            setShowModal(true); 
          }} className="flex-1 md:flex-none bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg hover:bg-emerald-700 transition">
            <i className="fas fa-plus"></i> {t.new}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print-area">
        <div className="hidden print:block p-6 text-center border-b-2 border-emerald-100">
           <h1 className="text-3xl font-black text-emerald-800">FIRST STEP</h1>
           <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{t.title}</p>
           <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleString()}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase">
              <tr>
                <th className="px-6 py-4">{t.name}</th>
                <th className="px-6 py-4">{lang === 'bn' ? 'স্টক' : 'Stock'}</th>
                <th className="px-6 py-4">{lang === 'bn' ? 'কেনা' : 'Buy'}</th>
                <th className="px-6 py-4">{lang === 'bn' ? 'বিক্রি' : 'Sell'}</th>
                <th className="px-6 py-4 text-center no-print">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-900">{p.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full font-black text-xs border ${p.stock <= (p.lowStockThreshold || 10) ? 'bg-red-600 text-white md:animate-pulse print:text-red-600 print:bg-transparent' : 'bg-gray-100 text-gray-700 print:bg-transparent'}`}>
                      {p.stock} {p.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 font-medium">৳{p.costPrice}</td>
                  <td className="px-6 py-4 font-black text-emerald-600">৳{p.salePrice}</td>
                  <td className="px-6 py-4 text-center no-print">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => { setEditing(p); setFormData({ ...p }); setShowModal(true); }} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition"><i className="fas fa-edit"></i></button>
                      <button onClick={() => setConfirmDelete({ id: p.id, name: p.name })} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"><i className="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProducts.length === 0 && <div className="p-10 text-center text-gray-400 font-bold italic">{lang === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found'}</div>}
        </div>
      </div>

      {/* Product Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md space-y-4 transform transition-all animate-scale-in">
            <h3 className="text-xl font-black text-emerald-900 flex items-center gap-2">
              <i className={editing ? 'fas fa-edit' : 'fas fa-plus-circle'}></i>
              {editing ? t.save : t.new}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-emerald-600 uppercase mb-1 ml-1">{t.name}</label>
                <input required placeholder={t.name} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-2 border-gray-100 p-3 rounded-xl font-bold outline-none focus:border-emerald-500 bg-gray-50" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-emerald-600 uppercase mb-1 ml-1">{t.stock}</label>
                  <input type="number" placeholder={t.stock} value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="w-full border-2 border-gray-100 p-3 rounded-xl font-bold outline-none focus:border-emerald-500 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-black text-emerald-600 uppercase mb-1 ml-1">{t.unit}</label>
                  <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full border-2 border-gray-100 p-3 rounded-xl font-bold outline-none focus:border-emerald-500 bg-gray-50">
                    <option value="Pcs">Pcs</option>
                    <option value="Box">Box</option>
                    <option value="Kg">Kg</option>
                    <option value="Ltr">Ltr</option>
                    <option value="Gm">Gm</option>
                    <option value="Doz">Doz</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-emerald-600 uppercase mb-1 ml-1">{t.buy}</label>
                  <input type="number" placeholder={t.buy} value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} className="w-full border-2 border-gray-100 p-3 rounded-xl font-bold outline-none focus:border-emerald-500 bg-gray-50" />
                </div>
                <div>
                  <label className="block text-xs font-black text-emerald-600 uppercase mb-1 ml-1">{t.sell}</label>
                  <input type="number" placeholder={t.sell} value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: Number(e.target.value)})} className="w-full border-2 border-gray-100 p-3 rounded-xl font-bold outline-none focus:border-emerald-500 bg-gray-50" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-red-600 uppercase mb-1 ml-1">{t.alertLimit}</label>
                <input type="number" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: Number(e.target.value)})} className="w-full border-2 border-gray-100 p-3 rounded-xl font-bold outline-none focus:border-red-500 bg-gray-50" />
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-black hover:bg-gray-200 transition">{t.cancel}</button>
              <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black shadow-lg hover:bg-emerald-700 transition">{t.save}</button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] no-print">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center space-y-4 transform transition-all animate-scale-in">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-2">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3 className="text-xl font-black text-gray-900">{t.deleteConfirm}</h3>
            <p className="text-gray-500 font-medium">
              {t.deleteBody} <br/>
              <span className="font-black text-gray-800 text-lg">"{confirmDelete.name}"</span>
            </p>
            <p className="text-xs text-red-500 font-bold uppercase tracking-tight">{t.deleteWarning}</p>
            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-black hover:bg-gray-200 transition"
              >
                {t.cancel}
              </button>
              <button 
                onClick={() => { onDelete(confirmDelete.id); setConfirmDelete(null); }}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black shadow-lg hover:bg-red-700 transition"
              >
                {t.confirmDeleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;