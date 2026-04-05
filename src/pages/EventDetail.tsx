import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import eventService, { type Event } from '../services/eventService';
import { getDepartmentById } from '../data/departments';

const EventDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    useTranslation();
    const { user, isAuthenticated, isAdmin } = useAuth();
    const navigate = useNavigate();

    const [event, setEvent] = useState<Event | null>(null);
    const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const loadEventData = async () => {
            if (!id) return;
            try {
                const data = await eventService.getEvent(id);
                setEvent(data);
                
                if (user) {
                    const [registered, saved] = await Promise.all([
                        eventService.checkRegistration(id, user.id),
                        eventService.checkSaved(id, user.id)
                    ]);
                    setIsRegistered(registered);
                    setIsSaved(saved);
                }
            } catch (error) {
                console.error('Failed to fetch event details:', error);
            } finally {
                setLoading(false);
            }
        };
        loadEventData();
    }, [id, user]);

    const handleRegister = async () => {
        if (!isAuthenticated) return navigate('/login');
        if (!id || !user) return;
        
        setRegistering(true);
        try {
            await eventService.registerForEvent(id, user.id);
            setIsRegistered(true);
            setEvent((prev) => prev ? { ...prev, registration_count: (prev.registration_count || 0) + 1 } : null);
            setAlert({ type: 'success', message: 'You have been successfully registered for this event!' });
        } catch (error: any) {
            setAlert({ type: 'danger', message: error.message || 'An error occurred' });
        } finally {
            setRegistering(false);
        }
    };

    const handleToggleSave = async () => {
        if (!isAuthenticated) return navigate('/login');
        if (!id || !user) return;
        
        try {
            if (isSaved) {
                await eventService.unsaveEvent(id, user.id);
                setIsSaved(false);
            } else {
                await eventService.saveEvent(id, user.id);
                setIsSaved(true);
            }
        } catch (error) {
            setAlert({ type: 'danger', message: 'An error occurred' });
        }
    };

    const handleDelete = async () => {
        if (!id) return;
        setDeleting(true);
        try {
            await eventService.deleteEvent(id);
            navigate('/my-events', { replace: true });
        } catch (error: any) {
            setAlert({ type: 'danger', message: error.message || 'Failed to delete event' });
            setShowDeleteConfirm(false);
        } finally {
            setDeleting(false);
        }
    };

    const canDelete = event && user && (user.id === event.created_by || isAdmin());

    const formatDate = (date: any) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-NG', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatTime = (date: any) => {
        const d = new Date(date);
        return d.toLocaleTimeString('en-NG', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) return (
        <div className="text-center py-5 my-5">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    if (!event) return (
        <div className="container py-5 text-center">
            <div className="portal-card p-5 bg-light border-dashed">
                <i className="bi bi-exclamation-triangle display-1 text-accent mb-4"></i>
                <h2 className="fw-bold text-main">Event Not Found</h2>
                <p className="text-muted">The record you are looking for might have been archived or deleted.</p>
                <button onClick={() => navigate('/events')} className="btn btn-primary mt-3">RETURN TO DIRECTORY</button>
            </div>
        </div>
    );

    const eventDept = event.department_id ? getDepartmentById(event.department_id) : null;

    return (
        <div className="animate-portal container pb-5">
            {/* Academic Breadcrumb Header */}
            <nav className="mb-4 small fw-bold text-uppercase" aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                    <li className="breadcrumb-item"><Link to="/events" className="text-decoration-none text-muted">Directory</Link></li>
                    <li className="breadcrumb-item active text-primary" aria-current="page">Event Records</li>
                </ol>
            </nav>

            {alert && (
                <div className={`alert alert-${alert.type} portal-card border-0 border-start border-4 border-${alert.type} mb-4 animate-portal`}>
                    <div className="d-flex align-items-center gap-2 fw-bold">
                        <i className={`bi bi-${alert.type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'} text-${alert.type}`}></i>
                        {alert.message}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4">
                            <div className="modal-body p-5 text-center">
                                <div className="bg-danger bg-opacity-10 d-inline-flex p-4 rounded-circle mb-4">
                                    <i className="bi bi-trash3-fill text-danger display-4"></i>
                                </div>
                                <h4 className="fw-bold mb-3">Delete Event?</h4>
                                <p className="text-muted mb-4">
                                    This will permanently delete <strong>"{event.title}"</strong> and all associated registrations. This action cannot be undone.
                                </p>
                                <div className="d-flex gap-3 justify-content-center">
                                    <button 
                                        className="btn btn-outline-secondary px-4 py-2" 
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={deleting}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        className="btn btn-danger px-4 py-2 fw-bold" 
                                        onClick={handleDelete}
                                        disabled={deleting}
                                    >
                                        {deleting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-trash3 me-2"></i>}
                                        DELETE EVENT
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="row g-4">
                <div className="col-lg-8">
                    {/* Main Content Area */}
                    <div className="portal-card mb-4 overflow-hidden">
                        {event.image_url ? (
                            <img src={event.image_url} className="w-100 border-bottom" alt={event.title} style={{ height: '400px', objectFit: 'cover' }} />
                        ) : (
                            <div className="bg-light p-5 text-center border-bottom">
                                <i className="bi bi-image text-muted display-1"></i>
                            </div>
                        )}
                        
                        <div className="p-4 p-md-5">
                            <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                                {event.category && (
                                    <span className="badge-portal text-white" style={{ background: event.category.color }}>
                                        {event.category.name}
                                    </span>
                                )}
                                {eventDept && (
                                    <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-1 small fw-bold">
                                        <i className="bi bi-building me-1"></i>
                                        {eventDept.code}
                                    </span>
                                )}
                                <span className="text-muted small fw-bold">ID: {event.id.substring(0, 8).toUpperCase()}</span>
                            </div>
                            
                            <h1 className="fw-800 text-primary mb-3">{event.title}</h1>

                            {/* Lecturer Name */}
                            {event.creator_name && (
                                <div className="d-flex align-items-center gap-2 mb-4 pb-3 border-bottom">
                                    <div className="bg-primary bg-opacity-10 p-2 rounded-circle">
                                        <i className="bi bi-person-badge-fill text-primary"></i>
                                    </div>
                                    <div>
                                        <small className="text-muted text-uppercase fw-bold d-block" style={{ fontSize: '0.6rem', letterSpacing: '0.1em' }}>Posted by</small>
                                        <span className="fw-bold text-main">{event.creator_name}</span>
                                    </div>
                                </div>
                            )}
                            
                            <div className="mb-5">
                                <h5 className="fw-bold text-main mb-3 h6 text-uppercase border-start border-4 border-primary ps-3">Activity Description</h5>
                                <p className="text-muted" style={{ lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>
                                    {event.description}
                                </p>
                            </div>

                            <div className="row g-4 pt-3">
                                <div className="col-md-6">
                                    <div className="d-flex gap-3 align-items-start portal-card p-3 bg-light border-0 shadow-none">
                                        <div className="text-primary fs-4 mt-n1"><i className="bi bi-geo-alt-fill"></i></div>
                                        <div>
                                            <h6 className="fw-800 text-main mb-1">Venue Location</h6>
                                            <p className="text-muted small mb-0">{event.venue}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="d-flex gap-3 align-items-start portal-card p-3 bg-light border-0 shadow-none">
                                        <div className="text-primary fs-4 mt-n1"><i className="bi bi-clock-fill"></i></div>
                                        <div>
                                            <h6 className="fw-800 text-main mb-1">Scheduled Time</h6>
                                            <p className="text-muted small mb-0">
                                                {formatTime(event.start_date)} - {formatTime(event.end_date)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    {/* Sidebar Actions */}
                    <div className="sticky-top" style={{ top: '100px' }}>
                        <div className="portal-card p-4 mb-4">
                            <h5 className="fw-bold text-main mb-4 pb-2 border-bottom">Registration</h5>
                            
                            <div className="mb-4 bg-light p-3 rounded-3 text-center">
                                <h4 className="fw-800 text-primary mb-0">{event.registration_count || 0}</h4>
                                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.65rem' }}>Students Registered</small>
                                
                                {event.max_attendees > 0 && (
                                    <div className="mt-2">
                                        <div className="progress rounded-pill bg-white border" style={{ height: '8px' }}>
                                            <div 
                                                className="progress-bar bg-primary" 
                                                style={{ width: `${Math.min(100, ((event.registration_count || 0) / event.max_attendees) * 100)}%` }}
                                            ></div>
                                        </div>
                                        <small className="text-muted mt-1 d-block" style={{ fontSize: '0.7rem' }}>
                                            Capacity: {event.registration_count}/{event.max_attendees}
                                        </small>
                                    </div>
                                )}
                            </div>

                            <div className="d-grid gap-3">
                                {isRegistered ? (
                                    <div className="p-3 bg-success bg-opacity-10 text-success rounded-3 border border-success border-opacity-25 text-center">
                                        <i className="bi bi-check-circle-fill me-2"></i>
                                        <strong>Confirmed Registration</strong>
                                        <p className="mb-0 x-small mt-1" style={{ fontSize: '0.75rem' }}>Check your email for reminders.</p>
                                    </div>
                                ) : event.is_full ? (
                                    <button className="btn btn-secondary w-100 py-3 fw-bold disabled">
                                        CAPACITY REACHED
                                    </button>
                                ) : (
                                    <button 
                                        className="btn btn-primary w-100 py-3 fw-bold" 
                                        onClick={handleRegister}
                                        disabled={registering}
                                    >
                                        {registering ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-person-plus me-2"></i>}
                                        REGISTER NOW
                                    </button>
                                )}
                                
                                <button 
                                    className={`btn w-100 py-3 fw-bold ${isSaved ? 'btn-outline-accent' : 'btn-outline-primary'}`}
                                    onClick={handleToggleSave}
                                >
                                    <i className={`bi bi-bookmark${isSaved ? '-fill' : ''} me-2`}></i>
                                    {isSaved ? 'SAVED TO MY RECORDS' : 'SAVE FOR LATER'}
                                </button>

                                {/* Delete Button for Creator/Admin */}
                                {canDelete && (
                                    <button 
                                        className="btn btn-outline-danger w-100 py-3 fw-bold"
                                        onClick={() => setShowDeleteConfirm(true)}
                                    >
                                        <i className="bi bi-trash3 me-2"></i>
                                        DELETE EVENT
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Calendar Details */}
                        <div className="portal-card p-4">
                            <h6 className="fw-800 text-main mb-3 text-uppercase small">Calendar Reference</h6>
                            <div className="bg-light p-3 rounded-2 border-start border-4 border-primary">
                                <div className="d-flex align-items-center mb-1">
                                    <i className="bi bi-calendar-check me-2 text-primary"></i>
                                    <span className="fw-bold small">{formatDate(event.start_date)}</span>
                                </div>
                                <div className="small text-muted ms-4">
                                    Official LASUSTECH Academic Calendar
                                </div>
                            </div>

                            {/* Edit link for creator/admin */}
                            {canDelete && (
                                <Link to={`/events/${event.id}/edit`} className="btn btn-outline-primary w-100 mt-3 fw-bold">
                                    <i className="bi bi-pencil-square me-2"></i>
                                    EDIT EVENT
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;
