
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
import ChatBot from './components/ChatBot';
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

  const deleteProduct = (id: string) => {
    setData(prev => {
      const itemToDelete = prev.products.find(p => p.id === id);
      if (itemToDelete) setLastDeleted({ type: 'product', item: itemToDelete, label: itemToDelete.name });
      return { ...prev, products: prev.products.filter(p => p.id !== id) };
    });
  };

  const deleteCustomer = (id: string) => {
    setData(prev => {
      const itemToDelete = prev.customers.find(c => c.id === id);
      if (itemToDelete) setLastDeleted({ type: 'customer', item: itemToDelete, label: itemToDelete.name });
      return { ...prev, customers: prev.customers.filter(c => c.id !== id) };
    });
  };

  const deleteSupplier = (id: string) => {
    setData(prev => {
      const itemToDelete = prev.suppliers.find(s => s.id === id);
      if (itemToDelete) setLastDeleted({ type: 'supplier', item: itemToDelete, label: itemToDelete.name });
      return { ...prev, suppliers: prev.suppliers.filter(s => s.id !== id) };
    });
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
      let tempProducts = prev.products.map(p => p.id === oldLog.productId ? { ...p, stock: p.stock + oldLog.quantity } : p);
      let tempCustomers = prev.customers.map(c => c.id === oldLog.customerId ? { ...c, dueAmount: c.dueAmount - oldLog.dueAdded } : c);
      const finalProducts = tempProducts.map(p => p.id === updatedLog.productId ? { ...p, stock: p.stock - updatedLog.quantity } : p);
      const finalCustomers = tempCustomers.map(c => c.id === updatedLog.customerId ? { ...c, dueAmount: c.dueAmount + updatedLog.dueAdded } : c);
      return {
        ...prev,
        stockOutLogs: prev.stockOutLogs.map(l => l.id === updatedLog.id ? updatedLog : l),
        products: finalProducts,
        customers: finalCustomers
      };
    });
  };

  const deleteStockIn = (logId: string) => {
    setData(prev => {
      const log = prev.stockInLogs.find(l => l.id === logId);
      if (!log) return prev;
      setLastDeleted({ type: 'stockIn', item: log, label: `${log.productName} (${log.quantity})` });
      return {
        ...prev,
        stockInLogs: prev.stockInLogs.filter(l => l.id !== logId),
        products: prev.products.map(p => p.id === log.productId ? { ...p, stock: Math.max(0, p.stock - log.quantity) } : p)
      };
    });
  };

  const updateStockIn = (updatedLog: StockIn) => {
    setData(prev => {
      const oldLog = prev.stockInLogs.find(l => l.id === updatedLog.id);
      if (!oldLog) return prev;
      let tempProducts = prev.products.map(p => p.id === oldLog.productId ? { ...p, stock: Math.max(0, p.stock - oldLog.quantity) } : p);
      const finalProducts = tempProducts.map(p => {
        if (p.id === updatedLog.productId) {
          const currentTotalValue = p.stock * p.costPrice;
          const incomingValue = updatedLog.quantity * updatedLog.unitPrice;
          const newTotalStock = p.stock + updatedLog.quantity;
          const avgPrice = newTotalStock > 0 ? Number(((currentTotalValue + incomingValue) / newTotalStock).toFixed(2)) : updatedLog.unitPrice;
          return { ...p, stock: newTotalStock, costPrice: avgPrice };
        }
        return p;
      });
      return {
        ...prev,
        stockInLogs: prev.stockInLogs.map(l => l.id === updatedLog.id ? updatedLog : l),
        products: finalProducts
      };
    });
  };

  const deletePaymentLog = (logId: string) => {
    setData(prev => {
      const log = prev.paymentLogs.find(l => l.id === logId);
      if (!log) return prev;
      setLastDeleted({ type: 'payment', item: log, label: `৳${log.amount}` });
      return {
        ...prev,
        paymentLogs: prev.paymentLogs.filter(l => l.id !== logId),
        customers: prev.customers.map(c => c.id === log.customerId ? { ...c, dueAmount: c.dueAmount + log.amount + (log.discount || 0) } : c)
      };
    });
  };

  const updatePaymentLog = (updatedLog: PaymentLog) => {
    setData(prev => {
      const log = prev.paymentLogs.find(l => l.id === updatedLog.id);
      if (!log) return prev;
      let tempCustomers = prev.customers.map(c => c.id === log.customerId ? { ...c, dueAmount: c.dueAmount + log.amount + (log.discount || 0) } : c);
      const finalCustomers = tempCustomers.map(c => c.id === updatedLog.customerId ? { ...c, dueAmount: c.dueAmount - (updatedLog.amount + (updatedLog.discount || 0)) } : c);
      return {
        ...prev,
        paymentLogs: prev.paymentLogs.map(l => l.id === updatedLog.id ? updatedLog : l),
        customers: finalCustomers
      };
    });
  };

  const deleteLedgerEntry = (id: string) => {
    setData(prev => {
      const item = (prev.ledgerEntries || []).find(e => e.id === id);
      if (item) setLastDeleted({ type: 'ledger', item, label: item.description });
      return { ...prev, ledgerEntries: (prev.ledgerEntries || []).filter(e => e.id !== id) };
    });
  };

  const updateLedgerEntry = (entry: LedgerEntry) => {
    setData(prev => ({ ...prev, ledgerEntries: (prev.ledgerEntries || []).map(e => e.id === entry.id ? entry : e) }));
  };

  const addLedgerEntry = (entry: LedgerEntry) => {
    setData(prev => ({ ...prev, ledgerEntries: [entry, ...(prev.ledgerEntries || [])] }));
  };

  const addCategory = (cat: Category) => setData(prev => ({ ...prev, categories: [...(prev.categories || []), cat] }));
  const updateCategory = (cat: Category) => setData(prev => ({ ...prev, categories: (prev.categories || []).map(c => c.id === cat.id ? cat : c) }));
  
  const deleteCategory = (id: string) => {
    setData(prev => {
      const catToDelete = (prev.categories || []).find(c => c.id === id);
      if (catToDelete) {
        const affectedProductIds = prev.products.filter(p => p.categoryId === id).map(p => p.id);
        setLastDeleted({ type: 'category', item: { category: catToDelete, affectedProductIds }, label: catToDelete.name });
      }
      return {
        ...prev,
        categories: (prev.categories || []).filter(c => c.id !== id),
        products: prev.products.map(p => p.categoryId === id ? { ...p, categoryId: undefined } : p)
      };
    });
  };

  const bulkUpdateProductCategory = (catId: string | undefined, productIds: string[]) => {
    setData(prev => ({ ...prev, products: prev.products.map(p => productIds.includes(p.id) ? { ...p, categoryId: catId } : p) }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-emerald-900 flex flex-col items-center justify-center text-white p-6">
        <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold">{lang === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}</h2>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login lang={lang} setLang={setLang} />
        <LanguageSwitcher lang={lang} setLang={setLang} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row relative">
      <div className="md:hidden bg-emerald-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 no-print">
        <h1 className="font-bold text-lg">FIRST STEP</h1>
        <div className="flex items-center gap-3">
           {syncing ? <i className="fas fa-sync fa-spin text-xs text-emerald-400"></i> : <i className="fas fa-cloud text-xs text-emerald-400"></i>}
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2"><i className={`fas ${isSidebarOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i></button>
        </div>
      </div>

      <Navbar currentPage={currentPage} setCurrentPage={(p) => { setCurrentPage(p); setIsSidebarOpen(false); }} onLogout={async () => { await supabase.auth.signOut(); setUser(null); }} user={user} lang={lang} setLang={setLang} isOpen={isSidebarOpen} />
      
      <main className="flex-1 p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-sm min-h-[70vh] p-1 md:p-4 border border-gray-100 relative">
          {currentPage === 'dashboard' && <Dashboard data={data} lang={lang} />}
          {currentPage === 'inventory' && <Inventory data={data} onAdd={(p) => setData(prev => ({ ...prev, products: [...prev.products, p] }))} onUpdate={(p) => setData(prev => ({...prev, products: prev.products.map(pr => pr.id === p.id ? p : pr)}))} onDelete={deleteProduct} onAddCategory={addCategory} onUpdateCategory={updateCategory} onDeleteCategory={deleteCategory} onBulkCategoryUpdate={bulkUpdateProductCategory} lang={lang} />}
          {currentPage === 'transactions' && <Transactions data={data} onRecordPurchase={(entry) => setData(prev => {
                const product = prev.products.find(p => p.id === entry.productId);
                if (!product) return prev;
                const currentTotalValue = product.stock * product.costPrice;
                const incomingValue = entry.quantity * entry.unitPrice;
                const newTotalStock = product.stock + entry.quantity;
                const avgPrice = newTotalStock > 0 ? Number(((currentTotalValue + incomingValue) / newTotalStock).toFixed(2)) : entry.unitPrice;
                return { ...prev, products: prev.products.map(p => p.id === entry.productId ? { ...p, stock: newTotalStock, costPrice: avgPrice } : p), stockInLogs: [entry, ...prev.stockInLogs] };
              })} onRecordSale={(entry) => setData(prev => ({ ...prev, products: prev.products.map(p => p.id === entry.productId ? { ...p, stock: p.stock - entry.quantity } : p), customers: prev.customers.map(c => c.id === entry.customerId ? { ...c, dueAmount: c.dueAmount + entry.dueAdded } : c), stockOutLogs: [entry, ...prev.stockOutLogs] }))} lang={lang} />}
          {currentPage === 'reports' && <Reports data={data} onDeleteStockIn={deleteStockIn} onDeleteStockOut={deleteStockOut} onUpdateStockIn={updateStockIn} onUpdateStockOut={updateStockOut} lang={lang} />}
          {currentPage === 'customers' && <Customers data={data} onAdd={(c) => setData(prev => ({...prev, customers: [...prev.customers, c]}))} onUpdate={(c) => setData(prev => ({...prev, customers: prev.customers.map(cu => cu.id === c.id ? c : cu)}))} onDelete={deleteCustomer} onPay={handlePaymentRecord} onDeleteLog={deleteStockOut} onUpdateLog={updateStockOut} onDeletePayment={deletePaymentLog} onUpdatePayment={updatePaymentLog} lang={lang} />}
          {currentPage === 'suppliers' && <Suppliers data={data} onAdd={(s) => setData(prev => ({...prev, suppliers: [...prev.suppliers, s]}))} onUpdate={(s) => setData(prev => ({...prev, suppliers: prev.suppliers.map(su => su.id === s.id ? s : su)}))} onDelete={deleteSupplier} onDeleteLog={deleteStockIn} onUpdateLog={updateStockIn} lang={lang} />}
          {currentPage === 'sss' && <SSS data={data} onAdd={addLedgerEntry} onUpdate={updateLedgerEntry} onDelete={deleteLedgerEntry} lang={lang} />}
        </div>
      </main>

      {lastDeleted && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-[100] animate-bounce max-w-[90vw] md:max-w-md border border-gray-700">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-emerald-400 mb-0.5">{lang === 'bn' ? 'মুছে ফেলা হয়েছে' : 'Deleted'}</span>
            <span className="font-bold text-sm truncate">{lastDeleted.label}</span>
          </div>
          <button onClick={handleUndo} className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase transition shrink-0 shadow-lg">{lang === 'bn' ? 'ফেরান (Undo)' : 'Undo'}</button>
        </div>
      )}

      <LanguageSwitcher lang={lang} setLang={setLang} />
      <ChatBot data={data} lang={lang} />
    </div>
  );
};

export default App;
