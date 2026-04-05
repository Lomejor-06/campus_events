import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getDepartmentsByCollege } from '../data/departments';

const Register: React.FC = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { register } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [selectedRole, setSelectedRole] = useState<'student' | 'pending_lecturer'>('student');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirm_password: '',
        full_name: '',
        phone: '',
        matric_number: '',
        staff_id: '',
        department_id: '',
        preferred_language: i18n.language,
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const departmentsByCollege = getDepartmentsByCollege();

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (formData.password !== formData.confirm_password) {
            setError('Passwords do not match');
            return;
        }

        if (selectedRole === 'student' && !formData.department_id) {
            setError('Please select your department');
            return;
        }

        setLoading(true);

        try {
            const response = await register({
                email: formData.email,
                password: formData.password,
                full_name: formData.full_name,
                role: selectedRole,
                phone: formData.phone || undefined,
                matric_number: selectedRole === 'student' ? (formData.matric_number || undefined) : undefined,
                staff_id: selectedRole === 'pending_lecturer' ? (formData.staff_id || undefined) : undefined,
                department_id: formData.department_id ? parseInt(formData.department_id) : undefined,
                preferred_language: formData.preferred_language,
            });

            if (selectedRole === 'pending_lecturer') {
                setSuccessMessage(response.message);
            } else {
                navigate('/');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during registration');
        } finally {
            setLoading(false);
        }
    };

    const languagesList = [
        { code: 'en', name: 'English' },
        { code: 'ha', name: 'Hausa' },
        { code: 'yo', name: 'Yorùbá' },
        { code: 'ig', name: 'Igbo' },
    ];

    // Show success screen for pending lecturers
    if (successMessage) {
        return (
            <div className="animate-portal row justify-content-center py-5">
                <div className="col-md-8 col-lg-6">
                    <div className="portal-card p-4 p-md-5 text-center">
                        <div className="bg-warning bg-opacity-10 d-inline-flex p-4 rounded-circle mb-4">
                            <i className="bi bi-hourglass-split text-warning display-4"></i>
                        </div>
                        <h3 className="fw-800 text-primary mb-3">Registration Submitted</h3>
                        <p className="text-muted mb-4 lead" style={{ fontSize: '1rem' }}>
                            {successMessage}
                        </p>
                        <div className="alert alert-info border-0 bg-info bg-opacity-10 rounded-4 p-4 text-start mb-4">
                            <div className="d-flex gap-3 align-items-start">
                                <i className="bi bi-info-circle-fill text-info fs-5 mt-1"></i>
                                <div>
                                    <strong className="d-block mb-1">What happens next?</strong>
                                    <small className="text-muted">
                                        An administrator will review your request and approve your lecturer account. 
                                        You will be able to log in once your account has been approved.
                                    </small>
                                </div>
                            </div>
                        </div>
                        <Link to="/login" className="btn btn-primary px-5 py-3 fw-bold">
                            <i className="bi bi-arrow-left me-2"></i>
                            BACK TO LOGIN
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-portal row justify-content-center py-5">
            <div className="col-md-10 col-lg-8">
                <div className="portal-card p-4 p-md-5">
                    <div className="text-center mb-5">
                        <h2 className="fw-800 text-primary mb-2">
                            {t('auth.register.title')}
                        </h2>
                        <p className="text-muted small fw-bold text-uppercase">LASUSTECH PORTAL REGISTRATION</p>
                    </div>

                    {error && (
                        <div className="alert alert-danger border-0 mb-4 py-3 shadow-sm rounded-3">
                            <i className="bi bi-exclamation-triangle-fill me-2"></i>
                            {error}
                        </div>
                    )}

                    {/* Role Selector */}
                    <div className="mb-5">
                        <label className="form-label fw-bold small text-uppercase text-muted mb-3">
                            I am registering as a *
                        </label>
                        <div className="row g-3">
                            <div className="col-6">
                                <div 
                                    className={`portal-card p-4 text-center cursor-pointer transition-all ${selectedRole === 'student' ? 'border-primary border-2 bg-primary bg-opacity-5 shadow-sm' : 'bg-light border-0'}`}
                                    onClick={() => setSelectedRole('student')}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <i className={`bi bi-mortarboard-fill display-6 d-block mb-2 ${selectedRole === 'student' ? 'text-primary' : 'text-muted'}`}></i>
                                    <h6 className={`fw-800 mb-1 ${selectedRole === 'student' ? 'text-primary' : 'text-muted'}`}>STUDENT</h6>
                                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>Access events & activities</small>
                                    {selectedRole === 'student' && (
                                        <div className="mt-2">
                                            <span className="badge bg-primary rounded-pill px-3"><i className="bi bi-check-lg"></i></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-6">
                                <div 
                                    className={`portal-card p-4 text-center cursor-pointer transition-all ${selectedRole === 'pending_lecturer' ? 'border-primary border-2 bg-primary bg-opacity-5 shadow-sm' : 'bg-light border-0'}`}
                                    onClick={() => setSelectedRole('pending_lecturer')}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <i className={`bi bi-person-workspace display-6 d-block mb-2 ${selectedRole === 'pending_lecturer' ? 'text-primary' : 'text-muted'}`}></i>
                                    <h6 className={`fw-800 mb-1 ${selectedRole === 'pending_lecturer' ? 'text-primary' : 'text-muted'}`}>LECTURER</h6>
                                    <small className="text-muted" style={{ fontSize: '0.7rem' }}>Create & manage events</small>
                                    {selectedRole === 'pending_lecturer' && (
                                        <div className="mt-2">
                                            <span className="badge bg-primary rounded-pill px-3"><i className="bi bi-check-lg"></i></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {selectedRole === 'pending_lecturer' && (
                            <div className="alert alert-warning border-0 bg-warning bg-opacity-10 mt-3 rounded-3 py-2 px-3">
                                <small className="fw-bold">
                                    <i className="bi bi-info-circle me-1"></i>
                                    Lecturer accounts require admin approval before activation.
                                </small>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="row g-4 mb-4">
                            <div className="col-md-6">
                                <label htmlFor="full_name" className="form-label fw-bold small text-uppercase text-muted">
                                    {t('auth.register.fullName')} *
                                </label>
                                <input
                                    type="text"
                                    className="form-control form-control-lg bg-light border-0 py-3 rounded-4"
                                    id="full_name"
                                    name="full_name"
                                    placeholder="John Doe"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label htmlFor="email" className="form-label fw-bold small text-uppercase text-muted">
                                    {t('auth.register.email')} *
                                </label>
                                <input
                                    type="email"
                                    className="form-control form-control-lg bg-light border-0 py-3 rounded-4"
                                    id="email"
                                    name="email"
                                    placeholder="john@university.edu"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="row g-4 mb-4">
                            <div className="col-md-6">
                                <label htmlFor="phone" className="form-label fw-bold small text-uppercase text-muted">
                                    {t('auth.register.phone')}
                                </label>
                                <input
                                    type="tel"
                                    className="form-control form-control-lg bg-light border-0 py-3 rounded-4"
                                    id="phone"
                                    name="phone"
                                    placeholder="+234..."
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="col-md-6">
                                {selectedRole === 'student' ? (
                                    <>
                                        <label htmlFor="matric_number" className="form-label fw-bold small text-uppercase text-muted">
                                            {t('auth.register.matricNumber')}
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-lg bg-light border-0 py-3 rounded-4"
                                            id="matric_number"
                                            name="matric_number"
                                            placeholder="Matric Number"
                                            value={formData.matric_number}
                                            onChange={handleChange}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <label htmlFor="staff_id" className="form-label fw-bold small text-uppercase text-muted">
                                            Staff ID
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-lg bg-light border-0 py-3 rounded-4"
                                            id="staff_id"
                                            name="staff_id"
                                            placeholder="Staff ID Number"
                                            value={formData.staff_id}
                                            onChange={handleChange}
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Department Selector */}
                        <div className="row g-4 mb-4">
                            <div className="col-md-6">
                                <label htmlFor="department_id" className="form-label fw-bold small text-uppercase text-muted">
                                    {t('auth.register.department')} {selectedRole === 'student' ? '*' : ''}
                                </label>
                                <select
                                    className="form-select form-select-lg bg-light border-0 py-3 rounded-4"
                                    id="department_id"
                                    name="department_id"
                                    value={formData.department_id}
                                    onChange={handleChange}
                                    required={selectedRole === 'student'}
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

                            <div className="col-md-6">
                                <label htmlFor="preferred_language" className="form-label fw-bold small text-uppercase text-muted">
                                    {t('auth.register.preferredLanguage')}
                                </label>
                                <select
                                    className="form-select form-select-lg bg-light border-0 py-3 rounded-4"
                                    id="preferred_language"
                                    name="preferred_language"
                                    value={formData.preferred_language}
                                    onChange={handleChange}
                                >
                                    {languagesList.map((lang) => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="row g-4 mb-5">
                            <div className="col-md-6">
                                <label htmlFor="password" className="form-label fw-bold small text-uppercase text-muted">
                                    {t('auth.register.password')} *
                                </label>
                                <div className="input-group">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        className="form-control form-control-lg bg-light border-0 py-3 rounded-start-4"
                                        id="password"
                                        name="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        className="btn btn-light border-0 px-3 rounded-end-4"
                                        type="button"
                                        onClick={togglePasswordVisibility}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-muted`}></i>
                                    </button>
                                </div>
                            </div>

                            <div className="col-md-6">
                                <label htmlFor="confirm_password" className="form-label fw-bold small text-uppercase text-muted">
                                    {t('auth.register.confirmPassword')} *
                                </label>
                                <div className="input-group">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className="form-control form-control-lg bg-light border-0 py-3 rounded-start-4"
                                        id="confirm_password"
                                        name="confirm_password"
                                        placeholder="••••••••"
                                        value={formData.confirm_password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <button
                                        className="btn btn-light border-0 px-3 rounded-end-4"
                                        type="button"
                                        onClick={toggleConfirmPasswordVisibility}
                                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                    >
                                        <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'} text-muted`}></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100 py-3 mt-4"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-person-plus-fill me-2"></i>
                                    {selectedRole === 'pending_lecturer' ? 'SUBMIT FOR APPROVAL' : 'AUTHENTICATE & REGISTER'}
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-5">
                        <p className="text-muted mb-0">
                            {t('auth.register.hasAccount')}{' '}
                            <Link to="/login" className="text-primary text-decoration-none fw-bold">
                                {t('auth.register.login')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
