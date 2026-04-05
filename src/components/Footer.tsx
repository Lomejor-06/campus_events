import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer: React.FC = () => {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="portal-footer mt-auto py-5 text-white" style={{ backgroundColor: 'var(--primary)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="container">
                <div className="row g-4">
                    <div className="col-lg-5">
                        <div className="d-flex align-items-center mb-4">
                            <img
                                src="/images/laspo.jpg"
                                alt="LASPO Logo"
                                height="48"
                                className="me-3 rounded shadow-sm border border-light border-opacity-25"
                            />
                            <div>
                                <h5 className="fw-800 mb-0 text-white">{t('app.title')}</h5>
                                <small className="text-white-50 fw-bold" style={{ fontSize: '0.7rem', letterSpacing: '0.1em' }}>LASUSTECH OFFICIAL PORTAL</small>
                            </div>
                        </div>
                        <p className="text-white-50 pe-lg-5" style={{ fontSize: '0.9rem', lineHeight: '1.7' }}>
                            {t('app.description')} The official digital repository for student activities, 
                            administrative academic events, and professional seminars at Lagos State University of Science and Technology.
                        </p>
                    </div>
                    
                    <div className="col-md-4 col-lg-3">
                        <h6 className="fw-800 text-uppercase mb-4" style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>{t('footer.quickLinks')}</h6>
                        <ul className="list-unstyled d-grid gap-2">
                            <li>
                                <RouterLink to="/events" className="text-white-50 text-decoration-none hover-white transition-all">
                                    <i className="bi bi-chevron-right me-2 small"></i>
                                    {t('footer.browseEvents')}
                                </RouterLink>
                            </li>
                            <li>
                                <RouterLink to="/calendar" className="text-white-50 text-decoration-none hover-white transition-all">
                                    <i className="bi bi-chevron-right me-2 small"></i>
                                    {t('nav.calendar')}
                                </RouterLink>
                            </li>
                            <li>
                                <RouterLink to="/terms" className="text-white-50 text-decoration-none hover-white transition-all">
                                    <i className="bi bi-chevron-right me-2 small"></i>
                                    Institutional Terms
                                </RouterLink>
                            </li>
                            <li>
                                <RouterLink to="/privacy" className="text-white-50 text-decoration-none hover-white transition-all">
                                    <i className="bi bi-chevron-right me-2 small"></i>
                                    Privacy Policy
                                </RouterLink>
                            </li>
                        </ul>
                    </div>
                    
                    <div className="col-md-8 col-lg-4">
                        <h6 className="fw-800 text-uppercase mb-4" style={{ fontSize: '0.75rem', letterSpacing: '0.1em' }}>{t('footer.contact')}</h6>
                        <div className="portal-card p-3 bg-white bg-opacity-10 border-0 shadow-none">
                            <ul className="list-unstyled mb-0">
                                <li className="mb-3 d-flex align-items-center">
                                    <div className="bg-white bg-opacity-10 p-2 rounded-3 me-3">
                                        <i className="bi bi-envelope-fill"></i>
                                    </div>
                                    <span className="text-white-50">events@lasustech.edu.ng</span>
                                </li>
                                <li className="d-flex align-items-center">
                                    <div className="bg-white bg-opacity-10 p-2 rounded-3 me-3">
                                        <i className="bi bi-telephone-fill"></i>
                                    </div>
                                    <span className="text-white-50">+234 (0) 800-LASUSTECH</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <hr className="my-5 bg-white opacity-10" />
                
                <div className="text-center text-white-50">
                    <p className="small mb-0">
                        &copy; {currentYear} Lagos State University of Science and Technology. All Rights Reserved.
                    </p>
                </div>
            </div>
            
            <style>{`
                .hover-white:hover { color: #fff !important; transform: translateX(5px); }
            `}</style>
        </footer>
    );
};

export default Footer;
