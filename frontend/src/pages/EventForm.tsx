import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import eventService, { type Category, type EventFormData } from '../services/eventService';

const EventForm: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(isEdit);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState<EventFormData>({
        title: '',
        description: '',
        category_id: 0,
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
                    const event = await eventService.getEvent(parseInt(id));
                    setFormData({
                        title: event.title,
                        description: event.description,
                        category_id: event.category_id || 0,
                        venue: event.venue,
                        start_date: event.start_date.slice(0, 16),
                        end_date: event.end_date.slice(0, 16),
                        max_attendees: event.max_attendees,
                        status: event.status,
                    });
                } catch (err) {
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
            [name]: name === 'category_id' || name === 'max_attendees' ? parseInt(value) || 0 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isEdit && id) {
                await eventService.updateEvent(parseInt(id), formData);
                navigate(`/events/${id}`);
            } else {
                const newEvent = await eventService.createEvent(formData);
                navigate(`/events/${newEvent.id}`);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const getCategoryName = (category: Category) => {
        const langMap: Record<string, keyof Category> = {
            ha: 'name_ha',
            yo: 'name_yo',
            ig: 'name_ig',
        };
        const langKey = langMap[i18n.language];
        return (langKey && category[langKey]) || category.name;
    };

    if (fetchLoading) {
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
            <Link to={isEdit ? `/events/${id}` : '/my-events'} className="btn btn-outline-secondary mb-4">
                <i className="bi bi-arrow-left me-2"></i>
                {t('common.back')}
            </Link>

            <h1 className="mb-4">
                <i className={`bi bi-${isEdit ? 'pencil' : 'plus-circle'} me-2 text-primary`}></i>
                {isEdit ? t('events.edit') : t('events.create')}
            </h1>

            {error && (
                <div className="alert alert-danger">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </div>
            )}

            <div className="card shadow-sm">
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label htmlFor="title" className="form-label">
                                {t('eventForm.title')} *
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="description" className="form-label">
                                {t('eventForm.description')}
                            </label>
                            <textarea
                                className="form-control"
                                id="description"
                                name="description"
                                rows={5}
                                value={formData.description}
                                onChange={handleChange}
                            ></textarea>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label htmlFor="category_id" className="form-label">
                                    {t('eventForm.category')}
                                </label>
                                <select
                                    className="form-select"
                                    id="category_id"
                                    name="category_id"
                                    value={formData.category_id}
                                    onChange={handleChange}
                                >
                                    <option value={0}>--</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {getCategoryName(cat)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-6 mb-3">
                                <label htmlFor="venue" className="form-label">
                                    {t('eventForm.venue')} *
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="venue"
                                    name="venue"
                                    value={formData.venue}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label htmlFor="start_date" className="form-label">
                                    {t('eventForm.startDate')} *
                                </label>
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    id="start_date"
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label htmlFor="end_date" className="form-label">
                                    {t('eventForm.endDate')} *
                                </label>
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    id="end_date"
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label htmlFor="max_attendees" className="form-label">
                                    {t('eventForm.maxAttendees')}
                                </label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="max_attendees"
                                    name="max_attendees"
                                    min={0}
                                    value={formData.max_attendees}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-md-6 mb-3">
                                <label htmlFor="status" className="form-label">
                                    {t('eventForm.status')}
                                </label>
                                <select
                                    className="form-select"
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

                        <div className="d-flex gap-2">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading && <span className="spinner-border spinner-border-sm me-2"></span>}
                                <i className="bi bi-check-lg me-2"></i>
                                {t('eventForm.submit')}
                            </button>
                            <Link
                                to={isEdit ? `/events/${id}` : '/my-events'}
                                className="btn btn-outline-secondary"
                            >
                                {t('eventForm.cancel')}
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EventForm;
