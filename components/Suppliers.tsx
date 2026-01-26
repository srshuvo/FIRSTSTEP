
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

  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');

  const [editingLog, setEditingLog] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  const t = {
    title: lang === 'bn' ? 'সাপ্লায়ার তালিকা' : 'Supplier List',
    search: lang === 'bn' ? 'সাপ্লায়ার খুঁজুন (নাম বা ফোন)...' : 'Search Supplier (Name or Phone)...',
    newBtn: lang === 'bn' ? 'নতুন সাপ্লায়ার' : 'New Supplier',
    name: lang === 'bn' ? 'নাম' : 'Name',
    phone: lang === 'bn' ? 'ফোন নাম্বার' : 'Phone Number',
    action: lang === 'bn' ? 'অ্যাকশন' : 'Action',
    addTitle: lang === 'bn' ? 'নতুন সাপ্লায়ার যোগ' : 'Add New Supplier',
    editTitle: lang === 'bn' ? 'সাপ্লায়ার আপডেট' : 'Update Supplier',
    cancel: lang === 'bn' ? 'বাতিল' : 'Cancel',
    save: lang === 'bn' ? 'সেভ করুন' : 'Save',
    noData: lang === 'bn' ? 'কোনো সাপ্লায়ার পাওয়া যায়নি' : 'No suppliers found',
    deleteConfirm: lang === 'bn' ? 'নিশ্চিত তো?' : 'Are you sure?',
    deleteBody: lang === 'bn' ? 'এই সাপ্লায়ারকে তালিকা থেকে সরাবেন?' : 'Do you want to delete this supplier?',
    confirmDeleteBtn: lang === 'bn' ? 'হ্যাঁ, ডিলিট' : 'Yes, Delete',
    historyTitle: lang === 'bn' ? 'মাল ক্রয়ের খতিয়ান' : 'Purchase History Ledger',
    date: lang === 'bn' ? 'তারিখ' : 'Date',
    product: lang === 'bn' ? 'পণ্য' : 'Product',
    qty: lang === 'bn' ? 'পরিমাণ' : 'Qty',
    price: lang === 'bn' ? 'দর' : 'Rate',
    total: lang === 'bn' ? 'মোট' : 'Total',
    printBtn: lang === 'bn' ? 'প্রিন্ট / PDF' : 'Print / PDF',
    shopName: 'FIRST STEP',
    startDate: lang === 'bn' ? 'শুরু' : 'Start',
    endDate: lang === 'bn' ? 'শেষ' : 'End',
    editEntry: lang === 'bn' ? 'লেনদেন এডিট' : 'Edit Entry'
  };

  const filtered = data.suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.phone.includes(searchTerm)
  );

  const supplierHistory = useMemo(() => {
    if (!historySupplier) return [];
    let logs = data.stockInLogs.filter(l => l.supplierId === historySupplier.id);
    
    if (ledgerStartDate) logs = logs.filter(l => l.date >= ledgerStartDate);
    if (ledgerEndDate) logs = logs.filter(l => l.date <= ledgerEndDate);

    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.stockInLogs, historySupplier, ledgerStartDate, ledgerEndDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      onUpdate({ ...editingSupplier, ...formData });
    } else {
      onAdd({ id: Math.random().toString(36).substr(2, 9), ...formData });
    }
    setShowModal(false);
    setEditingSupplier(null);
    setFormData({ name: '', phone: '' });
  };

  const openHistoryModal = (s: Supplier) => {
    setHistorySupplier(s);
    setLedgerStartDate('');
    setLedgerEndDate('');
    setShowHistoryModal(true);
  };

  const handleDeleteLogEntry = (logId: string) => {
    if (!confirm(lang === 'bn' ? "এই লেনদেনটি মুছে ফেলতে চান? এটি করলে স্টক আপডেট হবে।" : "Delete this record? This will revert stock levels.")) return;
    onDeleteLog(logId);
  };

  const handleEditLogEntry = (log: StockIn) => {
    setEditingLog(log);
    setEditFormData({ ...log });
  };

  const handleEntryUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: StockIn = {
      ...editFormData,
      totalPrice: editFormData.quantity * editFormData.unitPrice
    };
    onUpdateLog(updated);
    setEditingLog(null);
  };

  return (
    <div className="space-y-4 text-left">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div className="relative w-full md:w-96">
          <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
          <input 
            type="text" 
            placeholder={t.search} 
            className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => window.print()} className="flex-1 md:flex-none bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-bold flex items-center justify-center gap-2 border border-emerald-100 hover:bg-emerald-100 transition">
             <i className="fas fa-print"></i> {t.printBtn}
          </button>
          <button 
            onClick={() => { setEditingSupplier(null); setFormData({ name: '', phone: '' }); setShowModal(true); }}
            className="flex-1 md:flex-none bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 transition shadow-lg"
          >
            <i className="fas fa-truck-loading mr-2"></i> {t.newBtn}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print-area">
        <div className="hidden print:block p-6 text-center border-b-2 border-emerald-100">
           <h1 className="text-3xl font-black text-emerald-800">FIRST STEP</h1>
           <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{t.title}</p>
           <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleString()}</p>
        </div>
        <div className="p-6 border-b border-gray-100 no-print">
          <h3 className="text-lg font-bold text-gray-700">{t.title}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="p-4">{t.name}</th>
                <th className="p-4">{t.phone}</th>
                <th className="p-4 text-center no-print">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <button 
                      onClick={() => openHistoryModal(s)}
                      className="font-bold text-emerald-700 hover:text-emerald-900 underline underline-offset-4 decoration-emerald-200 text-left transition no-print"
                    >
                      {s.name}
                    </button>
                    <span className="hidden print:inline font-bold text-gray-800">{s.name}</span>
                  </td>
                  <td className="p-4 text-gray-500 font-medium">{s.phone}</td>
                  <td className="p-4 text-center no-print">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => { 
                          setEditingSupplier(s); 
                          setFormData({ name: s.name, phone: s.phone }); 
                          setShowModal(true); 
                        }} 
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        onClick={() => setConfirmDelete({ id: s.id, name: s.name })} 
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center py-10 text-gray-400 font-bold italic">{t.noData}</p>}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl space-y-6 transform transition-all animate-scale-in">
            <h3 className="font-black text-2xl text-emerald-900 flex items-center gap-2">
              <i className="fas fa-truck-field"></i>
              {editingSupplier ? t.editTitle : t.addTitle}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-1 ml-1 tracking-wider">{t.name}</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-2 border-gray-100 p-3 rounded-xl font-bold outline-none focus:border-emerald-500 bg-gray-50 text-gray-800" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-1 ml-1 tracking-wider">{t.phone}</label>
                <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border-2 border-gray-100 p-3 rounded-xl font-bold outline-none focus:border-emerald-500 bg-gray-50 text-gray-800" />
              </div>
              <div className="flex gap-4 mt-8 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-xl font-black hover:bg-gray-200 transition">{t.cancel}</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-black shadow-xl hover:bg-emerald-700 transition">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && historySupplier && (
        <div className="fixed inset-0 bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 z-50 overflow-y-auto no-print">
          <div className="bg-white p-6 rounded-2xl w-full max-w-3xl shadow-2xl space-y-4 transform transition-all animate-scale-in flex flex-col min-h-fit md:max-h-[90vh]">
            <div className="flex justify-between items-start border-b pb-4">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-xl">
                   <i className="fas fa-file-invoice"></i>
                </div>
                <div>
                  <h3 className="font-black text-2xl text-emerald-900">{t.historyTitle}</h3>
                  <p className="text-gray-500 font-bold">{historySupplier.name}</p>
                </div>
              </div>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-300 hover:text-red-500 text-3xl transition">
                <i className="fas fa-times-circle"></i>
              </button>
            </div>
            <div className="bg-emerald-50/50 p-4 rounded-xl flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[120px]">
                    <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1">{t.startDate}</label>
                    <input type="date" value={ledgerStartDate} onChange={e => setLedgerStartDate(e.target.value)} className="w-full border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="flex-1 min-w-[120px]">
                    <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1">{t.endDate}</label>
                    <input type="date" value={ledgerEndDate} onChange={e => setLedgerEndDate(e.target.value)} className="w-full border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white border-b-2 border-emerald-50 text-[10px] font-black uppercase text-gray-400">
                  <tr>
                    <th className="py-3 px-2">{t.date}</th>
                    <th className="py-3 px-2">{t.product}</th>
                    <th className="py-3 px-2">{t.qty}</th>
                    <th className="py-3 px-2 text-right">{t.total}</th>
                    <th className="py-3 px-2 text-center">{t.action}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {supplierHistory.map(log => (
                    <tr key={log.id}>
                      <td className="py-3 px-2">{log.date}</td>
                      <td className="py-3 px-2 font-bold text-gray-700">{log.productName}</td>
                      <td className="py-3 px-2">{log.quantity} {log.productUnit}</td>
                      <td className="py-3 px-2 text-right font-black text-emerald-600">৳{log.totalPrice}</td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex justify-center gap-1">
                           <button onClick={() => handleEditLogEntry(log)} className="p-1 text-blue-400 hover:text-blue-600 transition"><i className="fas fa-edit"></i></button>
                           <button onClick={() => handleDeleteLogEntry(log.id)} className="p-1 text-red-400 hover:text-red-600 transition"><i className="fas fa-trash-alt"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] no-print text-center">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm space-y-4 transform transition-all animate-scale-in">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-2">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3 className="text-xl font-black text-gray-900">{t.deleteConfirm}</h3>
            <p className="text-gray-500 font-medium">{t.deleteBody} <br/><span className="font-black text-gray-800 text-lg">"{confirmDelete.name}"</span></p>
            <div className="flex gap-3 pt-4">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-black">{t.cancel}</button>
              <button onClick={() => { onDelete(confirmDelete.id); setConfirmDelete(null); }} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black shadow-lg">{t.confirmDeleteBtn}</button>
            </div>
          </div>
        </div>
      )}

      {editingLog && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] no-print text-left">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4 animate-scale-in">
            <h3 className="text-xl font-black text-emerald-900 flex items-center gap-2 border-b pb-2">
               <i className="fas fa-edit"></i> {t.editEntry}
            </h3>
            <form onSubmit={handleEntryUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1">{t.date}</label>
                <input type="date" value={editFormData.date} onChange={e => setEditFormData({...editFormData, date: e.target.value})} className="w-full border p-2 rounded-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-1">{t.qty}</label>
                  <input type="number" value={editFormData.quantity} onChange={e => setEditFormData({...editFormData, quantity: Number(e.target.value)})} className="w-full border p-2 rounded-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-1">{t.price}</label>
                  <input type="number" value={editFormData.unitPrice} onChange={e => setEditFormData({...editFormData, unitPrice: Number(e.target.value)})} className="w-full border p-2 rounded-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingLog(null)} className="flex-1 py-2 bg-gray-100 text-gray-500 rounded-lg font-bold hover:bg-gray-200 transition">{t.cancel}</button>
                <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-lg hover:bg-emerald-700 transition">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;