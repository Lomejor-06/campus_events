import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import eventService, { type Event } from '../services/eventService';

const MyEvents: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const fetchMyEvents = async () => {
            setLoading(true);
            try {
                const response = await eventService.getMyEvents(page);
                setEvents(response.items);
                setTotalPages(response.pages);
            } catch (err) {
                console.error('Failed to fetch my events:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMyEvents();
    }, [page]);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(i18n.language === 'en' ? 'en-NG' : 'en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            draft: 'warning',
            published: 'success',
            cancelled: 'danger',
            completed: 'secondary',
        };
        return `badge bg-${colors[status] || 'secondary'}`;
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

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>
                    <i className="bi bi-calendar-plus me-2 text-primary"></i>
                    {t('nav.myEvents')}
                </h1>
                <Link to="/events/create" className="btn btn-primary">
                    <i className="bi bi-plus-circle me-2"></i>
                    {t('events.create')}
                </Link>
            </div>

            {events.length === 0 ? (
                <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    {t('events.noEvents')}
                </div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>{t('eventForm.title')}</th>
                                    <th>{t('eventForm.startDate')}</th>
                                    <th>{t('eventForm.venue')}</th>
                                    <th>{t('eventForm.status')}</th>
                                    <th>{t('events.spotsLeft', { count: 0 }).replace('0', '')}</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((event) => (
                                    <tr key={event.id}>
                                        <td>
                                            <Link to={`/events/${event.id}`} className="text-decoration-none fw-semibold">
                                                {event.title}
                                            </Link>
                                        </td>
                                        <td>{formatDate(event.start_date)}</td>
                                        <td>{event.venue}</td>
                                        <td>
                                            <span className={getStatusBadge(event.status)}>
                                                {t(`events.status.${event.status}`)}
                                            </span>
                                        </td>
                                        <td>
                                            {event.registration_count} / {event.max_attendees === 0 ? '∞' : event.max_attendees}
                                        </td>
                                        <td>
                                            <div className="btn-group btn-group-sm">
                                                <Link to={`/events/${event.id}`} className="btn btn-outline-primary">
                                                    <i className="bi bi-eye"></i>
                                                </Link>
                                                <Link to={`/events/${event.id}/edit`} className="btn btn-outline-secondary">
                                                    <i className="bi bi-pencil"></i>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <nav>
                            <ul className="pagination justify-content-center">
                                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setPage(page - 1)} disabled={page === 1}>
                                        &laquo;
                                    </button>
                                </li>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                                        <button className="page-link" onClick={() => setPage(p)}>
                                            {p}
                                        </button>
                                    </li>
                                ))}
                                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                                        &raquo;
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </>
            )}
        </div>
    );
};

export default MyEvents;
