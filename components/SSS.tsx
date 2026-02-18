
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

  const t = {
    title: lang === 'bn' ? 'অনন্যা ব্যায় খতিয়ান (Expense Ledger)' : 'Expense Ledger',
    newBtn: lang === 'bn' ? 'নতুন এন্ট্রি' : 'New Entry',
    printBtn: lang === 'bn' ? 'রিপোর্ট প্রিন্ট' : 'Print',
    total: lang === 'bn' ? 'মোট খরচ' : 'Total Expense',
    filterDateStart: lang === 'bn' ? 'শুরুর তারিখ' : 'Start Date',
    filterDateEnd: lang === 'bn' ? 'শেষ তারিখ' : 'End Date'
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

  const uniqueDescriptions = useMemo(() => {
    const descs = (data.ledgerEntries || []).map(e => e.description).filter(d => d && d.trim() !== '');
    return Array.from(new Set(descs)).sort();
  }, [data.ledgerEntries]);

  const totalExpense = useMemo(() => filtered.reduce((acc, curr) => acc + (curr.amount || 0), 0), [filtered]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(formRef.current!);
    const payload = {
      date: formData.get('date') as string,
      description: formData.get('description') as string,
      name: formData.get('name') as string,
      amount: Number(formData.get('amount'))
    };
    if (editingEntry) onUpdate({ ...editingEntry, ...payload });
    else onAdd({ id: Math.random().toString(36).substr(2, 9), ...payload });
    setShowModal(false);
  };

  const isFiltered = startDate !== '' || endDate !== '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 no-print">
        <div>
           <h2 className="text-2xl font-black text-slate-900">{t.title}</h2>
           <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{lang === 'bn' ? 'ব্যক্তিগত বা অতিরিক্ত খরচ' : 'General Expenses'}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto no-print">
          <button onClick={() => window.print()} className="px-5 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-black uppercase text-xs tracking-widest border border-emerald-100 transition"><i className="fas fa-print mr-2"></i> {t.printBtn}</button>
          <button onClick={() => { setEditingEntry(null); setShowModal(true); }} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition active:scale-95">{t.newBtn}</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 no-print search-container">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">{lang === 'bn' ? 'বিবরণ দিয়ে খুঁজুন' : 'Search by Description'}</label>
            <input 
              ref={searchInputRef}
              type="text" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full p-2.5 border rounded-xl font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500" 
              placeholder={lang === 'bn' ? 'খুঁজুন... (Alt+S)' : 'Search... (Alt+S)'} 
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">{t.filterDateStart}</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              className="w-full p-2.5 border rounded-xl font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 text-xs" 
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">{t.filterDateEnd}</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              className="w-full p-2.5 border rounded-xl font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 text-xs" 
            />
          </div>
          <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100 flex justify-between items-center">
             <span className="text-[10px] font-black uppercase text-rose-400">{t.total}</span>
             <span className="text-sm font-black text-rose-600">৳{totalExpense.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {isFiltered && (
        <div className="bg-indigo-600 text-white p-2 rounded-xl text-center text-[10px] font-black uppercase tracking-[0.2em] shadow-lg animate-pulse no-print">
           <i className="fas fa-history mr-2"></i> {startDate || 'শুরু'} থেকে {endDate || 'বর্তমান'} তারিখের রিপোর্ট
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print-area">
        <div className="hidden print:block p-8 text-center border-b-2 border-rose-500 bg-rose-50">
           <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">FIRST STEP - {t.title}</h2>
           <p className="text-[10px] font-bold text-gray-500 mt-1">
             {isFiltered ? (lang === 'bn' ? `${startDate} থেকে ${endDate} তারিখের রিপোর্ট` : `Report from ${startDate} to ${endDate}`) : new Date().toLocaleDateString()}
           </p>
           <div className="w-16 h-1 bg-rose-500 mx-auto mt-2 rounded-full"></div>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Name/Party</th>
              <th className="px-6 py-4 text-right">Amount</th>
              <th className="px-6 py-4 text-center no-print">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(entry => (
              <tr key={entry.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-3 font-bold text-gray-400 text-xs">{entry.date}</td>
                <td className="px-6 py-3 font-black text-slate-800">{entry.description}</td>
                <td className="px-6 py-3 font-medium text-slate-500">{entry.name || '-'}</td>
                <td className="px-6 py-3 text-right font-black text-rose-600">৳{entry.amount.toLocaleString()}</td>
                <td className="px-6 py-3 text-center no-print">
                   <div className="flex justify-center gap-1">
                      <button onClick={() => { setEditingEntry(entry); setShowModal(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"><i className="fas fa-edit"></i></button>
                      <button onClick={() => { if(confirm('Delete?')) onDelete(entry.id) }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"><i className="fas fa-trash-can"></i></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-black bg-slate-50">
             <tr>
               <td colSpan={3} className="px-6 py-4 font-black uppercase text-[10px] text-slate-400">{t.total}</td>
               <td className="px-6 py-4 text-right font-black text-rose-600 text-base">৳{totalExpense.toLocaleString()}</td>
               <td className="no-print"></td>
             </tr>
          </tfoot>
        </table>
        {filtered.length === 0 && <div className="p-10 text-center text-gray-400 italic font-bold">{lang === 'bn' ? 'কোনো এন্ট্রি পাওয়া যায়নি' : 'No entries found'}</div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
           <form ref={formRef} onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md space-y-6 animate-scale-in">
              <h3 className="text-xl font-black text-indigo-900">{editingEntry ? 'রেকর্ড এডিট' : 'নতুন এন্ট্রি'}</h3>
              <div className="space-y-4">
                 <input type="date" required name="date" defaultValue={editingEntry?.date || new Date().toISOString().split('T')[0]} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none" />
                 <input 
                    required 
                    list="desc-suggestions"
                    name="description" 
                    defaultValue={editingEntry?.description || ''} 
                    placeholder="বিবরণ" 
                    className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
                 />
                 <datalist id="desc-suggestions">
                    {uniqueDescriptions.map((d, i) => (
                      <option key={i} value={d} />
                    ))}
                 </datalist>
                 <input name="name" defaultValue={editingEntry?.name || ''} placeholder="নাম/ক্রেতা" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                 <input type="number" required name="amount" defaultValue={editingEntry?.amount || ''} placeholder="টাকার পরিমাণ" className="w-full p-4 bg-gray-50 border rounded-2xl font-bold text-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex gap-4 pt-4">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-xs">বাতিল</button>
                 <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg transition active:scale-95">সেভ</button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};

export default SSS;
