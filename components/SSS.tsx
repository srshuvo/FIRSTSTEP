
import React, { useState, useMemo } from 'react';
import { AppData, LedgerEntry } from '../types';

interface SSSProps {
  data: AppData;
  onAdd: (e: LedgerEntry) => void;
  onUpdate: (e: LedgerEntry) => void;
  onDelete: (id: string) => void;
  lang: 'bn' | 'en';
}

const SSS: React.FC<SSSProps> = ({ data, onAdd, onUpdate, onDelete, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    name: '',
    amount: 0
  });

  const t = {
    title: lang === 'bn' ? 'অনন্যা ব্যায় (Ledger)' : 'Ananya Expense Ledger',
    subtitle: lang === 'bn' ? 'ব্যক্তিগত বা দোকানের সকল অতিরিক্ত খরচের হিসাব' : 'Track all additional business or personal expenses',
    newBtn: lang === 'bn' ? 'নতুন এন্ট্রি' : 'New Entry',
    search: lang === 'bn' ? 'খুঁজুন...' : 'Search...',
    date: lang === 'bn' ? 'তারিখ' : 'Date',
    description: lang === 'bn' ? 'বিবরণ' : 'Description',
    name: lang === 'bn' ? 'নাম/ক্রেতা' : 'Name/Party',
    amount: lang === 'bn' ? 'টাকার পরিমাণ' : 'Amount',
    action: lang === 'bn' ? 'অ্যাকশন' : 'Action',
    save: lang === 'bn' ? 'সংরক্ষণ' : 'Save',
    cancel: lang === 'bn' ? 'বাতিল' : 'Cancel',
    total: lang === 'bn' ? 'মোট খরচ' : 'Total Expense',
    addTitle: lang === 'bn' ? 'নতুন ডাটা যোগ' : 'Add New Record',
    editTitle: lang === 'bn' ? 'ডাটা এডিট' : 'Edit Record',
    print: lang === 'bn' ? 'রিপোর্ট প্রিন্ট' : 'Print Report',
    noData: lang === 'bn' ? 'কোনো এন্ট্রি নেই' : 'No entries found'
  };

  const filtered = useMemo(() => {
    return (data.ledgerEntries || [])
      .filter(e => {
        const matchesSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             e.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStart = startDate ? e.date >= startDate : true;
        const matchesEnd = endDate ? e.date <= endDate : true;
        return matchesSearch && matchesStart && matchesEnd;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.ledgerEntries, searchTerm, startDate, endDate]);

  const totalAmount = useMemo(() => {
    return filtered.reduce((sum, e) => sum + e.amount, 0);
  }, [filtered]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEntry) {
      onUpdate({ ...editingEntry, ...formData });
    } else {
      onAdd({
        id: Math.random().toString(36).substr(2, 9),
        ...formData
      });
    }
    setShowModal(false);
    setEditingEntry(null);
    setFormData({ date: new Date().toISOString().split('T')[0], description: '', name: '', amount: 0 });
  };

  const handleEdit = (entry: LedgerEntry) => {
    setEditingEntry(entry);
    setFormData({ date: entry.date, description: entry.description, name: entry.name, amount: entry.amount });
    setShowModal(true);
  };

  return (
    <div className="space-y-6 animate-scale-in">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 no-print">
        <div>
           <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                <i className="fas fa-file-signature"></i>
              </div>
              {t.title}
           </h2>
           <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-1">{t.subtitle}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => window.print()} className="flex-1 px-5 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-black border border-indigo-100 hover:bg-indigo-600 hover:text-white transition flex items-center justify-center gap-2 group shadow-sm">
            <i className="fas fa-print group-hover:scale-110 transition-transform"></i> {t.print}
          </button>
          <button onClick={() => { setEditingEntry(null); setFormData({ date: new Date().toISOString().split('T')[0], description: '', name: '', amount: 0 }); setShowModal(true); }} className="flex-1 px-6 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-xl shadow-slate-900/20 hover:bg-black transition flex items-center justify-center gap-2 uppercase text-xs tracking-widest active:scale-95">
            <i className="fas fa-plus-circle"></i> {t.newBtn}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 space-y-4 no-print">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
              <input 
                type="text" 
                placeholder={t.search} 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold transition"
              />
            </div>
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
               <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest min-w-[30px]">{lang === 'bn' ? 'হতে' : 'From'}</span>
               <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-xs font-bold outline-none flex-1" />
            </div>
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
               <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest min-w-[30px]">{lang === 'bn' ? 'পর্যন্ত' : 'To'}</span>
               <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-xs font-bold outline-none flex-1" />
            </div>
         </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden print-area">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-gray-100">
              <tr>
                <th className="px-6 py-5 border-r border-gray-100">{t.date}</th>
                <th className="px-6 py-5 border-r border-gray-100">{t.description}</th>
                <th className="px-6 py-5 border-r border-gray-100">{t.name}</th>
                <th className="px-6 py-5 text-right border-r border-gray-100">{t.amount}</th>
                <th className="px-6 py-5 text-center no-print">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-400 text-xs border-r border-gray-100">{entry.date}</td>
                  <td className="px-6 py-4 font-black text-slate-800 border-r border-gray-100">{entry.description}</td>
                  <td className="px-6 py-4 font-bold text-gray-600 border-r border-gray-100">{entry.name}</td>
                  <td className="px-6 py-4 text-right font-black text-rose-600 text-base border-r border-gray-100">৳{entry.amount}</td>
                  <td className="px-6 py-4 text-center no-print">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(entry)} className="w-10 h-10 flex items-center justify-center text-blue-500 bg-blue-50 rounded-xl hover:bg-blue-500 hover:text-white transition shadow-sm border border-blue-100"><i className="fas fa-edit"></i></button>
                      <button onClick={() => { if(confirm('মুছে ফেলতে চান?')) onDelete(entry.id) }} className="w-10 h-10 flex items-center justify-center text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-500 hover:text-white transition shadow-sm border border-rose-100"><i className="fas fa-trash-can"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50/50">
                 <td colSpan={3} className="px-6 py-5 text-right font-black text-slate-400 uppercase tracking-widest text-xs">{t.total}</td>
                 <td className="px-6 py-5 text-right font-black text-rose-600 text-xl border-l border-gray-100">৳{totalAmount}</td>
                 <td className="no-print border-l border-gray-100"></td>
              </tr>
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-20 text-center flex flex-col items-center"><i className="fas fa-file-invoice text-gray-100 text-6xl mb-4"></i><p className="text-gray-400 font-black italic">{t.noData}</p></div>}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
           <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md space-y-6 animate-scale-in">
              <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                 <h3 className="text-xl font-black text-indigo-900 uppercase tracking-tighter">{editingEntry ? t.editTitle : t.addTitle}</h3>
                 <button type="button" onClick={() => setShowModal(false)} className="text-gray-300 hover:text-rose-600 transition"><i className="fas fa-circle-xmark text-xl"></i></button>
              </div>
              
              <div className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-black uppercase text-indigo-600 mb-1 ml-1">{t.date}</label>
                    <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-indigo-600 mb-1 ml-1">{t.description}</label>
                    <input required placeholder="যেমন: দোকান ভাড়া বা চশমা মেরামত" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-indigo-600 mb-1 ml-1">{t.name}</label>
                    <input placeholder="কারও নাম থাকলে দিন" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-indigo-600 mb-1 ml-1">{t.amount}</label>
                    <input type="number" required placeholder="0.00" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition text-2xl" />
                 </div>
              </div>

              <div className="flex gap-4 pt-4">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest">{t.cancel}</button>
                 <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-900/20">{t.save}</button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};

export default SSS;
