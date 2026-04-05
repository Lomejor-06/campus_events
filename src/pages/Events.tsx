import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import eventService, { type Event, type Category } from '../services/eventService';
import EventCard from '../components/EventCard';

const Events: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // If user is a student, filter events by their department
                const isStudent = user?.role === 'student';
                const departmentFilter = isStudent && user?.department_id ? user.department_id : undefined;

                const [eventsData, categoriesData] = await Promise.all([
                    eventService.getEvents({ department_id: departmentFilter }),
                    eventService.getCategories()
                ]);
                setEvents(eventsData.items);
                setCategories(categoriesData);
            } catch (error) {
                console.error('Failed to load events data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadInitialData();
    }, [user]);

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(search.toLowerCase()) ||
            event.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory ? event.category_id === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    const getCategoryName = (category: Category) => {
        const langMap: Record<string, string> = {
            ha: 'name_ha',
            yo: 'name_yo',
            ig: 'name_ig',
        };
        const langKey = langMap[i18n.language];
        return (langKey && (category as any)[langKey]) || category.name;
    };

    return (
        <div className="animate-portal container pb-5">
            <header className="mb-5 border-bottom pb-4">
                <h1 className="section-title mb-2">
                    {t('events.title')}
                </h1>
                <p className="text-muted mb-0">Browse and search the official campus activity directory.</p>
                {user?.role === 'student' && user?.department_id && (
                    <div className="mt-2">
                        <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2 small fw-bold">
                            <i className="bi bi-funnel me-1"></i>
                            Showing events for your department
                        </span>
                    </div>
                )}
            </header>

            {/* Search and Filters Portal */}
            <div className="portal-card p-4 mb-5 bg-light border-primary border-opacity-10 shadow-sm">
                <div className="row g-4 align-items-center">
                    <div className="col-lg-6">
                        <label className="small fw-bold text-uppercase text-primary mb-2 d-block">Search Records</label>
                        <div className="input-group">
                            <span className="input-group-text bg-white border-end-0">
                                <i className="bi bi-search text-muted"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0 py-2"
                                placeholder={t('events.searchPlaceholder')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <label className="small fw-bold text-uppercase text-primary mb-2 d-block">Filter Category</label>
                        <div className="d-flex flex-wrap gap-2">
                            <button
                                className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold transition-all ${!selectedCategory ? 'btn-primary' : 'btn-outline-primary border-opacity-25'}`}
                                onClick={() => setSelectedCategory('')}
                            >
                                {t('common.all')}
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    className={`btn btn-sm rounded-pill px-3 py-1 fw-semibold transition-all ${selectedCategory === cat.id ? 'btn-primary' : 'btn-outline-primary border-opacity-25'}`}
                                    onClick={() => setSelectedCategory(cat.id)}
                                >
                                    {getCategoryName(cat)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">{t('common.loading')}</span>
                    </div>
                </div>
            ) : (
                <>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="fw-bold text-main mb-0">
                            Results ({filteredEvents.length})
                        </h5>
                    </div>
                    
                    {filteredEvents.length === 0 ? (
                        <div className="portal-card p-5 text-center bg-white border-dashed">
                            <i className="bi bi-search display-3 text-muted mb-4"></i>
                            <p className="lead text-muted">{t('events.noEvents')}</p>
                            <button className="btn btn-outline-primary mt-2" onClick={() => {setSearch(''); setSelectedCategory('');}}>
                                Reset Filtering
                            </button>
                        </div>
                    ) : (
                        <div className="row g-4">
                            {filteredEvents.map((event) => (
                                <div key={event.id} className="col-md-6 col-lg-4">
                                    <EventCard event={event} />
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Events;
