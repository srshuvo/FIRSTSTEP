
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppData, Customer, PaymentLog, StockOut, Product } from '../types';

interface CustomersProps {
  data: AppData;
  onAdd: (c: Customer) => void;
  onUpdate: (c: Customer) => void;
  onDelete: (id: string) => void;
  onPay: (log: PaymentLog) => void;
  onRecordReturn: (log: StockOut) => void;
  onDeleteLog: (id: string) => void;
  onUpdateLog: (log: StockOut) => void;
  onDeletePayment: (id: string) => void;
  onUpdatePayment: (log: PaymentLog) => void;
  lang: 'bn' | 'en';
}

const Customers: React.FC<CustomersProps> = ({ data, onAdd, onUpdate, onDelete, onPay, onRecordReturn, onDeleteLog, onUpdateLog, onDeletePayment, onUpdatePayment, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditLogModal, setShowEditLogModal] = useState(false);
  
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [returningCustomer, setReturningCustomer] = useState<Customer | null>(null);
  const [historyCustomerId, setHistoryCustomerId] = useState<string | null>(null);
  
  const [editingLog, setEditingLog] = useState<StockOut | null>(null);
  const [editingPayment, setEditingPayment] = useState<PaymentLog | null>(null);
  
  const [returnSearchTerm, setReturnSearchTerm] = useState('');
  const [returnFormData, setReturnFormData] = useState({
    productId: '',
    quantity: 0,
    unitPrice: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const [paymentFormData, setPaymentFormData] = useState({
    amount: 0,
    discount: 0,
    note: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [logEditData, setLogEditData] = useState({
    quantity: 0,
    unitPrice: 0,
    paidAmount: 0,
    discount: 0,
    date: ''
  });

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

  const t = {
    title: lang === 'bn' ? 'ক্রেতা তালিকা (Customer List)' : 'Customer List',
    search: lang === 'bn' ? 'নাম বা ফোন দিয়ে খুঁজুন... (Alt+S)' : 'Search Ledger... (Alt+S)',
    newBtn: lang === 'bn' ? 'নতুন ক্রেতা' : 'New Customer',
    totalDue: lang === 'bn' ? 'মোট পাওনা (বাকি)' : 'Total Receivable',
    totalAdvance: lang === 'bn' ? 'মোট অগ্রিম (জমা)' : 'Total Advance',
    name: lang === 'bn' ? 'নাম' : 'Name',
    phone: lang === 'bn' ? 'ফোন' : 'Phone',
    due: lang === 'bn' ? 'পাওনা/জমা' : 'Balance',
    action: lang === 'bn' ? 'অ্যাকশন' : 'Action',
    addTitle: lang === 'bn' ? 'নতুন ক্রেতা যোগ' : 'Add Customer',
    editTitle: lang === 'bn' ? 'প্রোফাইল আপডেট' : 'Update Profile',
    payTitle: lang === 'bn' ? 'বাকি পরিশোধ / জমা' : 'Payment / Advance',
    returnTitle: lang === 'bn' ? 'বিক্রয় ফেরত (Return)' : 'Sales Return',
    historyTitle: lang === 'bn' ? 'লেনদেন হিস্টোরি' : 'Transaction History',
    cancel: lang === 'bn' ? 'বাতিল' : 'Cancel',
    save: lang === 'bn' ? 'সেভ' : 'Save',
    printBtn: lang === 'bn' ? 'রিপোর্ট প্রিন্ট' : 'Print',
    dueLabel: lang === 'bn' ? 'বাকি' : 'Due',
    advanceLabel: lang === 'bn' ? 'অগ্রিম' : 'Advance',
    productSearch: lang === 'bn' ? 'পণ্য খুঁজুন' : 'Search Product',
    qty: lang === 'bn' ? 'পরিমাণ' : 'Quantity',
    price: lang === 'bn' ? 'মূল্য' : 'Price',
    amount: lang === 'bn' ? 'টাকার পরিমাণ' : 'Amount',
    discount: lang === 'bn' ? 'ছাড় (Discount)' : 'Discount',
    note: lang === 'bn' ? 'নোট' : 'Note',
    editLogTitle: lang === 'bn' ? 'বিক্রয় এডিট' : 'Edit Sale',
    paid: lang === 'bn' ? 'পরিশোধ' : 'Paid'
  };

  const filtered = data.customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const stats = useMemo(() => ({
    totalDue: data.customers.filter(c => c.dueAmount > 0).reduce((sum, c) => sum + c.dueAmount, 0),
    totalAdvance: data.customers.filter(c => c.dueAmount < 0).reduce((sum, c) => sum + Math.abs(c.dueAmount), 0)
  }), [data.customers]);

  const currentHistoryCustomer = useMemo(() => {
    return data.customers.find(c => c.id === historyCustomerId) || null;
  }, [historyCustomerId, data.customers]);

  const customerHistory = useMemo(() => {
    if (!historyCustomerId) return [];
    const sales = data.stockOutLogs.filter(l => l.customerId === historyCustomerId).map(l => ({ ...l, type: 'SALE' }));
    const payments = data.paymentLogs.filter(l => l.customerId === historyCustomerId).map(l => ({ ...l, type: 'PAYMENT' }));
    return [...sales, ...payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [historyCustomerId, data.stockOutLogs, data.paymentLogs]);

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

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCustomer || paymentFormData.amount < 0) return;
    
    if (editingPayment) {
      onUpdatePayment({
        ...editingPayment,
        amount: paymentFormData.amount,
        discount: paymentFormData.discount,
        note: paymentFormData.note,
        date: paymentFormData.date
      });
      setEditingPayment(null);
    } else {
      onPay({
        id: Math.random().toString(36).substr(2, 9),
        customerId: payingCustomer.id,
        amount: paymentFormData.amount,
        discount: paymentFormData.discount,
        note: paymentFormData.note,
        date: paymentFormData.date
      });
    }
    
    setShowPayModal(false);
    setPaymentFormData({ amount: 0, discount: 0, note: '', date: new Date().toISOString().split('T')[0] });
  };

  const handleEditLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;
    
    const subtotal = logEditData.quantity * logEditData.unitPrice;
    const total = subtotal - logEditData.discount;
    const dueAdded = total - logEditData.paidAmount;

    onUpdateLog({
      ...editingLog,
      quantity: logEditData.quantity,
      unitPrice: logEditData.unitPrice,
      discount: logEditData.discount,
      paidAmount: logEditData.paidAmount,
      totalPrice: total,
      dueAdded: dueAdded,
      date: logEditData.date
    });
    
    setShowEditLogModal(false);
    setEditingLog(null);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningCustomer || !returnFormData.productId || returnFormData.quantity <= 0) return;
    const prod = data.products.find(p => p.id === returnFormData.productId);
    if (!prod) return;

    const totalValue = returnFormData.quantity * returnFormData.unitPrice;
    
    onRecordReturn({
      id: Math.random().toString(36).substr(2, 9),
      billNumber: `RET-${Date.now().toString().slice(-6)}`,
      productId: returnFormData.productId,
      productName: prod.name,
      productUnit: prod.unit,
      customerId: returningCustomer.id,
      quantity: returnFormData.quantity,
      unitPrice: returnFormData.unitPrice,
      discount: 0,
      totalPrice: totalValue,
      paidAmount: 0,
      dueAdded: -totalValue,
      date: returnFormData.date
    });

    alert(lang === 'bn' ? "ফেরত গ্রহণ সম্পন্ন!" : "Return Processed!");
    setShowReturnModal(false);
    setReturningCustomer(null);
    setReturnFormData({ productId: '', quantity: 0, unitPrice: 0, date: new Date().toISOString().split('T')[0] });
    setReturnSearchTerm('');
  };

  const returnFilteredProducts = useMemo(() => {
    return data.products.filter(p => p.name.toLowerCase().includes(returnSearchTerm.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name));
  }, [data.products, returnSearchTerm]);

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
        <div className="flex gap-2 w-full md:w-auto no-print">
          <button onClick={() => window.print()} className="flex-1 bg-emerald-50 text-emerald-600 px-5 py-3 rounded-2xl font-black flex items-center justify-center gap-2 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition"><i className="fas fa-print"></i> {t.printBtn}</button>
          <button onClick={() => { setEditingCustomer(null); setShowModal(true); }} className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:bg-emerald-700 transition uppercase text-xs tracking-widest">{t.newBtn}</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 no-print">
          <div className="bg-white p-2 sm:p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
              <p className="text-[7px] sm:text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t.totalDue}</p>
              <p className="text-sm sm:text-base font-black text-rose-600">৳{stats.totalDue.toLocaleString()}</p>
          </div>
          <div className="bg-white p-2 sm:p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
              <p className="text-[7px] sm:text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t.totalAdvance}</p>
              <p className="text-sm sm:text-base font-black text-emerald-600">৳{stats.totalAdvance.toLocaleString()}</p>
          </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print-area">
        <div className="hidden print:block p-8 text-center border-b-2 border-emerald-500 bg-emerald-50/10">
           <h2 className="text-3xl font-black text-emerald-900 tracking-tighter uppercase">FIRST STEP - {t.title}</h2>
           <p className="text-[10px] font-bold text-gray-500 mt-2">{new Date().toLocaleDateString()}</p>
           <div className="w-20 h-1 bg-emerald-500 mx-auto mt-2 rounded-full"></div>
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
                  <td onClick={() => { setHistoryCustomerId(c.id); setShowHistoryModal(true); }} className="px-6 py-4 font-black text-gray-800 text-sm cursor-pointer hover:text-emerald-600 transition-colors group">
                    <span className="flex items-center gap-2">
                       {c.name}
                       <i className="fas fa-arrow-right text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-bold">{c.phone}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-black ${c.dueAmount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>৳{Math.abs(c.dueAmount).toLocaleString()}</span>
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-tighter">{c.dueAmount > 0 ? t.dueLabel : t.advanceLabel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center no-print">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => { setReturningCustomer(c); setShowReturnModal(true); }} className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg" title={t.returnTitle}><i className="fas fa-rotate-left"></i></button>
                      <button onClick={() => { setPayingCustomer(c); setEditingPayment(null); setPaymentFormData({ amount: 0, discount: 0, note: '', date: new Date().toISOString().split('T')[0] }); setShowPayModal(true); }} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title={t.payTitle}><i className="fas fa-money-bill-wave"></i></button>
                      <button onClick={() => { setEditingCustomer(c); setShowModal(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title={t.editTitle}><i className="fas fa-edit"></i></button>
                      <button onClick={() => { if(confirm(lang === 'bn' ? 'মুছে ফেলতে চান?' : 'Delete?')) onDelete(c.id) }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg" title="Delete"><i className="fas fa-trash-can"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Optimized Print Footer: Grand totals in smaller layout as requested */}
            <tfoot className="border-t-4 border-black bg-gray-50 font-black print-total-row">
                <tr>
                    <td colSpan={2} className="px-4 py-4 text-[7px] font-black uppercase text-gray-400 align-top">
                        {lang === 'bn' ? 'সর্বমোট হিসাব' : 'Grand Totals Summary'}
                    </td>
                    <td className="px-4 py-4 text-right">
                        <div className="flex flex-col items-end space-y-1">
                           <div className="flex flex-col items-end">
                               <span className="text-[7px] font-black uppercase text-gray-400 tracking-widest">
                                  {lang === 'bn' ? 'মোট পাওনা (বাকি):' : 'Total Due (Receivable):'}
                               </span>
                               <span className="text-base font-black text-rose-600 leading-tight">৳{stats.totalDue.toLocaleString()}</span>
                           </div>
                           <div className="flex flex-col items-end">
                               <span className="text-[7px] font-black uppercase text-gray-400 tracking-widest">
                                  {lang === 'bn' ? 'মোট অগ্রিম (জমা):' : 'Total Advance:'}
                               </span>
                               <span className="text-base font-black text-emerald-700 leading-tight">৳{stats.totalAdvance.toLocaleString()}</span>
                           </div>
                        </div>
                    </td>
                    <td className="no-print"></td>
                </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <form ref={formRef} onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md space-y-6 animate-scale-in">
             <h3 className="text-xl font-black text-emerald-900">{editingCustomer ? t.editTitle : t.addTitle}</h3>
             <div className="space-y-4">
                <input required name="name" defaultValue={editingCustomer?.name || ''} placeholder={t.name} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none" />
                <input required name="phone" defaultValue={editingCustomer?.phone || ''} placeholder={t.phone} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none" />
                <input type="number" name="dueAmount" defaultValue={editingCustomer?.dueAmount || 0} placeholder={t.due} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none" />
             </div>
             <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-xs">{t.cancel}</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl">{t.save}</button>
             </div>
          </form>
        </div>
      )}

      {showPayModal && (
        <div className="fixed inset-0 bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110] no-print">
          <form onSubmit={handlePaySubmit} className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md space-y-6 animate-scale-in">
             <div className="flex justify-between items-center border-b pb-4">
               <h3 className="text-xl font-black text-emerald-900">{editingPayment ? (lang === 'bn' ? 'পেমেন্ট এডিট' : 'Edit Payment') : t.payTitle}</h3>
               <span className="text-xs font-black text-rose-600">Balance: ৳{payingCustomer?.dueAmount?.toLocaleString()}</span>
             </div>
             <div className="space-y-4">
                <div>
                   <label className="text-[10px] font-black text-gray-400 uppercase ml-1">{t.amount}</label>
                   <input required type="number" value={paymentFormData.amount || ''} onChange={e => setPaymentFormData({...paymentFormData, amount: Number(e.target.value)})} className="w-full p-4 bg-gray-50 border rounded-2xl font-black text-2xl" placeholder="0.00" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">{t.discount}</label>
                      <input type="number" value={paymentFormData.discount || ''} onChange={e => setPaymentFormData({...paymentFormData, discount: Number(e.target.value)})} className="w-full p-3 bg-gray-50 border rounded-xl font-bold" />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Date</label>
                      <input type="date" value={paymentFormData.date} onChange={e => setPaymentFormData({...paymentFormData, date: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl font-bold" />
                   </div>
                </div>
                <input placeholder={t.note} value={paymentFormData.note} onChange={e => setPaymentFormData({...paymentFormData, note: e.target.value})} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none" />
             </div>
             <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowPayModal(false)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-xs">{t.cancel}</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl">{t.save}</button>
             </div>
          </form>
        </div>
      )}

      {showEditLogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110] no-print">
          <form onSubmit={handleEditLogSubmit} className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md space-y-6 animate-scale-in">
             <h3 className="text-xl font-black text-emerald-900 border-b pb-4">{t.editLogTitle}</h3>
             <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">{t.qty}</label>
                      <input required type="number" value={logEditData.quantity} onChange={e => setLogEditData({...logEditData, quantity: Number(e.target.value)})} className="w-full p-3 bg-gray-50 border rounded-xl font-bold" />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">{t.price}</label>
                      <input required type="number" value={logEditData.unitPrice} onChange={e => setLogEditData({...logEditData, unitPrice: Number(e.target.value)})} className="w-full p-3 bg-gray-50 border rounded-xl font-bold" />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">{t.discount}</label>
                      <input type="number" value={logEditData.discount} onChange={e => setLogEditData({...logEditData, discount: Number(e.target.value)})} className="w-full p-3 bg-gray-50 border rounded-xl font-bold" />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1">{t.paid}</label>
                      <input type="number" value={logEditData.paidAmount} onChange={e => setLogEditData({...logEditData, paidAmount: Number(e.target.value)})} className="w-full p-3 bg-gray-50 border rounded-xl font-bold" />
                   </div>
                </div>
                <div>
                   <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Date</label>
                   <input type="date" value={logEditData.date} onChange={e => setLogEditData({...logEditData, date: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl font-bold" />
                </div>
             </div>
             <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowEditLogModal(false)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-xs">{t.cancel}</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl">{t.save}</button>
             </div>
          </form>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-scale-in">
             <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-[2rem]">
                <div>
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{currentHistoryCustomer?.name || 'Customer'}</h3>
                   <p className="text-[10px] font-bold text-gray-400 tracking-[0.2em]">{currentHistoryCustomer?.phone || ''}</p>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="w-10 h-10 flex items-center justify-center bg-white border rounded-full text-gray-400 hover:text-rose-500 transition shadow-sm"><i className="fas fa-times"></i></button>
             </div>
             <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {customerHistory.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 italic font-bold">No transactions found</div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                      <tr>
                        <th className="py-3 px-2">Date</th>
                        <th className="py-3 px-2">Details</th>
                        <th className="py-3 px-2 text-right">Amount</th>
                        <th className="py-3 px-2 text-center no-print">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {customerHistory.map((item: any) => (
                        <tr key={item.id} className="text-sm">
                          <td className="py-4 px-2 text-gray-400 font-bold">{item.date}</td>
                          <td className="py-4 px-2">
                            {item.type === 'SALE' ? (
                              <div className="flex flex-col">
                                <span className="font-black text-slate-800 uppercase tracking-tighter">Sale: {item.productName}</span>
                                <span className="text-[10px] font-bold text-gray-400">Bill: {item.billNumber} | {item.quantity} {item.productUnit}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                <span className="font-black text-emerald-600 uppercase tracking-tighter">Payment Received</span>
                                {item.note && <span className="text-[10px] font-bold text-gray-400">{item.note}</span>}
                              </div>
                            )}
                          </td>
                          <td className={`py-4 px-2 text-right font-black ${item.type === 'SALE' ? 'text-rose-600' : 'text-emerald-700'}`}>
                            {item.type === 'SALE' ? `+৳${item.dueAdded}` : `-৳${item.amount}`}
                          </td>
                          <td className="py-4 px-2 text-center no-print">
                             <div className="flex justify-center gap-1">
                                {item.type === 'SALE' ? (
                                  <>
                                    <button onClick={() => { 
                                      setEditingLog(item); 
                                      setLogEditData({
                                        quantity: item.quantity,
                                        unitPrice: item.unitPrice,
                                        paidAmount: item.paidAmount,
                                        discount: item.discount,
                                        date: item.date
                                      }); 
                                      setShowEditLogModal(true); 
                                    }} className="text-blue-500 p-1.5 hover:bg-blue-50 rounded-lg"><i className="fas fa-edit"></i></button>
                                    <button onClick={() => { if(confirm('Delete Sale Log?')) onDeleteLog(item.id) }} className="text-rose-400 p-1.5 hover:bg-rose-50 rounded-lg"><i className="fas fa-trash-can"></i></button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => { 
                                      setPayingCustomer(currentHistoryCustomer); 
                                      setEditingPayment(item); 
                                      setPaymentFormData({ amount: item.amount, discount: item.discount || 0, note: item.note || '', date: item.date }); 
                                      setShowPayModal(true); 
                                    }} className="text-blue-500 p-1.5 hover:bg-blue-50 rounded-lg"><i className="fas fa-edit"></i></button>
                                    <button onClick={() => { if(confirm('Delete Payment Log?')) onDeletePayment(item.id) }} className="text-rose-400 p-1.5 hover:bg-rose-50 rounded-lg"><i className="fas fa-trash-can"></i></button>
                                  </>
                                )}
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
             </div>
             <div className="p-6 bg-slate-900 text-white rounded-b-[2rem] flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Current Balance</span>
                <span className="text-2xl font-black">৳{currentHistoryCustomer?.dueAmount?.toLocaleString()}</span>
             </div>
          </div>
        </div>
      )}

      {showReturnModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <form onSubmit={handleReturnSubmit} className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md space-y-6 animate-scale-in">
             <div className="flex justify-between items-center border-b pb-4">
               <h3 className="text-xl font-black text-orange-600">{t.returnTitle}</h3>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{returningCustomer?.name}</span>
             </div>
             <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-emerald-600 uppercase ml-1">{t.productSearch}</label>
                  <input type="text" placeholder={t.productSearch} value={returnSearchTerm} onChange={e => setReturnSearchTerm(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl font-bold outline-none" />
                </div>
                <select required value={returnFormData.productId} onChange={e => {
                  const p = data.products.find(prod => prod.id === e.target.value);
                  setReturnFormData({...returnFormData, productId: e.target.value, unitPrice: p?.salePrice || 0});
                }} className="w-full p-3 bg-gray-50 border rounded-xl font-bold outline-none">
                  <option value="">-- {t.productSearch} --</option>
                  {returnFilteredProducts.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
                </select>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                     <label className="text-[10px] font-black text-emerald-600 uppercase ml-1">{t.qty}</label>
                     <input required type="number" placeholder={t.qty} value={returnFormData.quantity || ''} onChange={e => setReturnFormData({...returnFormData, quantity: Number(e.target.value)})} className="w-full p-3 bg-gray-50 border rounded-xl font-bold" />
                   </div>
                   <div className="space-y-1">
                     <label className="text-[10px] font-black text-emerald-600 uppercase ml-1">{t.price}</label>
                     <input required type="number" placeholder={t.price} value={returnFormData.unitPrice || ''} onChange={e => setReturnFormData({...returnFormData, unitPrice: Number(e.target.value)})} className="w-full p-3 bg-gray-50 border rounded-xl font-bold" />
                   </div>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex justify-between items-center">
                   <span className="text-xs font-black text-orange-700 uppercase">{lang === 'bn' ? 'ফেরত ভ্যালু:' : 'Return Total:'}</span>
                   <span className="text-lg font-black text-orange-800">৳{(returnFormData.quantity * returnFormData.unitPrice).toLocaleString()}</span>
                </div>
             </div>
             <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowReturnModal(false)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-xs">{t.cancel}</button>
                <button type="submit" className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl">{t.save}</button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Customers;
