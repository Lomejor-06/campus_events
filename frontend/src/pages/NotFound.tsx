import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFound: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="text-center py-5">
            <div className="mb-4">
                <i className="bi bi-exclamation-triangle text-warning" style={{ fontSize: '6rem' }}></i>
            </div>
            <h1 className="display-4 mb-3">404</h1>
            <h2 className="mb-4">{t('errors.notFound')}</h2>
            <p className="text-muted mb-4">{t('errors.notFoundMessage')}</p>
            <Link to="/" className="btn btn-primary btn-lg">
                <i className="bi bi-house-door me-2"></i>
                {t('errors.goHome')}
            </Link>
        </div>
    );
};

export default NotFound;
