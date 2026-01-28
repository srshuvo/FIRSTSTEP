
import React, { useState, useMemo } from 'react';
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
  
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');

  const [editingLog, setEditingLog] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  const [formData, setFormData] = useState({ name: '', phone: '', dueAmount: 0 });
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDiscount, setPaymentDiscount] = useState<number>(0);

  const t = {
    title: lang === 'bn' ? 'কাস্টমার ও বাকির তালিকা' : 'Customer & Due List',
    search: lang === 'bn' ? 'কাস্টমার খুঁজুন (নাম বা ফোন)...' : 'Search Customer (Name or Phone)...',
    newBtn: lang === 'bn' ? 'নতুন কাস্টমার' : 'New Customer',
    totalDue: lang === 'bn' ? 'মোট পাওনা (বাকি)' : 'Total Due',
    totalAdvance: lang === 'bn' ? 'মোট অগ্রিম (জমা)' : 'Total Advance',
    name: lang === 'bn' ? 'নাম' : 'Name',
    phone: lang === 'bn' ? 'ফোন নাম্বার' : 'Phone Number',
    due: lang === 'bn' ? 'মোট পাওনা/জমা' : 'Total Due/Advance',
    action: lang === 'bn' ? 'অ্যাকশন' : 'Action',
    addTitle: lang === 'bn' ? 'নতুন কাস্টমার যোগ' : 'Add New Customer',
    editTitle: lang === 'bn' ? 'কাস্টমার আপডেট' : 'Update Customer',
    payTitle: lang === 'bn' ? 'টাকা জমা নিন' : 'Payment Collection',
    payAmount: lang === 'bn' ? 'পরিশোধের পরিমাণ' : 'Payment Amount',
    payDiscount: lang === 'bn' ? 'ছাড়/মওকুফ' : 'Waiver/Discount',
    currentDue: lang === 'bn' ? 'বর্তমান বাকি' : 'Current Due',
    currentAdvance: lang === 'bn' ? 'বর্তমান অগ্রিম' : 'Current Advance',
    cancel: lang === 'bn' ? 'বাতিল' : 'Cancel',
    save: lang === 'bn' ? 'সংরক্ষণ করুন' : 'Save',
    payBtn: lang === 'bn' ? 'টাকা জমা নিন' : 'Confirm Payment',
    noData: lang === 'bn' ? 'কোনো ডাটা পাওয়া যায়নি' : 'No records found',
    deleteConfirm: lang === 'bn' ? 'মুছে ফেলতে চান?' : 'Delete Customer?',
    deleteBody: lang === 'bn' ? 'আপনি কি নিশ্চিত যে এই কাস্টমারকে তালিকা থেকে সরাবেন?' : 'Are you sure you want to remove this customer?',
    confirmDeleteBtn: lang === 'bn' ? 'হ্যাঁ, সরান' : 'Yes, Remove',
    historyTitle: lang === 'bn' ? 'ব্যক্তিগত লেনদেন খতিয়ান' : 'Customer Ledger',
    date: lang === 'bn' ? 'তারিখ' : 'Date',
    type: lang === 'bn' ? 'ধরন' : 'Type',
    details: lang === 'bn' ? 'বিবরণ' : 'Details',
    amount: lang === 'bn' ? 'টাকার পরিমাণ' : 'Amount',
    discount: lang === 'bn' ? 'ছাড়' : 'Disc.',
    saleType: lang === 'bn' ? 'মাল বিক্রি' : 'Sale',
    paymentType: lang === 'bn' ? 'বাকি শোধ' : 'Payment Recv.',
    printBtn: lang === 'bn' ? 'প্রিন্ট / PDF' : 'Print / PDF',
    shopName: 'FIRST STEP',
    startDate: lang === 'bn' ? 'শুরু' : 'Start',
    endDate: lang === 'bn' ? 'শেষ' : 'End',
    editEntry: lang === 'bn' ? 'লেনদেন এডিট' : 'Edit Entry',
    price: lang === 'bn' ? 'দর' : 'Rate',
    paid: lang === 'bn' ? 'পরিশোধ' : 'Paid',
    total: lang === 'bn' ? 'মোট' : 'Total',
    qty: lang === 'bn' ? 'পরিমাণ' : 'Qty',
    note: lang === 'bn' ? 'নোট / বিবরণ' : 'Note',
    advanceLabel: lang === 'bn' ? 'ওগ্রিম (জমা)' : 'Advance',
    dueLabel: lang === 'bn' ? 'বাকি (পাওনা)' : 'Due'
  };

  const filtered = data.customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const stats = useMemo(() => {
    return {
      totalDue: data.customers.filter(c => c.dueAmount > 0).reduce((sum, c) => sum + c.dueAmount, 0),
      totalAdvance: data.customers.filter(c => c.dueAmount < 0).reduce((sum, c) => sum + Math.abs(c.dueAmount), 0)
    };
  }, [data.customers]);

  const customerHistory = useMemo(() => {
    if (!historyCustomer) return [];
    
    const sales = data.stockOutLogs
      .filter(l => l.customerId === historyCustomer.id)
      .map(l => ({ 
        id: l.id, 
        date: l.date, 
        type: t.saleType, 
        details: `${l.productName} (${l.quantity} ${l.productUnit})`, 
        amount: l.totalPrice,
        discount: l.discount || 0,
        isSale: true,
        raw: l
      }));
    
    const payments = (data.paymentLogs || [])
      .filter(l => l.customerId === historyCustomer.id)
      .map(l => ({ 
        id: l.id, 
        date: l.date, 
        type: t.paymentType, 
        details: l.note || t.paymentType, 
        amount: l.amount,
        discount: l.discount || 0,
        isSale: false,
        raw: l
      }));

    let combined = [...sales, ...payments];

    if (ledgerStartDate) combined = combined.filter(l => l.date >= ledgerStartDate);
    if (ledgerEndDate) combined = combined.filter(l => l.date <= ledgerEndDate);

    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, historyCustomer, lang, ledgerStartDate, ledgerEndDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      onUpdate({ ...editingCustomer, ...formData });
    } else {
      onAdd({ id: Math.random().toString(36).substr(2, 9), ...formData });
    }
    setShowModal(false);
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', dueAmount: 0 });
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payingCustomer) {
      const paymentLog: PaymentLog = {
        id: Math.random().toString(36).substr(2, 9),
        customerId: payingCustomer.id,
        amount: paymentAmount,
        discount: paymentDiscount,
        date: new Date().toISOString().split('T')[0],
        note: lang === 'bn' ? 'টাকা জমা নেওয়া হয়েছে' : 'Payment collected'
      };
      onPay(paymentLog);
    }
    setShowPayModal(false);
    setPayingCustomer(null);
    setPaymentAmount(0);
    setPaymentDiscount(0);
  };

  const openHistoryModal = (c: Customer) => {
    setHistoryCustomer(c);
    setLedgerStartDate('');
    setLedgerEndDate('');
    setShowHistoryModal(true);
  };

  const handleDeleteLogEntry = (log: any) => {
    if (!confirm(lang === 'bn' ? "আপনি কি নিশ্চিত যে এই লেনদেনটি মুছে ফেলবেন?" : "Are you sure?")) return;
    if (log.isSale) onDeleteLog(log.id);
    else onDeletePayment(log.id);
  };

  const handleEditLogEntry = (log: any) => {
    setEditingLog(log);
    setEditFormData({ ...log.raw });
  };

  const handleEntryUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLog.isSale) {
      const subtotal = editFormData.quantity * editFormData.unitPrice;
      const total = subtotal - (editFormData.discount || 0);
      const updated: StockOut = {
        ...editFormData,
        totalPrice: total,
        dueAdded: total - (editFormData.paidAmount || 0)
      };
      onUpdateLog(updated);
    } else {
      const updated: PaymentLog = {
        ...editFormData
      };
      onUpdatePayment(updated);
    }
    setEditingLog(null);
  };

  return (
    <div className="space-y-4">
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
            onClick={() => { setEditingCustomer(null); setFormData({ name: '', phone: '', dueAmount: 0 }); setShowModal(true); }}
            className="flex-1 md:flex-none bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 transition shadow-lg"
          >
            <i className="fas fa-user-plus mr-2"></i> {t.newBtn}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
              <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.totalDue}</p>
                  <p className="text-xl font-black text-red-600">৳{stats.totalDue}</p>
              </div>
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-arrow-up-right-from-square"></i>
              </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
              <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.totalAdvance}</p>
                  <p className="text-xl font-black text-emerald-600">৳{stats.totalAdvance}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-arrow-down-left-and-arrow-up-right-to-center"></i>
              </div>
          </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print-area">
        <div className="hidden print:block p-6 text-center border-b-2 border-emerald-100">
           <h1 className="text-3xl font-black text-emerald-800">FIRST STEP</h1>
           <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{t.title}</p>
           <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleString()}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="p-4">{t.name}</th>
                <th className="p-4">{t.phone}</th>
                <th className="p-4 text-right">{t.due}</th>
                <th className="p-4 text-center no-print">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <button 
                      onClick={() => openHistoryModal(c)}
                      className="font-bold text-emerald-700 hover:text-emerald-900 underline underline-offset-4 decoration-emerald-200 text-left no-print"
                    >
                      {c.name}
                    </button>
                    <span className="hidden print:inline font-bold text-gray-800">{c.name}</span>
                  </td>
                  <td className="p-4 text-gray-500 font-medium">{c.phone}</td>
                  <td className="p-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className={`px-3 py-1 rounded-full text-sm font-black ${c.dueAmount > 0 ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'} print:bg-transparent print:border-none print:text-gray-900`}>
                        ৳{Math.abs(c.dueAmount)}
                      </span>
                      <span className={`text-[10px] font-bold uppercase ${c.dueAmount > 0 ? 'text-red-400' : 'text-emerald-500'}`}>
                        {c.dueAmount > 0 ? t.dueLabel : (c.dueAmount < 0 ? t.advanceLabel : '')}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-center no-print">
                    <div className="flex justify-center gap-1">
                      <button 
                        onClick={() => { setPayingCustomer(c); setPaymentAmount(c.dueAmount > 0 ? c.dueAmount : 0); setPaymentDiscount(0); setShowPayModal(true); }}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title={t.payTitle}
                      >
                        <i className="fas fa-hand-holding-dollar"></i>
                      </button>
                      <button 
                        onClick={() => { 
                          setEditingCustomer(c); 
                          setFormData({ name: c.name, phone: c.phone, dueAmount: c.dueAmount }); 
                          setShowModal(true); 
                        }} 
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                        title={t.editTitle}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        onClick={() => setConfirmDelete({ id: c.id, name: c.name })} 
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
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

      {showHistoryModal && historyCustomer && (
        <div className="fixed inset-0 bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 z-50 overflow-y-auto no-print">
          <div className="bg-white p-6 rounded-2xl w-full max-w-3xl shadow-2xl space-y-4 transform transition-all animate-scale-in flex flex-col min-h-fit md:max-h-[90vh]">
            <div className="flex justify-between items-start border-b pb-4">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-xl">
                   <i className="fas fa-file-invoice"></i>
                </div>
                <div>
                  <h3 className="font-black text-2xl text-emerald-900">{t.historyTitle}</h3>
                  <p className="text-gray-500 font-bold">{historyCustomer.name} ({historyCustomer.phone})</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-black hover:bg-emerald-700 transition flex items-center gap-2 shadow-lg">
                  <i className="fas fa-print"></i> {t.printBtn}
                </button>
                <button onClick={() => setShowHistoryModal(false)} className="text-gray-300 hover:text-red-500 text-3xl transition">
                  <i className="fas fa-times-circle"></i>
                </button>
              </div>
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
            <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-white border-b-2 border-emerald-50 text-[10px] font-black uppercase text-gray-400">
                  <tr>
                    <th className="py-3 px-2">{t.date}</th>
                    <th className="py-3 px-2">{t.type}</th>
                    <th className="py-3 px-2">{t.details}</th>
                    <th className="py-3 px-2 text-right">{t.amount}</th>
                    <th className="py-3 px-2 text-center">{t.action}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customerHistory.map(log => (
                    <tr key={log.id}>
                      <td className="py-3 px-2 font-medium whitespace-nowrap">{log.date}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${log.isSale ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                          {log.type}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                         <p className="font-bold text-gray-700">{log.details}</p>
                         {log.discount > 0 && <p className="text-[10px] text-emerald-600 font-bold">{t.discount}: ৳{log.discount}</p>}
                      </td>
                      <td className={`py-3 px-2 text-right font-black ${log.isSale ? 'text-gray-800' : 'text-emerald-600'}`}>
                        {log.isSale ? '' : '-' }৳{log.amount}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex justify-center gap-1">
                           <button onClick={() => handleEditLogEntry(log)} className="p-1 text-blue-400 hover:text-blue-600 transition" title={t.editEntry}><i className="fas fa-edit"></i></button>
                           <button onClick={() => handleDeleteLogEntry(log)} className="p-1 text-red-400 hover:text-red-600 transition" title="Delete"><i className="fas fa-trash-alt"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pt-4 border-t flex justify-between items-center bg-gray-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
              <span className="text-sm font-black text-gray-500 uppercase tracking-widest">{historyCustomer.dueAmount >= 0 ? t.currentDue : t.currentAdvance}</span>
              <span className={`text-2xl font-black bg-white px-4 py-2 rounded-xl border-2 shadow-sm ${historyCustomer.dueAmount >= 0 ? 'text-red-600 border-red-100' : 'text-emerald-600 border-emerald-100'}`}>
                  ৳{Math.abs(historyCustomer.dueAmount)}
              </span>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl space-y-6 transform transition-all animate-scale-in">
            <h3 className="font-black text-2xl text-emerald-900 flex items-center gap-2">
              <i className="fas fa-user-circle"></i>
              {editingCustomer ? t.editTitle : t.addTitle}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-1 tracking-wider ml-1">{t.name}</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-2 border-gray-100 p-3 rounded-xl font-bold outline-none focus:border-emerald-500 bg-gray-50 text-gray-800" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-1 tracking-wider ml-1">{t.phone}</label>
                <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border-2 border-gray-100 p-3 rounded-xl font-bold outline-none focus:border-emerald-500 bg-gray-50 text-gray-800" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-1 tracking-wider ml-1">{t.due} (৳) (জমা হলে মাইনাস দিন)</label>
                <input type="number" value={formData.dueAmount} onChange={e => setFormData({...formData, dueAmount: Number(e.target.value)})} className="w-full border-2 border-gray-100 p-3 rounded-xl font-bold outline-none focus:border-emerald-500 bg-gray-50 text-gray-800" />
              </div>
              <div className="flex gap-4 mt-8 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-xl font-black hover:bg-gray-200 transition">{t.cancel}</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-black shadow-xl hover:bg-emerald-700 transition">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPayModal && payingCustomer && (
        <div className="fixed inset-0 bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print text-center">
          <div className="bg-white p-8 rounded-2xl w-full max-sm shadow-2xl space-y-6 transform transition-all animate-scale-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto">
              <i className="fas fa-money-bill-wave"></i>
            </div>
            <div>
              <h3 className="font-black text-2xl text-emerald-900">{t.payTitle}</h3>
              <p className="text-gray-500 font-bold">{payingCustomer.name}</p>
            </div>
            <form onSubmit={handlePayment} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase mb-1 ml-1 tracking-wider">{t.payAmount}</label>
                <input required type="number" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} className="w-full border-2 border-emerald-100 p-3 rounded-xl font-black text-emerald-700 outline-none focus:border-emerald-500 text-xl" />
              </div>
              <div>
                <label className="block text-xs font-black text-emerald-600 uppercase mb-1 ml-1 tracking-wider">{t.payDiscount}</label>
                <input type="number" placeholder="0" value={paymentDiscount || ''} onChange={e => setPaymentDiscount(Number(e.target.value))} className="w-full border-2 border-emerald-50 p-3 rounded-xl font-black text-emerald-600 outline-none focus:border-emerald-500" />
              </div>
              
              {/* Contextual helper for the user */}
              <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold text-center border border-blue-100">
                  {lang === 'bn' ? 'বর্তমান ব্যালেন্স:' : 'Current Balance:'} ৳{Math.abs(payingCustomer.dueAmount)} ({payingCustomer.dueAmount > 0 ? t.dueLabel : t.advanceLabel})<br/>
                  <span className="text-emerald-600">
                    {lang === 'bn' ? 'নতুন জমা হবে:' : 'New deposit:'} ৳{paymentAmount + paymentDiscount}
                  </span>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPayModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-black">{t.cancel}</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black shadow-lg">{t.payBtn}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] no-print text-center">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-sm space-y-4 transform transition-all animate-scale-in">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-2">
              <i className="fas fa-user-minus"></i>
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
          <div className="bg-white p-6 rounded-2xl w-full max-md shadow-2xl space-y-4 animate-scale-in">
            <h3 className="text-xl font-black text-emerald-900 flex items-center gap-2 border-b pb-2">
               <i className="fas fa-edit"></i> {t.editEntry}
            </h3>
            <form onSubmit={handleEntryUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1">{t.date}</label>
                <input type="date" value={editFormData.date} onChange={e => setEditFormData({...editFormData, date: e.target.value})} className="w-full border p-2 rounded-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              {editingLog.isSale ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-gray-400 mb-1">{t.qty}</label>
                      <input type="number" value={editFormData.quantity} onChange={e => setEditFormData({...editFormData, quantity: Number(e.target.value)})} className="w-full border p-2 rounded-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-gray-400 mb-1">{t.price}</label>
                      <input type="number" value={editFormData.unitPrice} onChange={e => setEditFormData({...editFormData, unitPrice: Number(e.target.value)})} className="w-full border p-2 rounded-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-emerald-600 mb-1">{t.discount}</label>
                      <input type="number" value={editFormData.discount || 0} onChange={e => setEditFormData({...editFormData, discount: Number(e.target.value)})} className="w-full border p-2 rounded-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-gray-400 mb-1">{t.paid}</label>
                      <input type="number" value={editFormData.paidAmount || 0} onChange={e => setEditFormData({...editFormData, paidAmount: Number(e.target.value)})} className="w-full border p-2 rounded-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-gray-400 mb-1">{t.amount}</label>
                      <input type="number" value={editFormData.amount} onChange={e => setEditFormData({...editFormData, amount: Number(e.target.value)})} className="w-full border p-2 rounded-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-emerald-600 mb-1">{t.discount}</label>
                      <input type="number" value={editFormData.discount || 0} onChange={e => setEditFormData({...editFormData, discount: Number(e.target.value)})} className="w-full border p-2 rounded-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-gray-400 mb-1">{lang === 'bn' ? 'নোট' : 'Note'}</label>
                    <input type="text" value={editFormData.note || ''} onChange={e => setEditFormData({...editFormData, note: e.target.value})} className="w-full border p-2 rounded-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </>
              )}
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

export default Customers;
