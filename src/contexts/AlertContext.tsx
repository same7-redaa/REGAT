import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type AlertType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

interface AlertOptions {
    title: string;
    message: string;
    type?: AlertType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
}

interface AlertContextType {
    showAlert: (options: AlertOptions) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
    const [alertData, setAlertData] = useState<AlertOptions | null>(null);

    const showAlert = (options: AlertOptions) => {
        setAlertData({ type: 'info', confirmText: 'حسناً', cancelText: 'إلغاء', ...options });
    };

    const hideAlert = () => {
        setAlertData(null);
    };

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            {alertData && (
                <div className="alert-overlay no-print">
                    <div className="alert-box" style={{ animation: 'zoomIn 0.2s ease-out' }}>
                        <h3 className={`alert-title alert-${alertData.type}`}>
                            {alertData.title}
                        </h3>
                        <p className="alert-message">{alertData.message}</p>
                        <div className="alert-actions">
                            {alertData.type === 'confirm' && (
                                <button className="btn btn-outline" onClick={hideAlert}>
                                    {alertData.cancelText}
                                </button>
                            )}
                            <button
                                className={`btn ${alertData.type === 'confirm' || alertData.type === 'error' || alertData.type === 'warning' ? 'btn-danger' : 'btn-primary'}`}
                                onClick={() => {
                                    if (alertData.onConfirm) alertData.onConfirm();
                                    hideAlert();
                                }}
                            >
                                {alertData.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AlertContext.Provider>
    );
}

export function useAlert() {
    const context = useContext(AlertContext);
    if (context === undefined) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
}
