import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import bootstrap5Plugin from '@fullcalendar/bootstrap5';
import api from '../services/api';

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    color: string;
    allDay?: boolean;
}

const Calendar: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await api.get<any[]>('/events/calendar');
                const formattedEvents = response.data.map((event) => ({
                    ...event,
                    id: String(event.id)
                }));
                setEvents(formattedEvents);
            } catch (err) {
                console.error('Failed to fetch calendar events:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const handleEventClick = (info: any) => {
        navigate(`/events/${info.event.id}`);
    };

    return (
        <div>
            <h1 className="mb-4">
                <i className="bi bi-calendar3 me-2 text-primary"></i>
                {t('calendar.title')}
            </h1>

            <div className="card shadow-sm">
                <div className="card-body">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : (
                        <FullCalendar
                            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, bootstrap5Plugin]}
                            initialView="dayGridMonth"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'dayGridMonth,timeGridWeek,timeGridDay'
                            }}
                            themeSystem="bootstrap5"
                            events={events}
                            eventClick={handleEventClick}
                            height="auto"
                            aspectRatio={1.5}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Calendar;
