import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import eventService, { type Event, type Category } from '../services/eventService';
import EventCard from '../components/EventCard';

const Events: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    const [events, setEvents] = useState<Event[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);

    const currentPage = parseInt(searchParams.get('page') || '1');
    const categoryFilter = searchParams.get('category') || '';
    const searchQuery = searchParams.get('q') || '';
    const [searchInput, setSearchInput] = useState(searchQuery);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await eventService.getCategories();
                setCategories(data);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const response = await eventService.getEvents({
                    page: currentPage,
                    per_page: 12,
                    category: categoryFilter ? parseInt(categoryFilter) : undefined,
                    q: searchQuery || undefined,
                });
                setEvents(response.items);
                setTotalPages(response.pages);
            } catch (error) {
                console.error('Failed to fetch events:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, [currentPage, categoryFilter, searchQuery]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (searchInput) {
            params.set('q', searchInput);
        } else {
            params.delete('q');
        }
        params.set('page', '1');
        setSearchParams(params);
    };

    const handleCategoryChange = (categoryId: string) => {
        const params = new URLSearchParams(searchParams);
        if (categoryId) {
            params.set('category', categoryId);
        } else {
            params.delete('category');
        }
        params.set('page', '1');
        setSearchParams(params);
    };

    const handlePageChange = (page: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', String(page));
        setSearchParams(params);
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

    return (
        <div>
            <h1 className="mb-4">
                <i className="bi bi-grid me-2 text-primary"></i>
                {t('events.title')}
            </h1>

            {/* Filters */}
            <div className="row g-3 mb-4">
                <div className="col-md-6">
                    <form onSubmit={handleSearch}>
                        <div className="input-group">
                            <input
                                type="text"
                                className="form-control"
                                placeholder={t('events.search')}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                            />
                            <button className="btn btn-primary" type="submit">
                                <i className="bi bi-search"></i>
                            </button>
                        </div>
                    </form>
                </div>
                <div className="col-md-6">
                    <select
                        className="form-select"
                        value={categoryFilter}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                    >
                        <option value="">{t('events.allCategories')}</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {getCategoryName(cat)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Events Grid */}
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
                <>
                    <div className="row g-4">
                        {events.map((event) => (
                            <div key={event.id} className="col-md-6 col-lg-4">
                                <EventCard event={event} />
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <nav className="mt-4">
                            <ul className="pagination justify-content-center">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                    >
                                        &laquo;
                                    </button>
                                </li>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <li
                                        key={page}
                                        className={`page-item ${page === currentPage ? 'active' : ''}`}
                                    >
                                        <button
                                            className="page-link"
                                            onClick={() => handlePageChange(page)}
                                        >
                                            {page}
                                        </button>
                                    </li>
                                ))}
                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        &raquo;
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </>
            )}
        </div>
    );
};

export default Events;
