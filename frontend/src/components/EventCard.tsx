import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Event, Category } from '../services/eventService';

interface EventCardProps {
    event: Event;
    categoryName?: string;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
    const { t, i18n } = useTranslation();

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(i18n.language === 'en' ? 'en-NG' : 'en-NG', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
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

    return (
        <div className="card h-100 shadow-sm event-card">
            {event.image_url && (
                <img
                    src={event.image_url}
                    className="card-img-top"
                    alt={event.title}
                    style={{ height: '180px', objectFit: 'cover' }}
                />
            )}
            <div className="card-body d-flex flex-column">
                <div className="mb-2">
                    {event.category && (
                        <span
                            className="badge me-2"
                            style={{ backgroundColor: event.category.color }}
                        >
                            <i className={`bi ${event.category.icon} me-1`}></i>
                            {getCategoryName(event.category)}
                        </span>
                    )}
                    {event.is_full && (
                        <span className="badge bg-danger">{t('events.full')}</span>
                    )}
                </div>
                <h5 className="card-title">{event.title}</h5>
                <p className="card-text text-muted small flex-grow-1">
                    {event.description?.substring(0, 100)}
                    {event.description && event.description.length > 100 ? '...' : ''}
                </p>
                <div className="mt-auto">
                    <p className="card-text mb-1">
                        <small className="text-muted">
                            <i className="bi bi-calendar-event me-1"></i>
                            {formatDate(event.start_date)}
                        </small>
                    </p>
                    <p className="card-text mb-2">
                        <small className="text-muted">
                            <i className="bi bi-geo-alt me-1"></i>
                            {event.venue}
                        </small>
                    </p>
                    <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                            {event.max_attendees === 0
                                ? t('events.unlimited')
                                : event.spots_left !== null
                                    ? t('events.spotsLeft', { count: event.spots_left })
                                    : ''}
                        </small>
                        <Link
                            to={`/events/${event.id}`}
                            className="btn btn-primary btn-sm"
                        >
                            {t('common.view')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventCard;
