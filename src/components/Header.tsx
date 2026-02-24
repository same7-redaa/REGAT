import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, BellOff, Package, Clock, X, CheckCheck } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAppNotifications } from '../contexts/NotificationContext';

interface HeaderProps {
    isMobile: boolean;
}

export default function Header({ isMobile }: HeaderProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { notifications, unreadCount, markAllRead, clearAll } = useAppNotifications();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const getPageTitle = (path: string) => {
        if (path === '/') return 'اللوحة الرئيسية';
        if (path.startsWith('/orders')) return 'إدارة الطلبات';
        if (path.startsWith('/inventory')) return 'إدارة المخزون';
        if (path.startsWith('/shippers')) return 'شركات الشحن';
        if (path.startsWith('/expenses')) return 'المصروفات';
        if (path.startsWith('/settings')) return 'الإعدادات';
        return 'إدارة الطلبات';
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleNotificationClick = (notif: typeof notifications[0]) => {
        setDropdownOpen(false);
        if (notif.orderId) {
            // Navigate to orders and pass the highlighted order ID via sessionStorage
            sessionStorage.setItem('highlightOrderId', notif.orderId);
            navigate('/orders');
        } else if (notif.productId) {
            sessionStorage.setItem('highlightProductId', notif.productId);
            navigate('/inventory');
        }
    };

    const BellButton = () => (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                onClick={() => { setDropdownOpen(v => !v); if (!dropdownOpen) markAllRead(); }}
                style={{
                    background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '10px',
                    width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'white', position: 'relative', transition: 'background 0.2s'
                }}
                title="الإشعارات"
            >
                {notifications.length > 0 ? <Bell size={22} /> : <BellOff size={22} />}
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: '-4px', right: '-4px',
                        backgroundColor: '#ef4444', color: 'white',
                        borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700,
                        minWidth: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 3px', lineHeight: 1
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: isMobile ? '-140px' : 0,
                    width: '320px', maxHeight: '420px',
                    backgroundColor: 'var(--card-bg, white)',
                    border: '1px solid var(--border-color, #e5e7eb)',
                    borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    zIndex: 99999, overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    animation: 'fadeIn 0.15s ease'
                }}>
                    {/* Dropdown Header */}
                    <div style={{
                        padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color, #e5e7eb)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        backgroundColor: 'var(--bg-secondary, #f8fafc)'
                    }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                            الإشعارات {notifications.length > 0 && `(${notifications.length})`}
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {notifications.length > 0 && (
                                <>
                                    <button onClick={markAllRead} title="تعيين الكل كمقروء"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-color)', display: 'flex', alignItems: 'center' }}>
                                        <CheckCheck size={16} />
                                    </button>
                                    <button onClick={clearAll} title="مسح الكل"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)', display: 'flex', alignItems: 'center' }}>
                                        <X size={16} />
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {notifications.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                <BellOff size={32} style={{ margin: '0 auto 0.5rem', display: 'block', opacity: 0.4 }} />
                                لا توجد إشعارات
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <button
                                    key={notif.id}
                                    onClick={() => handleNotificationClick(notif)}
                                    style={{
                                        width: '100%', textAlign: 'right', padding: '0.75rem 1rem',
                                        border: 'none', borderBottom: '1px solid var(--border-color, #f0f0f0)',
                                        backgroundColor: notif.read ? 'transparent' : 'rgba(59,130,246,0.05)',
                                        cursor: 'pointer', display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                                        transition: 'background 0.15s'
                                    }}
                                >
                                    <span style={{
                                        width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        backgroundColor: notif.type === 'low_stock' ? '#fef3c7' : '#fee2e2',
                                        color: notif.type === 'low_stock' ? '#92400e' : '#991b1b'
                                    }}>
                                        {notif.type === 'low_stock' ? <Package size={16} /> : <Clock size={16} />}
                                    </span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.82rem', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {notif.title}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                                            {notif.message}
                                        </div>
                                    </div>
                                    {!notif.read && (
                                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', flexShrink: 0, marginTop: '6px' }} />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    if (isMobile) {
        return (
            <header className="mobile-header no-print text-white flex items-center justify-between" style={{ backgroundColor: 'var(--primary-color)', height: '60px', padding: '0 1rem', position: 'sticky', top: 0, zIndex: 30, boxShadow: 'var(--shadow-sm)' }}>
                {/* Right Side - Back Button Portal */}
                <div id="header-back-button" style={{ minWidth: '40px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}></div>

                {/* Center - Page Title */}
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <h1 style={{ margin: 0, fontSize: '1.2rem', color: 'white', fontWeight: 600, textAlign: 'center' }}>
                        {getPageTitle(location.pathname)}
                    </h1>
                </div>

                {/* Left Side - Bell + Logo */}
                <div style={{ minWidth: '80px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <BellButton />
                    <img src="/logo.png" alt="شعار النظام" style={{ height: '30px', objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
            </header>
        );
    }

    return (
        <header className="desktop-header no-print" style={{
            backgroundColor: 'var(--primary-color)',
            height: '70px', padding: '0 2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0, zIndex: 20, boxShadow: 'var(--shadow-sm)'
        }}>
            <h1 style={{ margin: 0, fontSize: '1.5rem', color: 'white', fontWeight: 600 }}>
                {getPageTitle(location.pathname)}
            </h1>
            <BellButton />
        </header>
    );
}
