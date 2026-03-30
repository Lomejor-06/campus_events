import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import eventService, { type Event, type Category } from '../services/eventService';

const EventDetail: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, isStaff, user } = useAuth();

    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEvent = async () => {
            if (!id) return;
            try {
                const data = await eventService.getEvent(parseInt(id));
                setEvent(data);
            } catch (err) {
                setError(t('common.error'));
            } finally {
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id, t]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(i18n.language === 'en' ? 'en-NG' : 'en-NG', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getCategoryName = (category?: Category) => {
        if (!category) return '';
        const langMap: Record<string, keyof Category> = {
            ha: 'name_ha',
            yo: 'name_yo',
            ig: 'name_ig',
        };
        const langKey = langMap[i18n.language];
        return (langKey && category[langKey]) || category.name;
    };

    const handleRegister = async () => {
        if (!event) return;
        setActionLoading(true);
        try {
            await eventService.registerForEvent(event.id);
            setEvent({ ...event, is_registered: true, registration_count: event.registration_count + 1 });
        } catch (err) {
            console.error('Registration failed:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnregister = async () => {
        if (!event) return;
        setActionLoading(true);
        try {
            await eventService.unregisterFromEvent(event.id);
            setEvent({ ...event, is_registered: false, registration_count: event.registration_count - 1 });
        } catch (err) {
            console.error('Unregistration failed:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSave = async () => {
        if (!event) return;
        setActionLoading(true);
        try {
            if (event.is_saved) {
                await eventService.unsaveEvent(event.id);
                setEvent({ ...event, is_saved: false });
            } else {
                await eventService.saveEvent(event.id);
                setEvent({ ...event, is_saved: true });
            }
        } catch (err) {
            console.error('Save action failed:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!event || !window.confirm(t('events.confirmDelete'))) return;
        try {
            await eventService.deleteEvent(event.id);
            navigate('/events');
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t('common.loading')}</span>
                </div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="alert alert-danger">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error || t('common.error')}
            </div>
        );
    }

    const canEdit = isStaff() && (user?.role === 'admin' || user?.id === event.created_by);

    return (
        <div>
            <Link to="/events" className="btn btn-outline-secondary mb-4">
                <i className="bi bi-arrow-left me-2"></i>
                {t('common.back')}
            </Link>

            <div className="row">
                <div className="col-lg-8">
                    {event.image_url && (
                        <img
                            src={event.image_url}
                            alt={event.title}
                            className="img-fluid rounded-3 mb-4 w-100"
                            style={{ maxHeight: '400px', objectFit: 'cover' }}
                        />
                    )}

                    <div className="mb-3">
                        {event.category && (
                            <span
                                className="badge me-2"
                                style={{ backgroundColor: event.category.color, fontSize: '0.9rem' }}
                            >
                                <i className={`bi ${event.category.icon} me-1`}></i>
                                {getCategoryName(event.category)}
                            </span>
                        )}
                        <span className={`badge bg-${event.status === 'published' ? 'success' :
                            event.status === 'cancelled' ? 'danger' :
                                event.status === 'completed' ? 'secondary' : 'warning'
                            }`}>
                            {t(`events.status.${event.status}`)}
                        </span>
                    </div>

                    <h1 className="mb-3">{event.title}</h1>

                    <div className="mb-4">
                        <p className="lead">{event.description}</p>
                    </div>

                    <div className="row g-4 mb-4">
                        <div className="col-md-6">
                            <div className="card bg-light">
                                <div className="card-body">
                                    <h6 className="text-muted mb-2">
                                        <i className="bi bi-calendar-event me-2"></i>
                                        {t('eventForm.startDate')}
                                    </h6>
                                    <p className="mb-0 fw-semibold">{formatDate(event.start_date)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card bg-light">
                                <div className="card-body">
                                    <h6 className="text-muted mb-2">
                                        <i className="bi bi-calendar-check me-2"></i>
                                        {t('eventForm.endDate')}
                                    </h6>
                                    <p className="mb-0 fw-semibold">{formatDate(event.end_date)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card bg-light">
                                <div className="card-body">
                                    <h6 className="text-muted mb-2">
                                        <i className="bi bi-geo-alt me-2"></i>
                                        {t('eventForm.venue')}
                                    </h6>
                                    <p className="mb-0 fw-semibold">{event.venue}</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card bg-light">
                                <div className="card-body">
                                    <h6 className="text-muted mb-2">
                                        <i className="bi bi-people me-2"></i>
                                        {t('eventForm.maxAttendees')}
                                    </h6>
                                    <p className="mb-0 fw-semibold">
                                        {event.registration_count} / {event.max_attendees === 0 ? '∞' : event.max_attendees}
                                        {event.spots_left !== null && event.spots_left > 0 && (
                                            <span className="text-success ms-2">
                                                ({t('events.spotsLeft', { count: event.spots_left })})
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="card shadow-sm sticky-top" style={{ top: '100px' }}>
                        <div className="card-body">
                            <h5 className="card-title mb-4">{t('events.register')}</h5>

                            {!isAuthenticated ? (
                                <div>
                                    <p className="text-muted">{t('auth.login.noAccount')}</p>
                                    <Link to="/login" className="btn btn-primary w-100">
                                        {t('nav.login')}
                                    </Link>
                                </div>
                            ) : event.is_registered ? (
                                <div>
                                    <div className="alert alert-success mb-3">
                                        <i className="bi bi-check-circle me-2"></i>
                                        {t('events.registered')}
                                    </div>
                                    <button
                                        className="btn btn-outline-danger w-100"
                                        onClick={handleUnregister}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? (
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                        ) : (
                                            <i className="bi bi-x-circle me-2"></i>
                                        )}
                                        {t('events.unregister')}
                                    </button>
                                </div>
                            ) : event.is_full ? (
                                <div className="alert alert-warning mb-0">
                                    <i className="bi bi-exclamation-triangle me-2"></i>
                                    {t('events.full')}
                                </div>
                            ) : (
                                <button
                                    className="btn btn-primary btn-lg w-100"
                                    onClick={handleRegister}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                    ) : (
                                        <i className="bi bi-calendar-plus me-2"></i>
                                    )}
                                    {t('events.register')}
                                </button>
                            )}

                            {isAuthenticated && (
                                <button
                                    className={`btn ${event.is_saved ? 'btn-outline-danger' : 'btn-outline-secondary'} w-100 mt-3`}
                                    onClick={handleSave}
                                    disabled={actionLoading}
                                >
                                    <i className={`bi bi-${event.is_saved ? 'bookmark-fill' : 'bookmark'} me-2`}></i>
                                    {event.is_saved ? t('events.unsave') : t('events.save')}
                                </button>
                            )}

                            {canEdit && (
                                <div className="border-top mt-4 pt-4">
                                    <Link
                                        to={`/events/${event.id}/edit`}
                                        className="btn btn-outline-primary w-100 mb-2"
                                    >
                                        <i className="bi bi-pencil me-2"></i>
                                        {t('events.edit')}
                                    </Link>
                                    <button
                                        className="btn btn-outline-danger w-100"
                                        onClick={handleDelete}
                                    >
                                        <i className="bi bi-trash me-2"></i>
                                        {t('events.delete')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
