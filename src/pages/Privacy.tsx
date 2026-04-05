import React from 'react';
import { useTranslation } from 'react-i18next';

const Privacy: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="container py-5">
            <h1 className="mb-4">{t('privacy.title', 'Privacy Policy')}</h1>
            <div className="card shadow-sm">
                <div className="card-body">
                    <h5>1. Information We Collect</h5>
                    <p>We collect information you provide directly to us, such as when you create or modify your account, register for an event, or communicate with us.</p>

                    <h5>2. How We Use Information</h5>
                    <p>We use the information we collect to operate, maintain, and provide to you the features and functionality of the Service.</p>

                    <h5>3. Security</h5>
                    <p>We implement a variety of security measures to maintain the safety of your personal information when you enter, submit, or access your personal information.</p>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
