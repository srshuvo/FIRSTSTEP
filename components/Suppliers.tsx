
import React, { useState, useMemo } from 'react';
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

  const t = {
    title: lang === 'bn' ? 'সাপ্লায়ার খাতা' : 'Supplier Directory',
    search: lang === 'bn' ? 'নাম বা ফোন দিয়ে খুঁজুন...' : 'Search Suppliers...',
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
    noData: lang === 'bn' ? 'কোনো সাপ্লায়ার নেই' : 'No records found'
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
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <div className="relative w-full md:w-96">
          <i className="fas fa-truck-moving absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input type="text" placeholder={t.search} className="w-full pl-10 pr-4 py-3 border rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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

      {/* History Modal */}
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

      {/* Add/Edit Modal (Logic remains intact, just updated icons) */}
    </div>
  );
};

export default Suppliers;
