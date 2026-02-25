import { useEffect, useRef } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAppNotifications } from '../contexts/NotificationContext';

const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

// Kept for backward-compat with Settings import (now unused but still exported)
export interface NotificationRule {
    enabled: boolean;
    days: number;
}
export type NotificationSettings = Partial<Record<string, NotificationRule>>;
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {};

async function requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
}

function pushBrowserNotification(title: string, body: string) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body, dir: 'rtl', lang: 'ar', icon: '/pwa-192x192.png' });
    }
}

export function useNotifications() {
    const { orders, products, isReady } = useDatabase();
    const { addNotifications } = useAppNotifications();
    const lastCheckedRef = useRef<number>(0);

    useEffect(() => {
        if (!isReady || !orders || !products) return;

        const check = async () => {
            const now = Date.now();
            if (now - lastCheckedRef.current < CHECK_INTERVAL_MS) return;
            lastCheckedRef.current = now;

            await requestPermission();

            const today = new Date();
            const inApp: Parameters<typeof addNotifications>[0] = [];

            // ── 1. Shipped orders past their expected delivery window ──────────────
            for (const order of orders) {
                if (order.is_deleted) continue;
                if (order.status !== 'تم الشحن') continue;

                // Only alert if the order has a deliveryDays set
                const daysLimit = order.deliveryDays;
                if (!daysLimit || daysLimit <= 0) continue;

                const refDate = new Date(order.shipDate || order.date);
                const diffDays = Math.floor((today.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays >= daysLimit) {
                    const title = `طلب لم يُسلَّم بعد — #${order.id?.slice(0, 8).toUpperCase()}`;
                    const message = `تم الشحن منذ ${diffDays} يوم (المتوقع: ${daysLimit} يوم) — ${order.customerName}`;
                    pushBrowserNotification(title, message);
                    inApp.push({ type: 'order_delayed', title, message, orderId: order.id });
                }
            }

            // ── 2. Low stock ─────────────────────────────────────────────────────
            for (const product of products) {
                if (product.is_deleted) continue;
                const threshold = product.stockThreshold;
                if (threshold == null || threshold <= 0) continue;
                if (product.stock <= threshold) {
                    const title = `مخزون منخفض: ${product.name}`;
                    const message = `المتبقي ${product.stock} فقط (الحد: ${threshold})`;
                    pushBrowserNotification(title, message);
                    inApp.push({ type: 'low_stock', title, message, productId: product.id });
                }
            }

            if (inApp.length > 0) {
                addNotifications(inApp);
            }
        };

        check();
        const timer = setInterval(check, CHECK_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [isReady, orders, products, addNotifications]);
}
