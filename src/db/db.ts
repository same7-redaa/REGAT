

export interface Product {
    id: string; // UUID
    name: string;
    purchasePrice: number;
    sellPrice: number;
    stock: number;
    stockThreshold?: number; // Alert when stock falls below this (optional)
    is_deleted?: boolean;
    updated_at?: number;
}

export interface Shipper {
    id: string; // UUID
    name: string;
    rates: { governorate: string; price: number }[];
    returnCost?: number;
    is_deleted?: boolean;
    updated_at?: number;
}

export type OrderStatus = 'تحت المراجعة' | 'تم الشحن' | 'تم التوصيل' | 'تسليم جزئي' | 'لاغي' | 'مرفوض';

export interface Order {
    id: string; // UUID
    customerName: string;
    phone: string;
    altPhone?: string;
    governorate: string;
    address: string;
    productId: string; // UUID
    quantity: number;
    totalPrice: number;
    discount: number;
    shipperId: string; // UUID
    shippingCost: number;
    status: OrderStatus;
    date: string; // ISO string
    shipDate?: string; // ISO string
    notes?: string;
    statusHistory?: { status: OrderStatus; date: string }[];
    printCount?: number;
    returnCost?: number; // Cost paid for returns (rejected or partial)
    deliveredQuantity?: number; // Quantity actually delivered in a partial delivery
    returnedQuantity?: number; // Quantity returned in a partial delivery
    is_deleted?: boolean;
    updated_at?: number;
}

export interface Expense {
    id: string; // UUID
    category: string;
    amount: number;
    date: string; // ISO string
    note?: string;
    is_deleted?: boolean;
    updated_at?: number;
}

// Only TypeScript interfaces remain here for fully online Supabase system.

export interface AppSettings {
    id: string; // Hardcoded to 'app_settings'
    storeName: string;
    notificationRules: Record<string, any>;
    updated_at?: number;
}
