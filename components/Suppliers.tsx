
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppData, Supplier, StockIn } from '../types';

interface SuppliersProps {
  data: AppData;
  onAdd: (s: Supplier) => void;
  onUpdate: (s: Supplier) => void;
  onDelete: (id: string) => void;
  onDeleteLog: (id: string) => void;
  onUpdateLog: (log: StockIn) => void;
  lang: 'bn' | 'en';
}

const Suppliers: React.FC<SuppliersProps> = ({ data, onAdd, onUpdate, onDelete, onDeleteLog, onUpdateLog, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const t = {
    title: lang === 'bn' ? 'সাপ্লায়ার তালিকা (Supplier List)' : 'Supplier List',
    search: lang === 'bn' ? 'নাম বা ফোন দিয়ে খুঁজুন...' : 'Search Suppliers...',
    newBtn: lang === 'bn' ? 'নতুন সাপ্লায়ার' : 'New Vendor',
    name: lang === 'bn' ? 'নাম' : 'Name',
    phone: lang === 'bn' ? 'ফোন' : 'Phone',
    action: lang === 'bn' ? 'অ্যাকশন' : 'Action',
    save: lang === 'bn' ? 'সংরক্ষণ' : 'Save',
    cancel: lang === 'bn' ? 'বাতিল' : 'Cancel',
    printBtn: lang === 'bn' ? 'প্রিন্ট' : 'Print'
  };

  const filtered = data.suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone.includes(searchTerm));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(formRef.current!);
    const payload = { 
      name: formData.get('name') as string, 
      phone: formData.get('phone') as string 
    };
    if (editingSupplier) onUpdate({ ...editingSupplier, ...payload });
    else onAdd({ id: Math.random().toString(36).substr(2, 9), ...payload });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <div className="relative w-full md:w-96 search-container">
          <i className="fas fa-truck-moving absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder={t.search} 
            className="w-full pl-10 pr-4 py-3 border rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => window.print()} className="flex-1 bg-emerald-50 text-emerald-600 px-5 py-3 rounded-2xl font-black flex items-center justify-center gap-2 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition"><i className="fas fa-print"></i> {t.printBtn}</button>
          <button onClick={() => { setEditingSupplier(null); setShowModal(true); }} className="flex-1 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:bg-black transition uppercase text-xs tracking-widest">{t.newBtn}</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print-area">
        <div className="hidden print:block p-8 text-center border-b-2 border-slate-900 bg-slate-50">
           <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">FIRST STEP - {t.title}</h2>
           <p className="text-[10px] font-bold text-gray-500 mt-1">{new Date().toLocaleDateString()}</p>
           <div className="w-16 h-1 bg-slate-900 mx-auto mt-2 rounded-full"></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr><th className="px-6 py-5">{t.name}</th><th className="px-6 py-5">{t.phone}</th><th className="px-6 py-5 text-center no-print">{t.action}</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-black text-slate-900">{s.name}</td>
                  <td className="px-6 py-4 text-gray-500 font-bold">{s.phone}</td>
                  <td className="px-6 py-4 text-center no-print">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => { setEditingSupplier(s); setShowModal(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><i className="fas fa-edit"></i></button>
                      <button onClick={() => { if(confirm(lang === 'bn' ? 'মুছে ফেলতে চান?' : 'Delete?')) onDelete(s.id) }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><i className="fas fa-trash-can"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <form ref={formRef} onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md space-y-6">
             <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{editingSupplier ? 'সাপ্লায়ার এডিট' : 'নতুন সাপ্লায়ার যোগ'}</h3>
             <div className="space-y-4">
                <input required name="name" defaultValue={editingSupplier?.name || ''} placeholder={t.name} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none" />
                <input required name="phone" defaultValue={editingSupplier?.phone || ''} placeholder={t.phone} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none" />
             </div>
             <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-xs">{t.cancel}</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs shadow-xl">{t.save}</button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
