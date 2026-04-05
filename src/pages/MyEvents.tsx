import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import eventService, { type Event } from '../services/eventService';

const MyEvents: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchMyEvents = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const items = await eventService.getMyEvents(user.id);
                setEvents(items);
            } catch (err) {
                console.error('Failed to fetch my events:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchMyEvents();
    }, [user]);

    const handleDelete = async (eventId: string) => {
        setDeleting(true);
        try {
            await eventService.deleteEvent(eventId);
            setEvents(prev => prev.filter(e => e.id !== eventId));
            setDeleteId(null);
        } catch (err: any) {
            console.error('Failed to delete event:', err);
            alert(err.message || 'Failed to delete event. You may not have permission.');
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const formatDate = (date: any) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-NG', {
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
        return `badge-custom text-white bg-${colors[status] || 'secondary'}`;
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-grow text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="d-flex justify-content-between align-items-end mb-5">
                <div>
                    <h1 className="display-4 fw-bold gradient-text mb-2">
                        {t('nav.myEvents')}
                    </h1>
                    <p className="text-muted mb-0">Manage the events you've created.</p>
                </div>
                <Link to="/events/create" className="btn btn-primary btn-lg px-4 shadow">
                    <i className="bi bi-plus-circle me-2"></i>
                    {t('events.create')}
                </Link>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-body p-5 text-center">
                                <div className="bg-danger bg-opacity-10 d-inline-flex p-4 rounded-circle mb-4">
                                    <i className="bi bi-trash3-fill text-danger display-4"></i>
                                </div>
                                <h4 className="fw-bold mb-3">Delete Event?</h4>
                                <p className="text-muted mb-4">
                                    This will permanently delete this event and all its registrations. This action cannot be undone.
                                </p>
                                <div className="d-flex gap-3 justify-content-center">
                                    <button className="btn btn-outline-secondary px-4 py-2" onClick={() => setDeleteId(null)} disabled={deleting}>
                                        Cancel
                                    </button>
                                    <button className="btn btn-danger px-4 py-2 fw-bold" onClick={() => handleDelete(deleteId)} disabled={deleting}>
                                        {deleting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-trash3 me-2"></i>}
                                        DELETE
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {events.length === 0 ? (
                <div className="glass-card p-5 text-center">
                    <i className="bi bi-calendar-x display-1 text-muted mb-4"></i>
                    <h3 className="fw-bold">No Events Found</h3>
                    <p className="text-muted">You haven't created any events yet.</p>
                    <Link to="/events/create" className="btn btn-primary mt-3 px-4">
                        Create Event
                    </Link>
                </div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0 mt-3 mx-2">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-4 py-3 border-0 bg-transparent text-muted small text-uppercase fw-bold">{t('eventForm.title')}</th>
                                    <th className="py-3 border-0 bg-transparent text-muted small text-uppercase fw-bold">{t('eventForm.startDate')}</th>
                                    <th className="py-3 border-0 bg-transparent text-muted small text-uppercase fw-bold">{t('eventForm.venue')}</th>
                                    <th className="py-3 border-0 bg-transparent text-muted small text-uppercase fw-bold">{t('eventForm.status')}</th>
                                    <th className="py-3 border-0 bg-transparent text-muted small text-uppercase fw-bold">Attendees</th>
                                    <th className="py-3 border-0 bg-transparent"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map((event) => (
                                    <tr key={event.id}>
                                        <td className="ps-4 py-3">
                                            <Link to={`/events/${event.id}`} className="text-decoration-none fw-bold text-main">
                                                {event.title}
                                            </Link>
                                        </td>
                                        <td className="py-3 text-muted">{formatDate(event.start_date)}</td>
                                        <td className="py-3 text-muted">{event.venue}</td>
                                        <td className="py-3">
                                            <span className={getStatusBadge(event.status)}>
                                                {t(`events.status.${event.status}`)}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <div className="d-flex align-items-center">
                                                <span className="fw-bold me-2">{event.registration_count}</span>
                                                <span className="text-muted small">/ {event.max_attendees === 0 ? '∞' : event.max_attendees}</span>
                                            </div>
                                        </td>
                                        <td className="pe-4 py-3 text-end">
                                            <div className="d-flex gap-2 justify-content-end">
                                                <Link to={`/events/${event.id}`} className="btn btn-light btn-sm rounded-3" title="View">
                                                    <i className="bi bi-eye"></i>
                                                </Link>
                                                <Link to={`/events/${event.id}/edit`} className="btn btn-light btn-sm rounded-3" title="Edit">
                                                    <i className="bi bi-pencil"></i>
                                                </Link>
                                                <button 
                                                    className="btn btn-outline-danger btn-sm rounded-3" 
                                                    title="Delete"
                                                    onClick={() => setDeleteId(event.id)}
                                                >
                                                    <i className="bi bi-trash3"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyEvents;
