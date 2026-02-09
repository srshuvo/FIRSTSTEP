
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppData, StockIn } from '../types';

interface PurchaseProps {
  data: AppData;
  onRecord: (entry: StockIn) => void;
  lang: 'bn' | 'en';
}

const Purchase: React.FC<PurchaseProps> = ({ data, onRecord, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    productId: '',
    supplierId: '',
    billNumber: '',
    quantity: 0,
    unitPrice: 0,
    date: new Date().toISOString().split('T')[0]
  });

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

  const filteredProducts = useMemo(() => {
    return data.products
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase().trim()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.products, searchTerm]);

  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed !== '' && filteredProducts.length === 1) {
      const p = filteredProducts[0];
      if (formData.productId !== p.id) {
        setFormData(prev => ({ ...prev, productId: p.id, unitPrice: p.costPrice }));
      }
    }
  }, [filteredProducts, searchTerm]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const elements = Array.from(formRef.current?.elements || []).filter(el => {
      const tag = (el as HTMLElement).tagName;
      return (tag === 'INPUT' || tag === 'SELECT' || tag === 'BUTTON') && !(el as any).disabled;
    }) as HTMLElement[];
    const index = elements.indexOf(target);

    if (index === -1) return;

    if (e.key === 'Enter') {
      if (target.tagName === 'BUTTON' && (target as HTMLButtonElement).type === 'submit') return;
      e.preventDefault();
      if (index < elements.length - 1) elements[index + 1].focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.supplierId || formData.quantity <= 0) return;
    const prod = data.products.find(p => p.id === formData.productId);
    if (!prod) return;

    onRecord({
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      productName: prod.name,
      productUnit: prod.unit,
      totalPrice: formData.quantity * formData.unitPrice
    });
    alert(lang === 'bn' ? "সফলভাবে সংরক্ষিত!" : "Saved successfully!");
    setFormData({ ...formData, productId: '', quantity: 0, billNumber: '' });
    setSearchTerm('');
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <h3 className="text-xl font-black text-emerald-600 flex items-center gap-2"><i className="fas fa-cart-plus"></i> {lang === 'bn' ? 'মাল কেনা (Purchase)' : 'Purchase Entry'}</h3>
        <form ref={formRef} onKeyDown={handleKeyDown} onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl space-y-4">
            <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{lang === 'bn' ? 'মালের নাম দিয়ে খুঁজুন... (Alt+S)' : 'Search product name... (Alt+S)'}</label>
            <input ref={searchInputRef} type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full border p-3 rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500" placeholder={lang === 'bn' ? 'মালের নাম দিয়ে খুঁজুন...' : 'Search...'} />
            
            <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{lang === 'bn' ? 'পণ্য বেছে নিন' : 'Select Product'}</label>
            <select required value={formData.productId} onChange={e => { const p = data.products.find(prod => prod.id === e.target.value); setFormData({...formData, productId: e.target.value, unitPrice: p?.costPrice || 0}); }} className="w-full border p-3 rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">{lang === 'bn' ? '-- পণ্য বেছে নিন --' : '-- Select Product --'}</option>
              {filteredProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock} {p.unit})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{lang === 'bn' ? 'চালান / বিল নম্বর' : 'Challan / Bill No'}</label>
              <input type="text" placeholder={lang === 'bn' ? 'চালান নম্বর' : 'Bill No'} value={formData.billNumber} onChange={e => setFormData({...formData, billNumber: e.target.value})} className="w-full border p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{lang === 'bn' ? 'সাপ্লায়ার' : 'Supplier'}</label>
              <select required value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})} className="w-full border p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">{lang === 'bn' ? 'সাপ্লায়ার' : 'Supplier'}</option>
                {data.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{lang === 'bn' ? 'পরিমাণ' : 'Quantity'}</label>
              <input required type="number" placeholder={lang === 'bn' ? 'পরিমাণ' : 'Quantity'} value={formData.quantity || ''} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} className="w-full border p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{lang === 'bn' ? 'দর' : 'Rate'}</label>
              <input required type="number" placeholder={lang === 'bn' ? 'দর' : 'Rate'} value={formData.unitPrice || ''} onChange={e => setFormData({...formData, unitPrice: Number(e.target.value)})} className="w-full border p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{lang === 'bn' ? 'তারিখ' : 'Date'}</label>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="p-4 bg-emerald-600 text-white rounded-xl flex justify-between items-center shadow-lg">
            <span className="font-bold">{lang === 'bn' ? 'মোট খরচ: ' : 'Total: '}</span><span className="text-2xl font-black">৳{formData.quantity * formData.unitPrice}</span>
          </div>
          <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black shadow-xl hover:bg-emerald-700 transition transform active:scale-95">{lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save Record'}</button>
        </form>
      </div>
    </div>
  );
};

export default Purchase;
