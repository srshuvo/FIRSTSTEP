
import React, { useMemo, useState } from 'react';
import { AppData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  data: AppData;
  lang: 'bn' | 'en';
}

const Dashboard: React.FC<DashboardProps> = ({ data, lang }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const t = {
    sales: lang === 'bn' ? 'মোট বিক্রি' : 'Total Sales',
    purchase: lang === 'bn' ? 'মোট কেনা' : 'Total Purchase',
    profit: lang === 'bn' ? 'মোট লাভ' : 'Total Profit',
    due: lang === 'bn' ? 'মোট বাকি' : 'Total Due',
    chartTitle: lang === 'bn' ? 'গত ৭ দিনের বিক্রি' : 'Last 7 Days Sales',
    lowStock: lang === 'bn' ? 'কম স্টকের মাল' : 'Low Stock Items',
    dailySearch: lang === 'bn' ? 'দিনের হিসাব দেখুন' : 'Check Daily Account',
    noData: lang === 'bn' ? 'কোনো ডাটা নেই' : 'No Data Available',
    urgent: lang === 'bn' ? 'জরুরী!' : 'Urgent!',
    threshold: lang === 'bn' ? 'সীমা' : 'Limit'
  };

  const stats = useMemo(() => {
    const totalSales = data.stockOutLogs.reduce((acc, log) => acc + log.totalPrice, 0);
    const totalPurchase = data.stockInLogs.reduce((acc, log) => acc + log.totalPrice, 0);
    
    // Aggregate only positive dueAmounts as real "Money Owed"
    const totalDue = data.customers.filter(c => c.dueAmount > 0).reduce((acc, c) => acc + c.dueAmount, 0);
    
    // Total Sales Discount
    const salesDiscount = data.stockOutLogs.reduce((acc, log) => acc + (log.discount || 0), 0);
    
    // Total Payment Waiver Discount
    const paymentDiscount = data.paymentLogs.reduce((acc, log) => acc + (log.discount || 0), 0);

    // Initial Gross Profit from Sales
    const grossProfitFromSales = data.stockOutLogs.reduce((acc, log) => {
      const p = data.products.find(prod => prod.id === log.productId);
      const cost = p?.costPrice || 0;
      const profitPerItem = log.unitPrice - cost;
      return acc + (profitPerItem * log.quantity);
    }, 0);

    const totalProfit = grossProfitFromSales - salesDiscount - paymentDiscount;
    
    return { totalSales, totalPurchase, totalDue, totalProfit };
  }, [data]);

  const dailyStats = useMemo(() => {
    const sales = data.stockOutLogs.filter(l => l.date === selectedDate).reduce((acc, l) => acc + l.totalPrice, 0);
    const purchases = data.stockInLogs.filter(l => l.date === selectedDate).reduce((acc, l) => acc + l.totalPrice, 0);
    return { sales, purchases };
  }, [data, selectedDate]);

  const salesData = useMemo(() => {
    return [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      return { 
        date: ds, 
        amount: data.stockOutLogs.filter(l => l.date === ds).reduce((acc, l) => acc + l.totalPrice, 0) 
      };
    }).reverse();
  }, [data.stockOutLogs]);

  const lowStockItems = useMemo(() => {
    return data.products.filter(p => p.stock <= (p.lowStockThreshold || 10));
  }, [data.products]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <h3 className="font-bold text-gray-700 flex items-center gap-2"><i className="fas fa-calendar-day text-emerald-600"></i> {t.dailySearch}</h3>
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <div className="flex gap-4">
          <div className="text-sm"><span className="text-gray-500">{lang === 'bn' ? 'বিক্রি' : 'Sale'}:</span> <span className="font-bold text-emerald-600">৳{dailyStats.sales}</span></div>
          <div className="text-sm"><span className="text-gray-500">{lang === 'bn' ? 'কেনা' : 'Buy'}:</span> <span className="font-bold text-blue-600">৳{dailyStats.purchases}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t.sales} value={`৳${stats.totalSales}`} icon="fa-hand-holding-dollar" color="bg-blue-500" />
        <StatCard title={t.purchase} value={`৳${stats.totalPurchase}`} icon="fa-cart-shopping" color="bg-orange-500" />
        <StatCard title={t.profit} value={`৳${stats.totalProfit}`} icon="fa-chart-line" color="bg-emerald-500" />
        <StatCard title={t.due} value={`৳${stats.totalDue}`} icon="fa-clock-rotate-left" color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
          <h3 className="text-lg font-bold mb-4">{t.chartTitle}</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{fontSize: 10}} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
            {t.lowStock}
            {lowStockItems.length > 0 && (
              <span className="text-[10px] bg-red-100 text-red-600 px-3 py-1 rounded-full animate-pulse font-black uppercase flex items-center gap-1">
                <i className="fas fa-circle text-[6px]"></i> {lowStockItems.length} {lang === 'bn' ? 'টি সতর্কবার্তা' : 'ALERTS'}
              </span>
            )}
          </h3>
          <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
            {lowStockItems.length > 0 ? (
              lowStockItems.map(p => (
                <div key={p.id} className="flex justify-between items-center p-4 bg-gradient-to-r from-red-50 to-white border border-red-100 rounded-xl group hover:border-red-300 transition-all">
                  <div className="flex flex-col">
                    <span className="font-black text-gray-800 text-base">{p.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold uppercase">
                        {t.threshold}: {p.lowStockThreshold || 10} {p.unit}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-black text-red-600 leading-none">{p.stock}</p>
                      <p className="text-[10px] font-bold text-red-400 uppercase">{p.unit}</p>
                    </div>
                    <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center text-xs shadow-lg shadow-red-200">
                      <i className="fas fa-exclamation-triangle animate-bounce"></i>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-2xl mb-3">
                  <i className="fas fa-check-circle"></i>
                </div>
                <p className="text-gray-400 font-bold italic">
                  {lang === 'bn' ? 'সব মাল পর্যাপ্ত আছে' : 'All stock levels are healthy'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }: any) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
    <div className={`w-12 h-12 ${color} text-white rounded-lg flex items-center justify-center text-xl shadow-md`}>
      <i className={`fas ${icon}`}></i>
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
      <p className="text-xl font-bold text-gray-800">{value}</p>
    </div>
  </div>
);

export default Dashboard;
