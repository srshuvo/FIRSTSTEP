
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppData, StockOut } from '../types';

interface SalesProps {
  data: AppData;
  onRecord: (entry: StockOut) => void;
  lang: 'bn' | 'en';
}

interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productUnit: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

const Sales: React.FC<SalesProps> = ({ data, onRecord, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [mainInfo, setMainInfo] = useState({
    customerId: '',
    billNumber: `BILL-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    paidAmount: 0,
    isSample: false
  });

  const [itemEntry, setItemEntry] = useState({
    productId: '',
    quantity: 0,
    unitPrice: 0,
    discount: 0
  });

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Keyboard Navigation Logic
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (['Enter', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
      const target = e.target as HTMLElement;
      
      // Allow select and number inputs to use arrows for value changes
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && 
          (target.tagName === 'SELECT' || (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'number'))) {
        return; 
      }

      const container = containerRef.current;
      if (!container) return;

      const elements = Array.from(container.querySelectorAll('input:not([type="hidden"]), select, button'))
        .filter(el => {
          const htmlEl = el as HTMLElement;
          return !htmlEl.hasAttribute('disabled') && 
                 htmlEl.tabIndex !== -1 && 
                 htmlEl.offsetParent !== null; // element is visible
        }) as HTMLElement[];
      
      const index = elements.indexOf(target);
      if (index === -1) return;

      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        // If it's a button, let it handle the Enter naturally
        if (e.key === 'Enter' && target.tagName === 'BUTTON') return;
        
        e.preventDefault();
        if (index < elements.length - 1) {
          elements[index + 1].focus();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (index > 0) {
          elements[index - 1].focus();
        }
      }
    }
  };

  const filteredProducts = useMemo(() => {
    return data.products
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase().trim()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data.products, searchTerm]);

  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed !== '' && filteredProducts.length === 1) {
      const p = filteredProducts[0];
      if (itemEntry.productId !== p.id) {
        setItemEntry(prev => ({ ...prev, productId: p.id, unitPrice: p.salePrice }));
      }
    }
  }, [filteredProducts, searchTerm]);

  const addToCart = () => {
    if (!itemEntry.productId || itemEntry.quantity <= 0) return;
    const prod = data.products.find(p => p.id === itemEntry.productId);
    if (!prod) return;

    if (prod.stock < itemEntry.quantity) {
      alert(lang === 'bn' ? `স্টক কম আছে! বর্তমানে আছে: ${prod.stock}` : `Low stock! Available: ${prod.stock}`);
      return;
    }

    const total = (itemEntry.quantity * itemEntry.unitPrice) - itemEntry.discount;
    const newItem: CartItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: itemEntry.productId,
      productName: prod.name,
      productUnit: prod.unit,
      quantity: itemEntry.quantity,
      unitPrice: itemEntry.unitPrice,
      discount: itemEntry.discount,
      total: total
    };

    setCartItems([...cartItems, newItem]);
    setItemEntry({ productId: '', quantity: 0, unitPrice: 0, discount: 0 });
    setSearchTerm('');
    
    // Return focus to search after adding
    setTimeout(() => searchInputRef.current?.focus(), 10);
  };

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const totalBill = cartItems.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0 || !mainInfo.customerId) {
      alert(lang === 'bn' ? "কাস্টমার এবং অন্তত একটি পণ্য নির্বাচন করুন" : "Select customer and at least one product");
      return;
    }

    let remainingPaid = mainInfo.paidAmount;

    cartItems.forEach((item, index) => {
      let paidForItem = 0;
      if (index === cartItems.length - 1) {
        paidForItem = remainingPaid;
      } else {
        paidForItem = Math.min(remainingPaid, item.total);
        remainingPaid -= paidForItem;
      }

      const log: StockOut = {
        id: Math.random().toString(36).substr(2, 9),
        billNumber: mainInfo.billNumber,
        productId: item.productId,
        productName: item.productName,
        productUnit: item.productUnit,
        customerId: mainInfo.customerId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        totalPrice: item.total,
        paidAmount: paidForItem,
        dueAdded: item.total - paidForItem,
        date: mainInfo.date,
        isSample: mainInfo.isSample
      };
      onRecord(log);
    });

    alert(lang === 'bn' ? "বিক্রি সম্পন্ন হয়েছে!" : "Sale Completed!");
    setCartItems([]);
    setMainInfo({
      ...mainInfo,
      paidAmount: 0,
      isSample: false,
      billNumber: `BILL-${Date.now().toString().slice(-6)}`
    });
  };

  const t = {
    title: lang === 'bn' ? 'মাল বিক্রি (Sales)' : 'Sales Entry',
    customer: lang === 'bn' ? 'কাস্টমার' : 'Customer',
    billNo: lang === 'bn' ? 'বিল নম্বর' : 'Bill Number',
    date: lang === 'bn' ? 'তারিখ' : 'Date',
    search: lang === 'bn' ? 'মালের নাম দিয়ে খুঁজুন... (Alt+S)' : 'Search product... (Alt+S)',
    selectProd: lang === 'bn' ? 'পণ্য নির্বাচন করুন' : 'Select Product',
    qty: lang === 'bn' ? 'পরিমাণ' : 'Quantity',
    price: lang === 'bn' ? 'বিক্রয় মূল্য' : 'Sale Price',
    discount: lang === 'bn' ? 'ছাড় (Discount)' : 'Discount',
    addToList: lang === 'bn' ? 'তালিকায় যোগ করুন' : 'Add to List',
    paid: lang === 'bn' ? 'পরিশোধ (Paid)' : 'Paid Amount',
    complete: lang === 'bn' ? 'বিক্রি সম্পন্ন করুন' : 'Complete Sale',
    total: lang === 'bn' ? 'মোট বিল:' : 'Total Bill:',
    cartTitle: lang === 'bn' ? 'পণ্যের তালিকা' : 'Product List',
    sample: lang === 'bn' ? 'স্যাম্পল (Sample)' : 'Sample'
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6" ref={containerRef} onKeyDown={handleKeyDown}>
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <h3 className="text-xl font-black text-emerald-600 flex items-center gap-2">
          <i className="fas fa-file-invoice-dollar"></i> {t.title}
        </h3>

        {/* Customer & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">{t.customer}</label>
            <select 
              required 
              value={mainInfo.customerId} 
              onChange={e => setMainInfo({...mainInfo, customerId: e.target.value})} 
              className="w-full border p-3 rounded-xl font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500 transition"
            >
              <option value="">{t.customer}</option>
              {data.customers.map(c => <option key={c.id} value={c.id}>{c.name} (৳{c.dueAmount})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">{t.date}</label>
            <input 
              type="date" 
              value={mainInfo.date} 
              onChange={e => setMainInfo({...mainInfo, date: e.target.value})} 
              className="w-full border p-3 rounded-xl font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500 transition" 
            />
          </div>
        </div>

        {/* Bill No & Sample */}
        <div className="grid grid-cols-2 gap-4 items-center">
          <div>
            <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">{t.billNo}</label>
            <input 
              type="text" 
              value={mainInfo.billNumber} 
              onChange={e => setMainInfo({...mainInfo, billNumber: e.target.value})} 
              className="w-full border p-3 rounded-xl font-bold bg-gray-50 outline-none focus:ring-2 focus:ring-emerald-500 transition" 
            />
          </div>
          <div className="flex items-center gap-2 pt-4">
            <input 
              type="checkbox" 
              id="isSample"
              checked={mainInfo.isSample} 
              onChange={e => setMainInfo({...mainInfo, isSample: e.target.checked})} 
              className="w-5 h-5 accent-emerald-600 cursor-pointer"
            />
            <label htmlFor="isSample" className="text-xs font-black text-slate-700 uppercase cursor-pointer">
              {t.sample}
            </label>
          </div>
        </div>

        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4">
          <label className="block text-[10px] font-black uppercase text-emerald-600 ml-1">{t.search}</label>
          <input 
            ref={searchInputRef}
            type="text" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            className="w-full border p-3 rounded-xl font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500" 
            placeholder={lang === 'bn' ? 'পণ্যের নাম...' : 'Search...'} 
          />
          
          <select 
            value={itemEntry.productId} 
            onChange={e => { 
              const p = data.products.find(prod => prod.id === e.target.value); 
              setItemEntry({...itemEntry, productId: e.target.value, unitPrice: p?.salePrice || 0}); 
            }} 
            className="w-full border p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">{t.selectProd}</option>
            {filteredProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.stock} {p.unit})</option>)}
          </select>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[9px] font-black uppercase text-gray-400 mb-1 ml-1">{t.qty}</label>
              <input 
                type="number" 
                value={itemEntry.quantity || ''} 
                onChange={e => setItemEntry({...itemEntry, quantity: Number(e.target.value)})} 
                className="w-full border p-3 rounded-xl font-bold" 
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase text-gray-400 mb-1 ml-1">{t.price}</label>
              <input 
                type="number" 
                value={itemEntry.unitPrice || ''} 
                onChange={e => setItemEntry({...itemEntry, unitPrice: Number(e.target.value)})} 
                className="w-full border p-3 rounded-xl font-bold" 
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[9px] font-black uppercase text-gray-400 mb-1 ml-1">{t.discount}</label>
              <input 
                type="number" 
                value={itemEntry.discount || ''} 
                onChange={e => setItemEntry({...itemEntry, discount: Number(e.target.value)})} 
                className="w-full border p-3 rounded-xl font-bold" 
                placeholder="0.00"
              />
            </div>
          </div>

          <button 
            type="button" 
            onClick={addToCart} 
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-black transition transform active:scale-95"
          >
            <i className="fas fa-plus-circle mr-2"></i> {t.addToList}
          </button>
        </div>

        {/* Product List Section */}
        {cartItems.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{t.cartTitle}</h4>
            <div className="space-y-2">
              {cartItems.map(item => (
                <div key={item.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex justify-between items-center animate-scale-in">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-800 text-xs truncate">{item.productName}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">
                      {item.quantity} {item.productUnit} × ৳{item.unitPrice} 
                      {item.discount > 0 && <span className="text-rose-500 ml-1">(-৳{item.discount})</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-black text-emerald-600 text-sm">৳{item.total.toLocaleString()}</span>
                    <button 
                      onClick={() => removeFromCart(item.id)} 
                      className="text-rose-500 hover:text-rose-700 p-1"
                      tabIndex={-1}
                    >
                      <i className="fas fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-6 border-t border-dashed border-gray-200 space-y-4">
          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
               <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest block">{t.total}</span>
               <span className="text-2xl font-black text-emerald-700">৳{totalBill.toLocaleString()}</span>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-1 ml-1">{t.paid}</label>
              <input 
                type="number" 
                value={mainInfo.paidAmount || ''} 
                onChange={e => setMainInfo({...mainInfo, paidAmount: Number(e.target.value)})} 
                className="w-full border-2 border-emerald-500 p-3 rounded-xl font-black text-emerald-600 outline-none" 
                placeholder="0.00"
              />
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={cartItems.length === 0}
            className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl hover:bg-emerald-700 transition transform active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed uppercase text-[11px] tracking-[0.2em]"
          >
            <i className="fas fa-check-double mr-2"></i> {t.complete}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sales;
