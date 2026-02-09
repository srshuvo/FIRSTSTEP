
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User, UserRole, AppData, Product, Customer, Supplier, StockIn, StockOut, PaymentLog, Category, LedgerEntry } from './types';
import { INITIAL_DATA } from './constants';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Transactions from './components/Transactions';
import Reports from './components/Reports';
import Customers from './components/Customers';
import Suppliers from './components/Suppliers';
import Navbar from './components/Navbar';
import Login from './components/Login';
import LanguageSwitcher from './components/LanguageSwitcher';
import SSS from './components/SSS';

const SUPABASE_URL = 'https://qwopfalqhkkjkxqpbloa.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3b3BmYWxxaGtramt4cXBibG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5OTQxMDIsImV4cCI6MjA4NDU3MDEwMn0.QyCarDEwYaH6dxEhhTgf5hiZab1ylv6P_06uXtYR_s0';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SHARED_STORE_ID = 'shared_khata_v1';

const App: React.FC = () => {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'inventory' | 'transactions' | 'reports' | 'customers' | 'suppliers' | 'sss'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [lastDeleted, setLastDeleted] = useState<{ type: string, item: any, label: string } | null>(null);
  const undoTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (lastDeleted) {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = setTimeout(() => {
        setLastDeleted(null);
      }, 10000);
    }
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, [lastDeleted]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser({ id: session.user.id, name: session.user.email?.split('@')[0] || 'User', role: UserRole.ADMIN });
        loadSharedData();
      } else {
        const saved = localStorage.getItem('khata_data');
        if (saved) setData(JSON.parse(saved));
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser({ id: session.user.id, name: session.user.email?.split('@')[0] || 'User', role: UserRole.ADMIN });
        loadSharedData();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadSharedData = async () => {
    try {
      setLoading(true);
      const { data: cloudRow, error } = await supabase
        .from('user_store')
        .select('data')
        .eq('id', SHARED_STORE_ID)
        .maybeSingle();

      if (error) throw error;
      if (cloudRow) {
        const cloudData = cloudRow.data;
        if (!cloudData.paymentLogs) cloudData.paymentLogs = [];
        if (!cloudData.categories) cloudData.categories = [];
        if (!cloudData.ledgerEntries) cloudData.ledgerEntries = [];
        setData(cloudData);
      } else {
        await syncToCloud(INITIAL_DATA);
      }
    } catch (err) {
      console.error('Database error:', err);
      const saved = localStorage.getItem('khata_data');
      if (saved) setData(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  };

  const syncToCloud = async (newData: AppData) => {
    localStorage.setItem('khata_data', JSON.stringify(newData));
    if (!user) return;
    setSyncing(true);
    try {
      const { error } = await supabase
        .from('user_store')
        .upsert({ 
          id: SHARED_STORE_ID, 
          data: newData, 
          updated_at: new Date().toISOString() 
        });
      if (error) throw error;
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => syncToCloud(data), 1000);
      return () => clearTimeout(timer);
    }
  }, [data, user, loading]);

  const handleUndo = () => {
    if (!lastDeleted) return;
    const { type, item } = lastDeleted;
    setData(prev => {
      let newData = { ...prev };
      if (type === 'product') newData.products = [item, ...prev.products];
      else if (type === 'customer') newData.customers = [item, ...prev.customers];
      else if (type === 'supplier') newData.suppliers = [item, ...prev.suppliers];
      else if (type === 'stockIn') {
        newData.stockInLogs = [item, ...prev.stockInLogs];
        newData.products = prev.products.map(p => p.id === item.productId ? { ...p, stock: p.stock + item.quantity } : p);
      } else if (type === 'stockOut') {
        newData.stockOutLogs = [item, ...prev.stockOutLogs];
        newData.products = prev.products.map(p => p.id === item.productId ? { ...p, stock: p.stock + item.quantity } : p);
        newData.customers = prev.customers.map(c => c.id === item.customerId ? { ...c, dueAmount: c.dueAmount + item.dueAdded } : c);
      } else if (type === 'payment') {
        newData.paymentLogs = [item, ...prev.paymentLogs];
        newData.customers = prev.customers.map(c => c.id === item.customerId ? { ...c, dueAmount: c.dueAmount - (item.amount + (item.discount || 0)) } : c);
      } else if (type === 'category') {
        newData.categories = [...(prev.categories || []), item.category];
        newData.products = prev.products.map(p => item.affectedProductIds.includes(p.id) ? { ...p, categoryId: item.category.id } : p);
      } else if (type === 'ledger') {
        newData.ledgerEntries = [item, ...(prev.ledgerEntries || [])];
      }
      return newData;
    });
    setLastDeleted(null);
  };

  const addProduct = (p: Product) => setData(prev => ({ ...prev, products: [p, ...prev.products] }));
  const updateProduct = (p: Product) => setData(prev => ({ ...prev, products: prev.products.map(old => old.id === p.id ? p : old) }));
  const deleteProduct = (id: string) => {
    setData(prev => {
      const itemToDelete = prev.products.find(p => p.id === id);
      if (itemToDelete) setLastDeleted({ type: 'product', item: itemToDelete, label: itemToDelete.name });
      return { ...prev, products: prev.products.filter(p => p.id !== id) };
    });
  };

  const addCategory = (c: Category) => setData(prev => ({ ...prev, categories: [...(prev.categories || []), c] }));
  const updateCategory = (c: Category) => setData(prev => ({ ...prev, categories: prev.categories.map(old => old.id === c.id ? c : old) }));
  const deleteCategory = (id: string) => {
    setData(prev => {
      const cat = prev.categories.find(c => c.id === id);
      const affectedProducts = prev.products.filter(p => p.categoryId === id);
      if (cat) setLastDeleted({ 
        type: 'category', 
        item: { category: cat, affectedProductIds: affectedProducts.map(p => p.id) }, 
        label: cat.name 
      });
      return {
        ...prev,
        categories: prev.categories.filter(c => c.id !== id),
        products: prev.products.map(p => p.categoryId === id ? { ...p, categoryId: undefined } : p)
      };
    });
  };

  const bulkCategoryUpdate = (catId: string | undefined, productIds: string[]) => {
    setData(prev => ({
      ...prev,
      products: prev.products.map(p => productIds.includes(p.id) ? { ...p, categoryId: catId } : p)
    }));
  };

  const addCustomer = (c: Customer) => setData(prev => ({ ...prev, customers: [c, ...prev.customers] }));
  const updateCustomer = (c: Customer) => setData(prev => ({ ...prev, customers: prev.customers.map(old => old.id === c.id ? c : old) }));
  const deleteCustomer = (id: string) => {
    setData(prev => {
      const itemToDelete = prev.customers.find(c => c.id === id);
      if (itemToDelete) setLastDeleted({ type: 'customer', item: itemToDelete, label: itemToDelete.name });
      return { ...prev, customers: prev.customers.filter(c => c.id !== id) };
    });
  };

  const addSupplier = (s: Supplier) => setData(prev => ({ ...prev, suppliers: [s, ...prev.suppliers] }));
  const updateSupplier = (s: Supplier) => setData(prev => ({ ...prev, suppliers: prev.suppliers.map(old => old.id === s.id ? s : old) }));
  const deleteSupplier = (id: string) => {
    setData(prev => {
      const itemToDelete = prev.suppliers.find(s => s.id === id);
      if (itemToDelete) setLastDeleted({ type: 'supplier', item: itemToDelete, label: itemToDelete.name });
      return { ...prev, suppliers: prev.suppliers.filter(s => s.id !== id) };
    });
  };

  const recordStockIn = (log: StockIn) => {
    setData(prev => ({
      ...prev,
      stockInLogs: [log, ...prev.stockInLogs],
      products: prev.products.map(p => {
        if (p.id === log.productId) {
          const currentTotalValue = (p.stock * p.costPrice);
          const newEntryValue = (log.quantity * log.unitPrice);
          const newTotalStock = p.stock + log.quantity;
          const averagePrice = (currentTotalValue + newEntryValue) / newTotalStock;
          const roundedPrice = Math.ceil(averagePrice);
          
          return { ...p, stock: newTotalStock, costPrice: roundedPrice };
        }
        return p;
      })
    }));
  };
  const deleteStockIn = (id: string) => {
    setData(prev => {
      const log = prev.stockInLogs.find(l => l.id === id);
      if (!log) return prev;
      setLastDeleted({ type: 'stockIn', item: log, label: `${log.productName} (${log.quantity})` });
      return {
        ...prev,
        stockInLogs: prev.stockInLogs.filter(l => l.id !== id),
        products: prev.products.map(p => p.id === log.productId ? { ...p, stock: p.stock - log.quantity } : p)
      };
    });
  };
  const updateStockIn = (updatedLog: StockIn) => {
    setData(prev => {
      const oldLog = prev.stockInLogs.find(l => l.id === updatedLog.id);
      if (!oldLog) return prev;
      return {
        ...prev,
        stockInLogs: prev.stockInLogs.map(l => l.id === updatedLog.id ? updatedLog : l),
        products: prev.products.map(p => p.id === updatedLog.productId ? { ...p, stock: p.stock - oldLog.quantity + updatedLog.quantity } : p)
      };
    });
  };

  const recordStockOut = (log: StockOut) => {
    setData(prev => ({
      ...prev,
      stockOutLogs: [log, ...prev.stockOutLogs],
      products: prev.products.map(p => p.id === log.productId ? { ...p, stock: p.stock - log.quantity } : p),
      customers: prev.customers.map(c => c.id === log.customerId ? { ...c, dueAmount: c.dueAmount + log.dueAdded } : c)
    }));
  };

  const recordSalesReturn = (log: StockOut) => {
    setData(prev => ({
      ...prev,
      stockOutLogs: [log, ...prev.stockOutLogs],
      products: prev.products.map(p => p.id === log.productId ? { ...p, stock: p.stock + log.quantity } : p),
      customers: prev.customers.map(c => c.id === log.customerId ? { ...c, dueAmount: c.dueAmount - log.totalPrice } : c)
    }));
  };

  const handlePaymentRecord = (log: PaymentLog) => {
    setData(prev => ({
      ...prev,
      customers: prev.customers.map(c => c.id === log.customerId ? { ...c, dueAmount: c.dueAmount - (log.amount + (log.discount || 0)) } : c),
      paymentLogs: [log, ...(prev.paymentLogs || [])]
    }));
  };

  const deleteStockOut = (logId: string) => {
    setData(prev => {
      const log = prev.stockOutLogs.find(l => l.id === logId);
      if (!log) return prev;
      setLastDeleted({ type: 'stockOut', item: log, label: `${log.productName} (${log.quantity})` });
      return {
        ...prev,
        stockOutLogs: prev.stockOutLogs.filter(l => l.id !== logId),
        products: prev.products.map(p => p.id === log.productId ? { ...p, stock: p.stock + log.quantity } : p),
        customers: prev.customers.map(c => c.id === log.customerId ? { ...c, dueAmount: c.dueAmount - log.dueAdded } : c)
      };
    });
  };

  const updateStockOut = (updatedLog: StockOut) => {
    setData(prev => {
      const oldLog = prev.stockOutLogs.find(l => l.id === updatedLog.id);
      if (!oldLog) return prev;
      return {
        ...prev,
        stockOutLogs: prev.stockOutLogs.map(l => l.id === updatedLog.id ? updatedLog : l),
        products: prev.products.map(p => p.id === updatedLog.productId ? { ...p, stock: p.stock + oldLog.quantity - updatedLog.quantity } : p),
        customers: prev.customers.map(c => c.id === updatedLog.customerId ? { ...c, dueAmount: c.dueAmount - oldLog.dueAdded + updatedLog.dueAdded } : c)
      };
    });
  };

  const deletePayment = (id: string) => {
    setData(prev => {
      const log = prev.paymentLogs.find(l => l.id === id);
      if (!log) return prev;
      setLastDeleted({ type: 'payment', item: log, label: `Payment: ৳${log.amount}` });
      return {
        ...prev,
        paymentLogs: prev.paymentLogs.filter(l => l.id !== id),
        customers: prev.customers.map(c => c.id === log.customerId ? { ...c, dueAmount: c.dueAmount + log.amount + (log.discount || 0) } : c)
      };
    });
  };

  const updatePayment = (updatedLog: PaymentLog) => {
    setData(prev => {
      const oldLog = prev.paymentLogs.find(l => l.id === updatedLog.id);
      if (!oldLog) return prev;
      return {
        ...prev,
        paymentLogs: prev.paymentLogs.map(l => l.id === updatedLog.id ? updatedLog : l),
        customers: prev.customers.map(c => c.id === updatedLog.customerId ? { ...c, dueAmount: c.dueAmount + (oldLog.amount + (oldLog.discount || 0)) - (updatedLog.amount + (updatedLog.discount || 0)) } : c)
      };
    });
  };

  const addLedgerEntry = (e: LedgerEntry) => setData(prev => ({ ...prev, ledgerEntries: [e, ...(prev.ledgerEntries || [])] }));
  const updateLedgerEntry = (e: LedgerEntry) => setData(prev => ({ ...prev, ledgerEntries: (prev.ledgerEntries || []).map(old => old.id === e.id ? e : old) }));
  const deleteLedgerEntry = (id: string) => {
    setData(prev => {
      const entry = (prev.ledgerEntries || []).find(e => e.id === id);
      if (entry) setLastDeleted({ type: 'ledger', item: entry, label: entry.description });
      return { ...prev, ledgerEntries: (prev.ledgerEntries || []).filter(e => e.id !== id) };
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (!user) return <Login lang={lang} setLang={setLang} />;
  
  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-emerald-500">
      <i className="fas fa-spinner fa-spin text-4xl mb-4"></i>
      <p className="font-black uppercase tracking-[0.5em] text-xs">Initializing Khata...</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      <Navbar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        onLogout={handleLogout} 
        user={user} 
        lang={lang} 
        setLang={setLang}
        isOpen={isSidebarOpen}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30 md:hidden no-print">
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-10 h-10 flex items-center justify-center text-slate-900">
              <i className={`fas ${isSidebarOpen ? 'fa-times' : 'fa-bars-staggered'}`}></i>
           </button>
           <h1 className="text-lg font-black text-slate-900 tracking-tighter">FIRST STEP</h1>
           <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-black text-xs text-white">
              {user.name.charAt(0).toUpperCase()}
           </div>
        </header>

        <main className="flex-1 p-4 md:p-8 lg:p-12 max-w-7xl mx-auto w-full">
          {currentPage === 'dashboard' && <Dashboard data={data} lang={lang} />}
          {currentPage === 'inventory' && (
            <Inventory 
              data={data} 
              onAdd={addProduct} 
              onUpdate={updateProduct} 
              onDelete={deleteProduct} 
              onAddCategory={addCategory} 
              onUpdateCategory={updateCategory} 
              onDeleteCategory={deleteCategory}
              onBulkCategoryUpdate={bulkCategoryUpdate}
              lang={lang} 
            />
          )}
          {currentPage === 'transactions' && (
            <Transactions 
              data={data} 
              onRecordPurchase={recordStockIn} 
              onRecordSale={recordStockOut} 
              lang={lang} 
            />
          )}
          {currentPage === 'reports' && (
            <Reports 
              data={data} 
              onDeleteStockIn={deleteStockIn} 
              onDeleteStockOut={deleteStockOut} 
              onUpdateStockIn={updateStockIn} 
              onUpdateStockOut={updateStockOut}
              onDeletePayment={deletePayment}
              onUpdatePayment={updatePayment}
              onDeleteLedgerEntry={deleteLedgerEntry}
              onUpdateLedgerEntry={updateLedgerEntry}
              lang={lang} 
            />
          )}
          {currentPage === 'customers' && (
            <Customers 
              data={data} 
              onAdd={addCustomer} 
              onUpdate={updateCustomer} 
              onDelete={deleteCustomer} 
              onPay={handlePaymentRecord}
              onRecordReturn={recordSalesReturn}
              onDeleteLog={deleteStockOut}
              onUpdateLog={updateStockOut}
              onDeletePayment={deletePayment}
              onUpdatePayment={updatePayment}
              lang={lang} 
            />
          )}
          {currentPage === 'suppliers' && (
            <Suppliers 
              data={data} 
              onAdd={addSupplier} 
              onUpdate={updateSupplier} 
              onDelete={deleteSupplier} 
              onDeleteLog={deleteStockIn}
              onUpdateLog={updateStockIn}
              lang={lang} 
            />
          )}
          {currentPage === 'sss' && (
            <SSS 
              data={data} 
              onAdd={addLedgerEntry} 
              onUpdate={updateLedgerEntry} 
              onDelete={deleteLedgerEntry} 
              lang={lang} 
            />
          )}
        </main>
      </div>

      <LanguageSwitcher lang={lang} setLang={setLang} />

      {lastDeleted && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] animate-slide-up no-print">
           <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-slate-800">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Item Deleted</span>
                <span className="text-sm font-bold truncate max-w-[200px]">{lastDeleted.label}</span>
              </div>
              <button 
                onClick={handleUndo}
                className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition active:scale-95"
              >
                Undo
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
