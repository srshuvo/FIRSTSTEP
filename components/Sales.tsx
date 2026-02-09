
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppData, StockOut } from '../types';

interface SalesProps {
  data: AppData;
  onRecord: (entry: StockOut) => void;
  lang: 'bn' | 'en';
}

const Sales: React.FC<SalesProps> = ({ data, onRecord, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    productId: '', customerId: '', quantity: 0, unitPrice: 0, discount: 0, paidAmount: 0,
    billNumber: `BILL-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0], isSample: false
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
    return data.products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase().trim())).sort((a, b) => a.name.localeCompare(b.name));
  }, [data.products, searchTerm]);

  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed !== '' && filteredProducts.length === 1) {
      const p = filteredProducts[0];
      if (formData.productId !== p.id) {
        setFormData(prev => ({ ...prev, productId: p.id, unitPrice: p.salePrice }));
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
    if (!formData.productId || !formData.customerId || formData.quantity <= 0) return;
    const prod = data.products.find(p => p.id === formData.productId);
    if (!prod) return;

    const total = (formData.quantity * formData.unitPrice) - formData.discount;
    onRecord({ id: Math.random().toString(36).substr(2, 9), ...formData, productName: prod.name, productUnit: prod.unit, totalPrice: total, dueAdded: total - formData.paidAmount });
    alert(lang === 'bn' ? "বিক্রি সম্পন্ন!" : "Sale Completed!");
    setFormData({ ...formData, productId: '', quantity: 0, discount: 0, paidAmount: 0, isSample: false, billNumber: `BILL-${Date.now().toString().slice(-6)}` });
    setSearchTerm('');
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <h3 className="text-xl font-black text-emerald-600 flex items-center gap-2"><i className="fas fa-file-invoice-dollar"></i> {lang === 'bn' ? 'মাল বিক্রি (Sales)' : 'Sales Entry'}</h3>
        <form ref={formRef} onKeyDown={handleKeyDown} onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl space-y-4">
            <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{lang === 'bn' ? 'মালের নাম দিয়ে খুঁজুন... (Alt+S)' : 'Search by product... (Alt+S)'}</label>
            <input ref={searchInputRef} type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full border p-3 rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500" placeholder={lang === 'bn' ? 'মালের নাম দিয়ে খুঁজুন...' : 'Search...'} />
            
            <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{lang === 'bn' ? 'পণ্য নির্বাচন করুন' : 'Select Product'}</label>
            <select required value={formData.productId} onChange={e => { const p = data.products.find(prod => prod.id === e.target.value); setFormData({...formData, productId: e.target.value, unitPrice: p?.salePrice || 0}); }} className="w-full border p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">{lang === 'bn' ? '-- পণ্য নির্বাচন করুন --' : '-- Select Product --'}</option>
              {filteredProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock} {p.unit})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{lang === 'bn' ? 'বিল নম্বর' : 'Bill Number'}</label>
              <input type="text" value={formData.billNumber} onChange={e => setFormData({...formData, billNumber: e.target.value})} className="w-full border p-3 rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{lang === 'bn' ? 'কাস্টমার' : 'Customer'}</label>
              <select required value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} className="w-full border p-3 rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">{lang === 'bn' ? 'কাস্টমার' : 'Customer'}</option>
                {data.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{lang === 'bn' ? 'পরিমাণ' : 'Quantity'}</label>
              <input required type="number" placeholder={lang === 'bn' ? 'পরিমাণ' : 'Quantity'} value={formData.quantity || ''} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} className="w-full border p-3 rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{lang === 'bn' ? 'বিক্রয় মূল্য' : 'Sale Price'}</label>
              <input required type="number" placeholder={lang === 'bn' ? 'বিক্রয় মূল্য' : 'Rate'} value={formData.unitPrice || ''} onChange={e => setFormData({...formData, unitPrice: Number(e.target.value)})} className="w-full border p-3 rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{lang === 'bn' ? 'ডিসকাউন্ট (ছাড়)' : 'Discount'}</label>
              <input type="number" placeholder={lang === 'bn' ? 'ডিসকাউন্ট (ছাড়)' : 'Discount'} value={formData.discount || ''} onChange={e => setFormData({...formData, discount: Number(e.target.value)})} className="w-full border-2 border-emerald-50 p-3 rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{lang === 'bn' ? 'পরিশোধ (Paid)' : 'Paid Amount'}</label>
              <input type="number" placeholder={lang === 'bn' ? 'পরিশোধ (Paid)' : 'Paid'} value={formData.paidAmount || ''} onChange={e => setFormData({...formData, paidAmount: Number(e.target.value)})} className="w-full border p-3 rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{lang === 'bn' ? 'তারিখ' : 'Date'}</label>
            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border p-3 rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="flex items-center gap-2 px-1">
             <input type="checkbox" id="isSample" checked={formData.isSample} onChange={e => setFormData({...formData, isSample: e.target.checked})} className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500" />
             <label htmlFor="isSample" className="text-xs font-black text-gray-500 uppercase tracking-widest">{lang === 'bn' ? 'sampol' : 'Sample'}</label>
          </div>
          <div className="p-4 bg-emerald-600 text-white rounded-xl flex justify-between items-center shadow-lg">
            <span className="font-bold">{lang === 'bn' ? 'মোট:' : 'Total:'}</span><span className="text-2xl font-black">৳{(formData.quantity * formData.unitPrice) - formData.discount}</span>
          </div>
          <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black shadow-xl hover:bg-emerald-700 transition transform active:scale-95">{lang === 'bn' ? 'বিক্রি সম্পন্ন করুন' : 'Complete Sale'}</button>
        </form>
      </div>
    </div>
  );
};

export default Sales;
