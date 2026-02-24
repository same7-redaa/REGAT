import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import { useState, useEffect } from 'react';
import { useDatabase } from '../contexts/DatabaseContext';
import { useNotifications } from '../hooks/useNotifications';

export default function Layout() {
    const { isReady } = useDatabase();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    useNotifications(); // 🔔 Check and trigger order notifications

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
            {!isMobile && (
                <Sidebar
                    isOpen={true}
                    onClose={() => { }}
                    isMobile={false}
                />
            )}

            <main style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--bg-color)',
                width: isMobile ? '100%' : 'calc(100% - 260px)',
                paddingBottom: isMobile ? '70px' : '0'
            }}>
                <Header isMobile={isMobile} />

                <div style={{
                    flex: 1,
                    padding: isMobile ? '1rem' : '2rem',
                    overflowY: 'auto'
                }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        {!isReady ? (
                            <div style={{ padding: '3rem', textAlign: 'center' }}>جاري التحميل والمزامنة...</div>
                        ) : (
                            <Outlet />
                        )}
                    </div>
                </div>
            </main>

            {isMobile && <BottomNav />}
        </div>
    );
}
