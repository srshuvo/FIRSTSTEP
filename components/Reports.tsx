import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppData, StockIn, StockOut } from '../types';

interface ReportsProps {
  data: AppData;
  onDeleteStockIn: (id: string) => void;
  onDeleteStockOut: (id: string) => void;
  onUpdateStockIn: (log: StockIn) => void;
  onUpdateStockOut: (log: StockOut) => void;
  lang: 'bn' | 'en';
}

const Reports: React.FC<ReportsProps> = ({ data, onDeleteStockIn, onDeleteStockOut, onUpdateStockIn, onUpdateStockOut, lang }) => {
  const [filter, setFilter] = useState({
    type: 'all',
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [editingLog, setEditingLog] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const filterSelectRef = useRef<HTMLSelectElement>(null);

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

  const t = {
    filterTitle: lang === 'bn' ? 'রিপোর্ট ফিল্টার (Alt+S)' : 'Report Filters (Alt+S)',
    reportType: lang === 'bn' ? 'লেনদেনের ধরন' : 'Transaction Type',
    start: lang === 'bn' ? 'শুরুর তারিখ' : 'Start Date',
    end: lang === 'bn' ? 'শেষ তারিখ' : 'End Date',
    history: lang === 'bn' ? 'লেনদেন হিস্টোরি' : 'Transaction History',
    date: lang === 'bn' ? 'তারিখ' : 'Date',
    type: lang === 'bn' ? 'ধরন' : 'Type',
    product: lang === 'bn' ? 'পণ্য' : 'Product',
    qty: lang === 'bn' ? 'পরিমাণ' : 'Qty',
    total: lang === 'bn' ? 'মোট' : 'Total',
    discount: lang === 'bn' ? 'ছাড়' : 'Disc.',
    all: lang === 'bn' ? 'সব লেনদেন' : 'All Transactions',
    buyLabel: lang === 'bn' ? 'কেনা' : 'Buy',
    sellLabel: lang === 'bn' ? 'বিক্রি' : 'Sell',
    print: lang === 'bn' ? 'প্রিন্ট / PDF ডাউনলোড' : 'Print / Download PDF',
    party: lang === 'bn' ? 'ক্রেতা/সাপ্লায়ার' : 'Party Name',
    action: lang === 'bn' ? 'অ্যাকশন' : 'Action',
    editTitle: lang === 'bn' ? 'লেনদেন এডিট' : 'Edit Entry',
    cancel: lang === 'bn' ? 'বাতিল' : 'Cancel',
    save: lang === 'bn' ? 'সেভ করুন' : 'Save',
    price: lang === 'bn' ? 'দর' : 'Rate',
    paid: lang === 'bn' ? 'পরিশোধ' : 'Paid',
    reportSubtitle: lang === 'bn' ? 'ডিজিটাল হিসাব খতিয়ান রিপোর্ট' : 'Digital Accounting Statement'
  };

  const filteredLogs = useMemo(() => {
    let combined: any[] = [];
    if (filter.type === 'all' || filter.type === 'stockIn') {
      combined.push(...data.stockInLogs.map(l => ({ 
        ...l, 
        typeLabel: t.buyLabel, 
        type: 'stockIn',
        partyName: data.suppliers.find(s => s.id === l.supplierId)?.name || 'N/A'
      })));
    }
    if (filter.type === 'all' || filter.type === 'stockOut') {
      combined.push(...data.stockOutLogs.map(l => ({ 
        ...l, 
        typeLabel: t.sellLabel, 
        type: 'stockOut',
        partyName: data.customers.find(c => c.id === l.customerId)?.name || 'N/A'
      })));
    }
    return combined
      .filter(l => l.date >= filter.startDate && l.date <= filter.endDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [data, filter, lang]);

  const handlePrint = () => {
    window.print();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLog.type === 'stockIn') {
      const updated: StockIn = { ...editFormData, totalPrice: editFormData.quantity * editFormData.unitPrice };
      onUpdateStockIn(updated);
    } else {
      const subtotal = editFormData.quantity * editFormData.unitPrice;
      const total = subtotal - (editFormData.discount || 0);
      const updated: StockOut = {
        ...editFormData,
        totalPrice: total,
        dueAdded: total - (editFormData.paidAmount || 0)
      };
      onUpdateStockOut(updated);
    }
    setEditingLog(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 no-print">
        <h3 className="text-lg font-black text-emerald-900 mb-4 flex items-center gap-2">
          <i className="fas fa-sliders text-emerald-600"></i> {t.filterTitle}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{t.reportType}</label>
            <select 
              ref={filterSelectRef}
              value={filter.type} 
              onChange={e => setFilter({ ...filter, type: e.target.value })} 
              className="w-full border p-2.5 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 border-gray-200"
            >
              <option value="all">{t.all}</option>
              <option value="stockIn">{t.buyLabel}</option>
              <option value="stockOut">{t.sellLabel}</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{t.start}</label>
            <input type="date" value={filter.startDate} onChange={e => setFilter({...filter, startDate: e.target.value})} className="w-full border p-2.5 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 border-gray-200" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{t.end}</label>
            <input type="date" value={filter.endDate} onChange={e => setFilter({...filter, endDate: e.target.value})} className="w-full border p-2.5 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50 border-gray-200" />
          </div>
          <div className="flex items-end">
            <button 
              onClick={handlePrint} 
              className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-black hover:bg-emerald-700 transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/10"
            >
              <i className="fas fa-file-export"></i> {t.print}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print-area">
        <div className="hidden print:block p-10 text-center border-b-4 border-emerald-600 mb-6 bg-emerald-50/30">
           <h1 className="text-5xl font-black text-emerald-900 tracking-tighter">FIRST STEP</h1>
           <p className="text-sm font-black text-emerald-600 uppercase tracking-[0.3em] mt-2">{t.reportSubtitle}</p>
           <div className="flex justify-center gap-10 mt-6 text-sm font-bold text-gray-700">
              <span className="bg-white px-4 py-1 rounded-full border border-gray-200">{t.start}: {filter.startDate}</span>
              <span className="bg-white px-4 py-1 rounded-full border border-gray-200">{t.end}: {filter.endDate}</span>
           </div>
        </div>

        <div className="p-5 bg-gray-50 border-b border-gray-100 flex justify-between items-center no-print">
          <h3 className="font-black text-gray-700 uppercase text-xs tracking-widest">{t.history}</h3>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-black uppercase tracking-wider">{filteredLogs.length} Records</span>
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
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${log.type === 'stockIn' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                      {log.typeLabel}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gray-800">{log.partyName}</td>
                  <td className="p-4 font-medium text-gray-700">{log.productName}</td>
                  <td className="p-4 font-black text-gray-600">{log.quantity} {log.productUnit}</td>
                  <td className="p-4 text-right">
                     <span className="font-black text-gray-900">৳{log.totalPrice}</span>
                     {log.discount > 0 && <p className="text-[9px] text-rose-500 font-bold italic">(-৳{log.discount} {t.discount})</p>}
                  </td>
                  <td className="p-4 text-center no-print">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => { setEditingLog(log); setEditFormData({...log}); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Edit"><i className="fas fa-pen-to-square"></i></button>
                      <button onClick={() => { if(confirm('মুছে ফেলতে চান?')) log.type === 'stockIn' ? onDeleteStockIn(log.id) : onDeleteStockOut(log.id) }} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete"><i className="fas fa-trash-can"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLogs.length === 0 && (
            <div className="p-20 text-center">
               <div className="text-gray-200 text-6xl mb-4"><i className="fas fa-file-waveform"></i></div>
               <p className="text-gray-400 font-black italic">{lang === 'bn' ? 'কোনো ডাটা পাওয়া যায়নি' : 'No transaction data available'}</p>
            </div>
          )}
        </div>

        <div className="hidden print:block p-8 bg-gray-50 border-t-2 border-emerald-100">
            <div className="flex justify-between items-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">Generated via FIRST STEP Digital Khata System</p>
                <div className="text-right">
                    <p className="text-sm font-black text-gray-800 uppercase">{lang === 'bn' ? 'মোট লেনদেন' : 'Total Transactions'}: {filteredLogs.length}</p>
                    <p className="text-[9px] text-gray-400 mt-1">{new Date().toLocaleString()}</p>
                </div>
            </div>
        </div>
      </div>

      {editingLog && (
        <div className="fixed inset-0 bg-emerald-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] no-print">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl animate-scale-in">
            <h3 className="text-xl font-black text-emerald-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
               <i className="fas fa-file-pen text-emerald-600"></i> {t.editTitle}
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{t.date}</label>
                  <input type="date" value={editFormData.date} onChange={e => setEditFormData({...editFormData, date: e.target.value})} className="w-full border p-2.5 rounded-xl font-bold bg-gray-50 border-gray-200" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{t.qty}</label>
                  <input type="number" value={editFormData.quantity} onChange={e => setEditFormData({...editFormData, quantity: Number(e.target.value)})} className="w-full border p-2.5 rounded-xl font-bold bg-gray-50 border-gray-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{t.price}</label>
                  <input type="number" value={editFormData.unitPrice} onChange={e => setEditFormData({...editFormData, unitPrice: Number(e.target.value)})} className="w-full border p-2.5 rounded-xl font-bold bg-gray-50 border-gray-200" />
                </div>
                {editingLog.type === 'stockOut' && (
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">{t.discount}</label>
                    <input type="number" value={editFormData.discount || 0} onChange={e => setEditFormData({...editFormData, discount: Number(e.target.value)})} className="w-full border p-2.5 rounded-xl font-bold bg-gray-50 border-gray-200" />
                  </div>
                )}
              </div>
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