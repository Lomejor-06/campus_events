import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import eventService, { type Event } from '../services/eventService';
import EventCard from '../components/EventCard';

const Home: React.FC = () => {
    const { t } = useTranslation();
    const { user, isStaff, isAdmin } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const isStudent = user?.role === 'student';
                const departmentFilter = isStudent && user?.department_id ? user.department_id : undefined;
                const response = await eventService.getEvents({ per_page: 6, department_id: departmentFilter });
                setEvents(response.items);
            } catch (error) {
                console.error('Failed to fetch events:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [user]);

    return (
        <div className="animate-portal pb-5">
            {/* Structured Academic Hero */}
            <section className="portal-card hero-structured mb-5">
                <div className="container py-5 px-4 position-relative" style={{ zIndex: 1 }}>
                    <div className="row align-items-center">
                        <div className="col-lg-7 text-start">
                            <h6 className="text-accent fw-bold text-uppercase mb-3" style={{ letterSpacing: '0.2em' }}>
                                Official LASUSTECH Portal
                            </h6>
                            <h1 className="display-4 fw-800 text-primary mb-3">
                                {t('home.hero.title')}
                            </h1>
                            <p className="lead mb-5 text-muted pe-lg-5" style={{ fontSize: '1.1rem' }}>
                                {t('home.hero.subtitle')} Stay updated with campus academic activities, cultural festivals, and professional seminars.
                            </p>
                            <div className="d-flex gap-3">
                                <Link to="/events" className="btn btn-primary px-4 py-2 d-inline-flex align-items-center">
                                    <i className="bi bi-grid-fill me-2"></i>
                                    {t('home.hero.browseEvents')}
                                </Link>
                                <Link to="/calendar" className="btn btn-outline-primary px-4 py-2">
                                    <i className="bi bi-calendar3 me-2"></i>
                                    {t('home.hero.viewCalendar')}
                                </Link>
                            </div>
                        </div>
                        <div className="col-lg-5 d-none d-lg-block">
                            <div className="p-4 bg-light rounded-4 border border-primary border-opacity-10">
                                <div className="d-flex align-items-center gap-3 mb-4">
                                    <div className="bg-primary p-2 rounded-3 text-white">
                                        <i className="bi bi-megaphone-fill fs-4"></i>
                                    </div>
                                    <h5 className="fw-bold mb-0">Notice Board</h5>
                                </div>
                                <div className="d-flex flex-column gap-3">
                                    <div className="p-5 bg-white rounded-3 border-dashed border-2 text-center">
                                        <i className="bi bi-bell text-muted d-block mb-2 fs-4"></i>
                                        <p className="mb-0 text-muted small fw-bold">No new notifications</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="container">
                {/* Event Directory Section */}
                <section className="upcoming-events py-2">
                    <div className="d-flex justify-content-between align-items-end mb-5">
                        <div>
                            <h2 className="section-title mb-0">
                                {t('home.upcomingEvents')}
                            </h2>
                        </div>
                        <Link to="/events" className="btn btn-link text-decoration-none fw-bold text-primary">
                            DIRECTORY LISTING
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
                        <div className="portal-card p-5 text-center bg-light">
                            <i className="bi bi-calendar-x display-2 text-muted mb-4"></i>
                            <p className="lead text-muted">{t('events.noEvents')}</p>
                            {(isStaff() || isAdmin()) ? (
                                <Link to="/events/create" className="btn btn-primary mt-3">
                                    REGISTER FIRST CAMPUS EVENT
                                </Link>
                            ) : (
                                <p className="text-muted small mt-2">Check back later for upcoming campus events.</p>
                            )}
                        </div>
                    ) : (
                        <div className="row g-4">
                            {events.map((event) => (
                                <div key={event.id} className="col-md-6 col-xl-4">
                                    <EventCard event={event} />
                                </div>
                            ))}
                        </div>
                    )}
                </section>
                
                {/* Information Strip (Hidden until data is dynamic) */}
                {/* <section className="mt-5 py-5 border-top text-center">
                    <div className="row g-4 text-center justify-content-center">
                        ...
                    </div>
                </section> */}
            </div>
        </div>
    );
};

export default Home;
