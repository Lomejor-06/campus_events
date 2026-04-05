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
        closeMenu();
        navigate('/');
    };

    const handleLanguageChange = (lang: string) => {
        changeLanguage(lang);
        closeMenu();
    };

    const isActive = (path: string) => location.pathname === path;

    const closeMenu = () => {
        const navbar = document.getElementById('navbarNav');
        if (navbar?.classList.contains('show')) {
            const toggler = document.querySelector('.navbar-toggler') as HTMLElement;
            toggler?.click();
        }
    };

    return (
        <nav className="navbar navbar-expand-lg sticky-top animate-portal">
            <div className="container">
                <Link className="navbar-brand d-flex align-items-center" to="/">
                    <img
                        src="/images/laspo.jpg"
                        alt="LASPO Logo"
                        height="42"
                        className="me-2 rounded shadow-sm border border-light"
                    />
                    <div className="d-flex flex-column lh-1">
                        <span className="fw-800 text-primary fs-5">{t('app.title')}</span>
                        <small className="text-muted fw-semibold" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                            LASUSTECH PORTAL
                        </small>
                    </div>
                </Link>

                <button
                    className="navbar-toggler border-0 p-0"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                >
                    <i className="bi bi-list fs-1 text-primary"></i>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav mx-auto">
                        <li className="nav-item px-1">
                            <Link className={`nav-link ${isActive('/') ? 'active' : ''}`} to="/" onClick={closeMenu}>
                                {t('nav.home')}
                            </Link>
                        </li>
                        <li className="nav-item px-1">
                            <Link className={`nav-link ${isActive('/events') ? 'active' : ''}`} to="/events" onClick={closeMenu}>
                                {t('nav.events')}
                            </Link>
                        </li>
                        <li className="nav-item px-1">
                            <Link className={`nav-link ${isActive('/calendar') ? 'active' : ''}`} to="/calendar" onClick={closeMenu}>
                                {t('nav.calendar')}
                            </Link>
                        </li>
                    </ul>

                    <ul className="navbar-nav">
                        {/* Language Selector */}
                        <li className="nav-item dropdown me-2">
                            <button
                                className="nav-link dropdown-toggle border-0 bg-transparent"
                                data-bs-toggle="dropdown"
                            >
                                <i className="bi bi-translate me-1"></i>
                                {languages[i18n.language as keyof typeof languages] || 'English'}
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end border-0 shadow-lg p-2">
                                {Object.entries(languages).map(([code, name]) => (
                                    <li key={code}>
                                        <button
                                            className={`dropdown-item rounded-2 ${i18n.language === code ? 'active' : ''}`}
                                            onClick={() => handleLanguageChange(code)}
                                            data-bs-dismiss="dropdown"
                                        >
                                            {name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </li>

                        {isAuthenticated ? (
                            <div className="d-flex align-items-center gap-2 border-start ps-3 ms-2">
                                {/* Notifications */}
                                <li className="nav-item dropdown">
                                    <Link className="nav-link position-relative p-2" to="/notifications" onClick={closeMenu}>
                                        <i className="bi bi-bell fs-5"></i>
                                        {unreadCount > 0 && (
                                            <span className="position-absolute top-1 start-100 translate-middle badge rounded-pill bg-primary shadow-sm" style={{ fontSize: '0.6rem', border: '1px solid #fff' }}>
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </Link>
                                </li>

                                {/* User Menu */}
                                <li className="nav-item dropdown ms-2">
                                    <button
                                        className="btn btn-outline-primary dropdown-toggle d-flex align-items-center gap-2"
                                        data-bs-toggle="dropdown"
                                    >
                                        <i className="bi bi-person-circle fs-5"></i>
                                        <span className="d-none d-xl-inline">{user?.full_name.split(' ')[0]}</span>
                                    </button>
                                    <ul className="dropdown-menu dropdown-menu-end border-0 shadow-lg p-2 mt-2">
                                        <li className="dropdown-header text-uppercase pb-1 mt-1 small fw-bold text-muted">
                                            {user?.role} Portal
                                        </li>
                                        <li>
                                            <Link className="dropdown-item rounded-2" to="/profile" data-bs-dismiss="dropdown" onClick={closeMenu}>
                                                <i className="bi bi-person me-2"></i>
                                                {t('nav.profile')}
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className="dropdown-item rounded-2" to="/saved-events" data-bs-dismiss="dropdown" onClick={closeMenu}>
                                                <i className="bi bi-bookmark-heart me-2"></i>
                                                {t('nav.savedEvents')}
                                            </Link>
                                        </li>
                                        
                                        {(isStaff() || isAdmin()) && (
                                            <>
                                                <li><hr className="dropdown-divider opacity-50" /></li>
                                                <li>
                                                    <Link className="dropdown-item rounded-2" to="/my-events" data-bs-dismiss="dropdown" onClick={closeMenu}>
                                                        <i className="bi bi-calendar-plus me-2"></i>
                                                        {t('nav.myEvents')}
                                                    </Link>
                                                </li>
                                                <li>
                                                    <Link className="dropdown-item rounded-2" to="/events/create" data-bs-dismiss="dropdown" onClick={closeMenu}>
                                                        <i className="bi bi-plus-circle me-2"></i>
                                                        {t('nav.createEvent')}
                                                    </Link>
                                                </li>
                                            </>
                                        )}
                                        

                                        
                                        <li><hr className="dropdown-divider opacity-50" /></li>
                                        <li>
                                            <button className="dropdown-item rounded-2 text-muted fw-bold" onClick={handleLogout}>
                                                <i className="bi bi-box-arrow-right me-2 text-primary"></i>
                                                {t('nav.logout')}
                                            </button>
                                        </li>
                                    </ul>
                                </li>
                            </div>
                        ) : (
                            <div className="d-flex align-items-center gap-2 ms-3">
                                <li className="nav-item">
                                    <Link className="nav-link fw-semibold" to="/login" onClick={closeMenu}>
                                        {t('nav.login')}
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <Link className="btn btn-primary px-4" to="/register" onClick={closeMenu}>
                                        {t('nav.register')}
                                    </Link>
                                </li>
                            </div>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
