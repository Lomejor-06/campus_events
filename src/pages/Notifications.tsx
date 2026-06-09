import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { notificationService, type AppNotification } from '../services/notificationService';
import { Link } from 'react-router-dom';

const Notifications: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { fetchUnreadCount } = useNotifications();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (user) {
            loadNotifications(); 
        }
    }, [user]);

    const loadNotifications = async () => {
        if (!user) return;
        try {
            const data = await notificationService.getNotifications(user.id);
            setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!user) return;
        setActionLoading(true);
        try {
            await notificationService.markAllAsRead(user.id);
            await loadNotifications();
            await fetchUnreadCount();
        } catch (error) {
            console.error('Error marking all as read:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleNotificationClick = async (notif: AppNotification) => {
        if (!notif.read) {
            try {
                await notificationService.markAsRead(notif.id);
                // Update local state smoothly
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
                await fetchUnreadCount();
            } catch (error) {
                console.error('Error marking as read:', error);
            }
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5 my-5">
                <div className="spinner-grow text-primary" role="status">
                    <span className="visually-hidden">{t('common.loading')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in container my-4">
            <div className="d-flex justify-content-between align-items-center mb-5">
                <h1 className="display-4 fw-bold gradient-text mb-0">
                    {t('notifications.title')}
                </h1>
                <button
                    className="btn btn-outline-secondary rounded-4 px-4"
                    onClick={handleMarkAllAsRead}
                    disabled={actionLoading || notifications.length === 0 || !notifications.some(n => !n.read)}
                >
                    {actionLoading ? (
                        <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : (
                        <i className="bi bi-check-all me-2"></i>
                    )}
                    {t('notifications.markAllRead')}
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                {notifications.length === 0 ? (
                    <div className="p-5 text-center text-muted my-5">
                        <i className="bi bi-bell-slash display-1 mb-4 text-opacity-25"></i>
                        <h3 className="fw-bold text-main">No Notifications Yet</h3>
                        <p className="mb-0">You'll receive updates about your registered events here.</p>
                    </div>
                ) : (
                    <div className="list-group list-group-flush">
                        {notifications.map(notif => (
                            <Link 
                                key={notif.id}
                                to={notif.event_id ? `/events/${notif.event_id}` : '#'}
                                onClick={() => handleNotificationClick(notif)}
                                className={`list-group-item list-group-item-action p-4 border-bottom ${notif.read ? 'bg-transparent' : 'bg-light'}`}
                                style={{ transition: 'all 0.2s ease', textDecoration: 'none' }}
                            >
                                <div className="d-flex w-100 justify-content-between align-items-center mb-2">
                                    <h5 className={`mb-0 ${!notif.read ? 'fw-bold text-primary' : 'text-dark'}`}>
                                        {!notif.read && <span className="p-1 bg-primary border border-light rounded-circle d-inline-block me-2"></span>}
                                        {notif.title}
                                    </h5>
                                    <small className="text-muted">
                                        {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </small>
                                </div>
                                <p className="mb-1 text-secondary ms-3 ps-1">{notif.message}</p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
