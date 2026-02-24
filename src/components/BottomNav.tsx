import { NavLink, useLocation } from 'react-router-dom';
import { PackageSearch, ShoppingCart, Truck, Receipt, LayoutDashboard, Settings, MoreHorizontal, X, RefreshCcw } from 'lucide-react';
import { useState } from 'react';

export default function BottomNav() {
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const mainItems = [
        { path: '/', icon: LayoutDashboard, label: 'الرئيسية' },
        { path: '/orders', icon: ShoppingCart, label: 'الطلبات' },
        { path: '/inventory', icon: PackageSearch, label: 'المخزون' },
        { path: '/returns', icon: RefreshCcw, label: 'المرتجعات' },
    ];

    const moreItems = [
        { path: '/shippers', icon: Truck, label: 'شركات الشحن' },
        { path: '/expenses', icon: Receipt, label: 'المصروفات' },
        { path: '/settings', icon: Settings, label: 'الإعدادات' },
    ];

    const closeMenu = () => setIsMenuOpen(false);

    return (
        <>
            {/* The More Menu Dropup */}
            <div
                className={`mobile-more-menu no-print ${isMenuOpen ? 'open' : ''}`}
                style={{
                    position: 'fixed',
                    bottom: '70px', /* Above the bottom nav */
                    left: 0,
                    right: 0,
                    backgroundColor: 'var(--surface-color)',
                    borderRadius: '24px 24px 0 0',
                    boxShadow: '0 -10px 25px rgba(0,0,0,0.08)',
                    padding: '1.5rem 1.25rem 1rem',
                    transform: isMenuOpen ? 'translateY(0)' : 'translateY(100%)',
                    opacity: isMenuOpen ? 1 : 0,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 45,
                    pointerEvents: isMenuOpen ? 'auto' : 'none',
                    borderTop: '1px solid var(--border-color)'
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>المزيد من الخيارات</h3>
                    <button onClick={closeMenu} style={{ color: 'var(--text-secondary)' }}>
                        <X size={20} />
                    </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {moreItems.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={closeMenu}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    backgroundColor: isActive ? 'var(--bg-color)' : 'transparent',
                                    color: isActive ? 'var(--primary-color)' : 'var(--text-primary)',
                                    fontWeight: isActive ? 600 : 500,
                                    textDecoration: 'none'
                                }}
                            >
                                <item.icon size={18} />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </div>
            </div>

            {/* Overlay for clicking outside to close */}
            {isMenuOpen && (
                <div
                    onClick={closeMenu}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 35, backgroundColor: 'rgba(0,0,0,0.2)' }}
                />
            )}

            {/* Bottom Nav Bar */}
            <nav className="bottom-nav no-print" style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                height: '70px',
                backgroundColor: 'var(--surface-color)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                paddingBottom: 'env(safe-area-inset-bottom)',
                zIndex: 50,
                boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
            }}>
                {mainItems.map((item) => {
                    const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={closeMenu}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                textDecoration: 'none',
                                color: isActive ? 'var(--primary-color)' : 'var(--text-secondary)',
                                width: '20%'
                            }}
                        >
                            <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span style={{ fontSize: '0.7rem', fontWeight: isActive ? 600 : 500 }}>{item.label}</span>
                        </NavLink>
                    );
                })}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        color: isMenuOpen ? 'var(--primary-color)' : 'var(--text-secondary)',
                        width: '20%',
                        background: 'none',
                        border: 'none'
                    }}
                >
                    <MoreHorizontal size={24} strokeWidth={isMenuOpen ? 2.5 : 2} />
                    <span style={{ fontSize: '0.7rem', fontWeight: isMenuOpen ? 600 : 500 }}>المزيد</span>
                </button>
            </nav>
        </>
    );
}
