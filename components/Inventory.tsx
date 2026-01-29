
import React, { useState, useMemo } from 'react';
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
  const [showProductManagerForCat, setShowProductManagerForCat] = useState<string | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string; type: 'product' | 'category' } | null>(null);
  
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
        const matchesCat = selectedCatId === 'all' 
          ? true 
          : (selectedCatId === 'none' ? !p.categoryId : p.categoryId === selectedCatId);
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.products, searchTerm, selectedCatId]);

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
    deleteBody: lang === 'bn' ? 'আপনি এটি মুছে ফেলতে চাইছেন:' : 'You are about to delete:',
    deleteWarning: lang === 'bn' ? 'এই কাজটি পরে আর ফেরানো যাবে না।' : 'This action cannot be easily undone.',
    confirmDeleteBtn: lang === 'bn' ? 'হ্যাঁ, ডিলিট করুন' : 'Yes, Delete It',
    alertLimit: lang === 'bn' ? 'অ্যালার্ট সীমা (Low Stock)' : 'Low Stock Alert',
    print: lang === 'bn' ? 'প্রিন্ট / PDF' : 'Print / PDF',
    categories: lang === 'bn' ? 'ক্যাটাগরি' : 'Categories',
    allCats: lang === 'bn' ? 'সব ক্যাটাগরি' : 'All Categories',
    uncategorized: lang === 'bn' ? 'ক্যাটাগরি ছাড়া' : 'Uncategorized',
    manageCats: lang === 'bn' ? 'ক্যাটাগরি ম্যানেজ' : 'Manage Categories',
    selectCat: lang === 'bn' ? 'ক্যাটাগরি নির্বাচন' : 'Select Category',
    newCat: lang === 'bn' ? 'নতুন ক্যাটাগরি' : 'New Category',
    editTitle: lang === 'bn' ? 'ক্যাটাগরি এডিট' : 'Edit Category',
    catName: lang === 'bn' ? 'ক্যাটাগরি নাম' : 'Category Name',
    manageProducts: lang === 'bn' ? 'মাল যোগ/বিয়োগ' : 'Manage Products',
    noCategory: lang === 'bn' ? 'ক্যাটাগরি নেই' : 'No Category',
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

  const toggleProductInCategory = (pId: string, currentCatId: string | undefined, targetCatId: string) => {
    const isCurrentlyIn = currentCatId === targetCatId;
    onBulkCategoryUpdate(isCurrentlyIn ? undefined : targetCatId, [pId]);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Categories Sidebar */}
      <div className="lg:w-64 space-y-4 no-print">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-fit sticky top-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-emerald-900 uppercase text-[10px] tracking-widest">{t.categories}</h3>
            <button onClick={() => setShowCatModal(true)} className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition shadow-sm border border-emerald-100">
              <i className="fas fa-folder-tree"></i>
            </button>
          </div>
          <div className="space-y-1">
            <button 
              onClick={() => setSelectedCatId('all')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight transition flex justify-between items-center ${selectedCatId === 'all' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/10' : 'text-gray-500 hover:bg-emerald-50'}`}
            >
              <span><i className="fas fa-layer-group mr-2 opacity-70"></i> {t.allCats}</span>
              <span className={`text-[10px] ${selectedCatId === 'all' ? 'text-emerald-100' : 'text-gray-400'}`}>{data.products.length}</span>
            </button>
            <button 
              onClick={() => setSelectedCatId('none')}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight transition flex justify-between items-center ${selectedCatId === 'none' ? 'bg-orange-500 text-white shadow-lg shadow-orange-900/10' : 'text-gray-500 hover:bg-orange-50'}`}
            >
              <span><i className="fas fa-circle-nodes mr-2 opacity-70"></i> {t.uncategorized}</span>
              <span className={`text-[10px] ${selectedCatId === 'none' ? 'text-orange-100' : 'text-gray-400'}`}>{data.products.filter(p => !p.categoryId).length}</span>
            </button>
            <div className="pt-2 border-t mt-2">
              {data.categories?.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-tight transition flex justify-between items-center ${selectedCatId === cat.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/10' : 'text-gray-500 hover:bg-emerald-50'}`}
                >
                  <span className="truncate"><i className="fas fa-hashtag mr-2 opacity-70"></i> {cat.name}</span>
                  <span className={`text-[10px] ${selectedCatId === cat.id ? 'text-emerald-100' : 'text-gray-400'}`}>{data.products.filter(p => p.categoryId === cat.id).length}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
          <div className="relative w-full md:w-96">
            <i className="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input 
              type="text" 
              placeholder={t.search} 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => window.print()} className="flex-1 md:flex-none bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 border border-emerald-100 hover:bg-emerald-100 transition">
              <i className="fas fa-file-pdf"></i> {t.print}
            </button>
            <button onClick={() => { 
              setEditing(null); 
              setFormData({ name: '', categoryId: selectedCatId === 'all' || selectedCatId === 'none' ? '' : selectedCatId, stock: 0, unit: 'Pcs', costPrice: 0, salePrice: 0, lowStockThreshold: 10 }); 
              setShowModal(true); 
            }} className="flex-1 md:flex-none bg-emerald-600 text-white px-6 py-2 rounded-xl font-black flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/10 hover:bg-emerald-700 transition transform active:scale-95 uppercase text-xs tracking-widest">
              <i className="fas fa-square-plus"></i> {t.new}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print-area">
          <div className="hidden print:block p-8 text-center border-b-2 border-emerald-600 bg-emerald-50/20">
             <h1 className="text-4xl font-black text-emerald-900">FIRST STEP</h1>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em] mt-2">Inventory Ledger Report</p>
             <p className="text-xs text-emerald-600 font-bold mt-4">{new Date().toLocaleString()}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
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
                  <tr key={p.id} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-black text-gray-800 text-base">{p.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${p.categoryId ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                           <i className={`fas ${p.categoryId ? 'fa-hashtag' : 'fa-circle-question'} mr-1 opacity-60`}></i>
                           {p.categoryId ? data.categories?.find(c => c.id === p.categoryId)?.name : t.noCategory}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`px-3 py-1 rounded-full font-black text-xs border inline-block w-fit ${p.stock <= (p.lowStockThreshold || 10) ? 'bg-rose-600 text-white md:animate-pulse print:text-rose-600 print:bg-transparent' : 'bg-gray-100 text-gray-700 print:bg-transparent'}`}>
                          {p.stock} {p.unit}
                        </span>
                        {p.stock <= (p.lowStockThreshold || 10) && <span className="text-[9px] font-black text-rose-400 uppercase mt-1">Critical Stock!</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-bold">৳{p.costPrice}</td>
                    <td className="px-6 py-4 font-black text-emerald-600 text-lg">৳{p.salePrice}</td>
                    <td className="px-6 py-4 text-center no-print">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => { setEditing(p); setFormData({ ...p, categoryId: p.categoryId || '' }); setShowModal(true); }} className="w-9 h-9 flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded-xl transition" title="Edit"><i className="fas fa-pen-to-square"></i></button>
                        <button onClick={() => setConfirmDelete({ id: p.id, name: p.name, type: 'product' })} className="w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition" title="Delete"><i className="fas fa-trash-can"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="p-20 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-full flex items-center justify-center text-3xl mb-4">
                  <i className="fas fa-box-open"></i>
                </div>
                <p className="text-gray-400 font-black italic">{lang === 'bn' ? 'কোনো পণ্য পাওয়া যায়নি' : 'No products found matching your search'}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-md space-y-5 transform transition-all animate-scale-in">
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
               <div>
                  <h3 className="text-2xl font-black text-emerald-900 flex items-center gap-3">
                    <i className={editing ? 'fas fa-pen-to-square text-emerald-600' : 'fas fa-square-plus text-emerald-600'}></i>
                    {editing ? t.save : t.new}
                  </h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Product Details Information</p>
               </div>
               <button type="button" onClick={() => setShowModal(false)} className="text-gray-300 hover:text-red-500 text-2xl transition">
                  <i className="fas fa-circle-xmark"></i>
               </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-emerald-600 uppercase mb-1 ml-1 tracking-wider">{t.name}</label>
                <input required placeholder={t.name} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-2 border-emerald-50 p-3.5 rounded-2xl font-bold outline-none focus:border-emerald-500 bg-emerald-50/30 transition shadow-inner" />
              </div>

              <div>
                <label className="block text-xs font-black text-emerald-600 uppercase mb-1 ml-1 tracking-wider">{t.selectCat}</label>
                <select value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full border-2 border-emerald-50 p-3.5 rounded-2xl font-bold outline-none focus:border-emerald-500 bg-emerald-50/30 transition shadow-inner">
                   <option value="">-- {t.noCategory} --</option>
                   {data.categories?.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-emerald-600 uppercase mb-1 ml-1 tracking-wider">{t.stock}</label>
                  <input type="number" placeholder={t.stock} value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="w-full border-2 border-emerald-50 p-3.5 rounded-2xl font-bold outline-none focus:border-emerald-500 bg-emerald-50/30 transition shadow-inner" />
                </div>
                <div>
                  <label className="block text-xs font-black text-emerald-600 uppercase mb-1 ml-1 tracking-wider">{t.unit}</label>
                  <select value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full border-2 border-emerald-50 p-3.5 rounded-2xl font-bold outline-none focus:border-emerald-500 bg-emerald-50/30 transition shadow-inner">
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
                  <label className="block text-xs font-black text-emerald-600 uppercase mb-1 ml-1 tracking-wider">{t.buy}</label>
                  <input type="number" placeholder={t.buy} value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} className="w-full border-2 border-emerald-50 p-3.5 rounded-2xl font-bold outline-none focus:border-emerald-500 bg-emerald-50/30 transition shadow-inner" />
                </div>
                <div>
                  <label className="block text-xs font-black text-emerald-600 uppercase mb-1 ml-1 tracking-wider">{t.sell}</label>
                  <input type="number" placeholder={t.sell} value={formData.salePrice} onChange={e => setFormData({...formData, salePrice: Number(e.target.value)})} className="w-full border-2 border-emerald-50 p-3.5 rounded-2xl font-bold outline-none focus:border-emerald-500 bg-emerald-50/30 transition shadow-inner" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-rose-600 uppercase mb-1 ml-1 tracking-wider">{t.alertLimit}</label>
                <input type="number" value={formData.lowStockThreshold} onChange={e => setFormData({...formData, lowStockThreshold: Number(e.target.value)})} className="w-full border-2 border-rose-50 p-3.5 rounded-2xl font-bold outline-none focus:border-rose-500 bg-rose-50/30 transition shadow-inner" />
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition uppercase text-xs tracking-widest">{t.cancel}</button>
              <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-900/20 hover:bg-emerald-700 transition uppercase text-xs tracking-widest">{t.save}</button>
            </div>
          </form>
        </div>
      )}

      {/* Category Management Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-lg space-y-6 animate-scale-in flex flex-col max-h-[90vh]">
             <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div>
                  <h3 className="font-black text-2xl text-emerald-900 flex items-center gap-3">
                    <i className="fas fa-folder-tree text-emerald-600"></i>
                    {t.manageCats}
                  </h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Edit Categories or Products in Categories</p>
                </div>
                <button onClick={() => setShowCatModal(false)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 transition hover:bg-red-50 rounded-full">
                  <i className="fas fa-circle-xmark text-2xl"></i>
                </button>
             </div>

             <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-100/50">
               <label className="block text-[10px] font-black uppercase text-emerald-600 mb-2 ml-1">{editingCat ? t.editTitle : t.newCat}</label>
               <form onSubmit={handleCatSubmit} className="flex gap-3">
                  <input 
                    required 
                    placeholder={t.catName} 
                    value={catFormData.name} 
                    onChange={e => setCatFormData({ name: e.target.value })} 
                    className="flex-1 border-2 border-emerald-50 p-3.5 rounded-2xl font-bold outline-none focus:border-emerald-500 bg-white transition shadow-sm"
                  />
                  <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-2xl font-black transition hover:bg-emerald-700 shadow-lg shadow-emerald-900/20 active:scale-95">
                    <i className={editingCat ? 'fas fa-check' : 'fas fa-plus'}></i>
                  </button>
               </form>
             </div>

             <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {data.categories?.length === 0 && <p className="text-center py-10 text-gray-300 italic font-bold">No categories added yet.</p>}
                {data.categories?.map(cat => (
                  <div key={cat.id} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm group hover:border-emerald-200 transition-all">
                     <div className="flex flex-col">
                        <span className="font-black text-gray-700 text-lg leading-tight">{cat.name}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                          {data.products.filter(p => p.categoryId === cat.id).length} Products
                        </span>
                     </div>
                     <div className="flex gap-1.5 items-center">
                        <button 
                          onClick={() => setShowProductManagerForCat(cat.id)}
                          className="px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-tight hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center gap-1.5"
                          title={t.manageProducts}
                        >
                          <i className="fas fa-boxes-stacked"></i> {t.manageProducts}
                        </button>
                        <button onClick={() => { setEditingCat(cat); setCatFormData({ name: cat.name }); }} className="w-9 h-9 flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded-xl transition" title="Edit"><i className="fas fa-pen-to-square"></i></button>
                        <button onClick={() => setConfirmDelete({ id: cat.id, name: cat.name, type: 'category' })} className="w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition" title="Delete"><i className="fas fa-trash-can"></i></button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* Bulk Product Management for Category Modal */}
      {showProductManagerForCat && (
        <div className="fixed inset-0 bg-emerald-900/80 backdrop-blur-md flex items-center justify-center p-4 z-[60] no-print">
           <div className="bg-white p-6 rounded-3xl shadow-2xl w-full max-w-2xl space-y-5 animate-scale-in flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                 <div>
                    <h3 className="text-xl font-black text-emerald-900 flex items-center gap-3">
                       <i className="fas fa-folder-open text-emerald-600"></i>
                       {lang === 'bn' ? 'ক্যাটাগরি মাল যোগ/বিয়োগ' : 'Manage Products in Category'}
                    </h3>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1">
                       Category: {data.categories.find(c => c.id === showProductManagerForCat)?.name}
                    </p>
                 </div>
                 <button onClick={() => setShowProductManagerForCat(null)} className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 transition hover:bg-red-50 rounded-full">
                    <i className="fas fa-circle-xmark text-2xl"></i>
                 </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl">
                 <div className="relative">
                    <i className="fas fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                    <input 
                       placeholder={lang === 'bn' ? 'মাল খুঁজুন...' : 'Search products...'} 
                       className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                    />
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                 {data.products.map(p => {
                    const isInThisCat = p.categoryId === showProductManagerForCat;
                    return (
                       <button 
                          key={p.id}
                          onClick={() => toggleProductInCategory(p.id, p.categoryId, showProductManagerForCat)}
                          className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex justify-between items-center ${isInThisCat ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-gray-100 hover:border-emerald-200'}`}
                       >
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isInThisCat ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                <i className={`fas ${isInThisCat ? 'fa-check' : 'fa-box-open'}`}></i>
                             </div>
                             <div>
                                <p className="font-black text-gray-800 leading-tight">{p.name}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                                   {p.categoryId && p.categoryId !== showProductManagerForCat 
                                      ? `${lang === 'bn' ? 'অন্য ক্যাটাগরি:' : 'Other Cat:'} ${data.categories.find(c => c.id === p.categoryId)?.name}` 
                                      : (p.categoryId === showProductManagerForCat ? (lang === 'bn' ? 'এই ক্যাটাগরিতে আছে' : 'In this category') : t.uncategorized)}
                                </p>
                             </div>
                          </div>
                          {isInThisCat ? (
                             <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-md">{lang === 'bn' ? 'যুক্ত' : 'Linked'}</span>
                          ) : (
                             <span className="text-gray-300 font-black text-[10px] uppercase hover:text-emerald-500 transition">{lang === 'bn' ? 'যোগ করুন' : 'Add to Cat'}</span>
                          )}
                       </button>
                    );
                 })}
              </div>

              <div className="pt-4 border-t border-gray-100">
                 <button 
                    onClick={() => setShowProductManagerForCat(null)}
                    className="w-full py-4 bg-emerald-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-950/20 hover:bg-black transition active:scale-95"
                 >
                    {lang === 'bn' ? 'সম্পন্ন করুন' : 'Finish & Close'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[70] no-print">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-sm text-center space-y-5 transform transition-all animate-scale-in">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-2 shadow-inner border-2 border-red-50">
              <i className="fas fa-trash-can"></i>
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 leading-tight">{t.deleteConfirm}</h3>
              <p className="text-gray-500 font-bold mt-2">
                {t.deleteBody} <br/>
                <span className="text-red-600 text-xl font-black italic">"{confirmDelete.name}"</span>
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-xl">
               <p className="text-[10px] text-red-500 font-black uppercase tracking-tight leading-relaxed">{t.deleteWarning}</p>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black hover:bg-gray-200 transition uppercase text-xs tracking-widest"
              >
                {t.cancel}
              </button>
              <button 
                onClick={() => { 
                  if (confirmDelete.type === 'product') onDelete(confirmDelete.id);
                  else onDeleteCategory(confirmDelete.id);
                  setConfirmDelete(null); 
                }}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black shadow-xl shadow-red-900/20 hover:bg-red-700 transition uppercase text-xs tracking-widest"
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
