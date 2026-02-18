
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppData, StockIn, StockOut, PaymentLog, LedgerEntry } from '../types';

interface ReportsProps {
  data: AppData;
  onDeleteStockIn: (id: string) => void;
  onDeleteStockOut: (id: string) => void;
  onUpdateStockIn: (log: StockIn) => void;
  onUpdateStockOut: (log: StockOut) => void;
  onDeletePayment: (id: string) => void;
  onUpdatePayment: (log: PaymentLog) => void;
  onDeleteLedgerEntry: (id: string) => void;
  onUpdateLedgerEntry: (log: LedgerEntry) => void;
  lang: 'bn' | 'en';
}

const Reports: React.FC<ReportsProps> = ({ data, onDeleteStockIn, onDeleteStockOut, onUpdateStockIn, onUpdateStockOut, onDeletePayment, onUpdatePayment, onDeleteLedgerEntry, onUpdateLedgerEntry, lang }) => {
  const [filter, setFilter] = useState({
    type: 'all',
    categoryId: 'all',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [editingLog, setEditingLog] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isSearched, setIsSearched] = useState(false);
  
  const filterSelectRef = useRef<HTMLSelectElement>(null);
  const editFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        filterSelectRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const elements = Array.from(editFormRef.current?.elements || []).filter(el => {
      const tag = (el as HTMLElement).tagName;
      return (tag === 'INPUT' || tag === 'SELECT' || tag === 'BUTTON') && !(el as any).disabled;
    }) as HTMLElement[];
    const index = elements.indexOf(target);
    if (index === -1) return;
    if (e.key === 'Enter') {
      if ((target as any).type === 'submit') return;
      e.preventDefault();
      if (index < elements.length - 1) elements[index + 1].focus();
    }
  };

  const t = {
    filterTitle: lang === 'bn' ? 'রিপোর্ট ফিল্টার (Alt+S)' : 'Report Filters (Alt+S)',
    reportType: lang === 'bn' ? 'লেনদেনের ধরন' : 'Transaction Type',
    category: lang === 'bn' ? 'ক্যাটাগরি' : 'Category',
    start: lang === 'bn' ? 'শুরুর তারিখ' : 'Start Date',
    end: lang === 'bn' ? 'শেষ তারিখ' : 'End Date',
    history: lang === 'bn' ? 'লেনদেন হিস্টোরি' : 'Transaction History',
    date: lang === 'bn' ? 'তারিখ' : 'Date',
    type: lang === 'bn' ? 'ধরন' : 'Type',
    product: lang === 'bn' ? 'পণ্য / বিবরণ' : 'Product / Description',
    qty: lang === 'bn' ? 'পরিমাণ' : 'Qty',
    total: lang === 'bn' ? 'টাকার পরিমাণ' : 'Amount',
    discount: lang === 'bn' ? 'ছাড়' : 'Disc.',
    all: lang === 'bn' ? 'সব' : 'All',
    buyLabel: lang === 'bn' ? 'কেনা' : 'Purchase',
    sellLabel: lang === 'bn' ? 'বিক্রি' : 'Sale',
    returnLabel: lang === 'bn' ? 'ফেরত' : 'Return',
    paymentLabel: lang === 'bn' ? 'জমা / পেমেন্ট' : 'Payment',
    expenseLabel: lang === 'bn' ? 'খরচ' : 'Expense',
    print: lang === 'bn' ? 'প্রিন্ট / PDF ডাউনলোড' : 'Print / Download PDF',
    party: lang === 'bn' ? 'ক্রেতা/সাপ্প্লাইয়ার' : 'Party Name',
    action: lang === 'bn' ? 'অ্যাকশন' : 'Action',
    editTitle: lang === 'bn' ? 'লেনদেন এডিট' : 'Edit Entry',
    cancel: lang === 'bn' ? 'বাতিল' : 'Cancel',
    save: lang === 'bn' ? 'সেভ করুন' : 'Save',
    price: lang === 'bn' ? 'দর' : 'Rate',
    paid: lang === 'bn' ? 'পরিশোধ' : 'Paid',
    grandTotal: lang === 'bn' ? 'সর্বমোট' : 'Grand Total'
  };

  const filteredLogs = useMemo(() => {
    let combined: any[] = [];
    
    // Process Stock In
    if (filter.type === 'all' || filter.type === 'stockIn') {
      data.stockInLogs.forEach(l => {
        const prod = data.products.find(p => p.id === l.productId);
        if (filter.categoryId === 'all' || prod?.categoryId === filter.categoryId) {
          combined.push({ 
            ...l, typeLabel: t.buyLabel, type: 'stockIn', colorClass: 'bg-indigo-100 text-indigo-700 border-indigo-200',
            partyName: data.suppliers.find(s => s.id === l.supplierId)?.name || 'N/A'
          });
        }
      });
    }

    // Process Stock Out
    if (filter.type === 'all' || filter.type === 'stockOut') {
      data.stockOutLogs.forEach(l => {
        const prod = data.products.find(p => p.id === l.productId);
        if (filter.categoryId === 'all' || prod?.categoryId === filter.categoryId) {
          const isReturn = l.billNumber?.startsWith('RET-') || l.dueAdded < 0;
          combined.push({
            ...l, typeLabel: isReturn ? t.returnLabel : t.sellLabel, type: 'stockOut',
            colorClass: isReturn ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200',
            partyName: data.customers.find(c => c.id === l.customerId)?.name || 'N/A'
          });
        }
      });
    }

    // Process Payments (Exclude if filtering by Category as payments aren't tied to products)
    if ((filter.type === 'all' || filter.type === 'payment') && filter.categoryId === 'all') {
      combined.push(...data.paymentLogs.map(l => ({
        ...l, typeLabel: t.paymentLabel, type: 'payment', productName: l.note || (lang === 'bn' ? 'পেমেন্ট রিসিভ' : 'Payment Received'),
        productUnit: '', quantity: '-', totalPrice: l.amount, colorClass: 'bg-amber-100 text-amber-700 border-amber-200',
        partyName: data.customers.find(c => c.id === l.customerId)?.name || 'N/A'
      })));
    }

    // Process Expenses (Exclude if filtering by Category as expenses aren't tied to products)
    if ((filter.type === 'all' || filter.type === 'expense') && filter.categoryId === 'all' && data.ledgerEntries) {
      combined.push(...data.ledgerEntries.map(l => ({
        ...l, typeLabel: t.expenseLabel, type: 'expense', productName: l.description, productUnit: '', quantity: '-',
        totalPrice: l.amount, colorClass: 'bg-rose-100 text-rose-700 border-rose-200', partyName: l.name || 'N/A'
      })));
    }

    return combined
      .filter(l => l.date >= filter.startDate && l.date <= filter.endDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, filter, lang]);

  const totalAmount = useMemo(() => {
    return filteredLogs.reduce((acc, log) => acc + Math.abs(log.totalPrice), 0);
  }, [filteredLogs]);

  const totalQuantity = useMemo(() => {
    return filteredLogs.reduce((acc, log) => {
      const qty = parseFloat(log.quantity);
      return isNaN(qty) ? acc : acc + qty;
    }, 0);
  }, [filteredLogs]);

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLog.type === 'stockIn') {
      onUpdateStockIn({ ...editFormData, totalPrice: editFormData.quantity * editFormData.unitPrice });
    } else if (editingLog.type === 'stockOut') {
      const sub = editFormData.quantity * editFormData.unitPrice;
      const tot = sub - (editFormData.discount || 0);
      onUpdateStockOut({ ...editFormData, totalPrice: tot, dueAdded: tot - (editFormData.paidAmount || 0) });
    } else if (editingLog.type === 'payment') {
      onUpdatePayment({ ...editFormData, amount: Number(editFormData.totalPrice) });
    } else if (editingLog.type === 'expense') {
      onUpdateLedgerEntry({ ...editFormData, description: editFormData.productName, amount: Number(editFormData.totalPrice) });
    }
    setEditingLog(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 no-print">
        <h3 className="text-lg font-black text-emerald-900 mb-4 flex items-center gap-2"><i className="fas fa-sliders text-emerald-600"></i> {t.filterTitle}</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{t.reportType}</label>
            <select ref={filterSelectRef} value={filter.type} onChange={e => { setFilter({ ...filter, type: e.target.value }); setIsSearched(true); }} className="w-full border p-2.5 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 border-gray-200 text-xs">
              <option value="all">{lang === 'bn' ? 'সব লেনদেন' : 'All Transactions'}</option>
              <option value="stockIn">{t.buyLabel}</option>
              <option value="stockOut">{t.sellLabel}</option>
              <option value="payment">{t.paymentLabel}</option>
              <option value="expense">{t.expenseLabel}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{t.category}</label>
            <select value={filter.categoryId} onChange={e => { setFilter({ ...filter, categoryId: e.target.value }); setIsSearched(true); }} className="w-full border p-2.5 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 border-gray-200 text-xs">
              <option value="all">{t.all}</option>
              {data.categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{t.start}</label>
            <input type="date" value={filter.startDate} onChange={e => { setFilter({...filter, startDate: e.target.value}); setIsSearched(true); }} className="w-full border p-2.5 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 border-gray-200 text-xs" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{t.end}</label>
            <input type="date" value={filter.endDate} onChange={e => { setFilter({...filter, endDate: e.target.value}); setIsSearched(true); }} className="w-full border p-2.5 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 border-gray-200 text-xs" />
          </div>
          <div className="flex items-end">
            <button onClick={() => window.print()} className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-black hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10 text-xs">
              <i className="fas fa-file-export"></i> {t.print}
            </button>
          </div>
        </div>
      </div>

      {isSearched && (
        <div className="bg-emerald-900 text-white p-2 rounded-xl text-center text-[10px] font-black uppercase tracking-[0.2em] shadow-lg animate-pulse no-print">
           <i className="fas fa-history mr-2"></i> {filter.startDate} থেকে {filter.endDate} তারিখের রিপোর্ট
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print-area">
        <div className="hidden print:block p-8 text-center border-b-2 border-emerald-500 bg-emerald-50/10">
           <h2 className="text-2xl font-black text-emerald-900 tracking-tighter uppercase">FIRST STEP - {t.history}</h2>
           <div className="flex justify-center gap-4 mt-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t.category}: {filter.categoryId === 'all' ? t.all : data.categories.find(c => c.id === filter.categoryId)?.name}</p>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date: {filter.startDate} to {filter.endDate}</p>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
              <tr>
                <th className="p-4">{t.date}</th>
                <th className="p-4">{t.type}</th>
                <th className="p-4">{t.party}</th>
                <th className="p-4">{t.product}</th>
                <th className="p-4">{t.qty}</th>
                <th className="p-4 text-right">{t.total}</th>
                <th className="p-4 text-center no-print">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.map((log: any) => (
                <tr key={log.id} className="text-sm hover:bg-emerald-50/30 transition-colors">
                  <td className="p-4 whitespace-nowrap font-medium text-gray-600">{log.date}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${log.colorClass}`}>
                      {log.typeLabel}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gray-800">{log.partyName}</td>
                  <td className="p-4 font-medium text-gray-700">
                    {log.productName}
                    {log.billNumber && <span className="block text-[8px] text-gray-400 font-black uppercase tracking-tighter">#{log.billNumber}</span>}
                  </td>
                  <td className="p-4 font-black text-gray-600">{log.quantity} {log.productUnit}</td>
                  <td className="p-4 text-right">
                     <span className={`font-black ${log.type === 'stockOut' && !log.billNumber?.startsWith('RET-') ? 'text-emerald-700' : log.type === 'stockIn' || log.type === 'expense' ? 'text-rose-600' : 'text-gray-900'}`}>
                       ৳{Math.abs(log.totalPrice).toLocaleString()}
                     </span>
                  </td>
                  <td className="p-4 text-center no-print">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => { setEditingLog(log); setEditFormData({...log}); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Edit"><i className="fas fa-pen-to-square"></i></button>
                      <button onClick={() => { 
                        if(confirm(lang === 'bn' ? 'মুছে ফেলতে চান?' : 'Delete?')) {
                          if (log.type === 'stockIn') onDeleteStockIn(log.id);
                          else if (log.type === 'stockOut') onDeleteStockOut(log.id);
                          else if (log.type === 'payment') onDeletePayment(log.id);
                          else if (log.type === 'expense') onDeleteLedgerEntry(log.id);
                        }
                      }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete"><i className="fas fa-trash-can"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filteredLogs.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-black font-black">
                <tr>
                  <td colSpan={4} className="p-4 text-[11px] uppercase tracking-widest text-gray-800 text-right">
                    {t.grandTotal}
                  </td>
                  <td className="p-4 font-black text-emerald-800 text-center">
                    {totalQuantity}
                  </td>
                  <td className="p-4 text-right text-lg text-emerald-800">
                    ৳{totalAmount.toLocaleString()}
                  </td>
                  <td className="no-print"></td>
                </tr>
              </tfoot>
            )}
          </table>
          {filteredLogs.length === 0 && <div className="p-20 text-center"><p className="text-gray-400 font-black italic">{lang === 'bn' ? 'কোনো ডাটা পাওয়া যায়নি' : 'No data'}</p></div>}
        </div>
      </div>

      {editingLog && (
        <div className="fixed inset-0 bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] no-print">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
            <h3 className="text-xl font-black text-emerald-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
               <i className="fas fa-file-pen text-emerald-600"></i> {t.editTitle}
            </h3>
            <form ref={editFormRef} onKeyDown={handleKeyDown} onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{t.date}</label>
                <input type="date" value={editFormData.date} onChange={e => setEditFormData({...editFormData, date: e.target.value})} className="w-full border p-2.5 rounded-xl font-bold bg-gray-50 border-gray-200" />
              </div>
              
              {(editingLog.type === 'stockIn' || editingLog.type === 'stockOut') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{t.qty}</label>
                    <input type="number" value={editFormData.quantity} onChange={e => setEditFormData({...editFormData, quantity: Number(e.target.value)})} className="w-full border p-2.5 rounded-xl font-bold bg-gray-50 border-gray-200" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{t.price}</label>
                    <input type="number" value={editFormData.unitPrice} onChange={e => setEditFormData({...editFormData, unitPrice: Number(e.target.value)})} className="w-full border p-2.5 rounded-xl font-bold bg-gray-50 border-gray-200" />
                  </div>
                </div>
              )}

              {(editingLog.type === 'payment' || editingLog.type === 'expense') && (
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{t.total}</label>
                  <input type="number" value={editFormData.totalPrice} onChange={e => setEditFormData({...editFormData, totalPrice: Number(e.target.value)})} className="w-full border p-2.5 rounded-xl font-bold bg-gray-50 border-gray-200" />
                </div>
              )}

              {editingLog.type === 'stockOut' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{t.discount}</label>
                    <input type="number" value={editFormData.discount || 0} onChange={e => setEditFormData({...editFormData, discount: Number(e.target.value)})} className="w-full border p-2.5 rounded-xl font-bold bg-gray-50 border-gray-200" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{t.paid}</label>
                    <input type="number" value={editFormData.paidAmount || 0} onChange={e => setEditFormData({...editFormData, paidAmount: Number(e.target.value)})} className="w-full border p-2.5 rounded-xl font-bold bg-gray-50 border-gray-200" />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-6">
                <button type="button" onClick={() => setEditingLog(null)} className="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-black hover:bg-gray-200 transition">{t.cancel}</button>
                <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black shadow-lg hover:bg-emerald-700 transition">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
