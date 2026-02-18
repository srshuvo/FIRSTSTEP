
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AppData, Supplier, StockIn } from '../types';

interface SuppliersProps {
  data: AppData;
  onAdd: (s: Supplier) => void;
  onUpdate: (s: Supplier) => void;
  onDelete: (id: string) => void;
  onDeleteLog: (id: string) => void;
  onUpdateLog: (log: StockIn) => void;
  lang: 'bn' | 'en';
}

const Suppliers: React.FC<SuppliersProps> = ({ data, onAdd, onUpdate, onDelete, onDeleteLog, onUpdateLog, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditLogModal, setShowEditLogModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [historySupplierId, setHistorySupplierId] = useState<string | null>(null);
  const [editingLog, setEditingLog] = useState<StockIn | null>(null);
  
  const [logEditData, setLogEditData] = useState({
    quantity: 0,
    unitPrice: 0,
    date: '',
    billNumber: ''
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
    title: lang === 'bn' ? 'সাপ্লায়ার তালিকা (Supplier List)' : 'Supplier List',
    search: lang === 'bn' ? 'নাম বা ফোন দিয়ে খুঁজুন... (Alt+S)' : 'Search Suppliers... (Alt+S)',
    newBtn: lang === 'bn' ? 'নতুন সাপ্লায়ার' : 'New Vendor',
    name: lang === 'bn' ? 'নাম' : 'Name',
    phone: lang === 'bn' ? 'ফোন' : 'Phone',
    action: lang === 'bn' ? 'অ্যাকশন' : 'Action',
    save: lang === 'bn' ? 'সংরক্ষণ' : 'Save',
    cancel: lang === 'bn' ? 'বাতিল' : 'Cancel',
    printBtn: lang === 'bn' ? 'প্রিন্ট' : 'Print',
    searchByDate: lang === 'bn' ? 'তারিখ অনুযায়ী' : 'Search By Date',
    historyTitle: lang === 'bn' ? 'কেনাকাটার ইতিহাস' : 'Purchase History',
    editLogTitle: lang === 'bn' ? 'ক্রয় এডিট' : 'Edit Purchase',
    qty: lang === 'bn' ? 'পরিমাণ' : 'Qty',
    price: lang === 'bn' ? 'দর' : 'Price'
  };

  const calculateUnitsBought = (supplierId: string, targetDate: string) => {
    let units = 0;
    data.stockInLogs.forEach(log => {
      if (log.supplierId === supplierId && log.date === targetDate) {
        units += log.quantity;
      }
    });
    return units;
  };

  const filtered = useMemo(() => {
    return data.suppliers
      .map(s => ({
        ...s,
        unitsOnDate: calculateUnitsBought(s.id, asOfDate)
      }))
      .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone.includes(searchTerm))
      .sort((a, b) => a.name.localeCompare(b.name, 'bn'));
  }, [data.suppliers, data.stockInLogs, searchTerm, asOfDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(formRef.current!);
    const payload = { 
      name: formData.get('name') as string, 
      phone: formData.get('phone') as string 
    };
    if (editingSupplier) onUpdate({ ...editingSupplier, ...payload });
    else onAdd({ id: Math.random().toString(36).substr(2, 9), ...payload });
    setShowModal(false);
  };

  const currentHistorySupplier = useMemo(() => {
    return data.suppliers.find(s => s.id === historySupplierId) || null;
  }, [historySupplierId, data.suppliers]);

  const supplierHistory = useMemo(() => {
    if (!historySupplierId) return [];
    return data.stockInLogs
      .filter(l => l.supplierId === historySupplierId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [historySupplierId, data.stockInLogs]);

  const handleEditLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog) return;
    
    onUpdateLog({
      ...editingLog,
      quantity: logEditData.quantity,
      unitPrice: logEditData.unitPrice,
      totalPrice: logEditData.quantity * logEditData.unitPrice,
      date: logEditData.date,
      billNumber: logEditData.billNumber
    });
    
    setShowEditLogModal(false);
    setEditingLog(null);
  };

  const isToday = asOfDate === new Date().toISOString().split('T')[0];
  // Banner only shows if searched (date changed from today)
  const showBanner = !isToday;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <div className="relative w-full md:w-80 search-container">
          <i className="fas fa-truck-moving absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            ref={searchInputRef}
            type="text" 
            placeholder={t.search} 
            className="w-full pl-10 pr-4 py-3 border rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        
        <div className="flex flex-col w-full md:w-56">
          <label className="text-[9px] font-black uppercase text-emerald-600 mb-1 ml-1">{t.searchByDate}</label>
          <input 
            type="date" 
            value={asOfDate} 
            onChange={e => setAsOfDate(e.target.value)} 
            className={`w-full px-4 py-3 border rounded-2xl font-bold outline-none focus:ring-2 focus:ring-emerald-500 ${!isToday ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20' : 'bg-white'}`} 
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto no-print">
          <button onClick={() => window.print()} className="flex-1 bg-emerald-50 text-emerald-600 px-5 py-3 rounded-2xl font-black flex items-center justify-center gap-2 border border-emerald-100 hover:bg-emerald-600 hover:text-white transition"><i className="fas fa-print"></i> {t.printBtn}</button>
          <button onClick={() => { setEditingSupplier(null); setShowModal(true); }} className="flex-1 bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl hover:bg-black transition uppercase text-xs tracking-widest">{t.newBtn}</button>
        </div>
      </div>

      {showBanner && (
        <div className="bg-indigo-600 text-white p-2 rounded-xl text-center text-[10px] font-black uppercase tracking-[0.2em] shadow-lg animate-pulse no-print">
           <i className="fas fa-history mr-2"></i> {asOfDate} তারিখের রিপোর্ট
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print-area">
        <div className="hidden print:block p-8 text-center border-b-2 border-slate-900 bg-slate-50">
           <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">FIRST STEP - {t.title}</h2>
           <p className="text-[10px] font-bold text-gray-500 mt-1">{asOfDate} তারিখের রিপোর্ট</p>
           <div className="w-16 h-1 bg-slate-900 mx-auto mt-2 rounded-full"></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-5">{t.name}</th>
                <th className="px-6 py-5">{t.phone}</th>
                <th className="px-6 py-5 text-right">{lang === 'bn' ? 'কেনা পরিমাণ (তারিখ অনুযায়ী)' : 'Units Bought (On Date)'}</th>
                <th className="px-6 py-5 text-center no-print">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td onClick={() => { setHistorySupplierId(s.id); setShowHistoryModal(true); }} className="px-6 py-4 font-black text-slate-900 cursor-pointer hover:text-emerald-600 group">
                    <span className="flex items-center gap-2">
                      {s.name}
                      <i className="fas fa-arrow-right text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-bold">{s.phone}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-3 py-1 rounded-full font-black text-xs ${s.unitsOnDate > 0 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                      {s.unitsOnDate} Units
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center no-print">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => { setEditingSupplier(s); setShowModal(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"><i className="fas fa-edit"></i></button>
                      <button onClick={() => { if(confirm(lang === 'bn' ? 'মুছে ফেলতে চান?' : 'Delete?')) onDelete(s.id) }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"><i className="fas fa-trash-can"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 no-print">
          <form ref={formRef} onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md space-y-6 animate-scale-in">
             <h3 className="text-xl font-black text-slate-900 tracking-tighter uppercase">{editingSupplier ? 'সাপ্লায়ার এডিট' : 'নতুন সাপ্লায়ার যোগ'}</h3>
             <div className="space-y-4">
                <input required name="name" defaultValue={editingSupplier?.name || ''} placeholder={t.name} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none" />
                <input required name="phone" defaultValue={editingSupplier?.phone || ''} placeholder={t.phone} className="w-full p-4 bg-gray-50 border rounded-2xl font-bold outline-none" />
             </div>
             <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-xs">{t.cancel}</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs shadow-xl">{t.save}</button>
             </div>
          </form>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 z-50 no-print">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-scale-in">
             <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-[2rem]">
                <div>
                   <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{currentHistorySupplier?.name || 'Supplier'}</h3>
                   <p className="text-[10px] font-bold text-gray-400 tracking-[0.2em]">{currentHistorySupplier?.phone || ''}</p>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="w-10 h-10 flex items-center justify-center bg-white border rounded-full text-gray-400 hover:text-rose-500 transition shadow-sm"><i className="fas fa-times"></i></button>
             </div>
             <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {supplierHistory.length === 0 ? (
                  <div className="p-12 text-center text-gray-400 italic font-bold">No purchase records found</div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                      <tr>
                        <th className="py-3 px-2">Date</th>
                        <th className="py-3 px-2">Product Name</th>
                        <th className="py-3 px-2 text-center">Quantity</th>
                        <th className="py-3 px-2 text-right">Unit Price</th>
                        <th className="py-3 px-2 text-right">Total</th>
                        <th className="py-3 px-2 text-center no-print">{t.action}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {supplierHistory.map((item: any) => (
                        <tr key={item.id} className="text-sm">
                          <td className="py-4 px-2 text-gray-400 font-bold">{item.date}</td>
                          <td className="py-4 px-2 font-black text-slate-800 uppercase tracking-tighter">
                            {item.productName}
                            {item.billNumber && <span className="block text-[8px] text-gray-400 font-black uppercase tracking-tighter">#{item.billNumber}</span>}
                          </td>
                          <td className="py-4 px-2 text-center font-bold text-slate-500">{item.quantity} {item.productUnit}</td>
                          <td className="py-4 px-2 text-right font-medium text-slate-500">৳{item.unitPrice.toLocaleString()}</td>
                          <td className="py-4 px-2 text-right font-black text-emerald-700">৳{item.totalPrice.toLocaleString()}</td>
                          <td className="py-4 px-2 text-center no-print">
                            <div className="flex justify-center gap-1">
                              <button onClick={() => { 
                                setEditingLog(item); 
                                setLogEditData({ quantity: item.quantity, unitPrice: item.unitPrice, date: item.date, billNumber: item.billNumber || '' }); 
                                setShowEditLogModal(true); 
                              }} className="text-blue-500 p-1.5 hover:bg-blue-50 rounded-lg"><i className="fas fa-edit"></i></button>
                              <button onClick={() => { if(confirm('Delete Purchase Log?')) onDeleteLog(item.id) }} className="text-rose-400 p-1.5 hover:bg-rose-50 rounded-lg"><i className="fas fa-trash-can"></i></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
             </div>
             <div className="p-6 bg-slate-900 text-white rounded-b-[2rem] flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Total Purchased</span>
                <span className="text-2xl font-black">৳{supplierHistory.reduce((acc, curr) => acc + curr.totalPrice, 0).toLocaleString()}</span>
             </div>
          </div>
        </div>
      )}

      {showEditLogModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110] no-print">
          <form onSubmit={handleEditLogSubmit} className="bg-white p-8 rounded-[2rem] shadow-2xl w-full max-w-md space-y-6 animate-scale-in">
             <h3 className="text-xl font-black text-slate-900 border-b pb-4 uppercase tracking-tighter">{t.editLogTitle}</h3>
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
                <div>
                   <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Challan / Bill No</label>
                   <input type="text" value={logEditData.billNumber} onChange={e => setLogEditData({...logEditData, billNumber: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl font-bold" />
                </div>
                <div>
                   <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Date</label>
                   <input type="date" value={logEditData.date} onChange={e => setLogEditData({...logEditData, date: e.target.value})} className="w-full p-3 bg-gray-50 border rounded-xl font-bold" />
                </div>
             </div>
             <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowEditLogModal(false)} className="flex-1 py-4 bg-gray-100 rounded-2xl font-black uppercase text-xs">{t.cancel}</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs shadow-xl">{t.save}</button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
