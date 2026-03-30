import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import api from '../services/api';
import { changeLanguage } from '../i18n';

interface Registration {
    id: number;
    event: {
        id: number;
        title: string;
        start_date: string;
        venue: string;
    };
    registered_at: string;
}

interface Department {
    id: number;
    name: string;
    faculty: string;
}

const Profile: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user, updateUser } = useAuth();

    const [departments, setDepartments] = useState<Department[]>([]);
    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        phone: user?.phone || '',
        matric_number: user?.matric_number || '',
        staff_id: user?.staff_id || '',
        department_id: user?.department_id || 0,
        preferred_language: user?.preferred_language || 'en',
    });
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const loadData = async () => {
            try {
                const [regsRes, deptsRes] = await Promise.all([
                    api.get<Registration[]>('/auth/registrations'),
                    api.get<Department[]>('/departments')
                ]);
                setRegistrations(regsRes.data);
                setDepartments(deptsRes.data);
            } catch (err) {
                console.error('Failed to fetch data:', err);
            }
        };
        loadData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'department_id' ? parseInt(value) : value
        }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({ ...prev, [name]: value }));
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const updatedUser = await authService.updateProfile({
                full_name: formData.full_name,
                phone: formData.phone,
                matric_number: formData.matric_number,
                staff_id: formData.staff_id,
                department_id: formData.department_id,
                preferred_language: formData.preferred_language,
            });
            updateUser(updatedUser);
            changeLanguage(formData.preferred_language);
            setMessage({ type: 'success', text: t('messages.profileUpdated') });
        } catch (err) {
            setMessage({ type: 'danger', text: t('common.error') });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            setMessage({ type: 'danger', text: 'Passwords do not match' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await authService.changePassword(
                passwordData.current_password,
                passwordData.new_password
            );
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            setMessage({ type: 'success', text: t('messages.passwordChanged') });
        } catch (err) {
            setMessage({ type: 'danger', text: t('common.error') });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString(i18n.language === 'en' ? 'en-NG' : 'en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'ha', name: 'Hausa' },
        { code: 'yo', name: 'Yorùbá' },
        { code: 'ig', name: 'Igbo' },
    ];

    return (
        <div>
            <h1 className="mb-4">
                <i className="bi bi-person-circle me-2 text-primary"></i>
                {t('auth.profile.title')}
            </h1>

            {message.text && (
                <div className={`alert alert-${message.type}`}>
                    <i className={`bi bi-${message.type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
                    {message.text}
                </div>
            )}

            <div className="row">
                <div className="col-lg-8">
                    {/* Profile Form */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">
                                <i className="bi bi-person-gear me-2"></i>
                                {t('auth.profile.update')}
                            </h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleProfileSubmit}>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">{t('auth.register.fullName')}</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="full_name"
                                            value={formData.full_name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">{t('auth.register.phone')}</label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">
                                            {(user?.role === 'staff' || user?.role === 'admin') ? t('auth.profile.staffId') : t('auth.register.matricNumber')}
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name={(user?.role === 'staff' || user?.role === 'admin') ? 'staff_id' : 'matric_number'}
                                            value={(user?.role === 'staff' || user?.role === 'admin') ? formData.staff_id : formData.matric_number}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">{t('auth.register.department')}</label>
                                        <select
                                            className="form-select"
                                            name="department_id"
                                            value={formData.department_id}
                                            onChange={handleChange}
                                        >
                                            <option value={0}>{t('auth.register.selectDepartment')}</option>
                                            {departments.map((dept) => (
                                                <option key={dept.id} value={dept.id}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">{t('auth.register.preferredLanguage')}</label>
                                        <select
                                            className="form-select"
                                            name="preferred_language"
                                            value={formData.preferred_language}
                                            onChange={handleChange}
                                        >
                                            {languages.map((lang) => (
                                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading && <span className="spinner-border spinner-border-sm me-2"></span>}
                                    <i className="bi bi-check-lg me-2"></i>
                                    {t('common.save')}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Change Password */}
                    <div className="card shadow-sm">
                        <div className="card-header bg-secondary text-white">
                            <h5 className="mb-0">
                                <i className="bi bi-key me-2"></i>
                                {t('auth.profile.changePassword')}
                            </h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handlePasswordSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">{t('auth.profile.currentPassword')}</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        name="current_password"
                                        value={passwordData.current_password}
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">{t('auth.profile.newPassword')}</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            name="new_password"
                                            value={passwordData.new_password}
                                            onChange={handlePasswordChange}
                                            required
                                            minLength={6}
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">{t('auth.profile.confirmNewPassword')}</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            name="confirm_password"
                                            value={passwordData.confirm_password}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-secondary" disabled={loading}>
                                    {loading && <span className="spinner-border spinner-border-sm me-2"></span>}
                                    <i className="bi bi-key me-2"></i>
                                    {t('auth.profile.changePassword')}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Registrations Sidebar */}
                <div className="col-lg-4">
                    <div className="card shadow-sm">
                        <div className="card-header bg-success text-white">
                            <h5 className="mb-0">
                                <i className="bi bi-calendar-check me-2"></i>
                                {t('auth.profile.upcomingRegistrations')}
                            </h5>
                        </div>
                        <div className="card-body">
                            {registrations.length === 0 ? (
                                <p className="text-muted mb-0">{t('events.noEvents')}</p>
                            ) : (
                                <ul className="list-group list-group-flush">
                                    {registrations.map((reg) => (
                                        <li key={reg.id} className="list-group-item px-0">
                                            <a href={`/events/${reg.event.id}`} className="text-decoration-none">
                                                <strong>{reg.event.title}</strong>
                                            </a>
                                            <br />
                                            <small className="text-muted">
                                                <i className="bi bi-calendar me-1"></i>
                                                {formatDate(reg.event.start_date)}
                                            </small>
                                            <br />
                                            <small className="text-muted">
                                                <i className="bi bi-geo-alt me-1"></i>
                                                {reg.event.venue}
                                            </small>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
