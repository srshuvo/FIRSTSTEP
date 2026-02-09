
export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  categoryId?: string;
  stock: number;
  unit: string;
  costPrice: number;
  salePrice: number;
  lowStockThreshold: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  dueAmount: number;
}

export interface StockIn {
  id: string;
  billNumber?: string;
  productId: string;
  productName: string; 
  productUnit: string; 
  supplierId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  date: string;
}

export interface StockOut {
  id: string;
  billNumber: string;
  productId: string;
  productName: string; 
  productUnit: string; 
  customerId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  paidAmount: number;
  dueAdded: number;
  date: string;
  isSample?: boolean;
}

export interface PaymentLog {
  id: string;
  customerId: string;
  amount: number;
  discount: number;
  date: string;
  note: string;
}

export interface LedgerEntry {
  id: string;
  date: string;
  description: string;
  name: string;
  amount: number;
}

export interface AppData {
  categories: Category[];
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  stockInLogs: StockIn[];
  stockOutLogs: StockOut[];
  paymentLogs: PaymentLog[];
  ledgerEntries?: LedgerEntry[];
}
