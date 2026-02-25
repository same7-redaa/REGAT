import { useState, useEffect } from 'react';
import { Save, CheckCircle, Bell, BellOff } from 'lucide-react';
import { useDatabase } from '../contexts/DatabaseContext';

export default function Settings() {
    const { settings, updateSettings } = useDatabase();

    const [storeName, setStoreName] = useState(settings?.storeName || 'Store Name');
    const [saved, setSaved] = useState(false);
    const [permissionState, setPermissionState] = useState<NotificationPermission>(
        'Notification' in window ? Notification.permission : 'denied'
    );

    useEffect(() => {
        if (settings?.storeName) {
            setStoreName(settings.storeName);
        }
    }, [settings]);

    const handleRequestPermission = async () => {
        if (!('Notification' in window)) return;
        const result = await Notification.requestPermission();
        setPermissionState(result);
    };

    const handleSave = async () => {
        await updateSettings({ storeName });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div style={{ paddingBottom: '5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* Store Name */}
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>إعدادات المتجر</h3>
                    <div style={{ marginBottom: '1rem' }}>
                        <label>اسم المتجر / المشروع</label>
                        <input
                            type="text"
                            value={storeName}
                            onChange={e => setStoreName(e.target.value)}
                            placeholder="مثال: REGAT Store"
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1rem' }}>
                        {saved && (
                            <span style={{ color: 'var(--success-color)', fontSize: '0.875rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={15} /> تم الحفظ
                            </span>
                        )}
                        <button className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Save size={16} /> حفظ
                        </button>
                    </div>
                </div>

                {/* Browser Notifications Permission */}
                <div className="card">
                    <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bell size={20} style={{ color: 'var(--primary-color)' }} /> إشعارات المتصفح
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                        يتم إرسال إشعار تلقائي عندما تتجاوز طلبات "تم الشحن" المدة المحددة لها، وعندما ينخفض مخزون أي منتج عن حده الأدنى.
                    </p>
                    <div>
                        {permissionState === 'default' && (
                            <button className="btn btn-primary" onClick={handleRequestPermission}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Bell size={15} /> السماح بالإشعارات
                            </button>
                        )}
                        {permissionState === 'granted' && (
                            <span style={{ color: 'var(--success-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <CheckCircle size={16} /> الإشعارات مفعّلة
                            </span>
                        )}
                        {permissionState === 'denied' && (
                            <span style={{ color: 'var(--danger-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <BellOff size={16} /> الإشعارات محظورة من المتصفح — يرجى السماح بها من إعدادات المتصفح
                            </span>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
