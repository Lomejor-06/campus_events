import React from 'react';
import { useTranslation } from 'react-i18next';

const About: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div>
            <h1 className="mb-4">
                <i className="bi bi-info-circle me-2 text-primary"></i>
                {t('about.title')}
            </h1>

            <div className="row">
                <div className="col-lg-8">
                    <div className="card shadow-sm mb-4">
                        <div className="card-body">
                            <h4 className="card-title mb-3">Multilingual Campus Event Management System</h4>
                            <p className="lead">
                                A comprehensive web-based platform for managing campus events at Lasustech
                                with full multilingual support.
                            </p>

                            <h5 className="mt-4 mb-3">Key Features</h5>
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item">
                                    <i className="bi bi-translate text-primary me-2"></i>
                                    <strong>Multilingual Support</strong> - Available in English, Hausa, Yorùbá, and Igbo
                                </li>
                                <li className="list-group-item">
                                    <i className="bi bi-people text-primary me-2"></i>
                                    <strong>Role-Based Access</strong> - Student, Staff, and Admin roles
                                </li>
                                <li className="list-group-item">
                                    <i className="bi bi-calendar-event text-primary me-2"></i>
                                    <strong>Event Management</strong> - Create, edit, publish, and manage campus events
                                </li>
                                <li className="list-group-item">
                                    <i className="bi bi-ticket-perforated text-primary me-2"></i>
                                    <strong>Registration System</strong> - Easy event registration with capacity management
                                </li>
                                <li className="list-group-item">
                                    <i className="bi bi-bookmark-heart text-primary me-2"></i>
                                    <strong>Save Events</strong> - Bookmark events for later reference
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="col-lg-4">
                    <div className="card shadow-sm bg-primary text-white">
                        <div className="card-body text-center">
                            <img
                                src="/images/laspo.jpg"
                                alt="LASPO Logo"
                                className="rounded-circle mb-3"
                                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                            />
                            <h5>Campus Events</h5>
                            <p className="mb-0">LASUSTECH</p>
                        </div>
                    </div>

                    <div className="card shadow-sm mt-4">
                        <div className="card-header bg-secondary text-white">
                            <h6 className="mb-0">Project Information</h6>
                        </div>
                        <div className="card-body">
                            <p className="mb-2">
                                <strong>Developer:</strong><br />
                                [Department/Institutional Group]
                            </p>
                            <p className="mb-2">
                                <strong>Type:</strong><br />
                                Institutional Portal
                            </p>
                            <p className="mb-0">
                                <strong>Year:</strong><br />
                                {new Date().getFullYear()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
