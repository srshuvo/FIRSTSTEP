
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppData, Customer, PaymentLog, StockOut } from '../types';

interface CustomersProps {
  data: AppData;
  onAdd: (c: Customer) => void;
  onUpdate: (c: Customer) => void;
  onDelete: (id: string) => void;
  onPay: (log: PaymentLog) => void;
  onDeleteLog: (id: string) => void;
  onUpdateLog: (log: StockOut) => void;
  onDeletePayment: (id: string) => void;
  onUpdatePayment: (log: PaymentLog) => void;
  lang: 'bn' | 'en';
}

const Customers: React.FC<CustomersProps> = ({ data, onAdd, onUpdate, onDelete, onPay, onDeleteLog, onUpdateLog, onDeletePayment, onUpdatePayment, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const t = {
    title: lang === 'bn' ? 'ক্রেতা তালিকা (Customer List)' : 'Customer List',
    search: lang === 'bn' ? 'নাম বা ফোন দিয়ে খুঁজুন...' : 'Search Ledger...',
    newBtn: lang === 'bn' ? 'নতুন ক্রেতা' : 'New Customer',
    totalDue: lang === 'bn' ? 'মোট পাওনা (বাকি)' : 'Total Receivable',
    totalAdvance: lang === 'bn' ? 'মোট অগ্রিম (জমা)' : 'Total Advance',
    name: lang === 'bn' ? 'নাম' : 'Name',
    phone: lang === 'bn' ? 'ফোন' : 'Phone',
    due: lang === 'bn' ? 'পাওনা/জমা' : 'Balance',
    action: lang === 'bn' ? 'অ্যাকশন' : 'Action',
    addTitle: lang === 'bn' ? 'নতুন ক্রেতা যোগ' : 'Add Customer',
    editTitle: lang === 'bn' ? 'প্রোফাইল আপডেট' : 'Update Profile',
    payTitle: lang === 'bn' ? 'পেমেন্ট সংগ্রহ' : 'Collect Payment',
    cancel: lang === 'bn' ? 'বাতিল' : 'Cancel',
    save: lang === 'bn' ? 'সেভ' : 'Save',
    printBtn: lang === 'bn' ? 'রিপোর্ট প্রিন্ট' : 'Print',
    dueLabel: lang === 'bn' ? 'বাকি' : 'Due',
    advanceLabel: lang === 'bn' ? 'অগ্রিম' : 'Advance'
  };

  const filtered = data.customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const stats = useMemo(() => ({
    totalDue: data.customers.filter(c => c.dueAmount > 0).reduce((sum, c) => sum + c.dueAmount, 0),
    totalAdvance: data.customers.filter(c => c.dueAmount < 0).reduce((sum, c) => sum + Math.abs(c.dueAmount), 0)
  }), [data.customers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(formRef.current!);
    const payload = { 
      name: formData.get('name') as string, 
      phone: formData.get('phone') as string, 
      dueAmount: Number(formData.get('dueAmount')) 
    };
    if (editingCustomer) onUpdate({ ...editingCustomer, ...payload });
    else onAdd({ id: Math.random().toString(36).substr(2, 9), ...payload });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <div className="relative w-full md:w-96 search-container">
          <i className="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
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
          <button onClick={() => { setEditingCustomer(null); setShowModal(true); }} className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:bg-emerald-700 transition uppercase text-xs tracking-widest">{t.newBtn}</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 no-print">
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t.totalDue}</p>
              <p className="text-base font-black text-rose-600">৳{stats.totalDue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t.totalAdvance}</p>
              <p className="text-base font-black text-emerald-600">৳{stats.totalAdvance.toLocaleString()}</p>
          </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print-area">
        <div className="hidden print:block p-8 text-center border-b-2 border-emerald-500 bg-emerald-50/10">
           <h2 className="text-2xl font-black text-emerald-900 tracking-tighter uppercase">FIRST STEP - {t.title}</h2>
           <p className="text-[10px] font-bold text-gray-500 mt-1">{new Date().toLocaleDateString()}</p>
           <div className="w-16 h-1 bg-emerald-500 mx-auto mt-2 rounded-full"></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">{t.name}</th>
                <th className="px-6 py-4">{t.phone}</th>
                <th className="px-6 py-4 text-right">{t.due}</th>
                <th className="px-6 py-4 text-center no-print">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3 font-black text-gray-800">{c.name}</td>
                  <td className="px-6 py-3 text-gray-500 font-bold">{c.phone}</td>
                  <td className="px-6 py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`text-xs font-black ${c.dueAmount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>৳{Math.abs(c.dueAmount).toLocaleString()}</span>
                      <span className="text-[8px] font-black uppercase text-gray-400">{c.dueAmount > 0 ? t.dueLabel : t.advanceLabel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center no-print">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => { setEditingCustomer(c); setShowModal(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><i className="fas fa-edit"></i></button>
                      <button onClick={() => { if(confirm(lang === 'bn' ? 'মুছে ফেলতে চান?' : 'Delete?')) onDelete(c.id) }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><i className="fas fa-trash-can"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <form ref={formRef} onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md space-y-6">
             <h3 className="text-xl font-black text-emerald-900">{editingCustomer ? t.editTitle : t.addTitle}</h3>
             <div className="space-y-4">
                <input required name="name" defaultValue={editingCustomer?.name || ''} placeholder={t.name} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" />
                <input required name="phone" defaultValue={editingCustomer?.phone || ''} placeholder={t.phone} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" />
                <input type="number" name="dueAmount" defaultValue={editingCustomer?.dueAmount || 0} placeholder={t.due} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold" />
             </div>
             <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-xs">{t.cancel}</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl">{t.save}</button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Customers;
