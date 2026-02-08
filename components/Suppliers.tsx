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
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [historySupplier, setHistorySupplier] = useState<Supplier | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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

  const t = {
    title: lang === 'bn' ? 'সাপ্লায়ার খাতা' : 'Supplier Directory',
    search: lang === 'bn' ? 'নাম বা ফোন দিয়ে খুঁজুন... (Alt+S)' : 'Search Suppliers... (Alt+S)',
    newBtn: lang === 'bn' ? 'নতুন সাপ্লায়ার' : 'New Vendor',
    name: lang === 'bn' ? 'নাম' : 'Supplier Name',
    phone: lang === 'bn' ? 'ফোন' : 'Phone',
    action: lang === 'bn' ? 'অ্যাকশন' : 'Action',
    addTitle: lang === 'bn' ? 'নতুন সাপ্লায়ার যোগ' : 'Add New Vendor',
    editTitle: lang === 'bn' ? 'সাপ্লায়ার এডিট' : 'Edit Vendor Info',
    save: lang === 'bn' ? 'সংরক্ষণ' : 'Save',
    cancel: lang === 'bn' ? 'বাতিল' : 'Cancel',
    historyTitle: lang === 'bn' ? 'ক্রয় খতিয়ান (Purchase)' : 'Procurement History',
    printBtn: lang === 'bn' ? 'প্রিন্ট' : 'Print',
    noData: lang === 'bn' ? 'কোনো সাপ্লায়ার নেই' : 'No records found',
    deleteConfirm: lang === 'bn' ? 'মুছে ফেলতে চান?' : 'Confirm Delete'
  };

  const filtered = data.suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone.includes(searchTerm));

  const supplierHistory = useMemo(() => {
    if (!historySupplier) return [];
    return data.stockInLogs.filter(l => l.supplierId === historySupplier.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.stockInLogs, historySupplier]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) onUpdate({ ...editingSupplier, ...formData });
    else onAdd({ id: Math.random().toString(36).substr(2, 9), ...formData });
    setShowModal(false);
    setEditingSupplier(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <div className="relative w-full md:w-96">
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
          <button onClick={() => window.print()} className="flex-1 bg-emerald-50 text-emerald-600 px-5 py-3 rounded-2xl font-black flex items-center justify-center gap-2 border border-emerald-100 hover:bg-emerald-100 transition"><i className="fas fa-print"></i> {t.printBtn}</button>
          <button onClick={() => { setEditingSupplier(null); setFormData({ name: '', phone: '' }); setShowModal(true); }} className="flex-1 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-slate-950/30 hover:bg-black transition uppercase text-xs tracking-widest"><i className="fas fa-plus-circle"></i> {t.newBtn}</button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr><th className="px-6 py-5">{t.name}</th><th className="px-6 py-5">{t.phone}</th><th className="px-6 py-5 text-center no-print">{t.action}</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <button onClick={() => { setHistorySupplier(s); setShowHistoryModal(true); }} className="font-black text-slate-900 hover:text-emerald-600 underline underline-offset-8 decoration-slate-200 transition">{s.name}</button>
                  </td>
                  <td className="px-6 py-5 text-gray-500 font-bold">{s.phone}</td>
                  <td className="px-6 py-5 text-center no-print">
                    <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingSupplier(s); setFormData({ name: s.name, phone: s.phone }); setShowModal(true); }} className="w-10 h-10 flex items-center justify-center text-blue-500 bg-blue-50 rounded-xl hover:bg-blue-500 hover:text-white transition shadow-sm"><i className="fas fa-pen-to-square"></i></button>
                      <button onClick={() => setConfirmDelete({ id: s.id, name: s.name })} className="w-10 h-10 flex items-center justify-center text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-500 hover:text-white transition shadow-sm"><i className="fas fa-trash-can"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-20 text-center flex flex-col items-center"><i className="fas fa-truck-field text-gray-100 text-6xl mb-4"></i><p className="text-gray-400 font-black italic">{t.noData}</p></div>}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <form ref={formRef} onKeyDown={handleKeyDown} onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md space-y-6 animate-scale-in">
             <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{editingSupplier ? t.editTitle : t.addTitle}</h3>
                <button type="button" onClick={() => setShowModal(false)} className="text-gray-300 hover:text-rose-600 transition"><i className="fas fa-circle-xmark text-xl"></i></button>
             </div>
             <div className="space-y-4">
                <div>
                   <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">{t.name}</label>
                   <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-slate-900 transition" />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 ml-1">{t.phone}</label>
                   <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-slate-900 transition" />
                </div>
             </div>
             <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest">{t.cancel}</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-950/20">{t.save}</button>
             </div>
          </form>
        </div>
      )}

      {showHistoryModal && historySupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white p-8 rounded-[3rem] w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">
             <div className="flex justify-between items-start border-b border-gray-100 pb-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-900 text-white rounded-3xl flex items-center justify-center text-2xl shadow-xl shadow-slate-950/20"><i className="fas fa-boxes-packing"></i></div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">{t.historyTitle}</h3>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">{historySupplier.name}</p>
                  </div>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-rose-600 transition hover:bg-rose-50 rounded-full"><i className="fas fa-circle-xmark text-2xl"></i></button>
             </div>
             <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                <table className="w-full text-left text-sm">
                   <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest sticky top-0">
                      <tr><th className="p-4">Date</th><th className="p-4">Item</th><th className="p-4 text-right">Total</th></tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {supplierHistory.map((log: any) => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                           <td className="p-4 font-bold text-gray-400 text-xs">{log.date}</td>
                           <td className="p-4"><p className="font-black text-gray-700">{log.productName}</p><p className="text-[10px] font-bold text-gray-400">{log.quantity} {log.productUnit} @ ৳{log.unitPrice}</p></td>
                           <td className="p-4 text-right font-black text-gray-900">৳{log.totalPrice}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm text-center space-y-5 animate-scale-in">
             <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center text-4xl mx-auto"><i className="fas fa-trash-can"></i></div>
             <h3 className="text-xl font-black text-gray-900">{t.deleteConfirm}</h3>
             <p className="text-gray-500 font-bold">"{confirmDelete.name}"</p>
             <div className="flex gap-3 pt-4">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-xs">Cancel</button>
                <button onClick={() => { onDelete(confirmDelete.id); setConfirmDelete(null); }} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs">Delete</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;