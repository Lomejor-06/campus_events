import React from 'react';
import { useTranslation } from 'react-i18next';

const Terms: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className="container py-5">
            <h1 className="mb-4">{t('terms.title', 'Terms of Service')}</h1>
            <div className="card shadow-sm">
                <div className="card-body">
                    <h5>1. Acceptance of Terms</h5>
                    <p>By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.</p>

                    <h5>2. Use License</h5>
                    <p>Permission is granted to temporarily download one copy of the materials (information or software) on Campus Events' website for personal, non-commercial transitory viewing only.</p>

                    <h5>3. Disclaimer</h5>
                    <p>The materials on Campus Events' website are provided on an 'as is' basis. Campus Events makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
                </div>
            </div>
        </div>
    );
};

export default Terms;
