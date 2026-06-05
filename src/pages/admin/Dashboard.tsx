import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabaseClient';
import authService from '../../services/authService';

interface Stats {
    total_users: number;
    total_events: number;
    total_registrations: number;
    upcoming_events: number;
    pending_lecturers: number;
}

const AdminDashboard: React.FC = () => {
    const { t } = useTranslation();
    const { isAdmin, isLoading: authLoading, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!isAdmin()) {
            setLoading(false);
            return;
        }

        const fetchStats = async () => {
            try {
                const [
                    { count: userCount },
                    { count: eventCount },
                    { data: upcomingData },
                    { data: regData },
                    pendingLecturers
                ] = await Promise.all([
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('events').select('*', { count: 'exact', head: true }),
                    supabase.from('events').select('id').gt('start_date', new Date().toISOString()),
                    supabase.from('events').select('registration_count'),
                    authService.getPendingLecturers()
                ]);

                const totalRegs = regData?.reduce((acc, curr) => acc + (curr.registration_count || 0), 0) || 0;

                setStats({
                    total_users: userCount || 0,
                    total_events: eventCount || 0,
                    total_registrations: totalRegs,
                    upcoming_events: upcomingData?.length || 0,
                    pending_lecturers: pendingLecturers.length,
                });
            } catch (err) {
                console.error('Failed to fetch admin stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [authLoading]);

    // ── Admin Gate ──
    if (authLoading) {
        return (
            <div className="text-center py-5 my-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t('common.loading')}</span>
                </div>
            </div>
        );
    }

    if (!isAdmin()) {
        return <Navigate to="/login" replace />;
    }

    if (loading) {
        return (
            <div className="text-center py-5 my-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t('common.loading')}</span>
                </div>
            </div>
        );
    }

    const statCards = [
        {
            title: 'Active Accounts',
            value: stats?.total_users || 0,
            icon: 'bi-people',
            color: 'primary',
            desc: 'Registered Students & Staff'
        },
        {
            title: 'Pending Lecturers',
            value: stats?.pending_lecturers || 0,
            icon: 'bi-hourglass-split',
            color: stats?.pending_lecturers ? 'danger' : 'secondary',
            desc: 'Awaiting Approval',
            highlight: (stats?.pending_lecturers || 0) > 0,
        },
        {
            title: 'Event Catalog',
            value: stats?.total_events || 0,
            icon: 'bi-calendar-event',
            color: 'info',
            desc: 'Total Activity Records'
        },
        {
            title: 'Attendance Flow',
            value: stats?.total_registrations || 0,
            icon: 'bi-ticket-detailed',
            color: 'success',
            desc: 'Confirmed Bookings'
        },
    ];

    const handleLogoutAdmin = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="animate-portal container pb-5">
            <header className="mb-5 border-bottom pb-4 d-md-flex justify-content-between align-items-end">
                <div>
                    <h1 className="section-title mb-2">System Administrator</h1>
                    <p className="text-muted mb-0">High-level institutional monitoring and records oversight.</p>
                </div>
                <button className="btn btn-outline-danger fw-bold px-4 mt-3 mt-md-0" onClick={handleLogoutAdmin}>
                    <i className="bi bi-box-arrow-right me-2"></i>
                    EXIT ADMIN
                </button>
            </header>

            {/* Systematic Metrics Grid */}
            <div className="row g-4 mb-5">
                {statCards.map((stat, index) => (
                    <div key={index} className="col-md-6 col-xl-3">
                        <div className={`portal-card p-4 h-100 bg-white d-flex flex-column justify-content-between ${stat.highlight ? 'border-danger border-2 border-opacity-50' : 'border-primary border-opacity-10'}`}>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="small fw-800 text-uppercase text-muted mb-0">{stat.title}</h6>
                                <div className={`text-${stat.color} opacity-75`}>
                                    <i className={`bi ${stat.icon} fs-4`}></i>
                                </div>
                            </div>
                            <div>
                                <h2 className={`fw-800 mb-1 ${stat.highlight ? 'text-danger' : 'text-primary'}`}>{stat.value}</h2>
                                <p className="text-muted small mb-0 fw-semibold">{stat.desc}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-4">
                <div className="col-lg-7">
                    <div className="portal-card h-100 p-4 p-md-5">
                        <div className="d-flex align-items-center gap-3 mb-5">
                            <div className="bg-primary bg-opacity-10 p-3 rounded-3 text-primary">
                                <i className="bi bi-shield-lock-fill fs-4"></i>
                            </div>
                            <div>
                                <h4 className="fw-bold mb-1">Portal Controls</h4>
                                <p className="text-muted small mb-0">System level overrides and directory access.</p>
                            </div>
                        </div>
                        
                        <div className="d-flex flex-column gap-3">
                            {(stats?.pending_lecturers || 0) > 0 && (
                                <a href="/admin/users" className="portal-card p-3 d-flex align-items-center justify-content-between text-decoration-none transition-all hover-translate border-danger border-opacity-25">
                                    <div className="d-flex align-items-center gap-3">
                                        <i className="bi bi-hourglass-split fs-5 text-danger"></i>
                                        <div>
                                            <span className="fw-bold text-danger">Review Pending Lecturers</span>
                                            <small className="d-block text-muted">{stats?.pending_lecturers} account(s) awaiting approval</small>
                                        </div>
                                    </div>
                                    <span className="badge bg-danger rounded-pill px-3">{stats?.pending_lecturers}</span>
                                </a>
                            )}
                            <a href="/admin/users" className="portal-card p-3 d-flex align-items-center justify-content-between text-decoration-none transition-all hover-translate">
                                <div className="d-flex align-items-center gap-3">
                                    <i className="bi bi-person-lines-fill fs-5 text-primary"></i>
                                    <span className="fw-bold text-main">Manage Institutional Records</span>
                                </div>
                                <i className="bi bi-chevron-right text-muted"></i>
                            </a>
                            <a href="/events/create" className="portal-card p-3 d-flex align-items-center justify-content-between text-decoration-none transition-all hover-translate">
                                <div className="d-flex align-items-center gap-3">
                                    <i className="bi bi-calendar-plus-fill fs-5 text-primary"></i>
                                    <span className="fw-bold text-main">Publish New Campus Event</span>
                                </div>
                                <i className="bi bi-chevron-right text-muted"></i>
                            </a>
                            <a href="/events" className="portal-card p-3 d-flex align-items-center justify-content-between text-decoration-none transition-all hover-translate">
                                <div className="d-flex align-items-center gap-3">
                                    <i className="bi bi-folder2-open fs-5 text-primary"></i>
                                    <span className="fw-bold text-main">Audit Live Directory Listing</span>
                                </div>
                                <i className="bi bi-chevron-right text-muted"></i>
                            </a>
                        </div>
                    </div>
                </div>
                
                <div className="col-lg-5">
                    <div className="portal-card h-100 p-4 p-md-5 bg-light border-0">
                        <h4 className="fw-bold mb-4 pb-2 border-bottom border-primary border-opacity-10">System Architecture</h4>
                        <div className="text-center py-4">
                            <div className="bg-white p-4 rounded-4 shadow-sm border border-primary border-opacity-10 mb-4">
                                <i className="bi bi-database-fill-check text-success mb-3 display-4 d-block"></i>
                                <h6 className="fw-800 text-main mb-1">Supabase Infrastructure</h6>
                                <p className="text-muted small">PostgreSQL and Auth are synchronized.</p>
                            </div>
                            
                            <div className="row g-3">
                                <div className="col-6">
                                    <div className="p-3 bg-white rounded-3 shadow-sm text-start">
                                        <div className="small fw-bold text-muted text-uppercase mb-1" style={{ fontSize: '0.6rem' }}>Environment</div>
                                        <div className="fw-bold text-primary small">Production-Stable</div>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="p-3 bg-white rounded-3 shadow-sm text-start">
                                        <div className="small fw-bold text-muted text-uppercase mb-1" style={{ fontSize: '0.6rem' }}>Auth System</div>
                                        <div className="fw-bold text-success small">Role-Based (RBAC)</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                .hover-translate:hover {
                    box-shadow: var(--shadow-md) !important;
                    transform: translateX(10px);
                }
            `}
            </style>
        </div>
    );
};

export default AdminDashboard;
