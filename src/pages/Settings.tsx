import { useState, useEffect } from 'react';
import { Save, CheckCircle, Bell, BellOff } from 'lucide-react';
import {
    DEFAULT_NOTIFICATION_SETTINGS,
    type NotificationSettings
} from '../hooks/useNotifications';
import type { OrderStatus } from '../db/db';
import { useDatabase } from '../contexts/DatabaseContext';

const STATUS_LABELS: { status: OrderStatus; label: string; description: string }[] = [
    { status: 'تحت المراجعة', label: 'تحت المراجعة', description: 'طلبات لم تُشحن بعد' },
    { status: 'تم الشحن', label: 'تم الشحن', description: 'طلبات في الطريق إلى العميل' },
    { status: 'تم التوصيل', label: 'تم التوصيل', description: 'طلبات تم تسليمها' },
    { status: 'لاغي', label: 'لاغي', description: 'طلبات ملغاة' },
    { status: 'مرفوض', label: 'مرفوض', description: 'طلبات رفض العميل استلامها' },
];

export default function Settings() {
    const { settings, updateSettings } = useDatabase();

    // Default or loaded settings
    const loadedRules = settings?.notificationRules || DEFAULT_NOTIFICATION_SETTINGS;

    // We maintain local state while editing, before hitting 'Save'
    const [notifSettings, setNotifSettings] = useState<NotificationSettings>(loadedRules as NotificationSettings);
    const [storeName, setStoreName] = useState(settings?.storeName || 'Store Name');

    const [notifSaved, setNotifSaved] = useState(false);
    const [permissionState, setPermissionState] = useState<NotificationPermission>(
        'Notification' in window ? Notification.permission : 'denied'
    );

    // Sync local state if remote settings change (e.g. initial load)
    useEffect(() => {
        if (settings) {
            if (Object.keys(settings.notificationRules).length > 0) {
                setNotifSettings(settings.notificationRules as NotificationSettings);
            }
            if (settings.storeName) {
                setStoreName(settings.storeName);
            }
        }
    }, [settings]);

    const handleRequestPermission = async () => {
        if (!('Notification' in window)) return;
        const result = await Notification.requestPermission();
        setPermissionState(result);
    };

    const updateRule = (status: OrderStatus, field: 'enabled' | 'days', value: boolean | number) => {
        setNotifSettings(prev => ({
            ...prev,
            [status]: { ...((prev[status]) ?? DEFAULT_NOTIFICATION_SETTINGS[status]), [field]: value }
        }));
    };

    const handleSaveNotifSettings = async () => {
        await updateSettings({ notificationRules: notifSettings, storeName });
        setNotifSaved(true);
        setTimeout(() => setNotifSaved(false), 2500);
    };

    return (
        <div style={{ paddingBottom: '5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>



                {/* Notification Settings - full width */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Bell size={20} style={{ color: 'var(--primary-color)' }} /> إشعارات الطلبات المتأخرة
                        </h3>

                        {/* Permission Banner */}
                        {permissionState === 'default' && (
                            <button className="btn btn-outline" onClick={handleRequestPermission}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                <Bell size={15} /> السماح بالإشعارات
                            </button>
                        )}
                        {permissionState === 'granted' && (
                            <span style={{ color: 'var(--success-color)', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={14} /> الإشعارات مفعّلة
                            </span>
                        )}
                        {permissionState === 'denied' && (
                            <span style={{ color: 'var(--danger-color)', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <BellOff size={14} /> الإشعارات محظورة من المتصفح
                            </span>
                        )}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                        عيّن لكل حالة عدد الأيام المسموح بها. إذا ظل الطلب في نفس الحالة أكثر من ذلك سيصلك إشعار تنبيه.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                        {STATUS_LABELS.map(({ status, label, description }) => {
                            const rule = notifSettings[status] ?? DEFAULT_NOTIFICATION_SETTINGS[status] ?? { enabled: false, days: 1 };
                            return (
                                <div key={status} style={{
                                    border: `1px solid ${rule.enabled ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                    borderRadius: '10px',
                                    padding: '0.9rem 1rem',
                                    backgroundColor: rule.enabled ? 'rgba(var(--primary-rgb, 59,130,246), 0.04)' : 'transparent',
                                    transition: 'all 0.2s ease'
                                }}>
                                    {/* Toggle Row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{label}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{description}</div>
                                        </div>
                                        {/* Toggle Switch */}
                                        <label htmlFor={`toggle-${status}`} style={{ display: 'inline-flex', cursor: 'pointer', flexShrink: 0 }}>
                                            <input
                                                id={`toggle-${status}`}
                                                type="checkbox"
                                                checked={rule.enabled}
                                                onChange={() => updateRule(status, 'enabled', !rule.enabled)}
                                                style={{ display: 'none' }}
                                            />
                                            <span style={{
                                                display: 'block', width: '48px', height: '28px', borderRadius: '999px',
                                                backgroundColor: rule.enabled ? 'var(--primary-color)' : '#cbd5e1',
                                                position: 'relative', transition: 'background-color 0.25s'
                                            }}>
                                                <span style={{
                                                    display: 'block', width: '22px', height: '22px', borderRadius: '50%',
                                                    backgroundColor: 'white', position: 'absolute', top: '3px',
                                                    right: rule.enabled ? '3px' : '23px',
                                                    transition: 'right 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
                                                }} />
                                            </span>
                                        </label>
                                    </div>

                                    {/* Days Input */}
                                    {rule.enabled && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>تنبيه بعد</span>
                                            <input
                                                type="number"
                                                min={1}
                                                max={90}
                                                value={rule.days}
                                                onChange={(e) => updateRule(status, 'days', Math.max(1, Number(e.target.value)))}
                                                className="input"
                                                style={{ width: '70px', padding: '0.3rem 0.5rem', textAlign: 'center', fontSize: '0.9rem' }}
                                            />
                                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>يوم</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
                        {notifSaved && (
                            <span style={{ color: 'var(--success-color)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={15} /> تم حفظ الإشعارات
                            </span>
                        )}
                        <button className="btn btn-primary" onClick={handleSaveNotifSettings}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Save size={16} /> حفظ إعدادات الإشعارات
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
