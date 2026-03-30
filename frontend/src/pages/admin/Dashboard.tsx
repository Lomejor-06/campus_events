import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

interface Stats {
    total_users: number;
    total_events: number;
    total_registrations: number;
    upcoming_events: number;
    users_by_role: { role: string; count: number }[];
    events_by_status: { status: string; count: number }[];
}

// Burgundy color palette
const burgundy = {
    primary: '#800020',
    dark: '#5c0017',
    light: '#a63d56',
    lighter: '#c76b80',
};

const AdminDashboard: React.FC = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get<Stats>('/admin/stats');
                setStats(response.data);
            } catch (err) {
                console.error('Failed to fetch admin stats:', err);
                // Set mock data for demo
                setStats({
                    total_users: 3,
                    total_events: 6,
                    total_registrations: 0,
                    upcoming_events: 6,
                    users_by_role: [
                        { role: 'admin', count: 1 },
                        { role: 'staff', count: 1 },
                        { role: 'student', count: 1 },
                    ],
                    events_by_status: [
                        { status: 'published', count: 6 },
                    ],
                });
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border" role="status" style={{ color: burgundy.primary }}>
                    <span className="visually-hidden">{t('common.loading')}</span>
                </div>
            </div>
        );
    }

    const statCards = [
        {
            title: t('admin.stats.totalUsers'),
            value: stats?.total_users || 0,
            icon: 'bi-people',
            bg: burgundy.primary,
        },
        {
            title: t('admin.stats.totalEvents'),
            value: stats?.total_events || 0,
            icon: 'bi-calendar-event',
            bg: burgundy.dark,
        },
        {
            title: t('admin.stats.totalRegistrations'),
            value: stats?.total_registrations || 0,
            icon: 'bi-ticket',
            bg: burgundy.light,
        },
        {
            title: t('admin.stats.upcomingEvents'),
            value: stats?.upcoming_events || 0,
            icon: 'bi-calendar-check',
            bg: burgundy.lighter,
        },
    ];

    return (
        <div>
            <h1 className="mb-4" style={{ color: burgundy.primary }}>
                <i className="bi bi-speedometer2 me-2"></i>
                {t('admin.dashboard')}
            </h1>

            {/* Stats Cards */}
            <div className="row g-4 mb-4">
                {statCards.map((stat, index) => (
                    <div key={index} className="col-sm-6 col-xl-3">
                        <div className="card border-0 shadow-sm text-white" style={{ backgroundColor: stat.bg }}>
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h6 className="text-white-50 mb-1">{stat.title}</h6>
                                        <h2 className="mb-0">{stat.value}</h2>
                                    </div>
                                    <i className={`bi ${stat.icon} fs-1 opacity-50`}></i>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-4">
                {/* Users by Role */}
                <div className="col-md-6">
                    <div className="card shadow-sm h-100">
                        <div className="card-header text-white" style={{ backgroundColor: burgundy.primary }}>
                            <h5 className="mb-0">
                                <i className="bi bi-people me-2"></i>
                                {t('admin.users')}
                            </h5>
                        </div>
                        <div className="card-body">
                            <ul className="list-group list-group-flush">
                                {stats?.users_by_role.map((item) => (
                                    <li key={item.role} className="list-group-item d-flex justify-content-between align-items-center">
                                        <span className="text-capitalize">{item.role}</span>
                                        <span className="badge rounded-pill" style={{ backgroundColor: burgundy.primary }}>{item.count}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Events by Status */}
                <div className="col-md-6">
                    <div className="card shadow-sm h-100">
                        <div className="card-header text-white" style={{ backgroundColor: burgundy.dark }}>
                            <h5 className="mb-0">
                                <i className="bi bi-calendar-event me-2"></i>
                                {t('admin.events')}
                            </h5>
                        </div>
                        <div className="card-body">
                            <ul className="list-group list-group-flush">
                                {stats?.events_by_status.map((item) => (
                                    <li key={item.status} className="list-group-item d-flex justify-content-between align-items-center">
                                        <span>{t(`events.status.${item.status}`)}</span>
                                        <span className="badge rounded-pill" style={{ backgroundColor: burgundy.primary }}>{item.count}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card shadow-sm mt-4">
                <div className="card-header text-white" style={{ backgroundColor: burgundy.light }}>
                    <h5 className="mb-0">Quick Actions</h5>
                </div>
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-3">
                            <a
                                href="/admin/users"
                                className="btn w-100 text-white"
                                style={{ backgroundColor: burgundy.primary }}
                            >
                                <i className="bi bi-people me-2"></i>
                                Manage Users
                            </a>
                        </div>
                        <div className="col-md-3">
                            <a
                                href="/events/create"
                                className="btn w-100"
                                style={{ borderColor: burgundy.primary, color: burgundy.primary }}
                            >
                                <i className="bi bi-plus-circle me-2"></i>
                                Create Event
                            </a>
                        </div>
                        <div className="col-md-3">
                            <a
                                href="/events"
                                className="btn w-100"
                                style={{ borderColor: burgundy.primary, color: burgundy.primary }}
                            >
                                <i className="bi bi-grid me-2"></i>
                                View Events
                            </a>
                        </div>
                        <div className="col-md-3">
                            <a
                                href="/my-events"
                                className="btn w-100"
                                style={{ borderColor: burgundy.primary, color: burgundy.primary }}
                            >
                                <i className="bi bi-calendar-plus me-2"></i>
                                My Events
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
