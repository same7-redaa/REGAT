import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface AppNotification {
    id: string;
    type: 'order_delayed' | 'low_stock';
    title: string;
    message: string;
    orderId?: string;
    productId?: string;
    timestamp: number;
    read: boolean;
}

interface NotificationContextValue {
    notifications: AppNotification[];
    unreadCount: number;
    addNotifications: (items: Omit<AppNotification, 'id' | 'read' | 'timestamp'>[]) => void;
    markAllRead: () => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
    notifications: [],
    unreadCount: 0,
    addNotifications: () => { },
    markAllRead: () => { },
    clearAll: () => { },
});

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);

    const addNotifications = useCallback((items: Omit<AppNotification, 'id' | 'read' | 'timestamp'>[]) => {
        if (items.length === 0) return;
        setNotifications(prev => {
            // Avoid duplicates: keep previous + add only new ones (by type+entityId)
            const existingKeys = new Set(prev.map(n => `${n.type}-${n.orderId ?? n.productId}`));
            const fresh = items
                .filter(i => !existingKeys.has(`${i.type}-${i.orderId ?? i.productId}`))
                .map(i => ({ ...i, id: crypto.randomUUID(), timestamp: Date.now(), read: false }));
            if (fresh.length === 0) return prev;
            return [...fresh, ...prev].slice(0, 50); // max 50 notifications
        });
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearAll = useCallback(() => setNotifications([]), []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, addNotifications, markAllRead, clearAll }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useAppNotifications() {
    return useContext(NotificationContext);
}
