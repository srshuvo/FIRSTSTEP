
import React, { useState } from 'react';
import { AppData, StockIn, StockOut } from '../types';
import Purchase from './Purchase';
import Sales from './Sales';

interface TransactionsProps {
  data: AppData;
  onRecordPurchase: (entry: StockIn) => void;
  onRecordSale: (entry: StockOut) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'warning') => void;
  lang: 'bn' | 'en';
}

const Transactions: React.FC<TransactionsProps> = ({ data, onRecordPurchase, onRecordSale, onNotify, lang }) => {
  const [activeTab, setActiveTab] = useState<'sell' | 'purchase'>('sell');

  const t = {
    sell: lang === 'bn' ? 'মাল বিক্রি (Sales)' : 'Sales / Sell',
    purchase: lang === 'bn' ? 'মাল কেনা (Purchase)' : 'Purchase / Buy',
    subtitle: lang === 'bn' ? 'লেনদেন সম্পন্ন করুন' : 'Complete your transactions'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
         <div className="inline-flex bg-gray-100 p-1.5 rounded-2xl shadow-inner mb-2 border border-gray-200">
            <button 
               onClick={() => setActiveTab('sell')}
               className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'sell' ? 'bg-emerald-600 text-white shadow-lg' : 'text-gray-500 hover:text-emerald-700'}`}
            >
               <i className="fas fa-basket-shopping mr-2"></i> {t.sell}
            </button>
            <button 
               onClick={() => setActiveTab('purchase')}
               className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'purchase' ? 'bg-slate-900 text-white shadow-lg' : 'text-gray-500 hover:text-slate-700'}`}
            >
               <i className="fas fa-cart-flatbed mr-2"></i> {t.purchase}
            </button>
         </div>
         <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{t.subtitle}</p>
      </div>

      <div className="animate-scale-in">
        {activeTab === 'sell' ? (
          <Sales data={data} onRecord={onRecordSale} onNotify={onNotify} lang={lang} />
        ) : (
          <Purchase data={data} onRecord={onRecordPurchase} onNotify={onNotify} lang={lang} />
        )}
      </div>
    </div>
  );
};

export default Transactions;
