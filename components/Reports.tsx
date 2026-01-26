
import React, { useState, useMemo } from 'react';
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

  const t = {
    filterTitle: lang === 'bn' ? 'রিপোর্ট ফিল্টার' : 'Report Filters',
    reportType: lang === 'bn' ? 'কিসের রিপোর্ট?' : 'Report Type',
    start: lang === 'bn' ? 'শুরুর তারিখ' : 'Start Date',
    end: lang === 'bn' ? 'শেষ তারিখ' : 'End Date',
    view: lang === 'bn' ? 'রিপোর্ট দেখুন' : 'View Report',
    history: lang === 'bn' ? 'লেনদেন হিস্টোরি' : 'Transaction History',
    date: lang === 'bn' ? 'তারিখ' : 'Date',
    type: lang === 'bn' ? 'ধরন' : 'Type',
    product: lang === 'bn' ? 'পণ্য' : 'Product',
    qty: lang === 'bn' ? 'পরিমাণ' : 'Qty',
    price: lang === 'bn' ? 'দর' : 'Rate',
    total: lang === 'bn' ? 'মোট' : 'Total',
    discount: lang === 'bn' ? 'ছাড়' : 'Disc.',
    all: lang === 'bn' ? 'সব লেনদেন' : 'All Transactions',
    buy: lang === 'bn' ? 'শুধু কেনা' : 'Buy Only',
    sell: lang === 'bn' ? 'শুধু বিক্রি' : 'Sell Only',
    buyLabel: lang === 'bn' ? 'কেনা' : 'Buy',
    sellLabel: lang === 'bn' ? 'বিক্রি' : 'Sell',
    download: lang === 'bn' ? 'Excel ডাউনলোড' : 'Download Excel',
    party: lang === 'bn' ? 'ক্রেতা/সাপ্লায়ার' : 'Customer/Supplier',
    action: lang === 'bn' ? 'অ্যাকশন' : 'Action',
    editTitle: lang === 'bn' ? 'লেনদেন এডিট' : 'Edit Transaction',
    paid: lang === 'bn' ? 'পরিশোধ' : 'Paid',
    cancel: lang === 'bn' ? 'বাতিল' : 'Cancel',
    save: lang === 'bn' ? 'সেভ করুন' : 'Save Changes'
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

  const handleDelete = (log: any) => {
    const msg = lang === 'bn' 
      ? `আপনি কি নিশ্চিত যে এই লেনদেনটি মুছে ফেলবেন? এটি করলে স্টক এবং খতিয়ান স্বয়ংক্রিয়ভাবে সমন্বয় (Reverse) হবে।` 
      : `Are you sure you want to delete this record? This will automatically reverse stock levels and balances.`;
    
    if (confirm(msg)) {
      if (log.type === 'stockIn') onDeleteStockIn(log.id);
      else onDeleteStockOut(log.id);
    }
  };

  const handleEditClick = (log: any) => {
    setEditingLog(log);
    setEditFormData({ ...log });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLog.type === 'stockIn') {
      const updated: StockIn = {
        ...editFormData,
        totalPrice: editFormData.quantity * editFormData.unitPrice
      };
      onUpdateStockIn(updated);
    } else {
      const subtotal = editFormData.quantity * editFormData.unitPrice;
      const total = subtotal - (editFormData.discount || 0);
      const updated: StockOut = {
        ...editFormData,
        totalPrice: total,
        dueAdded: Math.max(0, total - (editFormData.paidAmount || 0))
      };
      onUpdateStockOut(updated);
    }
    setEditingLog(null);
  };

  const exportToExcel = () => {
    let csv = "Date,Type,Party,Product,Quantity,Unit,Rate,Discount,Total\n";
    filteredLogs.forEach((log: any) => {
      csv += `${log.date},${log.typeLabel},${log.partyName},${log.productName || 'Deleted'},${log.quantity},${log.productUnit || ''},${log.unitPrice},${log.discount || 0},${log.totalPrice}\n`;
    });
    
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Report_${filter.startDate}_to_${filter.endDate}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 no-print">
        <h3 className="text-lg font-bold mb-4">{t.filterTitle}</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">{t.reportType}</label>
            <select value={filter.type} onChange={e => setFilter({ ...filter, type: e.target.value })} className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="all">{t.all}</option>
              <option value="stockIn">{t.buy}</option>
              <option value="stockOut">{t.sell}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">{t.start}</label>
            <input type="date" value={filter.startDate} onChange={e => setFilter({...filter, startDate: e.target.value})} className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">{t.end}</label>
            <input type="date" value={filter.endDate} onChange={e => setFilter({...filter, endDate: e.target.value})} className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={exportToExcel} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 transition flex items-center justify-center gap-2">
              <i className="fas fa-file-excel"></i> {t.download}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between">
          <h3 className="font-bold">{t.history}</h3>
          <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-bold">{filteredLogs.length} Records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-100 text-xs font-bold text-gray-600 uppercase">
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
              {filteredLogs.map((log: any) => {
                return (
                  <tr key={log.id} className="text-sm hover:bg-gray-50">
                    <td className="p-4">{log.date}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.type === 'stockIn' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {log.typeLabel}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-emerald-800">{log.partyName}</td>
                    <td className="p-4">{log.productName || 'Deleted'}</td>
                    <td className="p-4">{log.quantity} {log.productUnit || ''}</td>
                    <td className="p-4 text-right font-bold">
                       ৳{log.totalPrice}
                       {log.discount > 0 && <p className="text-[10px] text-emerald-600 font-bold">(-৳{log.discount} {t.discount})</p>}
                    </td>
                    <td className="p-4 text-center no-print">
                      <div className="flex justify-center gap-1">
                        <button 
                          onClick={() => handleEditClick(log)}
                          className="p-2 text-blue-400 hover:text-blue-600 transition-colors"
                          title="Edit Transaction"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          onClick={() => handleDelete(log)}
                          className="p-2 text-red-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {editingLog && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] no-print">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4 animate-scale-in">
            <h3 className="text-xl font-black text-emerald-900 flex items-center gap-2 border-b pb-2">
               <i className="fas fa-edit"></i> {t.editTitle}
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-black uppercase text-gray-400 mb-1">{t.date}</label>
                <input type="date" value={editFormData.date} onChange={e => setEditFormData({...editFormData, date: e.target.value})} className="w-full border p-2 rounded-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
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
              {editingLog.type === 'stockOut' && (
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
              )}
              <div className="pt-2">
                 <p className="text-sm font-bold text-emerald-700 bg-emerald-50 p-2 rounded text-center">
                    {t.total}: ৳{(editFormData.quantity * editFormData.unitPrice) - (editFormData.discount || 0)}
                 </p>
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

export default Reports;