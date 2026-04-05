import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import eventService, { type Event } from '../services/eventService';
import { changeLanguage } from '../i18n';
import { getDepartmentsByCollege, getDepartmentById } from '../data/departments';

const Profile: React.FC = () => {
    const { t } = useTranslation();
    const { user, updateUser } = useAuth();

    const [formData, setFormData] = useState({
        full_name: user?.full_name || '',
        phone: user?.phone || '',
        matric_number: user?.matric_number || '',
        staff_id: user?.staff_id || '',
        department_id: user?.department_id?.toString() ?? '',
        preferred_language: user?.preferred_language || 'en',
    });
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });
    const [registrations, setRegistrations] = useState<Event[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const departmentsByCollege = getDepartmentsByCollege();

    useEffect(() => {
        const loadData = async () => {
            if (!user) return;
            try {
                const regs = await eventService.getUserRegistrations(user.id);
                setRegistrations(regs);
            } catch (err) {
                console.error('Failed to fetch data:', err);
            }
        };
        loadData();
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData((prev) => ({ ...prev, [name]: value }));
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const updatedUser = await authService.updateProfile(user.id, {
                full_name: formData.full_name,
                phone: formData.phone,
                matric_number: formData.matric_number,
                staff_id: formData.staff_id,
                department_id: formData.department_id ? Number(formData.department_id) : undefined,
                preferred_language: formData.preferred_language,
            });
            updateUser(updatedUser);
            changeLanguage(formData.preferred_language);
            setMessage({ type: 'success', text: t('messages.profileUpdated') });
        } catch (err) {
            setMessage({ type: 'danger', text: 'Failed to update profile. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.new_password !== passwordData.confirm_password) {
            setMessage({ type: 'danger', text: 'New passwords do not match.' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            await authService.changePassword(
                passwordData.new_password
            );
            setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            setMessage({ type: 'success', text: t('messages.passwordChanged') });
        } catch (err: any) {
            setMessage({ type: 'danger', text: err.message || 'Failed to change password.' });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: any) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-NG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const languagesList = [
        { code: 'en', name: 'English' },
        { code: 'ha', name: 'Hausa' },
        { code: 'yo', name: 'Yorùbá' },
        { code: 'ig', name: 'Igbo' },
    ];

    const currentDept = user?.department_id ? getDepartmentById(user.department_id) : null;

    return (
        <div className="animate-portal container pb-5">
            <header className="mb-5 border-bottom pb-4">
                <h1 className="section-title mb-2">
                    {t('auth.profile.title')}
                </h1>
                <p className="text-muted">Manage your institutional record and event participation.</p>
            </header>

            {message.text && (
                <div className={`alert alert-${message.type} portal-card border-0 border-start border-4 border-${message.type} mb-4 animate-portal`}>
                    <div className="d-flex align-items-center gap-2 fw-bold">
                        <i className={`bi bi-${message.type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'} text-${message.type}`}></i>
                        {message.text}
                    </div>
                </div>
            )}

            <div className="row g-4">
                <div className="col-lg-8">
                    {/* Profile Information */}
                    <div className="portal-card p-4 p-md-5 mb-4">
                        <div className="d-flex align-items-center gap-3 mb-5">
                            <div className="bg-primary bg-opacity-10 p-3 rounded-3 text-primary">
                                <i className="bi bi-person-badge-fill fs-4"></i>
                            </div>
                            <h4 className="fw-bold mb-0">{t('auth.profile.update')}</h4>
                        </div>
                        
                        <form onSubmit={handleProfileSubmit}>
                            <div className="row g-4 mb-4">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold small text-uppercase text-muted">{t('auth.register.fullName')}</label>
                                    <input
                                        type="text"
                                        className="form-control px-4 py-3"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold small text-uppercase text-muted">{t('auth.register.phone')}</label>
                                    <input
                                        type="tel"
                                        className="form-control px-4 py-3"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            
                            <div className="row g-4 mb-4">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold small text-uppercase text-muted">
                                        {(user?.role === 'staff' || user?.role === 'admin') ? t('auth.profile.staffId') : t('auth.register.matricNumber')}
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control bg-light border-0 px-4 py-3 rounded-4"
                                        name={(user?.role === 'staff' || user?.role === 'admin') ? 'staff_id' : 'matric_number'}
                                        value={(user?.role === 'staff' || user?.role === 'admin') ? formData.staff_id : formData.matric_number}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* Department Selector */}
                                <div className="col-md-6">
                                    <label className="form-label fw-bold small text-uppercase text-muted">
                                        {t('auth.register.department')}
                                    </label>
                                    <select
                                        className="form-select bg-light border-0 px-4 py-3 rounded-4"
                                        name="department_id"
                                        value={formData.department_id}
                                        onChange={handleChange}
                                    >
                                        <option value="">{t('auth.register.selectDepartment')}</option>
                                        {Object.entries(departmentsByCollege).map(([college, depts]) => (
                                            <optgroup key={college} label={college}>
                                                {depts.map(dept => (
                                                    <option key={dept.id} value={dept.id}>
                                                        {dept.code} — {dept.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="row g-4 mb-4">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold small text-uppercase text-muted">{t('auth.register.preferredLanguage')}</label>
                                    <select
                                        className="form-select bg-light border-0 px-4 py-3 rounded-4"
                                        name="preferred_language"
                                        value={formData.preferred_language}
                                        onChange={handleChange}
                                    >
                                        {languagesList.map((lang) => (
                                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary px-5 py-3 mt-3" disabled={loading}>
                                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-lg me-2"></i>}
                                {t('common.save')}
                            </button>
                        </form>
                    </div>

                    {/* Security */}
                    <div className="portal-card p-4 p-md-5">
                        <div className="d-flex align-items-center gap-3 mb-5">
                            <div className="bg-danger bg-opacity-10 p-3 rounded-3 text-danger">
                                <i className="bi bi-shield-lock-fill fs-4"></i>
                            </div>
                            <h4 className="fw-bold mb-0">{t('auth.profile.changePassword')}</h4>
                        </div>

                        <form onSubmit={handlePasswordSubmit}>
                            <div className="row g-4 mb-4">
                                <div className="col-md-6">
                                    <label className="form-label fw-bold small text-uppercase text-muted">{t('auth.profile.newPassword')}</label>
                                    <input
                                        type="password"
                                        className="form-control bg-light border-0 px-4 py-3 rounded-4"
                                        name="new_password"
                                        value={passwordData.new_password}
                                        onChange={handlePasswordChange}
                                        required
                                        minLength={6}
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-bold small text-uppercase text-muted">{t('auth.profile.confirmNewPassword')}</label>
                                    <input
                                        type="password"
                                        className="form-control bg-light border-0 px-4 py-3 rounded-4"
                                        name="confirm_password"
                                        value={passwordData.confirm_password}
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-outline-danger px-5 py-3 rounded-4 mt-3" disabled={loading}>
                                {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-key me-2"></i>}
                                {t('auth.profile.changePassword')}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="col-lg-4">
                    {/* Profile Summary Card */}
                    <div className="portal-card p-4 mb-4">
                        <div className="text-center mb-4">
                            <div className="bg-primary bg-opacity-10 d-inline-flex p-4 rounded-circle mb-3">
                                <i className="bi bi-person-circle text-primary display-4"></i>
                            </div>
                            <h5 className="fw-bold mb-1">{user?.full_name}</h5>
                            <span className="badge bg-primary bg-opacity-15 text-primary rounded-pill px-3 py-1 text-uppercase small fw-bold">
                                {user?.role === 'staff' ? 'Lecturer' : user?.role}
                            </span>
                        </div>
                        {currentDept && (
                            <div className="bg-light rounded-3 p-3 mb-3 text-center">
                                <small className="text-muted text-uppercase fw-bold d-block mb-1" style={{ fontSize: '0.65rem' }}>Department</small>
                                <span className="fw-bold text-primary small">{currentDept.code} — {currentDept.name}</span>
                            </div>
                        )}
                        <div className="bg-light rounded-3 p-3 text-center">
                            <small className="text-muted text-uppercase fw-bold d-block mb-1" style={{ fontSize: '0.65rem' }}>Email</small>
                            <span className="small">{user?.email}</span>
                        </div>
                    </div>

                    {/* Upcoming Registrations */}
                    <div className="portal-card p-4 sticky-top" style={{ top: '100px' }}>
                        <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
                            <div className="bg-success bg-opacity-10 p-2 rounded-3 text-success">
                                <i className="bi bi-calendar-check-fill fs-5"></i>
                            </div>
                            <h5 className="fw-bold mb-0 small text-uppercase">{t('auth.profile.upcomingRegistrations')}</h5>
                        </div>

                        {registrations.length === 0 ? (
                            <div className="text-center py-4">
                                <p className="text-muted mb-0">No upcoming registrations</p>
                            </div>
                        ) : (
                            <div className="d-grid gap-3">
                                {registrations.map((event) => (
                                    <div key={event.id} className="p-3 bg-light rounded-4 transition-hover">
                                        <a href={`/events/${event.id}`} className="text-decoration-none d-block mb-1">
                                            <strong className="text-main">{event.title}</strong>
                                        </a>
                                        <div className="d-flex align-items-center text-muted small mb-1">
                                            <i className="bi bi-calendar3 me-2"></i>
                                            {formatDate(event.start_date)}
                                        </div>
                                        <div className="d-flex align-items-center text-muted small">
                                            <i className="bi bi-geo-alt me-2"></i>
                                            <span className="text-truncate">{event.venue}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
