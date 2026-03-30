import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import eventService, { type Event } from '../services/eventService';
import EventCard from '../components/EventCard';

const Home: React.FC = () => {
    const { t } = useTranslation();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await eventService.getEvents({ per_page: 6 });
                setEvents(response.items);
            } catch (error) {
                console.error('Failed to fetch events:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    return (
        <>
            {/* Hero Section */}
            <section className="hero-section py-5 mb-5 text-center text-white rounded-4" style={{ background: 'linear-gradient(135deg, #800020 0%, #5c0017 100%)' }}>
                <div className="py-5">
                    <h1 className="display-4 fw-bold mb-3">{t('home.hero.title')}</h1>
                    <p className="lead mb-4">{t('home.hero.subtitle')}</p>
                    <div className="d-flex gap-3 justify-content-center flex-wrap">
                        <Link to="/events" className="btn btn-light btn-lg px-4">
                            <i className="bi bi-grid me-2"></i>
                            {t('home.hero.browseEvents')}
                        </Link>
                        <Link to="/calendar" className="btn btn-outline-light btn-lg px-4">
                            <i className="bi bi-calendar3 me-2"></i>
                            {t('home.hero.viewCalendar')}
                        </Link>
                    </div>
                </div>
            </section>

            {/* Upcoming Events Section */}
            <section className="upcoming-events">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="mb-0">
                        <i className="bi bi-calendar-event me-2 text-primary"></i>
                        {t('home.upcomingEvents')}
                    </h2>
                    <Link to="/events" className="btn btn-outline-primary">
                        {t('home.viewAll')}
                        <i className="bi bi-arrow-right ms-2"></i>
                    </Link>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">{t('common.loading')}</span>
                        </div>
                    </div>
                ) : events.length === 0 ? (
                    <div className="alert alert-info">
                        <i className="bi bi-info-circle me-2"></i>
                        {t('events.noEvents')}
                    </div>
                ) : (
                    <div className="row g-4">
                        {events.map((event) => (
                            <div key={event.id} className="col-md-6 col-lg-4">
                                <EventCard event={event} />
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </>
    );
};

export default Home;
