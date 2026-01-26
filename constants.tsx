
import { AppData } from './types';

export const INITIAL_DATA: AppData = {
  products: [
    { id: '1', name: 'চিনি (Sugar)', stock: 50, unit: 'Kg', costPrice: 110, salePrice: 125, lowStockThreshold: 10 },
    { id: '2', name: 'মসুর ডাল (Lentil)', stock: 30, unit: 'Kg', costPrice: 130, salePrice: 145, lowStockThreshold: 15 },
  ],
  suppliers: [
    { id: '1', name: 'করিম ট্রেডার্স', phone: '01711223344' }
  ],
  customers: [
    { id: '1', name: 'রহিম সাহেব', phone: '01999887766', dueAmount: 500 }
  ],
  stockInLogs: [],
  stockOutLogs: [],
  paymentLogs: [],
};
