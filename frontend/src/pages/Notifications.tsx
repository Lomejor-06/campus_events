import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import type { Notification, PaginatedNotifications } from '../types/notification';
import { useNotifications } from '../contexts/NotificationContext';

// Burgundy color
const burgundy = {
    primary: '#800020',
};

const Notifications: React.FC = () => {
    const { t } = useTranslation();
    const { fetchUnreadCount } = useNotifications();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchNotifications = async () => {
        try {
            const response = await api.get<PaginatedNotifications>(`/notifications?page=${page}`);
            setNotifications(response.data.items);
            setTotalPages(response.data.pages);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [page]);

    const handleMarkAsRead = async (id: number) => {
        try {
            await api.post(`/notifications/${id}/read`);
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            ));
            fetchUnreadCount();
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        setActionLoading(true);
        try {
            await api.post('/notifications/mark-all-read');
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
            fetchUnreadCount();
        } catch (error) {
            console.error('Failed to mark all as read', error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading && notifications.length === 0) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border" role="status" style={{ color: burgundy.primary }}>
                    <span className="visually-hidden">{t('common.loading')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 style={{ color: burgundy.primary }}>
                    <i className="bi bi-bell me-2"></i>
                    {t('notifications.title')}
                </h1>
                <button
                    className="btn btn-outline-secondary"
                    onClick={handleMarkAllAsRead}
                    disabled={actionLoading || notifications.every(n => n.is_read)}
                >
                    <i className="bi bi-check-all me-1"></i>
                    {t('notifications.markAllRead')}
                </button>
            </div>

            <div className="list-group shadow-sm">
                {notifications.length === 0 ? (
                    <div className="list-group-item p-5 text-center text-muted">
                        <i className="bi bi-bell-slash fs-1 mb-3 d-block"></i>
                        <p className="mb-0">No notifications yet</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`list-group-item list-group-item-action p-3 ${!notification.is_read ? 'bg-light' : ''}`}
                        >
                            <div className="d-flex w-100 justify-content-between align-items-start">
                                <div>
                                    <h5 className="mb-1" style={{ color: !notification.is_read ? burgundy.primary : 'inherit' }}>
                                        {!notification.is_read && <span className="badge bg-danger me-2">New</span>}
                                        {notification.title}
                                    </h5>
                                    <p className="mb-1">{notification.message}</p>
                                    <small className="text-muted">
                                        <i className="bi bi-clock me-1"></i>
                                        {new Date(notification.created_at).toLocaleString()}
                                    </small>
                                </div>
                                {!notification.is_read && (
                                    <button
                                        className="btn btn-sm btn-link text-decoration-none"
                                        onClick={() => handleMarkAsRead(notification.id)}
                                        title="Mark as read"
                                    >
                                        <i className="bi bi-check-circle"></i>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <nav className="mt-4">
                    <ul className="pagination justify-content-center">
                        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setPage(page - 1)}>&laquo;</button>
                        </li>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => setPage(p)}
                                    style={p === page ? { backgroundColor: burgundy.primary, borderColor: burgundy.primary } : {}}
                                >
                                    {p}
                                </button>
                            </li>
                        ))}
                        <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setPage(page + 1)}>&raquo;</button>
                        </li>
                    </ul>
                </nav>
            )}
        </div>
    );
};

export default Notifications;
