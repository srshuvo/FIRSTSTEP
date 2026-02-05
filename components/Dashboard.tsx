
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
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-950 tracking-tighter uppercase neon-text">FIRST STEP</h1>
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] mt-1">Enterprise Solution</p>
        </div>

        <div className="bg-slate-950 px-8 py-4 rounded-[2.5rem] flex items-center gap-6 border-2 border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-all"></div>
          <div className="flex flex-col items-center">
            <span className="text-[7px] font-black text-emerald-700 uppercase tracking-widest mb-1.5">System Time</span>
            <div className="flex items-baseline font-mono-tech text-3xl font-black text-emerald-400 leading-none">
              <span>{clock.hours}</span>
              <span className="mx-1 animate-pulse">:</span>
              <span>{clock.minutes}</span>
              <span className="text-[10px] ml-2 text-emerald-600 font-black uppercase">{clock.ampm}</span>
            </div>
          </div>
          <div className="w-[1px] h-10 bg-slate-800"></div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-black text-emerald-500 font-mono-tech">{clock.seconds}</span>
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1 animate-ping"></div>
          </div>
        </div>
      </div>

      <div className="bg-white/50 backdrop-blur-sm p-3 rounded-[2.5rem] border border-slate-100 flex flex-wrap gap-2 items-center sticky top-2 z-10 no-print">
        <div className="px-5 py-2.5 bg-slate-950 rounded-full flex items-center gap-2">
           <i className="fas fa-filter text-emerald-500 text-[10px]"></i>
           <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{t.filters}</span>
        </div>
        {['today', '7days', 'month', '6months', '12months'].map(f => (
          <button
            key={f}
            onClick={() => setDateFilter(f as any)}
            className={`px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${dateFilter === f ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}
          >
            {lang === 'bn' ? (f === 'today' ? 'আজ' : f === '7days' ? '৭ দিন' : f === 'month' ? '১ মাস' : f === '6months' ? '৬ মাস' : '১ বছর') : f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard title={t.sales} value={`৳${stats.totalSales.toLocaleString()}`} icon="fa-wallet" color="bg-blue-600" />
        <KPICard title={t.purchase} value={`৳${stats.totalPurchase.toLocaleString()}`} icon="fa-cart-shopping" color="bg-amber-500" />
        <KPICard title={t.stock} value={`৳${stats.totalStockValue.toLocaleString()}`} icon="fa-boxes-stacked" color="bg-indigo-600" />
        <KPICard title={t.profit} value={`৳${stats.netProfit.toLocaleString()}`} icon="fa-chart-line" color="bg-emerald-600" />
        <KPICard title={t.due} value={`৳${stats.totalDue.toLocaleString()}`} icon="fa-user-clock" color="bg-rose-500" />
        <KPICard title={lang === 'bn' ? 'স্টক আইটেম' : 'Total Items'} value={data.products.length.toString()} icon="fa-layer-group" color="bg-slate-800" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform">
             <i className="fas fa-boxes-packing text-8xl text-emerald-600"></i>
           </div>
           <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest mb-6 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
              {lang === 'bn' ? 'স্টক ইনভেন্টরি অবস্থা' : 'Stock Status'}
           </h3>
           <div className="space-y-4 relative z-10">
              {data.products.slice(0, 5).map(p => {
                 const isLow = p.stock <= (p.lowStockThreshold || 10);
                 return (
                   <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-white transition shadow-sm border border-transparent hover:border-emerald-100">
                      <div className="flex flex-col">
                         <span className="font-black text-slate-800 text-sm">{p.name}</span>
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{p.unit} Base Unit</span>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className={`text-xs font-black px-4 py-1.5 rounded-xl shadow-inner ${isLow ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}`}>
                           {p.stock} {p.unit}
                         </span>
                         {isLow && <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>}
                      </div>
                   </div>
                 );
              })}
           </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
           <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest mb-6 flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
              {t.recent}
           </h3>
           <div className="space-y-4">
              {data.stockOutLogs.slice(0, 5).map(l => (
                <div key={l.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-white transition shadow-sm">
                   <div className="flex flex-col">
                      <span className="font-black text-slate-800 text-sm">{data.customers.find(c => c.id === l.customerId)?.name || 'Walk-in'}</span>
                      <span className="text-[10px] font-bold text-slate-400">{l.date}</span>
                   </div>
                   <span className="text-base font-black text-emerald-600">৳{l.totalPrice.toLocaleString()}</span>
                </div>
              ))}
              {data.stockOutLogs.length === 0 && <p className="text-center py-10 text-gray-400 italic font-bold text-xs uppercase">No Recent Transactions</p>}
           </div>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon, color }: any) => {
  const valLen = value?.length || 0;
  let valClass = 'text-2xl';
  if (valLen > 15) valClass = 'text-xs';
  else if (valLen > 12) valClass = 'text-sm';
  else if (valLen > 10) valClass = 'text-lg';

  return (
    <div className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 group overflow-hidden relative flex flex-col min-h-[110px] min-w-0">
      <div className={`absolute -top-10 -right-10 w-24 h-24 ${color} opacity-5 rounded-full blur-2xl group-hover:scale-150 transition-transform`}></div>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center text-white shadow-lg ${color} transition-transform group-hover:rotate-12`}>
           <i className={`fas ${icon} text-sm`}></i>
        </div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{title}</p>
      </div>
      <p className={`font-black tracking-tighter text-slate-900 leading-none truncate break-all ${valClass}`}>
        {value}
      </p>
    </div>
  );
};

export default Dashboard;
