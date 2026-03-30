import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import eventService, { type Event } from '../services/eventService';

const SavedEvents: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSavedEvents = async () => {
            try {
                const data = await eventService.getSavedEvents();
                setEvents(data);
            } catch (err) {
                console.error('Failed to fetch saved events:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSavedEvents();
    }, []);

    const handleUnsave = async (eventId: number) => {
        try {
            await eventService.unsaveEvent(eventId);
            setEvents(events.filter((e) => e.id !== eventId));
        } catch (err) {
            console.error('Failed to unsave event:', err);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(i18n.language === 'en' ? 'en-NG' : 'en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
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
            <h1 className="mb-4">
                <i className="bi bi-bookmark-heart me-2 text-primary"></i>
                {t('nav.savedEvents')}
            </h1>

            {events.length === 0 ? (
                <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    {t('events.noEvents')}
                </div>
            ) : (
                <div className="row g-4">
                    {events.map((event) => (
                        <div key={event.id} className="col-md-6 col-lg-4">
                            <div className="card h-100 shadow-sm">
                                <div className="card-body">
                                    <h5 className="card-title">
                                        <Link to={`/events/${event.id}`} className="text-decoration-none">
                                            {event.title}
                                        </Link>
                                    </h5>
                                    <p className="card-text text-muted small">
                                        {event.description?.substring(0, 80)}...
                                    </p>
                                    <p className="card-text mb-1">
                                        <small className="text-muted">
                                            <i className="bi bi-calendar-event me-1"></i>
                                            {formatDate(event.start_date)}
                                        </small>
                                    </p>
                                    <p className="card-text">
                                        <small className="text-muted">
                                            <i className="bi bi-geo-alt me-1"></i>
                                            {event.venue}
                                        </small>
                                    </p>
                                </div>
                                <div className="card-footer bg-transparent border-0">
                                    <div className="d-flex justify-content-between">
                                        <Link to={`/events/${event.id}`} className="btn btn-primary btn-sm">
                                            {t('common.view')}
                                        </Link>
                                        <button
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() => handleUnsave(event.id)}
                                        >
                                            <i className="bi bi-bookmark-x me-1"></i>
                                            {t('events.unsave')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SavedEvents;
