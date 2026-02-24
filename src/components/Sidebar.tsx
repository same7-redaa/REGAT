import { NavLink, useLocation } from 'react-router-dom';
import { PackageSearch, ShoppingCart, Truck, Receipt, LayoutDashboard, Settings, X, RefreshCcw, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isMobile: boolean;
}

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
    const location = useLocation();
    const { signOut } = useAuth();

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'اللوحة' },
        { path: '/orders', icon: ShoppingCart, label: 'الطلبات' },
        { path: '/returns', icon: RefreshCcw, label: 'المرتجعات' },
        { path: '/inventory', icon: PackageSearch, label: 'المخزون' },
        { path: '/shippers', icon: Truck, label: 'الشحن' },
        { path: '/expenses', icon: Receipt, label: 'المصروفات' },
        { path: '/settings', icon: Settings, label: 'الإعدادات' },
    ];

    const sidebarContent = (
        <>
            <div className="sidebar-header" style={{ height: '70px', backgroundColor: 'var(--primary-color)', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <img src="/REGAT LOGO.png" alt="REGAT" style={{ height: '40px', objectFit: 'contain' }} />
                </div>
                {isMobile && (
                    <button onClick={onClose} style={{ color: 'var(--text-secondary)', position: 'absolute', left: '1rem' }}>
                        <X size={24} />
                    </button>
                )}
            </div>
            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={isMobile ? onClose : undefined}
                        className={({ isActive }) => `sidebar-link ${isActive || (item.path !== '/' && location.pathname.startsWith(item.path)) ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
                <button
                    onClick={signOut}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', color: 'var(--danger-color)', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 600, cursor: 'pointer', transition: 'background-color 0.2s' }}
                >
                    <LogOut size={20} />
                    <span>تسجيل الخروج</span>
                </button>
            </div>
        </>
    );

    if (isMobile) {
        return (
            <>
                {isOpen && (
                    <div
                        className="mobile-overlay no-print"
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            zIndex: 40
                        }}
                    />
                )}
                <aside
                    className={`sidebar no-print`}
                    style={{
                        position: 'fixed',
                        top: 0,
                        right: 0,
                        height: '100vh',
                        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
                        transition: 'transform 0.3s ease',
                        zIndex: 50,
                        width: '260px',
                        backgroundColor: 'var(--surface-color)',
                        boxShadow: isOpen ? '0 0 15px rgba(0,0,0,0.1)' : 'none'
                    }}
                >
                    {sidebarContent}
                </aside>
            </>
        );
    }

    return (
        <aside className="sidebar no-print" style={{ zIndex: 10 }}>
            {sidebarContent}
        </aside>
    );
}
