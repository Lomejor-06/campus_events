import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
    unreadCount: number;
    fetchUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const { isAuthenticated } = useAuth();

    const fetchUnreadCount = async () => {
        if (!isAuthenticated) return;
        try {
            const response = await api.get<{ count: number }>('/notifications/unread-count');
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Failed to fetch unread notifications count', error);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchUnreadCount();
            // Poll every minute
            const interval = setInterval(fetchUnreadCount, 60000);
            return () => clearInterval(interval);
        } else {
            setUnreadCount(0);
        }
    }, [isAuthenticated]);

    return (
        <NotificationContext.Provider value={{ unreadCount, fetchUnreadCount }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
