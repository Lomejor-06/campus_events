import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Department {
    id: number;
    name: string;
    faculty: string;
}

const Register: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { register } = useAuth();

    const [departments, setDepartments] = useState<Department[]>([]);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirm_password: '',
        full_name: '',
        phone: '',
        matric_number: '',
        department_id: 0,
        preferred_language: i18n.language,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await api.get<Department[]>('/departments');
                setDepartments(response.data);
            } catch (err) {
                console.error('Failed to fetch departments:', err);
            }
        };
        fetchDepartments();
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === 'department_id' ? parseInt(value) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirm_password) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await register({
                email: formData.email,
                password: formData.password,
                full_name: formData.full_name,
                phone: formData.phone || undefined,
                matric_number: formData.matric_number || undefined,
                department_id: formData.department_id || undefined,
                preferred_language: formData.preferred_language,
            });
            navigate('/login');
        } catch (err: any) {
            setError(err.response?.data?.message || t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'ha', name: 'Hausa' },
        { code: 'yo', name: 'Yorùbá' },
        { code: 'ig', name: 'Igbo' },
    ];

    return (
        <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6">
                <div className="card shadow-sm">
                    <div className="card-body p-4">
                        <h2 className="text-center mb-4">
                            <i className="bi bi-person-plus me-2 text-primary"></i>
                            {t('auth.register.title')}
                        </h2>

                        {error && (
                            <div className="alert alert-danger">
                                <i className="bi bi-exclamation-triangle me-2"></i>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="full_name" className="form-label">
                                        {t('auth.register.fullName')} *
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="full_name"
                                        name="full_name"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label htmlFor="email" className="form-label">
                                        {t('auth.register.email')} *
                                    </label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="phone" className="form-label">
                                        {t('auth.register.phone')}
                                    </label>
                                    <input
                                        type="tel"
                                        className="form-control"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label htmlFor="matric_number" className="form-label">
                                        {t('auth.register.matricNumber')}
                                    </label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        id="matric_number"
                                        name="matric_number"
                                        value={formData.matric_number}
                                        onChange={handleChange}
                                        placeholder="e.g., 25010101010"
                                    />
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="department_id" className="form-label">
                                        {t('auth.register.department')}
                                    </label>
                                    <select
                                        className="form-select"
                                        id="department_id"
                                        name="department_id"
                                        value={formData.department_id}
                                        onChange={handleChange}
                                    >
                                        <option value={0}>{t('auth.register.selectDepartment')}</option>
                                        {departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name} ({dept.faculty})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label htmlFor="preferred_language" className="form-label">
                                        {t('auth.register.preferredLanguage')}
                                    </label>
                                    <select
                                        className="form-select"
                                        id="preferred_language"
                                        name="preferred_language"
                                        value={formData.preferred_language}
                                        onChange={handleChange}
                                    >
                                        {languages.map((lang) => (
                                            <option key={lang.code} value={lang.code}>
                                                {lang.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="password" className="form-label">
                                        {t('auth.register.password')} *
                                    </label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
                                    />
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label htmlFor="confirm_password" className="form-label">
                                        {t('auth.register.confirmPassword')} *
                                    </label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="confirm_password"
                                        name="confirm_password"
                                        value={formData.confirm_password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-100 btn-lg"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        {t('common.loading')}
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-person-plus me-2"></i>
                                        {t('auth.register.submit')}
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="text-center mt-4">
                            <p className="mb-0">
                                {t('auth.register.hasAccount')}{' '}
                                <Link to="/login">{t('auth.register.login')}</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
