import { useEffect, useRef } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAppNotifications } from '../contexts/NotificationContext';
import type { OrderStatus } from '../db/db';

export interface NotificationRule {
    enabled: boolean;
    days: number;
}

export type NotificationSettings = Partial<Record<OrderStatus, NotificationRule>>;

const CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
    'تحت المراجعة': { enabled: true, days: 2 },
    'تم الشحن': { enabled: true, days: 7 },
    'تم التوصيل': { enabled: false, days: 0 },
    'لاغي': { enabled: false, days: 0 },
    'مرفوض': { enabled: false, days: 0 },
};

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
    const { orders, products, settings, isReady } = useDatabase();
    const { addNotifications } = useAppNotifications();
    const lastCheckedRef = useRef<number>(0);

    useEffect(() => {
        if (!isReady || !orders || !products) return;

        const check = async () => {
            const now = Date.now();
            if (now - lastCheckedRef.current < CHECK_INTERVAL_MS) return;
            lastCheckedRef.current = now;

            await requestPermission();

            const rules = (settings?.notificationRules as NotificationSettings) || DEFAULT_NOTIFICATION_SETTINGS;
            const today = new Date();
            const inApp: Parameters<typeof addNotifications>[0] = [];

            // ── 1. Overdue orders ──────────────────────────────────────
            const overdueByStatus: Partial<Record<OrderStatus, { count: number; orderIds: string[] }>> = {};

            for (const order of orders) {
                if (order.is_deleted) continue;
                const rule = rules[order.status] ?? DEFAULT_NOTIFICATION_SETTINGS[order.status];
                if (!rule?.enabled || rule.days <= 0) continue;

                const refDate = new Date(
                    order.status === 'تم الشحن' && order.shipDate ? order.shipDate : order.date
                );
                const diffDays = Math.floor((today.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));

                if (diffDays >= rule.days) {
                    if (!overdueByStatus[order.status]) overdueByStatus[order.status] = { count: 0, orderIds: [] };
                    overdueByStatus[order.status]!.count++;
                    if (order.id) overdueByStatus[order.status]!.orderIds.push(order.id);
                }
            }

            for (const [status, { count, orderIds }] of Object.entries(overdueByStatus)) {
                const rule = rules[status as OrderStatus] ?? DEFAULT_NOTIFICATION_SETTINGS[status as OrderStatus];
                const title = `[تنبيه] ${count} طلب متأخر — ${status}`;
                const message = `${count} طلب في حالة "${status}" منذ أكثر من ${rule?.days || 0} يوم`;
                pushBrowserNotification(title, message);
                // Add one in-app notification per order for navigation
                for (const orderId of orderIds) {
                    inApp.push({ type: 'order_delayed', title: `طلب متأخر — ${status}`, message, orderId });
                }
            }

            // ── 2. Low stock ───────────────────────────────────────────
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
    }, [isReady, orders, products, settings, addNotifications]);
}
