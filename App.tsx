
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { User, UserRole, AppData, Product, Customer, Supplier, StockIn, StockOut, PaymentLog } from './types';
import { INITIAL_DATA } from './constants';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Sales from './components/Sales';
import Purchase from './components/Purchase';
import Reports from './components/Reports';
import Customers from './components/Customers';
import Suppliers from './components/Suppliers';
import Navbar from './components/Navbar';
import Login from './components/Login';

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
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'inventory' | 'sales' | 'purchase' | 'reports' | 'customers' | 'suppliers'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [lastDeleted, setLastDeleted] = useState<{ type: string, item: any } | null>(null);
  const undoTimeoutRef = useRef<any>(null);

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

  const showUndo = (type: string, item: any) => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setLastDeleted({ type, item });
    undoTimeoutRef.current = setTimeout(() => setLastDeleted(null), 5000);
  };

  const handleUndo = () => {
    if (!lastDeleted) return;
    const { type, item } = lastDeleted;
    setData(prev => {
      let newData = { ...prev };
      if (type === 'product') newData.products = [item, ...prev.products];
      else if (type === 'customer') newData.customers = [item, ...prev.customers];
      else if (type === 'supplier') newData.suppliers = [item, ...prev.suppliers];
      return newData;
    });
    setLastDeleted(null);
  };

  const deleteProduct = (id: string) => {
    setData(prev => {
      const itemToDelete = prev.products.find(p => p.id === id);
      if (itemToDelete) showUndo('product', itemToDelete);
      return { ...prev, products: prev.products.filter(p => p.id !== id) };
    });
  };

  const deleteCustomer = (id: string) => {
    setData(prev => {
      const itemToDelete = prev.customers.find(c => c.id === id);
      if (itemToDelete) showUndo('customer', itemToDelete);
      return { ...prev, customers: prev.customers.filter(c => c.id !== id) };
    });
  };

  const deleteSupplier = (id: string) => {
    setData(prev => {
      const itemToDelete = prev.suppliers.find(s => s.id === id);
      if (itemToDelete) showUndo('supplier', itemToDelete);
      return { ...prev, suppliers: prev.suppliers.filter(s => s.id !== id) };
    });
  };

  const handlePaymentRecord = (log: PaymentLog) => {
    setData(prev => ({
      ...prev,
      customers: prev.customers.map(c => c.id === log.customerId ? { ...c, dueAmount: Math.max(0, c.dueAmount - (log.amount + (log.discount || 0))) } : c),
      paymentLogs: [log, ...(prev.paymentLogs || [])]
    }));
  };

  const deleteStockOut = (logId: string) => {
    setData(prev => {
      const log = prev.stockOutLogs.find(l => l.id === logId);
      if (!log) return prev;
      return {
        ...prev,
        stockOutLogs: prev.stockOutLogs.filter(l => l.id !== logId),
        products: prev.products.map(p => p.id === log.productId ? { ...p, stock: p.stock + log.quantity } : p),
        customers: prev.customers.map(c => c.id === log.customerId ? { ...c, dueAmount: Math.max(0, c.dueAmount - log.dueAdded) } : c)
      };
    });
  };

  const updateStockOut = (updatedLog: StockOut) => {
    setData(prev => {
      const oldLog = prev.stockOutLogs.find(l => l.id === updatedLog.id);
      if (!oldLog) return prev;
      
      let tempProducts = prev.products.map(p => p.id === oldLog.productId ? { ...p, stock: p.stock + oldLog.quantity } : p);
      let tempCustomers = prev.customers.map(c => c.id === oldLog.customerId ? { ...c, dueAmount: Math.max(0, c.dueAmount - oldLog.dueAdded) } : c);
      
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
      
      // Step 1: Temporarily revert old quantity to get base stock
      let tempProducts = prev.products.map(p => p.id === oldLog.productId ? { ...p, stock: Math.max(0, p.stock - oldLog.quantity) } : p);
      
      // Step 2: Apply Weighted Average with the new purchase details
      const finalProducts = tempProducts.map(p => {
        if (p.id === updatedLog.productId) {
          const currentTotalValue = p.stock * p.costPrice;
          const incomingValue = updatedLog.quantity * updatedLog.unitPrice;
          const newTotalStock = p.stock + updatedLog.quantity;
          const avgPrice = newTotalStock > 0 
            ? Number(((currentTotalValue + incomingValue) / newTotalStock).toFixed(2)) 
            : updatedLog.unitPrice;
          
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
      return {
        ...prev,
        paymentLogs: prev.paymentLogs.filter(l => l.id !== logId),
        customers: prev.customers.map(c => c.id === log.customerId ? { ...c, dueAmount: c.dueAmount + log.amount + (log.discount || 0) } : c)
      };
    });
  };

  const updatePaymentLog = (updatedLog: PaymentLog) => {
    setData(prev => {
      const oldLog = prev.paymentLogs.find(l => l.id === updatedLog.id);
      if (!oldLog) return prev;

      let tempCustomers = prev.customers.map(c => c.id === oldLog.customerId ? { ...c, dueAmount: c.dueAmount + oldLog.amount + (oldLog.discount || 0) } : c);
      
      const finalCustomers = tempCustomers.map(c => c.id === updatedLog.customerId ? { ...c, dueAmount: Math.max(0, c.dueAmount - (updatedLog.amount + (updatedLog.discount || 0))) } : c);

      return {
        ...prev,
        paymentLogs: prev.paymentLogs.map(l => l.id === updatedLog.id ? updatedLog : l),
        customers: finalCustomers
      };
    });
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
    return <Login lang={lang} setLang={setLang} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row relative">
      <div className="md:hidden bg-emerald-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 no-print">
        <h1 className="font-bold text-lg">FIRST STEP</h1>
        <div className="flex items-center gap-3">
           {syncing ? <i className="fas fa-sync fa-spin text-xs text-emerald-400"></i> : <i className="fas fa-cloud text-xs text-emerald-400"></i>}
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2">
            <i className={`fas ${isSidebarOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
          </button>
        </div>
      </div>

      <Navbar 
        currentPage={currentPage} 
        setCurrentPage={(p) => { setCurrentPage(p); setIsSidebarOpen(false); }} 
        onLogout={async () => { await supabase.auth.signOut(); setUser(null); }} 
        user={user} 
        lang={lang} 
        setLang={setLang} 
        isOpen={isSidebarOpen}
      />
      
      <main className="flex-1 p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-sm min-h-[70vh] p-1 md:p-4 border border-gray-100">
          {currentPage === 'dashboard' && <Dashboard data={data} lang={lang} />}
          {currentPage === 'inventory' && (
            <Inventory 
              data={data} 
              onAdd={(p) => setData(prev => ({ ...prev, products: [...prev.products, p] }))} 
              onUpdate={(p) => setData(prev => ({...prev, products: prev.products.map(pr => pr.id === p.id ? p : pr)}))} 
              onDelete={deleteProduct} 
              lang={lang} 
            />
          )}
          {currentPage === 'purchase' && (
            <Purchase 
              data={data} 
              onRecord={(entry) => setData(prev => {
                const product = prev.products.find(p => p.id === entry.productId);
                if (!product) return prev;

                // Weighted Average Calculation:
                // New Cost = ((Old Stock * Old Price) + (New Quantity * New Price)) / Total Stock
                const currentTotalValue = product.stock * product.costPrice;
                const incomingValue = entry.quantity * entry.unitPrice;
                const totalNewStock = product.stock + entry.quantity;
                const avgPrice = totalNewStock > 0 
                  ? Number(((currentTotalValue + incomingValue) / totalNewStock).toFixed(2)) 
                  : entry.unitPrice;

                return {
                  ...prev, 
                  products: prev.products.map(p => p.id === entry.productId 
                    ? { ...p, stock: totalNewStock, costPrice: avgPrice } 
                    : p
                  ),
                  stockInLogs: [entry, ...prev.stockInLogs]
                };
              })} 
              lang={lang} 
            />
          )}
          {currentPage === 'sales' && (
            <Sales 
              data={data} 
              onRecord={(entry) => setData(prev => ({
                ...prev,
                products: prev.products.map(p => p.id === entry.productId ? { ...p, stock: p.stock - entry.quantity } : p),
                customers: prev.customers.map(c => c.id === entry.customerId ? { ...c, dueAmount: c.dueAmount + entry.dueAdded } : c),
                stockOutLogs: [entry, ...prev.stockOutLogs]
              }))} 
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
              lang={lang} 
            />
          )}
          {currentPage === 'customers' && (
            <Customers 
              data={data} 
              onAdd={(c) => setData(prev => ({...prev, customers: [...prev.customers, c]}))} 
              onUpdate={(c) => setData(prev => ({...prev, customers: prev.customers.map(cu => cu.id === c.id ? c : cu)}))} 
              onDelete={deleteCustomer} 
              onPay={handlePaymentRecord}
              onDeleteLog={deleteStockOut}
              onUpdateLog={updateStockOut}
              onDeletePayment={deletePaymentLog}
              onUpdatePayment={updatePaymentLog}
              lang={lang} 
            />
          )}
          {currentPage === 'suppliers' && (
            <Suppliers 
              data={data} 
              onAdd={(s) => setData(prev => ({...prev, suppliers: [...prev.suppliers, s]}))} 
              onUpdate={(s) => setData(prev => ({...prev, suppliers: prev.suppliers.map(su => su.id === s.id ? s : su)}))} 
              onDelete={deleteSupplier} 
              onDeleteLog={deleteStockIn}
              onUpdateLog={updateStockIn}
              lang={lang} 
            />
          )}
        </div>
      </main>

      {lastDeleted && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 z-[100] animate-bounce">
          <span className="font-bold text-sm">
            {lang === 'bn' ? 'মুছে ফেলা হয়েছে!' : 'Deleted!'}
          </span>
          <button 
            onClick={handleUndo}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-black uppercase transition"
          >
            {lang === 'bn' ? 'পূর্বাবস্থায় ফেরান' : 'Undo'}
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
