import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationService, type AppNotification } from '../services/notificationService';

interface ToastNotification extends AppNotification {
    toastId: string;
}

interface NotificationContextType {
    unreadCount: number;
    fetchUnreadCount: () => Promise<void>;
    toastQueue: ToastNotification[];
    dismissToast: (toastId: string) => void;
    markToastAsRead: (notif: ToastNotification) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [toastQueue, setToastQueue] = useState<ToastNotification[]>([]);
    const { isAuthenticated, user } = useAuth();

    const seenIdsRef = useRef<Set<string>>(new Set());
    const initialLoadDoneRef = useRef(false);

    const fetchUnreadCount = useCallback(async () => {
        if (!isAuthenticated || !user) return;
        try {
            const count = await notificationService.getUnreadCount(user.id);
            setUnreadCount(count);
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    }, [isAuthenticated, user]);

    const fetchAndDiffNotifications = useCallback(async () => {
        if (!isAuthenticated || !user) return;
        try {
            const all: AppNotification[] = await notificationService.getNotifications(user.id);
            const unread = all.filter(n => !n.read);

            if (!initialLoadDoneRef.current) {
                // Baseline on first load — don't toast existing notifications
                unread.forEach(n => seenIdsRef.current.add(n.id));
                initialLoadDoneRef.current = true;
                setUnreadCount(unread.length);
                return;
            }

            const fresh = unread.filter(n => !seenIdsRef.current.has(n.id));
            fresh.forEach(n => seenIdsRef.current.add(n.id));

            if (fresh.length > 0) {
                const newToasts: ToastNotification[] = fresh.map(n => ({
                    ...n,
                    toastId: `${n.id}-${Date.now()}`,
                }));
                setToastQueue(prev => [...prev, ...newToasts]);
            }

            setUnreadCount(unread.length);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, [isAuthenticated, user]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchAndDiffNotifications();
            const interval = setInterval(fetchAndDiffNotifications, 30000);
            return () => clearInterval(interval);
        } else {
            setUnreadCount(0);
            setToastQueue([]);
            seenIdsRef.current.clear();
            initialLoadDoneRef.current = false;
        }
    }, [isAuthenticated, fetchAndDiffNotifications]);

    const dismissToast = useCallback((toastId: string) => {
        setToastQueue(prev => prev.filter(t => t.toastId !== toastId));
    }, []);

    const markToastAsRead = useCallback(async (notif: ToastNotification) => {
        try {
            await notificationService.markAsRead(notif.id);
            setUnreadCount(prev => Math.max(0, prev - 1));
            dismissToast(notif.toastId);
        } catch (error) {
            console.error('Failed to mark toast as read:', error);
        }
    }, [dismissToast]);

    return (
        <NotificationContext.Provider value={{ unreadCount, fetchUnreadCount, toastQueue, dismissToast, markToastAsRead }}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationProvider;

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};