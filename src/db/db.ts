

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
    rates: { governorate: string; price: number; discount?: number }[];
    returnCost?: number;
    is_deleted?: boolean;
    updated_at?: number;
}

export type OrderStatus = 'تحت المراجعة' | 'تم الشحن' | 'تم التوصيل' | 'تسليم جزئي' | 'لاغي' | 'مرفوض';

export interface OrderItem {
    productId: string; // UUID
    quantity: number;
    returnedQuantity?: number; // Granular control over partial delivery/returns
}

export interface Order {
    id: string; // UUID
    customerName: string;
    phone: string;
    altPhone?: string;
    governorate: string;
    address: string;
    // Legacy single item fields: (kept for compatibility)
    productId?: string;
    quantity?: number;

    // New multi-item field:
    items?: OrderItem[];

    totalPrice: number;
    discount: number;
    shipperId: string; // UUID
    shippingCost: number;
    status: OrderStatus;
    date: string; // ISO string
    shipDate?: string; // ISO string
    notes?: string;
    deliveryDays?: number; // Expected delivery window in days (alert if shipped > X days)
    statusHistory?: { status: OrderStatus; date: string }[];
    printCount?: number;

    returnCost?: number; // Cost paid for returns (rejected or partial)
    deliveredQuantity?: number; // Legacy partial delivery metric
    returnedQuantity?: number; // Legacy returned quantity metric

    is_deleted?: boolean;
    updated_at?: number;
}

// Helper to normalize legacy and new orders
export function getOrderItems(order: Order): OrderItem[] {
    if (order.items && order.items.length > 0) {
        return order.items;
    }
    if (order.productId && order.quantity) {
        return [{
            productId: order.productId,
            quantity: order.quantity,
            returnedQuantity: order.returnedQuantity
        }];
    }
    return [];
}

/**
 * Fundamental solution for long UUIDs.
 * Slices the ID to 8 characters and converts to uppercase for a professional look.
 */
export function formatId(id?: string): string {
    if (!id) return '';
    return id.slice(0, 8).toUpperCase();
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
