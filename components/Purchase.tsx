
import React, { useState, useMemo, useEffect } from 'react';
import { AppData, StockIn } from '../types';

interface PurchaseProps {
  data: AppData;
  onRecord: (entry: StockIn) => void;
  lang: 'bn' | 'en';
}

const Purchase: React.FC<PurchaseProps> = ({ data, onRecord, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    productId: '',
    supplierId: '',
    quantity: 0,
    unitPrice: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const filteredProducts = useMemo(() => {
    return data.products
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.products, searchTerm]);

  // Automatic selection logic
  useEffect(() => {
    if (searchTerm.trim() !== '' && filteredProducts.length === 1) {
      const p = filteredProducts[0];
      if (formData.productId !== p.id) {
        setFormData(prev => ({
          ...prev,
          productId: p.id,
          unitPrice: p.costPrice
        }));
      }
    }
  }, [filteredProducts, searchTerm, formData.productId]);

  const t = {
    title: lang === 'bn' ? 'মাল কেনা (Purchase)' : 'Purchase Entry',
    product: lang === 'bn' ? 'পণ্য বেছে নিন' : 'Select Product',
    search: lang === 'bn' ? 'মালের নাম দিয়ে খুঁজুন...' : 'Search by product name...',
    supplier: lang === 'bn' ? 'সাপ্লায়ার' : 'Supplier',
    quantity: lang === 'bn' ? 'পরিমাণ' : 'Quantity',
    price: lang === 'bn' ? 'দর' : 'Rate',
    save: lang === 'bn' ? 'রেকর্ড সেভ করুন' : 'Save Record',
    total: lang === 'bn' ? 'মোট খরচ' : 'Total'
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
    setFormData({ ...formData, productId: '', quantity: 0 });
    setSearchTerm('');
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <h3 className="text-xl font-black text-emerald-600 flex items-center gap-2">
          <i className="fas fa-cart-plus"></i> {t.title}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <label className="block text-xs font-black uppercase text-gray-400 mb-2">{t.search}</label>
              <input 
                type="text" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full border p-3 rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={t.search}
              />
              
              <div className="mt-4">
                <label className="block text-xs font-black uppercase text-gray-400 mb-2">{t.product}</label>
                <select 
                  required
                  value={formData.productId}
                  onChange={e => {
                    const p = data.products.find(prod => prod.id === e.target.value);
                    setFormData({...formData, productId: e.target.value, unitPrice: p?.costPrice || 0});
                  }}
                  className="w-full border p-3 rounded-xl outline-none font-bold bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- {t.product} --</option>
                  {filteredProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock} {p.unit})</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1 ml-1">{t.supplier}</label>
                <select required value={formData.supplierId} onChange={e => setFormData({...formData, supplierId: e.target.value})} className="w-full border p-3 rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value="">{t.supplier}</option>
                  {data.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1 ml-1">{lang === 'bn' ? 'তারিখ' : 'Date'}</label>
                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full border p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1 ml-1">{t.quantity}</label>
                <input required type="number" placeholder={t.quantity} value={formData.quantity || ''} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} className="w-full border p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1 ml-1">{t.price}</label>
                <input required type="number" placeholder={t.price} value={formData.unitPrice || ''} onChange={e => setFormData({...formData, unitPrice: Number(e.target.value)})} className="w-full border p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-600 text-white rounded-xl flex justify-between items-center shadow-lg">
            <span className="font-bold">{t.total}:</span>
            <span className="text-2xl font-black">৳{formData.quantity * formData.unitPrice}</span>
          </div>

          <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black shadow-xl hover:bg-emerald-700 transition transform active:scale-95">
            {t.save}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Purchase;
