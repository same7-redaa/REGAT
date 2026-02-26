import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product, Shipper, Order, Expense, AppSettings } from '../db/db';
import { supabase } from '../db/supabase';
import { mapToSupabase, mapFromSupabase } from '../db/supabaseUtils';

interface DatabaseContextType {
    isReady: boolean;
    products: Product[];
    shippers: Shipper[];
    orders: Order[];
    expenses: Expense[];
    settings: AppSettings | null;

    saveProduct: (product: Product) => Promise<void>;
    adjustProductStock: (productId: string, delta: number) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;

    saveShipper: (shipper: Shipper) => Promise<void>;
    deleteShipper: (id: string) => Promise<void>;

    saveOrder: (order: Order) => Promise<void>;
    deleteOrder: (id: string) => Promise<void>;

    saveExpense: (expense: Expense) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;

    updateSettings: (settings: Partial<AppSettings>) => Promise<void>;
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
    const [settings, setSettings] = useState<AppSettings | null>(null);

    const fetchAllData = async () => {
        try {
            const [
                { data: pData, error: pErr },
                { data: sData, error: sErr },
                { data: oData, error: oErr },
                { data: eData, error: eErr },
                { data: settingsData, error: stErr }
            ] = await Promise.all([
                supabase.from('products').select('*').neq('is_deleted', true),
                supabase.from('shippers').select('*').neq('is_deleted', true),
                supabase.from('orders').select('*').neq('is_deleted', true),
                supabase.from('expenses').select('*').neq('is_deleted', true),
                supabase.from('settings').select('*').eq('id', 'app_settings').single()
            ]);

            if (pErr) console.error('❌ products fetch error:', pErr);
            if (sErr) console.error('❌ shippers fetch error:', sErr);
            if (oErr) console.error('❌ orders fetch error:', oErr);
            if (eErr) console.error('❌ expenses fetch error:', eErr);
            if (stErr && stErr.code !== 'PGRST116') console.error('❌ settings fetch error:', stErr);

            setProducts(pData?.map(mapFromSupabase) || []);
            setShippers(sData?.map(mapFromSupabase) || []);
            setOrders(oData?.map(mapFromSupabase) || []);
            setExpenses(eData?.map(mapFromSupabase) || []);

            if (settingsData) {
                setSettings(mapFromSupabase(settingsData));
            }

        } catch (error) {
            console.error('❌ fetchAllData failed:', error);
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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (payload) => {
                if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                    setSettings(mapFromSupabase(payload.new));
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
            console.error(`❌ Error saving to ${tableName}:`, error.message, error.details);
        } else {
            console.log(`✅ Saved to ${tableName}:`, itemToSave.id);
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

    // Adjust stock by delta (+/-) reading live value from Supabase to avoid stale state
    const adjustProductStock = async (productId: string, delta: number) => {
        // Read the freshest value from DB first
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
        if (error || !data) {
            console.error('adjustProductStock: failed to read product', productId, error);
            return;
        }
        const fresh = mapFromSupabase(data) as Product;
        const newStock = Number(fresh.stock) + delta;
        await _saveItem('products', { ...fresh, stock: newStock }, setProducts);
    };
    const deleteProduct = (id: string) => _deleteItem('products', id, setProducts);

    const saveShipper = (shipper: Shipper) => _saveItem('shippers', shipper, setShippers);
    const deleteShipper = (id: string) => _deleteItem('shippers', id, setShippers);

    const saveOrder = (order: Order) => _saveItem('orders', order, setOrders);
    const deleteOrder = (id: string) => _deleteItem('orders', id, setOrders);

    const saveExpense = (expense: Expense) => _saveItem('expenses', expense, setExpenses);
    const deleteExpense = (id: string) => _deleteItem('expenses', id, setExpenses);

    const updateSettings = async (newSettingsPartial: Partial<AppSettings>) => {
        const updated = {
            ...(settings || { storeName: 'Store Name', notificationRules: {} }),
            ...newSettingsPartial,
            id: 'app_settings',
            updated_at: Date.now()
        };
        // Optimistic UI
        setSettings(updated);

        const mapped = mapToSupabase(updated);
        const { error } = await supabase.from('settings').upsert(mapped, { onConflict: 'id' });
        if (error) {
            console.error('Error saving settings:', error);
        }
    };

    return (
        <DatabaseContext.Provider value={{
            isReady,
            products, shippers, orders, expenses, settings,
            saveProduct, adjustProductStock, deleteProduct,
            saveShipper, deleteShipper,
            saveOrder, deleteOrder,
            saveExpense, deleteExpense,
            updateSettings
        }}>
            {children}
        </DatabaseContext.Provider>
    );
};
