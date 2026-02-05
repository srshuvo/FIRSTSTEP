
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

    if (log.isSample) {
        const cost = (p.costPrice || 0) * log.quantity;
        return log.paidAmount - cost;
    }

    const cat = data.categories.find(c => c.id === p.categoryId);
    const isSpareParts = cat?.name.toLowerCase().includes('spare parts') || cat?.name.includes('স্পেয়ার পার্টস');
    if (isSpareParts) return (log.unitPrice * log.quantity) * 0.4;
    return (log.unitPrice - (p.costPrice || 0)) * log.quantity;
  };

  const stats = useMemo(() => {
    const sOut = getFilteredLogs(data.stockOutLogs);
    const sIn = getFilteredLogs(data.stockInLogs);
    const payments = getFilteredLogs(data.paymentLogs);
    const ledgerEntries = getFilteredLogs(data.ledgerEntries || []);

    const totalSales = sOut.reduce((acc, l) => acc + l.totalPrice, 0);
    const totalPurchase = sIn.reduce((acc, l) => acc + l.totalPrice, 0);
    const totalExpenses = ledgerEntries.reduce((acc, l) => acc + (l.amount || 0), 0);
    const grossProfit = sOut.reduce((acc, l) => acc + calculateProfit(l), 0);
    const discountsGiven = payments.reduce((acc, l) => acc + (l.discount || 0), 0);
    const netProfit = grossProfit - discountsGiven - totalExpenses;
    const totalDue = data.customers.reduce((acc, c) => acc + (c.dueAmount > 0 ? c.dueAmount : 0), 0);
    const totalStockValue = data.products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);

    return { 
      totalSales, totalPurchase, netProfit, grossProfit,
      totalDue, totalStockValue
    };
  }, [data, dateFilter, customRange]);

  const fullDates = useMemo(() => {
    const now = currentTime;
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const bnMonths = ["বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ন", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"];
    
    const toBn = (n: number | string) => n.toString().split('').map(d => bnDigits[parseInt(d)] || d).join('');

    const getBongabdo = () => {
      const year = now.getFullYear();
      const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      let start = new Date(year, 3, 14);
      if (now < start) start.setFullYear(year - 1);
      const diffInDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const bYear = (now < new Date(year, 3, 14) ? year - 594 : year - 593);
      const monthDays = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, isLeap ? 31 : 30, 30];
      let dayCount = diffInDays + 1;
      let mIdx = 0;
      for (const days of monthDays) {
        if (dayCount <= days) break;
        dayCount -= days;
        mIdx++;
      }
      return `${toBn(dayCount)}-${bnMonths[mIdx]}-${toBn(bYear)}`;
    };

    const getGregorian = () => {
      return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(now);
    };

    const getHijri = () => {
      const hijriOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
      return new Intl.DateTimeFormat('bn-BD-u-ca-islamic-umalqura', hijriOptions).format(now);
    };
    
    return { en: getGregorian(), bn: getBongabdo(), ar: getHijri() };
  }, [currentTime]);

  const clock = useMemo(() => {
    const date = currentTime;
    const hours = (date.getHours() % 12 || 12).toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
    return { hours, minutes, seconds, ampm };
  }, [currentTime]);

  const t = {
    sales: lang === 'bn' ? 'মোট বিক্রি' : "Sales",
    purchase: lang === 'bn' ? 'মোট কেনা' : "Purchase",
    grossProfit: lang === 'bn' ? 'মোট লাভ' : 'Gross Profit',
    netProfit: lang === 'bn' ? 'নীট লাভ' : "Net Profit",
    due: lang === 'bn' ? 'মোট পাওনা' : 'Total Due',
    stockVal: lang === 'bn' ? 'স্টক ভ্যালু' : 'Stock Value',
    stockIntel: lang === 'bn' ? 'স্টক ইনভেন্টরি' : 'Stock Intel',
    filterLabel: lang === 'bn' ? 'ফিল্টার' : 'Filters',
    recentSales: lang === 'bn' ? 'সাম্প্রতিক বিক্রি' : 'Recent Sales',
    engCal: lang === 'bn' ? 'ইংরেজি' : 'English',
    bngCal: lang === 'bn' ? 'বাংলা' : 'Bengali',
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
              <span className="text-[7px] font-black uppercase text-emerald-800 tracking-[0.4em] mb-1.5 leading-none">System Sync</span>
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

      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5">
        <KPICard title={t.sales} value={`৳${stats.totalSales.toLocaleString()}`} icon="fa-wallet" color="blue" />
        <KPICard title={t.purchase} value={`৳${stats.totalPurchase.toLocaleString()}`} icon="fa-cart-flatbed" color="orange" />
        <KPICard title={t.stockVal} value={`৳${stats.totalStockValue.toLocaleString()}`} icon="fa-boxes-stacked" color="indigo" />
        <KPICard title={t.grossProfit} value={`৳${stats.grossProfit.toLocaleString()}`} icon="fa-money-bill-trend-up" color="emerald-light" />
        <KPICard title={t.netProfit} value={`৳${stats.netProfit.toLocaleString()}`} icon="fa-chart-line" color="emerald" />
        <KPICard title={t.due} value={`৳${stats.totalDue.toLocaleString()}`} icon="fa-user-clock" color="red" />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-slate-100 relative overflow-hidden group h-fit">
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
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100">Live Status</span>
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
                {data.products.slice(0, 8).map(p => {
                  const status = p.stock <= 0 ? 'Empty' : (p.stock <= (p.lowStockThreshold || 10) ? 'Low' : 'OK');
                  const color = status === 'Empty' ? 'bg-rose-500 shadow-rose-100' : (status === 'Low' ? 'bg-amber-500 shadow-amber-100' : 'bg-emerald-500 shadow-emerald-100');
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-6 py-5 font-black text-slate-700">{p.name}</td>
                      <td className="px-6 py-5 text-center font-bold text-slate-500">{p.stock} <span className="text-[9px] uppercase">{p.unit}</span></td>
                      <td className="px-6 py-5 text-center">
                        <span className={`text-[8px] px-4 py-1.5 rounded-xl text-white font-black uppercase shadow-lg inline-block ${color}`}>{status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-slate-100 h-full">
             <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-[0.25em] mb-6 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 neon-border"></div>
                {t.recentSales}
             </h3>
             <div className="space-y-4">
                 {data.stockOutLogs.slice(0, 6).map(l => (
                   <div key={l.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-lg hover:border-blue-100 border border-transparent transition-all group">
                     <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800">{data.customers.find(c => c.id === l.customerId)?.name || 'Guest'}</span>
                        <span className="text-[10px] font-bold text-slate-400">{l.date}</span>
                     </div>
                     <span className="font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">৳{l.totalPrice.toLocaleString()}</span>
                   </div>
                 ))}
                 {data.stockOutLogs.length === 0 && (
                   <p className="text-center py-10 text-gray-400 italic text-xs font-bold">No recent sales records.</p>
                 )}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const CalendarCard = ({ label, date, icon, glow }: { label: string, date: string, icon: string, glow?: boolean }) => {
  return (
    <div className={`bg-slate-950 ${glow ? 'text-emerald-300 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'text-emerald-400/80 border-slate-800 shadow-xl'} px-6 py-4 rounded-[2.5rem] border-2 flex flex-col items-center justify-center min-w-[170px] min-h-[85px] transition-all duration-300 hover:scale-105 group relative overflow-hidden`}>
      <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-all"></div>
      <div className="flex items-center gap-2 mb-2 opacity-60">
        <i className={`fas ${icon} text-[10px]`}></i>
        <span className="text-[7px] font-black uppercase tracking-[0.3em]">{label}</span>
      </div>
      <p className="text-[12px] font-black tracking-tighter text-center leading-tight whitespace-nowrap">{date}</p>
    </div>
  );
};

const KPICard = ({ title, value, icon, color }: any) => {
  const colorMap: any = {
    blue: 'bg-blue-600 text-blue-700 shadow-blue-100',
    orange: 'bg-amber-500 text-amber-600 shadow-amber-100',
    emerald: 'bg-emerald-600 text-emerald-700 shadow-emerald-100',
    'emerald-light': 'bg-emerald-400 text-emerald-500 shadow-emerald-50',
    red: 'bg-rose-500 text-rose-600 shadow-rose-100',
    indigo: 'bg-indigo-600 text-indigo-700 shadow-indigo-100',
  };
  const [bg, text, shadow] = colorMap[color].split(' ');
  
  const valLen = value?.length || 0;
  let valClass = 'text-xl sm:text-2xl';
  if (valLen > 15) valClass = 'text-[11px] sm:text-sm';
  else if (valLen > 12) valClass = 'text-sm sm:text-base';
  else if (valLen > 9) valClass = 'text-base sm:text-lg';

  return (
    <div className="bg-white p-4 sm:p-5 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-3 hover:shadow-2xl transition-all duration-500 group h-full min-h-[95px] min-w-0 overflow-hidden relative">
      <div className={`absolute -top-12 -right-12 w-28 h-28 ${bg} opacity-5 rounded-full blur-2xl transition-all group-hover:scale-150`}></div>
      <div className={`w-10 h-10 shrink-0 rounded-[1.2rem] flex items-center justify-center text-base text-white shadow-lg transition-all duration-500 group-hover:rotate-12 ${bg}`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] mb-0.5 truncate">{title}</p>
        <p className={`font-black tracking-tighter ${text} truncate break-all leading-none ${valClass}`}>{value}</p>
      </div>
    </div>
  );
};

export default Dashboard;
