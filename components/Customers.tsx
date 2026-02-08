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
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const payFormRef = useRef<HTMLFormElement>(null);
  const historyFilterRef = useRef<HTMLDivElement>(null);

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

  const handleKeyDownNavigation = (containerRef: React.RefObject<HTMLElement | null>) => (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT';
    const isSelect = target.tagName === 'SELECT';
    const isButton = target.tagName === 'BUTTON';

    // Find all focusable elements within the provided container
    const elements = Array.from(containerRef.current?.querySelectorAll('input, select, button') || [])
      .filter(el => {
        const element = el as HTMLElement;
        return !(element as any).disabled && element.getAttribute('type') !== 'hidden';
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
      const input = target as HTMLInputElement;
      const isAtEnd = !isInput || (input.selectionStart === input.value.length);
      if (isAtEnd && index < elements.length - 1) {
        e.preventDefault();
        elements[index + 1].focus();
      }
    } else if (e.key === 'ArrowLeft') {
      const input = target as HTMLInputElement;
      const isAtStart = !isInput || (input.selectionStart === 0);
      if (isAtStart && index > 0) {
        e.preventDefault();
        elements[index - 1].focus();
      }
    }
  };
  
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');

  const [formData, setFormData] = useState({ name: '', phone: '', dueAmount: 0 });
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDiscount, setPaymentDiscount] = useState<number>(0);

  const t = {
    title: lang === 'bn' ? 'ক্রেতা ও খতিয়ান' : 'Customer Ledger',
    search: lang === 'bn' ? 'নাম বা ফোন দিয়ে খুঁজুন... (Alt+S)' : 'Search Ledger... (Alt+S)',
    newBtn: lang === 'bn' ? 'নতুন ক্রেতা' : 'New Customer',
    totalDue: lang === 'bn' ? 'মোট পাওনা (বাকি)' : 'Total Receivable',
    totalAdvance: lang === 'bn' ? 'মোট অগ্রিম (জমা)' : 'Total Advance',
    name: lang === 'bn' ? 'নাম' : 'Name',
    phone: lang === 'bn' ? 'ফোন নাম্বার' : 'Phone',
    due: lang === 'bn' ? 'পাওনা/জমা' : 'Balance',
    action: lang === 'bn' ? 'অ্যাকশন' : 'Action',
    addTitle: lang === 'bn' ? 'নতুন ক্রেতা যোগ' : 'Add New Customer',
    editTitle: lang === 'bn' ? 'প্রোফাইল আপডেট' : 'Update Profile',
    payTitle: lang === 'bn' ? 'পেমেন্ট সংগ্রহ' : 'Collect Payment',
    payAmount: lang === 'bn' ? 'পরিমাণ' : 'Amount',
    payDiscount: lang === 'bn' ? 'ছাড়' : 'Discount',
    cancel: lang === 'bn' ? 'বাতিল' : 'Cancel',
    save: lang === 'bn' ? 'সেভ' : 'Save',
    payBtn: lang === 'bn' ? 'পেমেন্ট নিশ্চিত করুন' : 'Confirm Payment',
    noData: lang === 'bn' ? 'কোনো ডাটা পাওয়া যায়নি' : 'No results found',
    deleteConfirm: lang === 'bn' ? 'মুছে ফেলতে চান?' : 'Confirm Delete',
    historyTitle: lang === 'bn' ? 'ব্যক্তিগত লেনদেন খতিয়ান' : 'Customer Statement',
    date: lang === 'bn' ? 'তারিখ' : 'Date',
    saleType: lang === 'bn' ? 'বিক্রি' : 'Sale',
    paymentType: lang === 'bn' ? 'পেমেন্ট' : 'Payment',
    printBtn: lang === 'bn' ? 'রিপোর্ট প্রিন্ট' : 'Print Report',
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

  const customerHistory = useMemo(() => {
    if (!historyCustomer) return [];
    const sales = data.stockOutLogs.filter(l => l.customerId === historyCustomer.id).map(l => ({ 
      ...l, type: t.saleType, isSale: true, debit: l.totalPrice, credit: l.paidAmount, details: l.productName 
    }));
    const payments = (data.paymentLogs || []).filter(l => l.customerId === historyCustomer.id).map(l => ({ 
      ...l, type: t.paymentType, isSale: false, debit: 0, credit: (l.amount + (l.discount || 0)), details: l.note || t.paymentType 
    }));
    let combined = [...sales, ...payments] as any[];
    if (ledgerStartDate) combined = combined.filter(l => l.date >= ledgerStartDate);
    if (ledgerEndDate) combined = combined.filter(l => l.date <= ledgerEndDate);
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, historyCustomer, lang, ledgerStartDate, ledgerEndDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) onUpdate({ ...editingCustomer, ...formData });
    else onAdd({ id: Math.random().toString(36).substr(2, 9), ...formData });
    setShowModal(false);
    setEditingCustomer(null);
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payingCustomer) {
      onPay({
        id: Math.random().toString(36).substr(2, 9),
        customerId: payingCustomer.id,
        amount: paymentAmount,
        discount: paymentDiscount,
        date: new Date().toISOString().split('T')[0],
        note: lang === 'bn' ? 'খতিয়ান পেমেন্ট' : 'Ledger Payment'
      });
    }
    setShowPayModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <div className="relative w-full md:w-96">
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
          <button onClick={() => window.print()} className="flex-1 bg-emerald-50 text-emerald-600 px-5 py-3 rounded-2xl font-black flex items-center justify-center gap-2 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition shadow-sm"><i className="fas fa-file-export"></i> {t.printBtn}</button>
          <button onClick={() => { setEditingCustomer(null); setFormData({ name: '', phone: '', dueAmount: 0 }); setShowModal(true); }} className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/10 hover:bg-emerald-700 transition uppercase text-xs tracking-widest active:scale-95"><i className="fas fa-user-plus"></i> {t.newBtn}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex justify-between items-center group hover:border-red-200 transition-all">
              <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.totalDue}</p>
                  <p className="text-2xl font-black text-rose-600">৳{stats.totalDue}</p>
              </div>
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform"><i className="fas fa-hand-holding-dollar"></i></div>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex justify-between items-center group hover:border-emerald-200 transition-all">
              <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.totalAdvance}</p>
                  <p className="text-2xl font-black text-emerald-600">৳{stats.totalAdvance}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform"><i className="fas fa-piggy-bank"></i></div>
          </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden print-area">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">{t.name}</th>
                <th className="px-6 py-5">{t.phone}</th>
                <th className="px-6 py-5 text-right">{t.due}</th>
                <th className="px-6 py-5 text-center no-print">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <button 
                      onClick={() => { setHistoryCustomer(c); setShowHistoryModal(true); }} 
                      className="font-black text-emerald-800 hover:text-emerald-600 underline underline-offset-8 decoration-emerald-200 decoration-2 transition no-print text-left"
                    >
                      {c.name}
                    </button>
                    <span className="hidden print:inline font-black text-gray-800">{c.name}</span>
                  </td>
                  <td className="px-6 py-5 text-gray-500 font-bold">{c.phone}</td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`px-4 py-1.5 rounded-xl text-xs font-black shadow-sm ${c.dueAmount > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>৳{Math.abs(c.dueAmount)}</span>
                      <span className={`text-[9px] font-black uppercase mt-1 tracking-widest ${c.dueAmount > 0 ? t.dueLabel : t.advanceLabel}`}>{c.dueAmount > 0 ? t.dueLabel : t.advanceLabel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center no-print">
                    <div className="flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setPayingCustomer(c); setPaymentAmount(c.dueAmount > 0 ? c.dueAmount : 0); setShowPayModal(true); }} className="w-10 h-10 flex items-center justify-center text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-600 hover:text-white transition shadow-sm border border-emerald-100" title={t.payTitle}><i className="fas fa-wallet"></i></button>
                      <button onClick={() => { setEditingCustomer(c); setFormData({ name: c.name, phone: c.phone, dueAmount: c.dueAmount }); setShowModal(true); }} className="w-10 h-10 flex items-center justify-center text-blue-500 bg-blue-50 rounded-xl hover:bg-blue-500 hover:text-white transition shadow-sm border border-blue-100" title={t.editTitle}><i className="fas fa-user-pen"></i></button>
                      <button onClick={() => { if(confirm(t.deleteConfirm)) onDelete(c.id) }} className="w-10 h-10 flex items-center justify-center text-rose-500 bg-rose-50 rounded-xl hover:bg-rose-500 hover:text-white transition shadow-sm border border-rose-100" title={t.deleteConfirm}><i className="fas fa-trash-can"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="p-20 text-center flex flex-col items-center"><i className="fas fa-address-book text-gray-100 text-6xl mb-4"></i><p className="text-gray-400 font-black italic">{t.noData}</p></div>}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <form ref={formRef} onKeyDown={handleKeyDownNavigation(formRef)} onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md space-y-6 animate-scale-in">
             <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <h3 className="text-xl font-black text-emerald-900 uppercase tracking-tighter">{editingCustomer ? t.editTitle : t.addTitle}</h3>
                <button type="button" onClick={() => setShowModal(false)} className="text-gray-300 hover:text-rose-600 transition"><i className="fas fa-circle-xmark text-xl"></i></button>
             </div>
             <div className="space-y-4">
                <div>
                   <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{t.name}</label>
                   <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition" />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{t.phone}</label>
                   <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition" />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{t.due}</label>
                   <input type="number" value={formData.dueAmount} onChange={e => setFormData({...formData, dueAmount: Number(e.target.value)})} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition" />
                </div>
             </div>
             <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest">{t.cancel}</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-900/20">{t.save}</button>
             </div>
          </form>
        </div>
      )}

      {showPayModal && payingCustomer && (
        <div className="fixed inset-0 bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <form ref={payFormRef} onKeyDown={handleKeyDownNavigation(payFormRef)} onSubmit={handlePayment} className="bg-white p-8 rounded-[2.5rem] shadow-2xl w-full max-w-md space-y-6 animate-scale-in">
             <div className="flex justify-between items-center border-b border-gray-50 pb-4">
                <h3 className="text-xl font-black text-emerald-900 uppercase tracking-tighter">{t.payTitle}</h3>
                <button type="button" onClick={() => setShowPayModal(false)} className="text-gray-300 hover:text-rose-600 transition"><i className="fas fa-circle-xmark text-xl"></i></button>
             </div>
             <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Customer Name</p>
                <p className="text-xl font-black text-emerald-900">{payingCustomer.name}</p>
                <p className="text-xs font-bold text-emerald-600 mt-1">{t.due}: ৳{payingCustomer.dueAmount}</p>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{t.payAmount}</label>
                   <input required type="number" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition" />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">{t.payDiscount}</label>
                   <input type="number" value={paymentDiscount} onChange={e => setPaymentDiscount(Number(e.target.value))} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-emerald-500 transition" />
                </div>
             </div>
             <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-emerald-900/20 transition hover:bg-emerald-700 active:scale-95">{t.payBtn}</button>
          </form>
        </div>
      )}

      {showHistoryModal && historyCustomer && (
        <div className="fixed inset-0 bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white p-8 rounded-[3rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] animate-scale-in">
             <div className="flex justify-between items-start border-b border-gray-100 pb-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-600 text-white rounded-3xl flex items-center justify-center text-2xl shadow-xl shadow-emerald-900/20"><i className="fas fa-file-invoice"></i></div>
                  <div>
                    <h3 className="text-2xl font-black text-emerald-900 leading-tight">{t.historyTitle}</h3>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">{historyCustomer.name} | {historyCustomer.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button onClick={() => window.print()} className="p-3 text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition"><i className="fas fa-print"></i></button>
                   <button onClick={() => setShowHistoryModal(false)} className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-rose-600 transition hover:bg-rose-50 rounded-full"><i className="fas fa-circle-xmark text-2xl"></i></button>
                </div>
             </div>
             
             <div ref={historyFilterRef} onKeyDown={handleKeyDownNavigation(historyFilterRef)} className="grid grid-cols-2 gap-4 mb-6">
                <div>
                   <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">শুরুর তারিখ</label>
                   <input type="date" value={ledgerStartDate} onChange={setLedgerStartDate} className="w-full p-3 bg-gray-50 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase text-emerald-600 mb-1 ml-1">শেষ তারিখ</label>
                   <input type="date" value={ledgerEndDate} onChange={setLedgerEndDate} className="w-full p-3 bg-gray-50 border rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
             </div>

             <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
                <table className="w-full text-left text-sm border-collapse">
                   <thead className="bg-emerald-50 text-[10px] font-black uppercase text-emerald-700 tracking-widest sticky top-0">
                      <tr>
                        <th className="p-4 border-b">তারিখ (Date)</th>
                        <th className="p-4 border-b">বিবরণ (Details)</th>
                        <th className="p-4 border-b text-right">বিক্রি (Sales)</th>
                        <th className="p-4 border-b text-right">পেমেন্ট (Paid)</th>
                        <th className="p-4 border-b text-center no-print">অ্যাকশন</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {customerHistory.map((log: any) => (
                        <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                           <td className="p-4 font-bold text-gray-400 text-xs">{log.date}</td>
                           <td className="p-4 font-black text-gray-700">{log.details}</td>
                           <td className="p-4 text-right font-black text-rose-600">{log.isSale ? `৳${log.debit}` : '-'}</td>
                           <td className="p-4 text-right font-black text-emerald-600">{`৳${log.credit}`}</td>
                           <td className="p-4 text-center no-print">
                              <button onClick={() => { if(confirm('মুছে ফেলতে চান?')) log.isSale ? onDeleteLog(log.id) : onDeletePayment(log.id) }} className="text-rose-300 hover:text-rose-600 transition"><i className="fas fa-trash-can text-xs"></i></button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             
             <div className="mt-6 p-6 bg-slate-900 rounded-3xl flex justify-between items-center text-white">
                <span className="font-black uppercase text-xs tracking-[0.2em]">বর্তমান মোট ব্যালেন্স:</span>
                <span className={`text-2xl font-black ${historyCustomer.dueAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>৳{Math.abs(historyCustomer.dueAmount)} {historyCustomer.dueAmount > 0 ? '(বাকি)' : '(জমা)'}</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;