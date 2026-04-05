import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Event, Category } from '../services/eventService';

interface EventCardProps {
    event: Event;
    categoryName?: string;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
    const { i18n } = useTranslation();

    const formatDate = (date: any) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (date: any) => {
        const d = new Date(date);
        return d.toLocaleTimeString('en-NG', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getCategoryName = (category?: Category) => {
        if (!category) return '';
        const langMap: Record<string, string> = {
            ha: 'name_ha',
            yo: 'name_yo',
            ig: 'name_ig',
        };
        const langKey = langMap[i18n.language];
        return (langKey && (category as any)[langKey]) || category.name;
    };

    return (
        <div className="portal-card portal-card-interactive h-100 event-card overflow-hidden d-flex flex-column animate-portal">
            <div className="position-relative">
                {event.image_url ? (
                    <img
                        src={event.image_url}
                        className="w-100 border-bottom"
                        alt={event.title}
                        style={{ height: '180px', objectFit: 'cover' }}
                    />
                ) : (
                    <div className="w-100 bg-light d-flex align-items-center justify-content-center border-bottom" style={{ height: '180px' }}>
                        <i className="bi bi-calendar-event text-muted display-4"></i>
                    </div>
                )}
                
                <div className="position-absolute top-0 end-0 m-3 d-flex flex-column gap-2">
                    {event.category && (
                        <span
                            className="badge-portal text-white shadow-sm"
                            style={{ background: event.category.color }}
                        >
                            <i className={`bi ${event.category.icon} me-1`}></i>
                            {getCategoryName(event.category)}
                        </span>
                    )}
                </div>
            </div>
            
            <div className="p-4 d-flex flex-column flex-grow-1">
                <div className="d-flex align-items-center mb-2 gap-2 text-primary small fw-bold text-uppercase">
                    <i className="bi bi-clock"></i>
                    {formatTime(event.start_date)}
                </div>
                
                <h5 className="fw-bold mb-2 line-clamp-1 text-main">{event.title}</h5>

                {/* Lecturer Name */}
                {event.creator_name && (
                    <div className="d-flex align-items-center text-muted small mb-2">
                        <i className="bi bi-person-badge me-1 text-primary"></i>
                        <span className="fw-semibold">By: {event.creator_name}</span>
                    </div>
                )}
                
                <p className="text-muted small mb-4 line-clamp-2 flex-grow-1" style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                    {event.description}
                </p>
                
                <div className="mt-auto pt-3 border-top bg-light mx-n4 px-4 pb-0">
                    <div className="row g-0 py-3">
                        <div className="col-7 border-end">
                            <div className="d-flex align-items-center text-muted small mb-1">
                                <i className="bi bi-calendar3 me-2 text-primary"></i>
                                {formatDate(event.start_date)}
                            </div>
                            <div className="d-flex align-items-center text-muted small">
                                <i className="bi bi-geo-alt me-2 text-primary"></i>
                                <span className="line-clamp-1">{event.venue}</span>
                            </div>
                        </div>
                        <div className="col-5 ps-3 d-flex flex-column justify-content-center">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <span className="fw-bold text-primary fs-5">
                                    {event.registration_count}
                                </span>
                                <span className="text-muted" style={{ fontSize: '0.7rem' }}>REGISTERED</span>
                            </div>
                            <Link
                                to={`/events/${event.id}`}
                                className="btn btn-primary btn-sm w-100 py-1"
                                style={{ fontSize: '0.75rem' }}
                            >
                                EXPLORE
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>{`
                .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
                .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            `}
            </style>
        </div>
    );
};

export default EventCard;
