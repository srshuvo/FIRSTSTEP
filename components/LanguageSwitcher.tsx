
import React, { useState } from 'react';

interface LanguageSwitcherProps {
  lang: 'bn' | 'en';
  setLang: (l: 'bn' | 'en') => void;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ lang, setLang }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-24 z-[100] no-print">
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 min-w-[140px] animate-scale-in">
          <button 
            onClick={() => { setLang('bn'); setIsOpen(false); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-black transition ${lang === 'bn' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            বাংলা {lang === 'bn' && <i className="fas fa-check text-[10px]"></i>}
          </button>
          <button 
            onClick={() => { setLang('en'); setIsOpen(false); }}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-black transition ${lang === 'en' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            English {lang === 'en' && <i className="fas fa-check text-[10px]"></i>}
          </button>
        </div>
      )}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center text-xl hover:bg-emerald-700 transition transform active:scale-90 border-4 border-white"
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-language'}`}></i>
      </button>
    </div>
  );
};

export default LanguageSwitcher;
