import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  const formRef = useRef<HTMLFormElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    name: '',
    amount: 0
  });

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

  const filtered = useMemo(() => {
    return (data.ledgerEntries || [])
      .filter(e => {
        const matchSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) || e.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStart = startDate ? e.date >= startDate : true;
        const matchEnd = endDate ? e.date <= endDate : true;
        return matchSearch && matchStart && matchEnd;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data.ledgerEntries, searchTerm, startDate, endDate]);

  const totalExpense = useMemo(() => filtered.reduce((acc, curr) => acc + (curr.amount || 0), 0), [filtered]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEntry) onUpdate({ ...editingEntry, ...formData });
    else onAdd({ id: Math.random().toString(36).substr(2, 9), ...formData });
    setShowModal(false);
    setEditingEntry(null);
    setFormData({ date: new Date().toISOString().split('T')[0], description: '', name: '', amount: 0 });
  };

  return (
    <div className="space-y-6 animate-scale-in">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 no-print">
        <div>
           <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">{lang === 'bn' ? 'অনন্যা ব্যায় (Ledger)' : 'Ananya Expense Ledger'}</h2>
           <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{lang === 'bn' ? 'ব্যক্তিগত বা দোকানের সকল অতিরিক্ত খরচের হিসাব' : 'General Ledger and Personal Expenses'}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => window.print()} className="px-5 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black uppercase text-xs tracking-widest border border-emerald-100"><i className="fas fa-print mr-2"></i> {lang === 'bn' ? 'রিপোর্ট প্রিন্ট' : 'Print Report'}</button>
          <button onClick={() => { setEditingEntry(null); setShowModal(true); }} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">{lang === 'bn' ? 'নতুন এন্ট্রি' : 'New Entry'}</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 no-print">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">{lang === 'bn' ? 'খুঁজুন... (Alt+S)' : 'Search... (Alt+S)'}</label>
            <input 
              ref={searchInputRef}
              type="text" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full p-2.5 border rounded-xl font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500" 
              placeholder={lang === 'bn' ? 'খুঁজুন...' : 'Search...'} 
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">{lang === 'bn' ? 'হতে' : 'From'}</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2.5 border rounded-xl font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">{lang === 'bn' ? 'পর্যন্ত' : 'To'}</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2.5 border rounded-xl font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100 flex justify-between items-center">
             <span className="text-[10px] font-black uppercase text-rose-400">{lang === 'bn' ? 'মোট খরচ' : 'Total'}</span>
             <span className="text-sm font-black text-rose-600">৳{totalExpense.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden print-area">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-5">{lang === 'bn' ? 'তারিখ' : 'Date'}</th>
              <th className="px-6 py-5">{lang === 'bn' ? 'বিবরণ' : 'Description'}</th>
              <th className="px-6 py-5">{lang === 'bn' ? 'নাম/ক্রেতা' : 'Name/Party'}</th>
              <th className="px-6 py-5 text-right">{lang === 'bn' ? 'টাকার পরিমাণ' : 'Amount'}</th>
              <th className="px-6 py-5 text-center no-print">{lang === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(entry => (
              <tr key={entry.id} className="hover:bg-indigo-50/30 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-400 text-xs">{entry.date}</td>
                <td className="px-6 py-4 font-black text-slate-800">{entry.description}</td>
                <td className="px-6 py-4 font-medium text-slate-500">{entry.name || '-'}</td>
                <td className="px-6 py-4 text-right font-black text-rose-600">৳{entry.amount.toLocaleString()}</td>
                <td className="px-6 py-4 text-center no-print">
                   <div className="flex justify-center gap-1">
                      <button onClick={() => { setEditingEntry(entry); setFormData(entry); setShowModal(true); }} className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg"><i className="fas fa-edit"></i></button>
                      <button onClick={() => { if(confirm(lang === 'bn' ? 'মুছে ফেলতে চান?' : 'Delete?')) onDelete(entry.id) }} className="text-red-500 p-2 hover:bg-red-50 rounded-lg"><i className="fas fa-trash-can"></i></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50">
             <tr>
               <td colSpan={3} className="px-6 py-4 font-black uppercase text-xs text-slate-400">{lang === 'bn' ? 'মোট খরচ' : 'Total Expense'}</td>
               <td className="px-6 py-4 text-right font-black text-rose-600 text-lg">৳{totalExpense.toLocaleString()}</td>
               <td className="no-print"></td>
             </tr>
          </tfoot>
        </table>
        {filtered.length === 0 && (
           <div className="p-20 text-center flex flex-col items-center">
              <i className="fas fa-file-invoice text-gray-100 text-5xl mb-3"></i>
              <p className="text-gray-400 font-black italic">{lang === 'bn' ? 'কোনো এন্ট্রি নেই' : 'No entries found'}</p>
           </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
           <form ref={formRef} onKeyDown={handleKeyDown} onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md space-y-6">
              <h3 className="text-xl font-black text-indigo-900">{editingEntry ? (lang === 'bn' ? 'রেকর্ড এডিট' : 'Edit Record') : (lang === 'bn' ? 'নতুন এন্ট্রি' : 'New Record')}</h3>
              <div className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 ml-1">{lang === 'bn' ? 'তারিখ' : 'Date'}</label>
                    <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold outline-none focus:border-indigo-500" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 ml-1">{lang === 'bn' ? 'বিবরণ' : 'Description'}</label>
                    <input required placeholder={lang === 'bn' ? 'বিবরণ' : 'Description'} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold outline-none focus:border-indigo-500" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 ml-1">{lang === 'bn' ? 'নাম/ক্রেতা' : 'Name/Party'}</label>
                    <input placeholder={lang === 'bn' ? 'নাম/ক্রেতা' : 'Name/Party'} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold outline-none focus:border-indigo-500" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-indigo-400 mb-1 ml-1">{lang === 'bn' ? 'টাকার পরিমাণ' : 'Amount'}</label>
                    <input type="number" required placeholder={lang === 'bn' ? 'টাকার পরিমাণ' : 'Amount'} value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full p-4 bg-gray-50 border-2 rounded-2xl font-bold outline-none focus:border-indigo-500 text-2xl" />
                 </div>
              </div>
              <div className="flex gap-4 pt-4">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-xs tracking-widest">{lang === 'bn' ? 'বাতিল' : 'Cancel'}</button>
                 <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">{lang === 'bn' ? 'সেভ' : 'Save'}</button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};

export default SSS;