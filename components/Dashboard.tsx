
import React, { useMemo, useState, useEffect } from 'react';
import { AppData, Product, StockOut } from '../types';

interface DashboardProps {
  data: AppData;
  lang: 'bn' | 'en';
}

const Dashboard: React.FC<DashboardProps> = ({ data, lang }) => {
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'month' | '6months' | '12months' | 'custom'>('today');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const getFilteredLogs = (logs: any[]) => {
    const now = new Date();
    return (logs || []).filter(log => {
      const logDate = new Date(log.date);
      if (dateFilter === 'today') return log.date === todayStr;
      if (dateFilter === '7days') {
        const diff = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
        return diff <= 7;
      }
      if (dateFilter === 'month') return log.date.startsWith(todayStr.slice(0, 7));
      if (dateFilter === '6months') {
        const diff = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
        return diff <= 180;
      }
      if (dateFilter === '12months') {
        const diff = (now.getTime() - logDate.getTime()) / (1000 * 3600 * 24);
        return diff <= 365;
      }
      if (dateFilter === 'custom') return log.date >= customRange.start && log.date <= customRange.end;
      return true;
    });
  };

  const calculateProfit = (log: StockOut) => {
    const p = data.products.find(prod => prod.id === log.productId);
    if (!p) return 0;
    if (log.isSample) return log.paidAmount - ((p.costPrice || 0) * log.quantity);
    const cat = data.categories.find(c => c.id === p.categoryId);
    const isSpareParts = cat?.name.toLowerCase().includes('spare parts') || cat?.name.includes('স্পেয়ার পার্টস');
    if (isSpareParts) return (log.unitPrice * log.quantity) * 0.4;
    return (log.unitPrice - (p.costPrice || 0)) * log.quantity;
  };

  const stats = useMemo(() => {
    const sOut = getFilteredLogs(data.stockOutLogs);
    const sIn = getFilteredLogs(data.stockInLogs);
    const ledgerEntries = getFilteredLogs(data.ledgerEntries || []);
    const payments = getFilteredLogs(data.paymentLogs);

    const totalSales = sOut.reduce((acc, l) => acc + l.totalPrice, 0);
    const totalPurchase = sIn.reduce((acc, l) => acc + l.totalPrice, 0);
    const totalExpenses = ledgerEntries.reduce((acc, l) => acc + (l.amount || 0), 0);
    const grossProfit = sOut.reduce((acc, l) => acc + calculateProfit(l), 0);
    const discountsGiven = payments.reduce((acc, l) => acc + (l.discount || 0), 0);
    const netProfit = grossProfit - discountsGiven - totalExpenses;
    const totalDue = data.customers.reduce((acc, c) => acc + (c.dueAmount > 0 ? c.dueAmount : 0), 0);
    const totalStockValue = data.products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);

    return { totalSales, totalPurchase, netProfit, grossProfit, totalDue, totalStockValue };
  }, [data, dateFilter, customRange]);

  const clock = useMemo(() => {
    const d = currentTime;
    return {
      hours: (d.getHours() % 12 || 12).toString().padStart(2, '0'),
      minutes: d.getMinutes().toString().padStart(2, '0'),
      seconds: d.getSeconds().toString().padStart(2, '0'),
      ampm: d.getHours() >= 12 ? 'PM' : 'AM'
    };
  }, [currentTime]);

  const t = {
    sales: lang === 'bn' ? 'মোট বিক্রি' : "Sales",
    purchase: lang === 'bn' ? 'মোট কেনা' : "Purchase",
    profit: lang === 'bn' ? 'নীট লাভ' : "Net Profit",
    due: lang === 'bn' ? 'মোট পাওনা' : 'Total Due',
    stock: lang === 'bn' ? 'স্টক ভ্যালু' : 'Stock Value',
    recent: lang === 'bn' ? 'সাম্প্রতিক বিক্রি' : 'Recent Sales',
    filters: lang === 'bn' ? 'ফিল্টার' : 'Filters'
  };

  return (
    <div className="space-y-8 animate-scale-in">
      {/* Premium Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="text-center lg:text-left">
          <h1 className="text-5xl font-black text-slate-950 tracking-tighter uppercase neon-text leading-none">FIRST STEP</h1>
          <div className="flex items-center justify-center lg:justify-start gap-2 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.5em]">Enterprise Edition v2.5</p>
          </div>
        </div>

        <div className="bg-slate-950 px-10 py-5 rounded-[3rem] flex items-center gap-8 border-2 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative overflow-hidden group min-w-[320px]">
          <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-all"></div>
          <div className="flex flex-col items-center">
            <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest mb-2">Sync Time</span>
            <div className="flex items-baseline font-mono-tech text-4xl font-black text-emerald-400 leading-none drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]">
              <span>{clock.hours}</span>
              <span className="mx-1 animate-pulse opacity-50">:</span>
              <span>{clock.minutes}</span>
              <span className="text-xs ml-3 text-emerald-600 font-black uppercase tracking-tighter">{clock.ampm}</span>
            </div>
          </div>
          <div className="w-[1px] h-12 bg-slate-800"></div>
          <div className="flex flex-col items-center justify-center">
            <span className="text-lg font-black text-emerald-500/80 font-mono-tech">{clock.seconds}</span>
            <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 animate-ping shadow-[0_0_10px_#10b981]"></div>
          </div>
        </div>
      </div>

      {/* Modern Filter Bar */}
      <div className="bg-white/70 backdrop-blur-xl p-3 rounded-[3rem] border border-slate-200/50 flex flex-wrap gap-2 items-center sticky top-4 z-40 no-print shadow-xl shadow-slate-200/40">
        <div className="px-5 py-3 bg-slate-950 rounded-full flex items-center gap-3">
           <i className="fas fa-microchip text-emerald-500 text-[10px] animate-pulse"></i>
           <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{t.filters}</span>
        </div>
        {['today', '7days', 'month', '6months', '12months'].map(f => (
          <button
            key={f}
            onClick={() => setDateFilter(f as any)}
            className={`px-7 py-3 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${dateFilter === f ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 scale-105 neon-border' : 'text-slate-500 hover:bg-emerald-50 border border-transparent'}`}
          >
            {lang === 'bn' ? (f === 'today' ? 'আজ' : f === '7days' ? '৭ দিন' : f === 'month' ? '১ মাস' : f === '6months' ? '৬ মাস' : '১ বছর') : f}
          </button>
        ))}
      </div>

      {/* KPI Section with Responsive Sizing */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
        <KPICard title={t.sales} value={`৳${stats.totalSales.toLocaleString()}`} icon="fa-wallet" color="bg-blue-600" />
        <KPICard title={t.purchase} value={`৳${stats.totalPurchase.toLocaleString()}`} icon="fa-cart-shopping" color="bg-orange-500" />
        <KPICard title={t.stock} value={`৳${stats.totalStockValue.toLocaleString()}`} icon="fa-cubes-stacked" color="bg-indigo-600" />
        <KPICard title={t.profit} value={`৳${stats.netProfit.toLocaleString()}`} icon="fa-chart-line" color="bg-emerald-600" />
        <KPICard title={t.due} value={`৳${stats.totalDue.toLocaleString()}`} icon="fa-user-clock" color="bg-rose-500" />
        <KPICard title={lang === 'bn' ? 'স্টক আইটেম' : 'Total Items'} value={data.products.length.toString()} icon="fa-tags" color="bg-slate-800" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Inventory Status Card */}
        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-700">
             <i className="fas fa-boxes-packing text-[120px] text-emerald-600"></i>
           </div>
           <div className="flex justify-between items-center mb-10">
             <h3 className="font-black text-slate-900 text-xs uppercase tracking-[0.25em] flex items-center gap-4">
                <div className="w-2 h-8 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]"></div>
                {lang === 'bn' ? 'স্টক ইনভেন্টরি অবস্থা' : 'Stock Inventory Status'}
             </h3>
             <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 tracking-widest uppercase">Live Scan</span>
           </div>
           <div className="space-y-4 relative z-10">
              {data.products.slice(0, 6).map(p => {
                 const isLow = p.stock <= (p.lowStockThreshold || 10);
                 return (
                   <div key={p.id} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-3xl border border-transparent hover:border-emerald-100 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-xl group/item">
                      <div className="flex flex-col">
                         <span className="font-black text-slate-800 text-sm group-hover/item:text-emerald-700 transition-colors">{p.name}</span>
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{p.unit} Base Unit</span>
                      </div>
                      <div className="flex items-center gap-4">
                         <div className="flex flex-col items-end">
                            <span className={`text-sm font-black px-5 py-2 rounded-2xl shadow-inner ${isLow ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                              {p.stock} <span className="text-[10px] opacity-70 ml-1">{p.unit}</span>
                            </span>
                         </div>
                         {isLow && <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></div>}
                      </div>
                   </div>
                 );
              })}
           </div>
        </div>

        {/* Recent Transactions Card */}
        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)]">
           <h3 className="font-black text-slate-900 text-xs uppercase tracking-[0.25em] mb-10 flex items-center gap-4">
              <div className="w-2 h-8 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></div>
              {t.recent}
           </h3>
           <div className="space-y-4">
              {data.stockOutLogs.slice(0, 6).map(l => (
                <div key={l.id} className="flex items-center justify-between p-5 bg-gray-50/50 rounded-3xl border border-transparent hover:border-blue-100 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-xl">
                   <div className="flex flex-col">
                      <span className="font-black text-slate-800 text-sm">{data.customers.find(c => c.id === l.customerId)?.name || 'Walk-in'}</span>
                      <span className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-2">
                        <i className="fas fa-clock text-[8px]"></i> {l.date}
                      </span>
                   </div>
                   <div className="text-right">
                      <span className="text-lg font-black text-emerald-600 font-mono-tech">৳{l.totalPrice.toLocaleString()}</span>
                   </div>
                </div>
              ))}
              {data.stockOutLogs.length === 0 && (
                <div className="text-center py-20 flex flex-col items-center">
                   <i className="fas fa-receipt text-5xl text-gray-100 mb-4"></i>
                   <p className="text-gray-400 italic font-black text-[10px] uppercase tracking-widest">No Recent Transactions Found</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon, color }: any) => {
  const valLen = value?.length || 0;
  let valClass = 'text-3xl';
  if (valLen > 15) valClass = 'text-[11px]';
  else if (valLen > 12) valClass = 'text-sm';
  else if (valLen > 9) valClass = 'text-xl';

  return (
    <div className="bg-white p-6 rounded-[2.8rem] border border-slate-100 shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:scale-[1.03] transition-all duration-500 group overflow-hidden relative flex flex-col min-h-[135px] min-w-0">
      <div className={`absolute -top-12 -right-12 w-32 h-32 ${color} opacity-5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700`}></div>
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center text-white shadow-xl ${color} transition-all duration-500 group-hover:rotate-12 group-hover:scale-110`}>
           <i className={`fas ${icon} text-lg`}></i>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate group-hover:text-slate-600 transition-colors">{title}</p>
        </div>
      </div>
      <p className={`font-black tracking-tighter text-slate-950 leading-none truncate break-all transition-all ${valClass} group-hover:translate-x-1`}>
        {value}
      </p>
    </div>
  );
};

export default Dashboard;
