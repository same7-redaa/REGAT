import { useState } from 'react';
import { supabase } from '../db/supabase';
import { useAlert } from '../contexts/AlertContext';
import { Lock, Mail, ArrowLeft } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { showAlert } = useAlert();
    const { session } = useAuth();

    // If already logged in, redirect to dashboard
    if (session) {
        return <Navigate to="/" replace />;
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            showAlert({
                title: 'خطأ في تسجيل الدخول',
                message: 'تأكد من صحة البريد الإلكتروني وكلمة المرور.',
                type: 'error',
                confirmText: 'حسناً'
            });
        }
        setLoading(false);
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100%',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--bg-color)',
            padding: '1rem',
            backgroundImage: 'radial-gradient(circle at 50% -20%, var(--primary-color) 0%, transparent 70%)',
        }}>
            <div className="card" style={{
                width: '100%',
                maxWidth: '420px',
                padding: '2.5rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                backgroundColor: 'var(--surface-color)',
            }}>
                <img src="/REGAT LOGO.png" alt="REGAT" style={{ height: '50px', objectFit: 'contain', marginBottom: '2rem' }} />

                <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)', textAlign: 'center' }}>تسجيل الدخول للنظام</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    أدخل بيانات الدخول الخاصة بك للوصول للوحة التحكم
                </p>

                <form onSubmit={handleLogin} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                            <Mail size={16} /> البريد الإلكتروني
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="admin@regat.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{ padding: '0.75rem 1rem' }}
                            dir="ltr"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                            <Lock size={16} /> كلمة المرور
                        </label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{ padding: '0.75rem 1rem' }}
                            dir="ltr"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{
                            marginTop: '1rem',
                            padding: '0.8rem',
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            borderRadius: '6px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}
                    >
                        {loading ? (
                            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
                        ) : (
                            <>
                                تسجيل الدخول <ArrowLeft size={18} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
