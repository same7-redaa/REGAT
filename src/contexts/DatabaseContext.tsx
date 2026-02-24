import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, Shipper, Order, Expense } from '../db/db';
import { supabase } from '../db/supabase';
import { mapToSupabase, mapFromSupabase } from '../db/supabaseUtils';

interface DatabaseContextType {
    isReady: boolean;
    products: Product[];
    shippers: Shipper[];
    orders: Order[];
    expenses: Expense[];

    saveProduct: (product: Product) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;

    saveShipper: (shipper: Shipper) => Promise<void>;
    deleteShipper: (id: string) => Promise<void>;

    saveOrder: (order: Order) => Promise<void>;
    deleteOrder: (id: string) => Promise<void>;

    saveExpense: (expense: Expense) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | null>(null);

export const useDatabase = () => {
    const context = useContext(DatabaseContext);
    if (!context) {
        throw new Error('useDatabase must be used within a DatabaseProvider');
    }
    return context;
};

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isReady, setIsReady] = useState(false);

    const [products, setProducts] = useState<Product[]>([]);
    const [shippers, setShippers] = useState<Shipper[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);

    const fetchAllData = async () => {
        try {
            const [
                { data: pData },
                { data: sData },
                { data: oData },
                { data: eData }
            ] = await Promise.all([
                supabase.from('products').select('*').eq('is_deleted', false),
                supabase.from('shippers').select('*').eq('is_deleted', false),
                supabase.from('orders').select('*').eq('is_deleted', false),
                supabase.from('expenses').select('*').eq('is_deleted', false)
            ]);

            setProducts(pData?.map(mapFromSupabase) || []);
            setShippers(sData?.map(mapFromSupabase) || []);
            setOrders(oData?.map(mapFromSupabase) || []);
            setExpenses(eData?.map(mapFromSupabase) || []);

        } catch (error) {
            console.error("Error fetching data from Supabase:", error);
        } finally {
            setIsReady(true);
        }
    };

    useEffect(() => {
        fetchAllData();

        // Subscriptions
        const channels = supabase.channel('custom-all-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    const mapped = mapFromSupabase(payload.new);
                    setProducts(prev => {
                        const next = [...prev];
                        const idx = next.findIndex(x => x.id === mapped.id);
                        if (mapped.is_deleted) {
                            if (idx !== -1) next.splice(idx, 1);
                        } else {
                            if (idx !== -1) next[idx] = mapped;
                            else next.push(mapped);
                        }
                        return next;
                    });
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'shippers' }, (payload) => {
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    const mapped = mapFromSupabase(payload.new);
                    setShippers(prev => {
                        const next = [...prev];
                        const idx = next.findIndex(x => x.id === mapped.id);
                        if (mapped.is_deleted) {
                            if (idx !== -1) next.splice(idx, 1);
                        } else {
                            if (idx !== -1) next[idx] = mapped;
                            else next.push(mapped);
                        }
                        return next;
                    });
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    const mapped = mapFromSupabase(payload.new);
                    setOrders(prev => {
                        const next = [...prev];
                        const idx = next.findIndex(x => x.id === mapped.id);
                        if (mapped.is_deleted) {
                            if (idx !== -1) next.splice(idx, 1);
                        } else {
                            if (idx !== -1) next[idx] = mapped;
                            else next.push(mapped);
                        }
                        return next;
                    });
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload) => {
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    const mapped = mapFromSupabase(payload.new);
                    setExpenses(prev => {
                        const next = [...prev];
                        const idx = next.findIndex(x => x.id === mapped.id);
                        if (mapped.is_deleted) {
                            if (idx !== -1) next.splice(idx, 1);
                        } else {
                            if (idx !== -1) next[idx] = mapped;
                            else next.push(mapped);
                        }
                        return next;
                    });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channels);
        };
    }, []);

    // Generic save
    const _saveItem = async (tableName: string, item: any, setList: any) => {
        const itemToSave = {
            ...item,
            id: item.id || crypto.randomUUID(),
            updated_at: Date.now(),
            is_deleted: false
        };

        // Optimistic UI update
        setList((prev: any[]) => {
            const next = [...prev];
            const idx = next.findIndex(x => x.id === itemToSave.id);
            if (idx !== -1) next[idx] = itemToSave;
            else next.push(itemToSave);
            return next;
        });

        const mapped = mapToSupabase(itemToSave);
        const { error } = await supabase.from(tableName).upsert(mapped, { onConflict: 'id' });
        if (error) {
            console.error(`Error saving to ${tableName}:`, error);
        }
    };

    // Generic delete (soft delete)
    const _deleteItem = async (tableName: string, id: string, setList: any) => {
        // Optimistic UI update
        setList((prev: any[]) => prev.filter(x => x.id !== id));

        const { error } = await supabase.from(tableName).update({ is_deleted: true, updated_at: Date.now() }).eq('id', id);
        if (error) {
            console.error(`Error deleting from ${tableName}:`, error);
        }
    };

    const saveProduct = (product: Product) => _saveItem('products', product, setProducts);
    const deleteProduct = (id: string) => _deleteItem('products', id, setProducts);

    const saveShipper = (shipper: Shipper) => _saveItem('shippers', shipper, setShippers);
    const deleteShipper = (id: string) => _deleteItem('shippers', id, setShippers);

    const saveOrder = (order: Order) => _saveItem('orders', order, setOrders);
    const deleteOrder = (id: string) => _deleteItem('orders', id, setOrders);

    const saveExpense = (expense: Expense) => _saveItem('expenses', expense, setExpenses);
    const deleteExpense = (id: string) => _deleteItem('expenses', id, setExpenses);

    return (
        <DatabaseContext.Provider value={{
            isReady,
            products, shippers, orders, expenses,
            saveProduct, deleteProduct,
            saveShipper, deleteShipper,
            saveOrder, deleteOrder,
            saveExpense, deleteExpense
        }}>
            {children}
        </DatabaseContext.Provider>
    );
};
