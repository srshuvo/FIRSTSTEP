
import React from 'react';
import { User } from '../types';

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: any) => void;
  onLogout: () => void;
  user: User;
  lang: 'bn' | 'en';
  setLang: (l: 'bn' | 'en') => void;
  isOpen?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, setCurrentPage, onLogout, user, lang, setLang, isOpen }) => {
  const menuItems = [
    { id: 'dashboard', label: lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard', icon: 'fa-chart-pie' },
    { id: 'inventory', label: lang === 'bn' ? 'স্টক/ইনভেন্টরি' : 'Stock', icon: 'fa-boxes-stacked' },
    { id: 'purchase', label: lang === 'bn' ? 'মাল কেনা' : 'Purchase', icon: 'fa-cart-plus' },
    { id: 'sales', label: lang === 'bn' ? 'মাল বিক্রি' : 'Sell', icon: 'fa-file-invoice-dollar' },
    { id: 'customers', label: lang === 'bn' ? 'কাস্টমার' : 'Customers', icon: 'fa-users' },
    { id: 'suppliers', label: lang === 'bn' ? 'সাপ্লায়ার' : 'Suppliers', icon: 'fa-truck-field' },
    { id: 'reports', label: lang === 'bn' ? 'রিপোর্ট' : 'Reports', icon: 'fa-file-lines' },
  ];

  return (
    <>
      {/* Sidebar */}
      <nav className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative md:flex w-64 bg-emerald-900 text-white flex-col transition-transform duration-300 ease-in-out z-40 no-print shadow-2xl md:shadow-none`}>
        <div className="p-6 text-center border-b border-emerald-800">
          <div className="w-12 h-12 bg-emerald-700 rounded-full flex items-center justify-center text-xl mx-auto mb-2 border-2 border-emerald-600">
            <i className="fas fa-store"></i>
          </div>
          <h2 className="text-xl font-bold tracking-tight">FIRST STEP</h2>
          <p className="text-[11px] text-emerald-400 font-bold uppercase">হিসাব হবে এখন স্মার্টলি</p>
        </div>

        <div className="flex-1 py-4 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-4 px-6 py-4 transition-all text-left ${
                currentPage === item.id ? 'bg-emerald-700 border-l-4 border-white' : 'hover:bg-emerald-800/50'
              }`}
            >
              <i className={`fas ${item.icon} w-6 text-lg`}></i>
              <span className="font-bold text-sm">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-emerald-800 space-y-2">
          <div className="text-center py-2 flex flex-col">
             <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">Created by SHUVO</span>
             <span className="text-[9px] text-emerald-600 font-bold">{user.name} ({user.role})</span>
          </div>
          <button 
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            className="w-full py-2 bg-emerald-800 text-xs rounded hover:bg-emerald-700 transition font-bold"
          >
            {lang === 'bn' ? 'English' : 'বাংলা'}
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition font-bold text-sm shadow-lg shadow-red-900/20"
          >
            <i className="fas fa-sign-out-alt"></i> {lang === 'bn' ? 'লগ আউট' : 'Logout'}
          </button>
        </div>
      </nav>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setCurrentPage(currentPage)}
        />
      )}
    </>
  );
};

export default Navbar;