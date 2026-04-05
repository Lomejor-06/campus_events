import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import bootstrap5Plugin from '@fullcalendar/bootstrap5';
import eventService from '../services/eventService';

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    color?: string;
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
                const data = await eventService.getCalendarEvents();
                const formattedEvents = data.map((event) => {
                    const startDate = new Date(event.start_date);
                    const endDate = new Date(event.end_date);
                    
                    return {
                        id: event.id,
                        title: event.title,
                        start: startDate.toISOString(),
                        end: endDate.toISOString(),
                        color: event.category?.color || '#2563eb'
                    };
                });
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
        <div className="animate-portal container pb-5">
            <header className="mb-5 border-bottom pb-4">
                <h1 className="section-title mb-2">
                    {t('calendar.title')}
                </h1>
                <p className="text-muted">Keep track of all campus activities in one place.</p>
            </header>

            <div className="portal-card p-2 p-md-4 shadow-sm bg-white overflow-hidden">
                {loading ? (
                    <div className="text-center py-5 my-5">
                        <div className="spinner-grow text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : (
                    <div className="calendar-container">
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
                            eventDisplay="block"
                            eventClassNames="rounded-3 px-2 py-1 shadow-sm border-0"
                            dayMaxEvents={true}
                        />
                    </div>
                )}
            </div>
            
            <style>{`
                .fc { --fc-border-color: #e2e8f0; --fc-button-bg-color: #1e3a8a; --fc-button-border-color: #1e3a8a; --fc-button-hover-bg-color: #1e40af; --fc-button-active-bg-color: #172554; }
                .fc .fc-toolbar-title { font-weight: 800; font-size: 1.5rem; color: #1e3a8a; }
                .fc .fc-col-header-cell-cushion { text-transform: uppercase; font-size: 0.75rem; font-weight: 700; color: #475569; padding: 1rem 0; }
                .fc .fc-daygrid-event { transition: all 0.2s ease; cursor: pointer; border-radius: 4px !important; }
                .fc .fc-daygrid-event:hover { opacity: 0.9; transform: translateY(-1px); }
                .fc .fc-button { border-radius: 4px; font-weight: 600; padding: 0.5rem 1rem; border: none; box-shadow: var(--shadow-sm); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
                .fc .fc-today-button { background: #f8fafc !important; color: #1e3a8a !important; border: 1px solid #e2e8f0 !important; }
            `}</style>
        </div>
    );
};

export default Calendar;
