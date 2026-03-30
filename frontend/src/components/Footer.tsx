import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer mt-auto py-4 text-white" style={{ backgroundColor: '#5c0017' }}>
            <div className="container">
                <div className="row">
                    <div className="col-md-6">
                        <div className="d-flex align-items-center mb-2">
                            <img
                                src="/images/laspo.jpg"
                                alt="LASPO Logo"
                                height="40"
                                className="me-2 rounded"
                            />
                            <h5 className="mb-0">{t('app.title')}</h5>
                        </div>
                        <p className="text-white-50">{t('app.description')}</p>
                    </div>
                    <div className="col-md-3">
                        <h6>{t('footer.quickLinks')}</h6>
                        <ul className="list-unstyled">
                            <li>
                                <Link to="/events" className="text-white-50">
                                    {t('footer.browseEvents')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/calendar" className="text-white-50">
                                    {t('nav.calendar')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-white-50">
                                    {t('about.title')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms" className="text-white-50">
                                    {t('footer.terms', 'Terms of Service')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="text-white-50">
                                    {t('footer.privacy', 'Privacy Policy')}
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div className="col-md-3">
                        <h6>{t('footer.contact')}</h6>
                        <ul className="list-unstyled text-white-50">
                            <li>
                                <i className="bi bi-envelope me-2"></i>
                                events@lasustech.edu.ng
                            </li>
                            <li>
                                <i className="bi bi-telephone me-2"></i>
                                +234 800 0000 000
                            </li>
                        </ul>
                    </div>
                </div>
                <hr className="my-3 bg-secondary" />
                <div className="text-center text-white-50">
                    <small>
                        &copy; {currentYear} {t('app.title')}. {t('footer.rights')}
                    </small>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
