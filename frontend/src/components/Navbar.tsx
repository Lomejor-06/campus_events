import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { languages, changeLanguage } from '../i18n';

const Navbar: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user, isAuthenticated, logout, isAdmin, isStaff } = useAuth();
    const { unreadCount } = useNotifications();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const handleLanguageChange = (lang: string) => {
        changeLanguage(lang);
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <nav className="navbar navbar-expand-lg navbar-dark fixed-top shadow-sm" style={{ backgroundColor: '#800020' }}>
            <div className="container">
                <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
                    <img
                        src="/images/laspo.jpg"
                        alt="LASPO Logo"
                        height="40"
                        className="me-2 rounded"
                    />
                    <span className="d-none d-sm-inline">{t('app.title')}</span>
                </Link>

                <button
                    className="navbar-toggler border-0"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto">
                        <li className="nav-item">
                            <Link className={`nav-link ${isActive('/') ? 'active' : ''}`} to="/">
                                <i className="bi bi-house-door me-1"></i>
                                {t('nav.home')}
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link ${isActive('/events') ? 'active' : ''}`} to="/events">
                                <i className="bi bi-grid me-1"></i>
                                {t('nav.events')}
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link className={`nav-link ${isActive('/calendar') ? 'active' : ''}`} to="/calendar">
                                <i className="bi bi-calendar3 me-1"></i>
                                {t('nav.calendar')}
                            </Link>
                        </li>
                    </ul>

                    <ul className="navbar-nav">
                        {/* Language Switcher */}
                        <li className="nav-item dropdown">
                            <a
                                className="nav-link dropdown-toggle"
                                href="#"
                                data-bs-toggle="dropdown"
                            >
                                <i className="bi bi-translate me-1"></i>
                                {languages[i18n.language as keyof typeof languages] || 'English'}
                            </a>
                            <ul className="dropdown-menu dropdown-menu-end">
                                {Object.entries(languages).map(([code, name]) => (
                                    <li key={code}>
                                        <button
                                            className={`dropdown-item ${i18n.language === code ? 'active' : ''}`}
                                            onClick={() => handleLanguageChange(code)}
                                        >
                                            {name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </li>

                        {isAuthenticated ? (
                            <>
                                {/* Notifications */}
                                <li className="nav-item me-2">
                                    <Link className={`nav-link position-relative ${isActive('/notifications') ? 'active' : ''}`} to="/notifications">
                                        <i className="bi bi-bell fs-5"></i>
                                        {unreadCount > 0 && (
                                            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem', marginTop: '10px' }}>
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                                <span className="visually-hidden">unread messages</span>
                                            </span>
                                        )}
                                    </Link>
                                </li>

                                <li className="nav-item dropdown">
                                    <a
                                        className="nav-link dropdown-toggle"
                                        href="#"
                                        data-bs-toggle="dropdown"
                                    >
                                        <i className="bi bi-person-circle me-1"></i>
                                        {user?.full_name.split(' ')[0]}
                                    </a>
                                    <ul className="dropdown-menu dropdown-menu-end">
                                        <li>
                                            <Link className="dropdown-item" to="/profile">
                                                <i className="bi bi-person me-2"></i>
                                                {t('nav.profile')}
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className="dropdown-item" to="/saved-events">
                                                <i className="bi bi-bookmark-heart me-2"></i>
                                                {t('nav.savedEvents')}
                                            </Link>
                                        </li>
                                        {isStaff() && (
                                            <>
                                                <li>
                                                    <Link className="dropdown-item" to="/my-events">
                                                        <i className="bi bi-calendar-plus me-2"></i>
                                                        {t('nav.myEvents')}
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link className="dropdown-item" to="/events/create">
                                                        <i className="bi bi-plus-circle me-2"></i>
                                                        {t('nav.createEvent')}
                                                    </Link>
                                                </li>
                                            </>
                                        )}
                                        {isAdmin() && (
                                            <>
                                                <li><hr className="dropdown-divider" /></li>
                                                <li>
                                                    <Link className="dropdown-item text-primary" to="/admin">
                                                        <i className="bi bi-speedometer2 me-2"></i>
                                                        {t('nav.adminDashboard')}
                                                    </Link>
                                                </li>
                                            </>
                                        )}
                                        <li><hr className="dropdown-divider" /></li>
                                        <li>
                                            <button className="dropdown-item text-danger" onClick={handleLogout}>
                                                <i className="bi bi-box-arrow-right me-2"></i>
                                                {t('nav.logout')}
                                            </button>
                                        </li>
                                    </ul>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item">
                                    <Link className="nav-link" to="/login">
                                        <i className="bi bi-box-arrow-in-right me-1"></i>
                                        {t('nav.login')}
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="btn btn-light btn-sm ms-2" to="/register">
                                        {t('nav.register')}
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
