import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import eventService, { type Event } from '../services/eventService';

const SavedEvents: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSavedEvents = async () => {
            if (!user) return;
            try {
                const data = await eventService.getSavedEvents(user.id);
                setEvents(data);
            } catch (err) {
                console.error('Failed to fetch saved events:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchSavedEvents();
    }, [user]);

    const handleUnsave = async (eventId: string) => {
        if (!user) return;
        try {
            await eventService.unsaveEvent(eventId, user.id);
            setEvents(events.filter((e) => e.id !== eventId));
        } catch (err) {
            console.error('Failed to unsave event:', err);
        }
    };

    const formatDate = (date: any) => {
        const d = new Date(date);
        return d.toLocaleDateString(i18n.language === 'en' ? 'en-NG' : 'en-NG', {
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
                <div className="spinner-grow text-primary" role="status">
                    <span className="visually-hidden">{t('common.loading')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <header className="mb-5">
                <h1 className="display-4 fw-bold gradient-text mb-3">
                    {t('nav.savedEvents')}
                </h1>
                <p className="text-muted">A collection of results you've saved for later.</p>
            </header>

            {events.length === 0 ? (
                <div className="glass-card p-5 text-center">
                    <i className="bi bi-bookmark display-1 text-muted mb-4 text-opacity-25"></i>
                    <h3 className="fw-bold">No Saved Events</h3>
                    <p className="text-muted">Browse the event grid to find something interesting.</p>
                    <Link to="/events" className="btn btn-primary mt-3 px-4 shadow">
                        Browse Events
                    </Link>
                </div>
            ) : (
                <div className="row g-4">
                    {events.map((event) => (
                        <div key={event.id} className="col-md-6 col-lg-4">
                            <div className="glass-card h-100 event-card overflow-hidden d-flex flex-column p-4">
                                <div className="mb-3 d-flex justify-content-between align-items-start">
                                    <h5 className="fw-bold mb-0">
                                        <Link to={`/events/${event.id}`} className="text-decoration-none text-main line-clamp-1">
                                            {event.title}
                                        </Link>
                                    </h5>
                                    <button
                                        className="btn btn-link text-danger p-0"
                                        onClick={() => handleUnsave(event.id)}
                                        title={t('events.unsave')}
                                    >
                                        <i className="bi bi-bookmark-fill fs-5"></i>
                                    </button>
                                </div>
                                
                                <p className="text-muted small mb-4 line-clamp-2 flex-grow-1">
                                    {event.description}
                                </p>
                                
                                <div className="mt-auto d-grid pt-3 border-top border-light">
                                    <div className="d-flex align-items-center mb-2 text-muted small">
                                        <i className="bi bi-calendar3 me-2"></i>
                                        {formatDate(event.start_date)}
                                    </div>
                                    <div className="d-flex align-items-center mb-4 text-muted small">
                                        <i className="bi bi-geo-alt me-2"></i>
                                        <span className="line-clamp-1">{event.venue}</span>
                                    </div>
                                    
                                    <Link to={`/events/${event.id}`} className="btn btn-outline-primary btn-sm rounded-3">
                                        {t('common.view')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <style>{`
                .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
                .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            `}</style>
        </div>
    );
};

export default SavedEvents;
