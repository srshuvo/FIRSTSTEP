
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

  const lowStockItems = useMemo(() => {
    return data.products.filter(p => p.stock <= (p.lowStockThreshold || 10));
  }, [data.products]);

  const catPerformance = useMemo(() => {
    const sOut = getFilteredLogs(data.stockOutLogs);
    const performanceMap: Record<string, { name: string; stock: number; stockVal: number; sales: number; profit: number }> = {};
    
    data.categories.forEach(cat => {
      performanceMap[cat.id] = { name: cat.name, stock: 0, stockVal: 0, sales: 0, profit: 0 };
    });
    
    performanceMap['none'] = { name: lang === 'bn' ? 'ক্যাটাগরি ছাড়া' : 'Uncategorized', stock: 0, stockVal: 0, sales: 0, profit: 0 };

    data.products.forEach(p => {
      const catId = p.categoryId || 'none';
      if (performanceMap[catId]) {
        performanceMap[catId].stock += p.stock;
        performanceMap[catId].stockVal += (p.stock * p.costPrice);
      }
    });

    sOut.forEach(log => {
      const p = data.products.find(prod => prod.id === log.productId);
      const catId = p?.categoryId || 'none';
      if (performanceMap[catId]) {
        performanceMap[catId].sales += log.totalPrice;
        performanceMap[catId].profit += calculateProfit(log);
      }
    });

    return Object.values(performanceMap);
  }, [data, dateFilter, customRange, lang]);

  const fullDates = useMemo(() => {
    const now = currentTime;
    const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    const bnMonths = ["বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ন", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"];
    const hijriMonthsBn = ["মহররম", "সফর", "রবিউল আউয়াল", "রবিউস সানি", "জমাদিউল আউয়াল", "জমাদিউস সানি", "রজব", "শাবান", "রমজান", "শাওয়াল", "জিলকদ", "জিলহজ"];

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
      return `${toBn(dayCount)} ${bnMonths[mIdx]} ${toBn(bYear)}`;
    };

    const getHijri = () => {
      const hijriFormatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric' });
      const parts = hijriFormatter.formatToParts(now);
      const day = parts.find(p => p.type === 'day')?.value || '';
      const monthIndex = parseInt(parts.find(p => p.type === 'month')?.value || '1') - 1;
      const year = parts.find(p => p.type === 'year')?.value || '';
      return `${toBn(day)} ${hijriMonthsBn[monthIndex]} ${toBn(year)}`;
    };
    
    return { en: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(now), bn: getBongabdo(), ar: getHijri() };
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
    grossProfit: lang === 'bn' ? 'মোট লাভ' : 'Gross Profit',
    netProfit: lang === 'bn' ? 'নীট লাভ' : "Net Profit",
    due: lang === 'bn' ? 'মোট পাওনা' : 'Total Due',
    stockVal: lang === 'bn' ? 'স্টক ভ্যালু' : 'Stock Value',
    catPerformance: lang === 'bn' ? 'ক্যাটাগরি পারফরম্যান্স' : 'Category Performance',
    lowStock: lang === 'bn' ? 'স্টক এলার্ট (কম মাল)' : 'Stock Alert (Low Stock)',
    engCal: lang === 'bn' ? 'ইংরেজি' : 'English',
    bngCal: lang === 'bn' ? 'বাংলা' : 'Bengali',
    hijCal: lang === 'bn' ? 'হিজরি' : 'Hijri'
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-scale-in">
      <div className="flex flex-col xl:flex-row justify-between items-center gap-4 sm:gap-6">
        <div className="flex flex-col justify-center text-center xl:text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-none tracking-tighter neon-text uppercase">FIRST STEP</h1>
          <div className="flex items-center justify-center xl:justify-start gap-2 mt-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse neon-border"></span>
            <p className="text-[10px] sm:text-[11px] font-black text-emerald-600 uppercase tracking-[0.4em]">Enterprise Khata v2.0</p>
          </div>
        </div>

        <div className="no-print flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <div className="bg-slate-950 text-emerald-400 px-4 sm:px-6 py-3 sm:py-4 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl flex items-center gap-3 sm:gap-5 border-2 border-slate-800 relative overflow-hidden group min-h-[70px] sm:min-h-[85px]">
            <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-all"></div>
            <div className="flex flex-col items-center">
              <span className="text-[6px] sm:text-[7px] font-black uppercase text-emerald-800 tracking-[0.4em] mb-1 leading-none">System Sync</span>
              <div className="flex items-baseline font-mono-tech text-2xl sm:text-3xl font-black leading-none tracking-tight">
                <span className="drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]">{clock.hours}</span>
                <span className="mx-1 text-slate-700 animate-pulse">:</span>
                <span className="drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]">{clock.minutes}</span>
                <span className="text-[8px] sm:text-[9px] ml-1 sm:ml-2 font-black text-emerald-600 uppercase tracking-tighter">{clock.ampm}</span>
              </div>
            </div>
            <div className="w-[1px] h-8 sm:h-10 bg-slate-800 rounded-full opacity-50"></div>
            <div className="flex flex-col items-center justify-center">
               <span className="text-[10px] sm:text-xs font-black text-emerald-500 font-mono-tech">{clock.seconds}</span>
               <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-400/20 rounded-full mt-1 sm:mt-2 flex items-center justify-center">
                  <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-emerald-400 rounded-full animate-ping"></div>
               </div>
            </div>
          </div>

          <CalendarCard label={t.engCal} date={fullDates.en} icon="fa-calendar-days" />
          <CalendarCard label={t.bngCal} date={fullDates.bn} icon="fa-language" glow />
          <CalendarCard label={t.hijCal} date={fullDates.ar} icon="fa-moon" />
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-md p-2 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap gap-1 sm:gap-2 items-center no-print sticky top-4 z-20">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 rounded-full border border-slate-800">
           <i className="fas fa-microchip text-emerald-500 text-[8px] sm:text-[10px] animate-pulse"></i>
           <span className="text-[8px] sm:text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em]">Filters</span>
        </div>
        {['today', '7days', 'month', '6months', '12months', 'custom'].map(f => (
          <button
            key={f}
            onClick={() => setDateFilter(f as any)}
            className={`px-3 sm:px-5 py-2 rounded-2xl text-[10px] sm:text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${dateFilter === f ? 'bg-emerald-600 text-white shadow-lg scale-105' : 'text-slate-500 hover:bg-emerald-50'}`}
          >
            {lang === 'bn' ? (f === 'today' ? 'আজ' : f === '7days' ? '৭ দিন' : f === 'month' ? '১ মাস' : f === '6months' ? '৬ মাস' : f === '12months' ? '১২ মাস' : 'কাস্টম') : f}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-6">
        <KPICard title={t.sales} value={`৳${stats.totalSales.toLocaleString()}`} icon="fa-wallet" color="blue" />
        <KPICard title={t.purchase} value={`৳${stats.totalPurchase.toLocaleString()}`} icon="fa-cart-flatbed" color="orange" />
        <KPICard title={t.stockVal} value={`৳${stats.totalStockValue.toLocaleString()}`} icon="fa-boxes-stacked" color="indigo" />
        <KPICard title={t.grossProfit} value={`৳${stats.grossProfit.toLocaleString()}`} icon="fa-money-bill-trend-up" color="emerald-light" />
        <KPICard title={t.netProfit} value={`৳${stats.netProfit.toLocaleString()}`} icon="fa-chart-line" color="emerald" />
        <KPICard title={t.due} value={`৳${stats.totalDue.toLocaleString()}`} icon="fa-user-clock" color="red" />
      </section>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <div className="bg-rose-50 border border-rose-100 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-sm">
           <h3 className="font-black text-rose-700 text-xs sm:text-sm uppercase tracking-widest flex items-center gap-3 mb-4">
             <i className="fas fa-triangle-exclamation animate-bounce"></i>
             {t.lowStock}
           </h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
             {lowStockItems.map(p => (
               <div key={p.id} className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-rose-200 flex justify-between items-center shadow-sm">
                  <span className="font-black text-slate-800 text-[10px] sm:text-xs truncate mr-2">{p.name}</span>
                  <span className="shrink-0 bg-rose-600 text-white px-2 sm:px-3 py-1 rounded-full text-[8px] sm:text-[10px] font-black">
                    {p.stock} {p.unit}
                  </span>
               </div>
             ))}
           </div>
        </div>
      )}

      <div className="bg-white p-4 sm:p-8 rounded-[2rem] sm:rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
            <h3 className="font-black text-slate-900 text-[10px] sm:text-sm uppercase tracking-[0.2em] flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                 <i className="fas fa-chart-pie text-indigo-600 text-xs sm:text-sm"></i>
              </div>
              {t.catPerformance}
            </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px] sm:text-xs">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase tracking-[0.15em]">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4 rounded-l-2xl sm:rounded-l-3xl">{lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-center">{lang === 'bn' ? 'স্টক পরিমাণ' : 'Stock Qty'}</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-center">{lang === 'bn' ? 'স্টক ভ্যালু' : 'Stock Value'}</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-center">{lang === 'bn' ? 'মোট বিক্রি' : 'Sales'}</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right rounded-r-2xl sm:rounded-r-3xl">{lang === 'bn' ? 'লাভ' : 'Profit'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {catPerformance.map((p, idx) => (
                <tr key={idx} className="hover:bg-indigo-50/20 transition-all group">
                  <td className="px-4 sm:px-6 py-4 sm:py-5 font-black text-slate-800">{p.name}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-center font-bold text-slate-500">{p.stock}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-center font-black text-slate-700">৳{p.stockVal.toLocaleString()}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-center font-black text-blue-600">৳{p.sales.toLocaleString()}</td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-right font-black text-emerald-600">৳{p.profit.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CalendarCard = ({ label, date, icon, glow }: any) => (
  <div className={`bg-slate-950 ${glow ? 'text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-emerald-400/80 border-slate-800'} px-4 sm:px-6 py-3 sm:py-4 rounded-[1.5rem] sm:rounded-[2.5rem] border-2 flex flex-col items-center justify-center min-w-[140px] sm:min-w-[170px] min-h-[70px] sm:min-h-[85px] transition-all hover:scale-105 group relative overflow-hidden`}>
    <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-all"></div>
    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2 opacity-60">
      <i className={`fas ${icon} text-[8px] sm:text-[10px]`}></i>
      <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-[0.3em]">{label}</span>
    </div>
    <p className="text-[10px] sm:text-[12px] font-black tracking-tighter text-center leading-tight whitespace-nowrap">{date}</p>
  </div>
);

const KPICard = ({ title, value, icon, color }: any) => {
  const colorMap: any = {
    blue: 'bg-blue-600 text-blue-700 shadow-blue-100',
    orange: 'bg-amber-500 text-amber-600 shadow-amber-100',
    emerald: 'bg-emerald-600 text-emerald-700 shadow-emerald-100',
    'emerald-light': 'bg-emerald-400 text-emerald-500 shadow-emerald-50',
    red: 'bg-rose-500 text-rose-600 shadow-rose-100',
    indigo: 'bg-indigo-600 text-indigo-700 shadow-indigo-100',
  };
  const [bg, text] = colorMap[color].split(' ');
  const valLen = value?.toString().length || 0;
  let valFontSizeClass = valLen > 14 ? 'text-[10px]' : valLen > 11 ? 'text-[11px]' : 'text-xs sm:text-base';

  return (
    <div className="bg-white p-3 sm:p-5 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-2 sm:gap-3 hover:shadow-2xl transition-all h-full min-h-[80px] sm:min-h-[100px] min-w-0">
      <div className={`w-8 h-8 sm:w-11 sm:h-11 shrink-0 rounded-[1rem] sm:rounded-[1.4rem] flex items-center justify-center text-sm sm:text-lg text-white shadow-2xl ${bg}`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.1em] mb-0.5 truncate">{title}</p>
        <p className={`font-black tracking-tighter ${text} ${valFontSizeClass} break-all transition-all leading-tight`}>
          {value}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
