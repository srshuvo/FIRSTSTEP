
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
    return logs.filter(log => {
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
    const cat = data.categories.find(c => c.id === p.categoryId);
    const isSpareParts = cat?.name.toLowerCase().includes('spare parts') || cat?.name.includes('স্পেয়ার পার্টস');
    if (isSpareParts) return (log.unitPrice * log.quantity) * 0.4;
    return (log.unitPrice - (p.costPrice || 0)) * log.quantity;
  };

  const stats = useMemo(() => {
    const sOut = getFilteredLogs(data.stockOutLogs);
    const sIn = getFilteredLogs(data.stockInLogs);
    const payments = getFilteredLogs(data.paymentLogs);

    const totalSales = sOut.reduce((acc, l) => acc + l.totalPrice, 0);
    const totalPurchase = sIn.reduce((acc, l) => acc + l.totalPrice, 0);
    const totalProfit = sOut.reduce((acc, l) => acc + calculateProfit(l), 0) - payments.reduce((acc, l) => acc + (l.discount || 0), 0);
    
    const totalDue = data.customers.reduce((acc, c) => acc + (c.dueAmount > 0 ? c.dueAmount : 0), 0);
    const totalStockValue = data.products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);

    return { 
      totalSales, totalPurchase, totalProfit, 
      totalDue, totalStockValue
    };
  }, [data, dateFilter, customRange]);

  const fullDates = useMemo(() => {
    const date = new Date();
    
    const getFormattedDate = (locale: string, calendar: string) => {
      try {
        const options: Intl.DateTimeFormatOptions = { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        };
        // Explicitly requesting the official Bengali calendar (Bongabdo)
        const formatter = new Intl.DateTimeFormat(`${locale}-u-ca-${calendar}`, options);
        return formatter.format(date);
      } catch (e) {
        return date.toLocaleDateString(locale);
      }
    };

    const en = getFormattedDate('en-GB', 'gregory');
    const bn = getFormattedDate('bn-BD', 'beng'); // Correctly pulls Falgun 1431 etc.
    const ar = getFormattedDate('bn-BD', 'islamic-umalqura');
    
    return { en, bn, ar };
  }, [currentTime]);

  const formatClock = (date: Date) => {
    const hours = (date.getHours() % 12 || 12).toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return { hours, minutes, seconds, ampm };
  };

  const clock = formatClock(currentTime);

  const t = {
    sales: lang === 'bn' ? 'মোট বিক্রি' : "Sales",
    purchase: lang === 'bn' ? 'মোট কেনা' : "Purchase",
    profit: lang === 'bn' ? 'নীট লাভ' : "Profit",
    due: lang === 'bn' ? 'মোট পাওনা (বাকি)' : 'Total Due',
    stockVal: lang === 'bn' ? 'স্টক ভ্যালু' : 'Stock Value',
    stockIntel: lang === 'bn' ? 'স্টক ইনভেন্টরি' : 'Stock Intel',
    filterLabel: lang === 'bn' ? 'ফিল্টার' : 'Filters',
    recentSales: lang === 'bn' ? 'সাম্প্রতিক বিক্রি' : 'Recent Sales',
    engCal: lang === 'bn' ? 'ইংরেজি' : 'English',
    bngCal: lang === 'bn' ? 'বঙ্গাব্দ' : 'Bengali',
    hijCal: lang === 'bn' ? 'হিজরি' : 'Hijri'
  };

  return (
    <div className="space-y-8 animate-scale-in">
      <div className="flex flex-col xl:flex-row justify-between items-center gap-6">
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl font-black text-slate-900 leading-none tracking-tighter neon-text uppercase">FIRST STEP</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse neon-border"></span>
            <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.4em]">Enterprise Khata v2.0</p>
          </div>
        </div>

        <div className="no-print flex flex-wrap items-center gap-3">
          <div className="bg-slate-950 text-emerald-400 px-6 py-4 rounded-[2.5rem] shadow-2xl flex items-center gap-5 border-2 border-slate-800 relative overflow-hidden group min-h-[85px]">
            <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-all"></div>
            <div className="flex flex-col items-center">
              <span className="text-[7px] font-black uppercase text-emerald-800 tracking-[0.4em] mb-1.5 leading-none">Realtime Sync</span>
              <div className="flex items-baseline font-mono-tech text-3xl font-black leading-none tracking-tight">
                <span className="drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]">{clock.hours}</span>
                <span className="mx-1 text-slate-700 animate-pulse">:</span>
                <span className="drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]">{clock.minutes}</span>
                <span className="text-[9px] ml-2 font-black text-emerald-600 uppercase tracking-tighter">{clock.ampm}</span>
              </div>
            </div>
            <div className="w-[1px] h-10 bg-slate-800 rounded-full opacity-50"></div>
            <div className="flex flex-col items-center justify-center">
               <span className="text-xs font-black text-emerald-500 font-mono-tech">{clock.seconds}</span>
               <div className="w-2 h-2 bg-emerald-400/20 rounded-full mt-2 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></div>
               </div>
            </div>
          </div>

          <CalendarCard label={t.engCal} date={fullDates.en} icon="fa-calendar-days" />
          <CalendarCard label={t.bngCal} date={fullDates.bn} icon="fa-language" glow />
          <CalendarCard label={t.hijCal} date={fullDates.ar} icon="fa-moon" />
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md p-3 rounded-[3rem] shadow-sm border border-slate-100 flex flex-wrap gap-2 items-center no-print sticky top-4 z-20">
        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-950 rounded-full border border-slate-800 mr-2">
           <i className="fas fa-microchip text-emerald-500 text-[10px] animate-pulse"></i>
           <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em]">{t.filterLabel}</span>
        </div>
        {['today', '7days', 'month', '6months', '12months', 'custom'].map(f => (
          <button
            key={f}
            onClick={() => setDateFilter(f as any)}
            className={`px-6 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${dateFilter === f ? 'bg-emerald-600 text-white shadow-2xl shadow-emerald-200 scale-105 neon-border' : 'text-slate-500 hover:bg-emerald-50 border border-transparent'}`}
          >
            {lang === 'bn' ? (f === 'today' ? 'আজ' : f === '7days' ? '৭ দিন' : f === 'month' ? '১ মাস' : f === '6months' ? '৬ মাস' : f === '12months' ? '১২ মাস' : 'কাস্টম') : f}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <KPICard title={t.sales} value={`৳${stats.totalSales}`} icon="fa-wallet" color="blue" />
        <KPICard title={t.purchase} value={`৳${stats.totalPurchase}`} icon="fa-cart-flatbed" color="orange" />
        <KPICard title={t.profit} value={`৳${stats.totalProfit.toFixed(0)}`} icon="fa-chart-line" color="emerald" />
        <KPICard title={t.due} value={`৳${stats.totalDue}`} icon="fa-user-clock" color="red" />
        <KPICard title={t.stockVal} value={`৳${stats.totalStockValue}`} icon="fa-boxes-stacked" color="indigo" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <i className="fas fa-layer-group text-8xl text-emerald-600"></i>
          </div>
          <div className="flex justify-between items-center mb-8 relative z-10">
            <h3 className="font-black text-slate-900 text-sm uppercase tracking-[0.2em] flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                 <i className="fas fa-cubes-stacked text-emerald-600 text-sm"></i>
              </div>
              {t.stockIntel}
            </h3>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">Live Asset Tracking</span>
          </div>
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-[0.15em]">
                <tr>
                  <th className="px-6 py-4 rounded-l-3xl">{lang === 'bn' ? 'পণ্যের নাম' : 'Name'}</th>
                  <th className="px-6 py-4 text-center">{lang === 'bn' ? 'স্টক' : 'Qty'}</th>
                  <th className="px-6 py-4 text-center rounded-r-3xl">{lang === 'bn' ? 'স্ট্যাটাস' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.products.slice(0, 6).map(p => {
                  const status = p.stock <= 0 ? 'Empty' : (p.stock <= (p.lowStockThreshold || 10) ? 'Low' : 'OK');
                  const color = status === 'Empty' ? 'bg-rose-500 shadow-rose-100' : (status === 'Low' ? 'bg-amber-500 shadow-amber-100' : 'bg-emerald-500 shadow-emerald-100');
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-6 py-5 font-black text-slate-700">{p.name}</td>
                      <td className="px-6 py-5 text-center font-bold text-slate-500">{p.stock} <span className="text-[9px] uppercase">{p.unit}</span></td>
                      <td className="px-6 py-5 text-center">
                        <span className={`text-[8px] px-4 py-1.5 rounded-xl text-white font-black uppercase shadow-lg inline-block transition-transform group-hover:scale-110 ${color}`}>{status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-slate-100">
             <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-[0.25em] mb-6 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 neon-border"></div>
                {t.recentSales}
             </h3>
             <table className="w-full text-left text-[11px]">
               <tbody className="divide-y divide-slate-50">
                 {data.stockOutLogs.slice(0, 5).map(l => (
                   <tr key={l.id} className="hover:bg-blue-50/30 transition-all group rounded-2xl">
                     <td className="p-4 text-slate-400 font-medium whitespace-nowrap">{l.date}</td>
                     <td className="p-4 font-black text-slate-800">{data.customers.find(c => c.id === l.customerId)?.name || 'Guest'}</td>
                     <td className="p-4 text-right">
                       <span className="font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">৳{l.totalPrice}</span>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
};

const CalendarCard = ({ label, date, icon, glow }: { label: string, date: string, icon: string, glow?: boolean }) => {
  return (
    <div className={`bg-slate-950 ${glow ? 'text-emerald-300 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'text-emerald-400/80 border-slate-800 shadow-xl'} px-6 py-4 rounded-[2.5rem] border-2 flex flex-col items-center justify-center min-w-[155px] min-h-[85px] transition-all duration-300 hover:scale-105 group relative overflow-hidden`}>
      <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-all"></div>
      <div className="flex items-center gap-2 mb-2 opacity-60">
        <i className={`fas ${icon} text-[10px] drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]`}></i>
        <span className="text-[7px] font-black uppercase tracking-[0.3em]">{label}</span>
      </div>
      <p className="text-[11px] font-black tracking-tighter text-center leading-tight drop-shadow-[0_0_8px_rgba(52,211,153,0.4)] whitespace-nowrap">{date}</p>
    </div>
  );
};

const KPICard = ({ title, value, icon, color }: any) => {
  const colorMap: any = {
    blue: 'bg-blue-600 text-blue-700 shadow-blue-100 border-blue-100',
    orange: 'bg-amber-500 text-amber-600 shadow-amber-100 border-amber-100',
    emerald: 'bg-emerald-600 text-emerald-700 shadow-emerald-100 border-emerald-100',
    red: 'bg-rose-500 text-rose-600 shadow-rose-100 border-rose-100',
    indigo: 'bg-indigo-600 text-indigo-700 shadow-indigo-100 border-indigo-100',
  };
  const [bg, text, shadow, border] = colorMap[color].split(' ');
  return (
    <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-slate-100 flex items-center gap-6 hover:shadow-2xl transition-all duration-500 group relative overflow-hidden">
      <div className={`absolute -top-12 -right-12 w-28 h-28 ${bg} opacity-5 rounded-full blur-2xl transition-all group-hover:scale-150`}></div>
      <div className={`w-14 h-14 rounded-[1.8rem] flex items-center justify-center text-xl text-white shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-12 z-10 ${bg}`}>
        <i className={`fas ${icon} tech-icon`}></i>
      </div>
      <div className="z-10">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1.5">{title}</p>
        <p className={`text-2xl font-black tracking-tighter ${text} drop-shadow-sm`}>{value}</p>
      </div>
    </div>
  );
};

export default Dashboard;
