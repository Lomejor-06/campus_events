import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();

    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember_me: false,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(formData);
            // Check if the logged-in user is an admin and redirect accordingly
            const cached = localStorage.getItem('user');
            const loggedInUser = cached ? JSON.parse(cached) : null;
            if (loggedInUser?.role === 'admin') {
                navigate('/admin', { replace: true });
            } else {
                navigate(from, { replace: true });
            }
        } catch (err: any) {
            console.error('Login error:', err);
            let message = t('common.error');
            
            const errMsg = err?.message?.toLowerCase() || '';
            
            if (errMsg.includes('invalid login credentials') || errMsg.includes('invalid-credential')) {
                message = 'Invalid email or password. Please check your credentials and try again.';
            } else if (errMsg.includes('user not found') || errMsg.includes('user-not-found')) {
                message = 'No account found with this email. Please register first.';
            } else if (errMsg.includes('email not confirmed')) {
                message = 'Please confirm your email address before logging in.';
            } else if (errMsg.includes('too many requests') || errMsg.includes('rate limit')) {
                message = 'Too many login attempts. Please wait a moment and try again.';
            } else if (err.message === 'User data not found') {
                message = 'Your account profile was not found. Please contact an administrator.';
            } else if (err.message) {
                message = err.message;
            }
            
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-portal row justify-content-center py-5">
            <div className="col-md-6 col-xl-4">
                <div className="portal-card p-4 p-md-5">
                    <div className="text-center mb-5">
                        <h2 className="fw-800 text-primary mb-2">
                            {t('auth.login.title')}
                        </h2>
                        <p className="text-muted small fw-bold text-uppercase">LASUSTECH PORTAL ACCESS</p>
                    </div>

                    {error && (
                        <div className="alert alert-danger glass-card border-danger border-opacity-25 mb-4">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="email" className="form-label fw-bold small text-uppercase text-muted">
                                {t('auth.login.email')}
                            </label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-0 ps-3">
                                    <i className="bi bi-person text-muted"></i>
                                </span>
                                <input
                                    type="email"
                                    className="form-control form-control-lg bg-light border-0 py-3 rounded-end-4"
                                    id="email"
                                    name="email"
                                    placeholder="yourname@university.edu"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="password" className="form-label fw-bold small text-uppercase text-muted">
                                {t('auth.login.password')}
                            </label>
                            <div className="input-group">
                                <span className="input-group-text bg-light border-0 ps-3">
                                    <i className="bi bi-lock text-muted"></i>
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-control form-control-lg bg-light border-0 py-3"
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <button
                                    className="btn btn-light border-0 px-3"
                                    type="button"
                                    onClick={togglePasswordVisibility}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    style={{ borderRadius: '0 1rem 1rem 0' }}
                                >
                                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-muted`}></i>
                                </button>
                            </div>
                        </div>

                        <div className="mb-5 d-flex justify-content-between align-items-center">
                            <div className="form-check">
                                <input
                                    type="checkbox"
                                    className="form-check-input"
                                    id="remember_me"
                                    name="remember_me"
                                    checked={formData.remember_me}
                                    onChange={handleChange}
                                />
                                <label className="form-check-label text-muted" htmlFor="remember_me">
                                    {t('auth.login.rememberMe')}
                                </label>
                            </div>
                            <Link to="/forgot-password" hidden className="text-decoration-none small text-primary fw-semibold">
                                Forgot Password?
                            </Link>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100 py-3 mt-4"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    {t('common.loading')}
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-shield-lock-fill me-2"></i>
                                    AUTHENTICATE
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center mt-5">
                        <p className="text-muted mb-0">
                            {t('auth.login.noAccount')}{' '}
                            <Link to="/register" className="text-primary text-decoration-none fw-bold">
                                {t('auth.login.register')}
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
