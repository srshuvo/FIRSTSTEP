
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
    { id: 'dashboard', label: lang === 'bn' ? 'ড্যাশবোর্ড' : 'Dashboard', icon: 'fa-briefcase' },
    { id: 'inventory', label: lang === 'bn' ? 'স্টক খাতা' : 'Inventory', icon: 'fa-boxes-packing' },
    { id: 'transactions', label: lang === 'bn' ? 'ক্রয় / বিক্রয়' : 'Transactions', icon: 'fa-money-bill-transfer' },
    { id: 'customers', label: lang === 'bn' ? 'ক্রেতা মড্যুল' : 'Customers', icon: 'fa-address-book' },
    { id: 'suppliers', label: lang === 'bn' ? 'সাপ্লায়ার' : 'Suppliers', icon: 'fa-truck-ramp-box' },
    { id: 'reports', label: lang === 'bn' ? 'রিপোর্ট বক্স' : 'Reports', icon: 'fa-file-invoice' },
  ];

  return (
    <>
      <nav className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative md:flex w-72 bg-slate-950 text-white flex-col transition-all duration-500 ease-in-out z-40 no-print shadow-2xl border-r border-slate-800`}>
        <div className="p-8 text-center border-b border-slate-900 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 neon-border"></div>
          <div className="w-14 h-14 bg-emerald-600 rounded-3xl flex items-center justify-center text-2xl mx-auto mb-4 border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-transform hover:scale-110">
            <i className="fas fa-gem"></i>
          </div>
          <h2 className="text-2xl font-black tracking-tighter neon-text">FIRST STEP</h2>
          <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em] mt-2 opacity-80">Digital Business Suite</p>
        </div>

        <div className="flex-1 py-6 overflow-y-auto px-4 custom-scrollbar">
          <div className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 transition-all duration-300 rounded-[1.5rem] group ${
                  currentPage === item.id 
                    ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-900/40 neon-border' 
                    : 'text-slate-400 hover:bg-slate-900/50 hover:text-white'
                }`}
              >
                <div className={`w-10 h-10 flex items-center justify-center text-lg transition-transform group-hover:scale-110 ${currentPage === item.id ? 'text-white' : 'text-slate-600'}`}>
                   <i className={`fas ${item.icon}`}></i>
                </div>
                <span className="font-black text-[11px] uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-900 space-y-4">
          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-black text-xs">
                 {user.name.charAt(0).toUpperCase()}
               </div>
               <div className="flex flex-col">
                 <span className="text-[11px] font-black text-white truncate max-w-[120px]">{user.name}</span>
                 <span className="text-[9px] text-emerald-500 font-black uppercase tracking-tighter">{user.role} ACCESS</span>
               </div>
             </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 py-4 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-2xl transition-all duration-300 font-black text-xs uppercase tracking-[0.2em] border border-rose-600/20"
          >
            <i className="fas fa-power-off"></i> {lang === 'bn' ? 'লগ আউট' : 'Disconnect'}
          </button>
          
          {/* Neon Credit Card */}
          <div className="pt-2">
            <a 
              href="https://www.facebook.com/shuvo.moni.16623" 
              target="_blank" 
              rel="noopener noreferrer"
              className="relative group block p-4 rounded-[1.5rem] overflow-hidden transition-all duration-500 bg-slate-900 border border-emerald-500/30 hover:border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]"
            >
              {/* Glowing Background Animation */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div className="relative flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-emerald-500/60 uppercase tracking-[0.3em] mb-1">Developer</span>
                  <span className="text-[11px] font-black text-white uppercase tracking-wider group-hover:text-emerald-400 transition-colors">
                    DESIGNED BY <span className="text-emerald-400">shuvo</span>
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-600/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
                  <i className="fab fa-facebook-f text-xs"></i>
                </div>
              </div>

              {/* Animated Pulse Ring */}
              <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-emerald-500/10 rounded-full blur-xl group-hover:animate-pulse"></div>
            </a>
          </div>
        </div>
      </nav>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-30 md:hidden"
          onClick={() => setCurrentPage(currentPage)}
        />
      )}
    </>
  );
};

export default Navbar;
