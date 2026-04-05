import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import eventService, { type Category, type EventFormData } from '../services/eventService';

const EventForm: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, isStaff, isAdmin } = useAuth();
    const isEdit = !!id;

    // Only staff and admins can create/edit events
    if (!isStaff() && !isAdmin()) {
        return (
            <div className="animate-fade-in max-width-container mx-auto text-center py-5" style={{ maxWidth: '600px' }}>
                <div className="glass-card p-5">
                    <i className="bi bi-shield-lock display-1 text-danger mb-4"></i>
                    <h2 className="fw-bold mb-3">Access Restricted</h2>
                    <p className="text-muted mb-4">Only lecturers and administrators can create or edit campus events.</p>
                    <button onClick={() => navigate('/')} className="btn btn-primary px-4">
                        <i className="bi bi-house me-2"></i>Return Home
                    </button>
                </div>
            </div>
        );
    }

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(isEdit);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState<EventFormData>({
        title: '',
        description: '',
        category_id: '',
        venue: '',
        start_date: '',
        end_date: '',
        max_attendees: 0,
        status: 'draft',
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await eventService.getCategories();
                setCategories(data);
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (isEdit && id) {
            const fetchEvent = async () => {
                try {
                    const event = await eventService.getEvent(id);
                    const startDate = new Date(event.start_date);
                    const endDate = new Date(event.end_date);
                    
                    const safeStartDate = isNaN(startDate.getTime()) ? '' : startDate.toISOString().slice(0, 16);
                    const safeEndDate = isNaN(endDate.getTime()) ? '' : endDate.toISOString().slice(0, 16);
                    
                    setFormData({
                        title: event.title,
                        description: event.description,
                        category_id: event.category_id || '',
                        venue: event.venue,
                        start_date: safeStartDate,
                        end_date: safeEndDate,
                        max_attendees: event.max_attendees,
                        status: event.status,
                    });
                } catch (err) {
                    console.error("Failed to load event for editing:", err);
                    setError(t('common.error'));
                } finally {
                    setFetchLoading(false);
                }
            };
            fetchEvent();
        }
    }, [id, isEdit, t]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'max_attendees' ? parseInt(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!user) {
            setError('You must be logged in to create an event');
            setLoading(false);
            return;
        }

        try {
            if (isEdit && id) {
                await eventService.updateEvent(id, formData);
                navigate(`/events/${id}`);
            } else {
                const newEvent = await eventService.createEvent(formData, user.id);
                navigate(`/events/${newEvent.id}`);
            }
        } catch (err: any) {
            setError(err.message || t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const getCategoryName = (category: Category) => {
        const langMap: Record<string, string> = {
            ha: 'name_ha',
            yo: 'name_yo',
            ig: 'name_ig',
        };
        const langKey = langMap[i18n.language];
        return (langKey && (category as any)[langKey]) || category.name;
    };

    if (fetchLoading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-grow text-primary" role="status">
                    <span className="visually-hidden">{t('common.loading')}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-width-container mx-auto" style={{ maxWidth: '800px' }}>
            <Link to={isEdit ? `/events/${id}` : '/my-events'} className="btn btn-link text-decoration-none text-muted mb-4 p-0">
                <i className="bi bi-arrow-left me-2"></i>
                {t('common.back')}
            </Link>

            <header className="mb-5">
                <h1 className="display-5 fw-bold gradient-text mb-3">
                    {isEdit ? t('events.edit') : t('events.create')}
                </h1>
                <p className="text-muted">Fill out the details below to host your campus event.</p>
            </header>

            {error && (
                <div className="alert alert-danger glass-card border-danger border-opacity-25 mb-4">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </div>
            )}

            <div className="glass-card p-4 p-md-5">
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="title" className="form-label fw-bold small text-uppercase text-muted">
                            {t('eventForm.title')} *
                        </label>
                        <input
                            type="text"
                            className="form-control form-control-lg bg-light border-0 px-4 py-3 rounded-4"
                            id="title"
                            name="title"
                            placeholder="e.g. Annual Tech Symposium"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label htmlFor="description" className="form-label fw-bold small text-uppercase text-muted">
                            {t('eventForm.description')}
                        </label>
                        <textarea
                            className="form-control bg-light border-0 px-4 py-3 rounded-4"
                            id="description"
                            name="description"
                            rows={4}
                            placeholder="Tell students what to expect..."
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    <div className="row g-4 mb-4">
                        <div className="col-md-6">
                            <label htmlFor="category_id" className="form-label fw-bold small text-uppercase text-muted">
                                {t('eventForm.category')}
                            </label>
                            <select
                                className="form-select form-select-lg bg-light border-0 px-4 py-3 rounded-4"
                                id="category_id"
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleChange}
                            >
                                <option value="">Select a category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {getCategoryName(cat)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-6">
                            <label htmlFor="venue" className="form-label fw-bold small text-uppercase text-muted">
                                {t('eventForm.venue')} *
                            </label>
                            <input
                                type="text"
                                className="form-control form-control-lg bg-light border-0 px-4 py-3 rounded-4"
                                id="venue"
                                name="venue"
                                placeholder="e.g. Main Auditorium"
                                value={formData.venue}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="row g-4 mb-4">
                        <div className="col-md-6">
                            <label htmlFor="start_date" className="form-label fw-bold small text-uppercase text-muted">
                                {t('eventForm.startDate')} *
                            </label>
                            <input
                                type="datetime-local"
                                className="form-control form-control-lg bg-light border-0 px-4 py-3 rounded-4"
                                id="start_date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <label htmlFor="end_date" className="form-label fw-bold small text-uppercase text-muted">
                                {t('eventForm.endDate')} *
                            </label>
                            <input
                                type="datetime-local"
                                className="form-control form-control-lg bg-light border-0 px-4 py-3 rounded-4"
                                id="end_date"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="row g-4 mb-5">
                        <div className="col-md-6">
                            <label htmlFor="max_attendees" className="form-label fw-bold small text-uppercase text-muted">
                                {t('eventForm.maxAttendees')}
                            </label>
                            <input
                                type="number"
                                className="form-control form-control-lg bg-light border-0 px-4 py-3 rounded-4"
                                id="max_attendees"
                                name="max_attendees"
                                min={0}
                                placeholder="0 for unlimited"
                                value={formData.max_attendees}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="col-md-6">
                            <label htmlFor="status" className="form-label fw-bold small text-uppercase text-muted">
                                {t('eventForm.status')}
                            </label>
                            <select
                                className="form-select form-select-lg bg-light border-0 px-4 py-3 rounded-4"
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                            >
                                <option value="draft">{t('events.status.draft')}</option>
                                <option value="published">{t('events.status.published')}</option>
                                <option value="cancelled">{t('events.status.cancelled')}</option>
                            </select>
                        </div>
                    </div>

                    <div className="d-flex gap-3 pt-3">
                        <button type="submit" className="btn btn-primary btn-lg px-5 flex-grow-1" disabled={loading}>
                            {loading ? (
                                <span className="spinner-border spinner-border-sm me-2"></span>
                            ) : (
                                <i className="bi bi-check2-circle me-2"></i>
                            )}
                            {isEdit ? t('common.saveChanges') : t('eventForm.submit')}
                        </button>
                        <Link
                            to={isEdit ? `/events/${id}` : '/my-events'}
                            className="btn btn-outline-secondary btn-lg px-4"
                            style={{ borderRadius: '1rem' }}
                        >
                            {t('eventForm.cancel')}
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventForm;
