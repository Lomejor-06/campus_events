import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import authService, { type User } from '../../services/authService';

const AdminUsers: React.FC = () => {
    const { t } = useTranslation();
    const { isAdmin, isLoading: authLoading } = useAuth();

    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [pendingLecturers, setPendingLecturers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [searchQuery, setSearchQuery] = useState('');

    // Add Admin Modal state
    const [showAddAdmin, setShowAddAdmin] = useState(false);
    const [adminForm, setAdminForm] = useState({ email: '', password: '', full_name: '' });
    const [adminFormLoading, setAdminFormLoading] = useState(false);
    const [adminFormError, setAdminFormError] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const [users, pending] = await Promise.all([
                authService.getAllUsers(),
                authService.getPendingLecturers()
            ]);
            setAllUsers(users.filter(u => u.role !== 'pending_lecturer'));
            setPendingLecturers(pending);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && isAdmin()) {
            fetchUsers();
        }
    }, [authLoading]);

    // Auth guard — must be after all hooks
    if (authLoading) {
        return (
            <div className="text-center py-5 my-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t('common.loading')}</span>
                </div>
            </div>
        );
    }

    if (!isAdmin()) {
        return <Navigate to="/login" replace />;
    }

    const handleApproveLecturer = async (userId: string, userName: string) => {
        setActionLoading(userId);
        try {
            await authService.approveLecturer(userId);
            setMessage({ type: 'success', text: `${userName} has been approved as a Lecturer (Staff).` });
            fetchUsers();
        } catch (err: any) {
            setMessage({ type: 'danger', text: err.message || 'Failed to approve lecturer' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectLecturer = async (userId: string, userName: string) => {
        if (!window.confirm(`Are you sure you want to reject ${userName}'s lecturer application? Their account will be removed.`)) {
            return;
        }
        setActionLoading(userId);
        try {
            await authService.rejectLecturer(userId);
            setMessage({ type: 'success', text: `${userName}'s lecturer application has been rejected.` });
            fetchUsers();
        } catch (err: any) {
            setMessage({ type: 'danger', text: err.message || 'Failed to reject lecturer' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (userId: string, userName: string, isSuperadmin: boolean) => {
        if (isSuperadmin) {
            setMessage({ type: 'danger', text: 'Cannot delete the superadmin account.' });
            return;
        }
        if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
            return;
        }
        setActionLoading(userId);
        try {
            await authService.deleteUser(userId);
            setMessage({ type: 'success', text: `User record for ${userName} deleted successfully` });
            fetchUsers();
        } catch (err: any) {
            setMessage({ type: 'danger', text: err.message || 'Failed to delete user' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleRoleChange = async (userId: string, newRole: 'student' | 'staff' | 'admin', userName: string) => {
        setActionLoading(userId);
        try {
            await authService.updateUserRole(userId, newRole);
            setMessage({ type: 'success', text: `${userName} role changed to ${newRole.toUpperCase()}` });
            fetchUsers();
        } catch (err: any) {
            setMessage({ type: 'danger', text: err.message || 'Failed to update role' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleActive = async (userId: string, currentStatus: boolean) => {
        setActionLoading(userId);
        try {
            await authService.toggleUserStatus(userId, !currentStatus);
            setMessage({ type: 'success', text: `Portal access updated for user` });
            fetchUsers();
        } catch (err: any) {
            setMessage({ type: 'danger', text: err.message || 'Failed to toggle status' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdminFormError('');
        setAdminFormLoading(true);
        try {
            await authService.addAdmin(adminForm.email, adminForm.password, adminForm.full_name);
            setMessage({ type: 'success', text: `Admin account created for ${adminForm.full_name}` });
            setShowAddAdmin(false);
            setAdminForm({ email: '', password: '', full_name: '' });
            fetchUsers();
        } catch (err: any) {
            setAdminFormError(err.message || 'Failed to create admin account');
        } finally {
            setAdminFormLoading(false);
        }
    };

    const filteredUsers = allUsers.filter(u =>
        u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.matric_number && u.matric_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.staff_id && u.staff_id.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const renderPendingTable = () => {
        if (pendingLecturers.length === 0) return null;

        return (
            <div className="portal-card mb-5 bg-white shadow-sm overflow-hidden border-0 border-top border-4 border-warning">
                <div className="p-4 d-flex justify-content-between align-items-center bg-warning bg-opacity-10 border-bottom">
                    <h6 className="fw-800 text-main mb-0 d-flex align-items-center gap-2 text-uppercase small">
                        <i className="bi bi-hourglass-split text-warning"></i>
                        Pending Lecturer Approvals
                    </h6>
                    <span className="badge bg-warning text-dark px-3 fw-bold">{pendingLecturers.length} Pending</span>
                </div>
                <div className="table-responsive">
                    <table className="portal-table table align-middle mb-0">
                        <thead>
                            <tr className="bg-light">
                                <th className="ps-4">Applicant</th>
                                <th>Staff ID</th>
                                <th>Phone</th>
                                <th>Applied</th>
                                <th className="text-end pe-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingLecturers.map((lecturer) => (
                                <tr key={lecturer.id}>
                                    <td className="ps-4 py-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className="bg-warning bg-opacity-10 p-2 rounded-circle text-warning" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <i className="bi bi-person-workspace"></i>
                                            </div>
                                            <div>
                                                <div className="fw-bold text-main">{lecturer.full_name}</div>
                                                <div className="small text-muted">{lecturer.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="p-1 px-2 bg-light text-muted border rounded fw-bold" style={{ fontSize: '0.7rem' }}>
                                            {lecturer.staff_id || '—'}
                                        </span>
                                    </td>
                                    <td className="small text-muted">{lecturer.phone || '—'}</td>
                                    <td className="small text-muted">
                                        {lecturer.created_at ? new Date(lecturer.created_at as any).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="text-end pe-4">
                                        <button
                                            className="btn btn-sm btn-success fw-bold me-2 px-3"
                                            onClick={() => handleApproveLecturer(lecturer.id, lecturer.full_name)}
                                            disabled={actionLoading === lecturer.id}
                                            style={{ fontSize: '0.75rem' }}
                                        >
                                            {actionLoading === lecturer.id ? (
                                                <span className="spinner-border spinner-border-sm"></span>
                                            ) : (
                                                <><i className="bi bi-check-circle-fill me-1"></i> APPROVE</>
                                            )}
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-danger fw-bold px-3"
                                            onClick={() => handleRejectLecturer(lecturer.id, lecturer.full_name)}
                                            disabled={actionLoading === lecturer.id}
                                            style={{ fontSize: '0.75rem' }}
                                        >
                                            <i className="bi bi-x-circle-fill me-1"></i> REJECT
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderUserTable = (users: User[], title: string, countBadge: string) => (
        <div className="portal-card mb-5 bg-white shadow-sm overflow-hidden border-0 border-top border-4 border-primary">
            <div className="p-4 d-flex justify-content-between align-items-center bg-light border-bottom">
                <h6 className="fw-800 text-main mb-0 d-flex align-items-center gap-2 text-uppercase small">
                    <i className="bi bi-person-lines-fill text-primary"></i>
                    {title}
                </h6>
                <span className={`badge-portal ${countBadge} px-3`}>{users.length} Records</span>
            </div>
            <div className="table-responsive">
                <table className="portal-table table align-middle mb-0">
                    <thead>
                        <tr className="bg-light">
                            <th className="ps-4">Identification</th>
                            <th>Portal Role</th>
                            <th>System Status</th>
                            <th className="text-end pe-4">Management Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-5 text-muted small fw-bold">NO RECORDS FOUND IN THIS CATEGORY</td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id}>
                                    <td className="ps-4 py-3">
                                        <div className="d-flex align-items-center gap-3">
                                            <div className={`p-2 rounded-circle ${user.is_superadmin ? 'bg-danger bg-opacity-10 text-danger' : 'bg-primary bg-opacity-10 text-primary'}`} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <i className={`bi ${user.is_superadmin ? 'bi-shield-fill-check' : 'bi-person-fill'}`}></i>
                                            </div>
                                            <div>
                                                <div className="fw-bold text-main">
                                                    {user.full_name}
                                                    {user.is_superadmin && (
                                                        <span className="badge bg-danger ms-2 rounded-pill" style={{ fontSize: '0.6rem' }}>SUPERADMIN</span>
                                                    )}
                                                </div>
                                                <div className="small text-muted">{user.email}</div>
                                                <div className="mt-1 d-flex gap-2">
                                                    {user.matric_number && <span className="p-1 px-2 bg-light text-primary border rounded x-small fw-bold" style={{ fontSize: '0.65rem' }}>STUDENT: {user.matric_number}</span>}
                                                    {user.staff_id && <span className="p-1 px-2 bg-light text-primary border rounded x-small fw-bold" style={{ fontSize: '0.65rem' }}>STAFF: {user.staff_id}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge-portal px-3 py-2 ${
                                            user.role === 'admin' ? 'bg-danger text-white' :
                                            user.role === 'staff' ? 'bg-primary text-white' :
                                            'bg-info text-dark border'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="form-check form-switch p-0 ps-3">
                                            <div className="d-flex align-items-center gap-2">
                                                <input
                                                    className="form-check-input cursor-pointer m-0"
                                                    type="checkbox"
                                                    role="switch"
                                                    checked={user.is_active}
                                                    onChange={() => handleToggleActive(user.id, user.is_active)}
                                                    disabled={actionLoading === user.id || user.is_superadmin}
                                                />
                                                <span className={`small fw-bold ${user.is_active ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.75rem' }}>
                                                    {user.is_active ? 'ENABLED' : 'BLOCKED'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-end pe-4">
                                        {!user.is_superadmin && (
                                            <>
                                                <div className="dropdown d-inline-block">
                                                    <button className="btn btn-sm btn-outline-primary fw-bold" data-bs-toggle="dropdown" disabled={actionLoading === user.id} style={{ fontSize: '0.75rem' }}>
                                                        PERMISSION OVERRIDE
                                                    </button>
                                                    <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 p-2 animate-portal">
                                                        <li><p className="dropdown-header small text-uppercase fw-800 text-muted pb-1 mb-1">Set Global Role</p></li>
                                                        <li><button className="dropdown-item rounded-2 py-2" onClick={() => handleRoleChange(user.id, 'student', user.full_name)}>Student Permission</button></li>
                                                        <li><button className="dropdown-item rounded-2 py-2" onClick={() => handleRoleChange(user.id, 'staff', user.full_name)}>Staff Permission</button></li>
                                                        <li><button className="dropdown-item rounded-2 py-2 text-danger fw-bold" onClick={() => handleRoleChange(user.id, 'admin', user.full_name)}>Admin Privileges</button></li>
                                                    </ul>
                                                </div>
                                                <button 
                                                    className="btn btn-sm text-danger ms-2"
                                                    onClick={() => handleDeleteUser(user.id, user.full_name, user.is_superadmin)}
                                                    disabled={actionLoading === user.id}
                                                    title="Delete Record"
                                                >
                                                    {actionLoading === user.id ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-trash3-fill"></i>}
                                                </button>
                                            </>
                                        )}
                                        {user.is_superadmin && (
                                            <span className="badge bg-dark bg-opacity-10 text-muted fw-bold px-3 py-2" style={{ fontSize: '0.7rem' }}>
                                                <i className="bi bi-lock-fill me-1"></i> PROTECTED
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (loading) return (
        <div className="text-center py-5 my-5">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{t('common.loading')}</span>
            </div>
        </div>
    );

    return (
        <div className="animate-portal container pb-5">
            <header className="mb-5 border-bottom pb-4 d-md-flex justify-content-between align-items-end">
                <div>
                    <nav className="mb-2 small fw-bold text-uppercase" aria-label="breadcrumb">
                         <ol className="breadcrumb mb-0">
                            <li className="breadcrumb-item"><a href="/admin" className="text-decoration-none text-muted">Dashboard</a></li>
                            <li className="breadcrumb-item active text-primary" aria-current="page">User Directory</li>
                        </ol>
                    </nav>
                    <h1 className="section-title mb-0">User Account Records</h1>
                </div>
                <div className="mt-3 mt-md-0 d-flex gap-3 align-items-center">
                    <button 
                        className="btn btn-primary fw-bold px-4 py-2 d-flex align-items-center gap-2"
                        onClick={() => setShowAddAdmin(true)}
                        style={{ fontSize: '0.8rem' }}
                    >
                        <i className="bi bi-person-plus-fill"></i>
                        ADD ADMIN
                    </button>
                    <div className="input-group portal-card border-0 p-1 rounded-3 shadow-sm bg-white" style={{ minWidth: '300px' }}>
                        <span className="input-group-text bg-transparent border-0 ps-3">
                            <i className="bi bi-search text-muted"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control border-0 bg-transparent py-2"
                            placeholder="Search records by name, ID or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            {message.text && (
                <div className={`alert alert-${message.type} portal-card border-0 border-start border-4 border-${message.type} mb-4 animate-portal`}>
                    <div className="d-flex align-items-center gap-2 fw-bold text-main">
                        <i className={`bi bi-${message.type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'} text-${message.type}`}></i>
                        {message.text}
                    </div>
                </div>
            )}

            {/* Pending Lecturers Section */}
            {renderPendingTable()}

            {/* Active Users */}
            {renderUserTable(filteredUsers.filter(u => u.role === 'admin'), 'Academic Administrators', 'bg-danger text-white')}
            {renderUserTable(filteredUsers.filter(u => u.role === 'staff'), 'Departmental Staff (Lecturers)', 'bg-primary text-white')}
            {renderUserTable(filteredUsers.filter(u => u.role === 'student'), 'Student Body Records', 'bg-light text-dark border')}

            {/* Add Admin Modal */}
            {showAddAdmin && (
                <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                            <div className="modal-header bg-primary text-white border-0 py-4 px-4">
                                <div>
                                    <h5 className="modal-title fw-800 mb-1">
                                        <i className="bi bi-person-plus-fill me-2"></i>
                                        Create Admin Account
                                    </h5>
                                    <small className="opacity-75">This admin will have management privileges but cannot delete the superadmin.</small>
                                </div>
                                <button type="button" className="btn-close btn-close-white" onClick={() => { setShowAddAdmin(false); setAdminFormError(''); }}></button>
                            </div>
                            <div className="modal-body p-4">
                                {adminFormError && (
                                    <div className="alert alert-danger border-0 rounded-3 py-2 mb-4">
                                        <small className="fw-bold">
                                            <i className="bi bi-x-circle-fill me-1"></i>
                                            {adminFormError}
                                        </small>
                                    </div>
                                )}
                                <form onSubmit={handleAddAdmin}>
                                    <div className="mb-4">
                                        <label className="form-label fw-bold small text-uppercase text-muted">Full Name *</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-lg bg-light border-0 py-3 rounded-4"
                                            placeholder="Administrator Name"
                                            value={adminForm.full_name}
                                            onChange={(e) => setAdminForm(prev => ({ ...prev, full_name: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label fw-bold small text-uppercase text-muted">Email Address *</label>
                                        <input
                                            type="email"
                                            className="form-control form-control-lg bg-light border-0 py-3 rounded-4"
                                            placeholder="admin@university.edu"
                                            value={adminForm.email}
                                            onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label fw-bold small text-uppercase text-muted">Password *</label>
                                        <input
                                            type="password"
                                            className="form-control form-control-lg bg-light border-0 py-3 rounded-4"
                                            placeholder="Set a secure password"
                                            value={adminForm.password}
                                            onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                                            required
                                            minLength={6}
                                        />
                                        <small className="text-muted mt-1 d-block">Minimum 6 characters. Share this password securely with the new admin.</small>
                                    </div>
                                    <div className="d-flex gap-3">
                                        <button type="button" className="btn btn-light flex-fill py-3 fw-bold" onClick={() => { setShowAddAdmin(false); setAdminFormError(''); }}>
                                            CANCEL
                                        </button>
                                        <button type="submit" className="btn btn-primary flex-fill py-3 fw-bold" disabled={adminFormLoading}>
                                            {adminFormLoading ? (
                                                <><span className="spinner-border spinner-border-sm me-2"></span> CREATING...</>
                                            ) : (
                                                <><i className="bi bi-person-check-fill me-2"></i> CREATE ADMIN</>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
