import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

interface User {
    id: number;
    email: string;
    full_name: string;
    role: string;
    matric_number: string | null;
    staff_id: string | null;
    phone: string | null;
    is_active: boolean;
    created_at: string | null;
    last_login: string | null;
}

interface PaginatedUsers {
    items: User[];
    total: number;
    page: number;
    pages: number;
    per_page: number;
}

// Burgundy color palette
const burgundy = {
    primary: '#800020',
    dark: '#5c0017',
    light: '#a63d56',
};

const AdminUsers: React.FC = () => {
    const { t } = useTranslation();
    const [adminUsers, setAdminUsers] = useState<User[]>([]);
    const [staffUsers, setStaffUsers] = useState<User[]>([]);
    const [studentUsers, setStudentUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [searchQuery, setSearchQuery] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Fetch all users
            const response = await api.get<PaginatedUsers>('/admin/users?per_page=100');
            const allUsers = response.data.items;

            // Separate admins, staff, and students
            setAdminUsers(allUsers.filter(u => u.role === 'admin'));
            setStaffUsers(allUsers.filter(u => u.role === 'staff'));
            setStudentUsers(allUsers.filter(u => u.role === 'student'));
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleDeleteUser = async (userId: number, userName: string) => {
        if (!window.confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
            return;
        }
        setActionLoading(userId);
        try {
            await api.delete(`/admin/users/${userId}`);
            setMessage({ type: 'success', text: `User ${userName} deleted successfully` });
            fetchUsers();
        } catch (err: any) {
            setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to delete user' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleRoleChange = async (userId: number, newRole: string, userName: string) => {
        setActionLoading(userId);
        try {
            await api.put(`/admin/users/${userId}/role`, { role: newRole });
            setMessage({ type: 'success', text: `${userName} role changed to ${newRole}` });
            fetchUsers();
        } catch (err: any) {
            setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to update role' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleActive = async (userId: number) => {
        setActionLoading(userId);
        try {
            const response = await api.post(`/admin/users/${userId}/toggle-active`);
            setMessage({ type: 'success', text: response.data.message });
            fetchUsers();
        } catch (err: any) {
            setMessage({ type: 'danger', text: err.response?.data?.message || 'Failed to toggle status' });
        } finally {
            setActionLoading(null);
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return burgundy.primary;
            case 'staff': return burgundy.light;
            default: return '#6c757d';
        }
    };

    const filterUsers = (users: User[]) => {
        if (!searchQuery) return users;
        const query = searchQuery.toLowerCase();
        return users.filter(u =>
            u.full_name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            (u.matric_number && u.matric_number.toLowerCase().includes(query))
        );
    };

    const renderUserRow = (user: User) => (
        <tr key={user.id}>
            <td>
                <div>
                    <strong>{user.full_name}</strong>
                    {user.matric_number && (
                        <small className="text-muted d-block">{user.matric_number}</small>
                    )}
                    {user.staff_id && (
                        <small className="text-muted d-block">Staff ID: {user.staff_id}</small>
                    )}
                </div>
            </td>
            <td>{user.email}</td>
            <td>
                <span
                    className="badge text-white"
                    style={{ backgroundColor: getRoleBadgeColor(user.role) }}
                >
                    {user.role}
                </span>
            </td>
            <td>
                <span className={`badge bg-${user.is_active ? 'success' : 'danger'}`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <div className="btn-group btn-group-sm">
                    {/* Role dropdown */}
                    <div className="dropdown">
                        <button
                            className="btn btn-outline-secondary dropdown-toggle"
                            data-bs-toggle="dropdown"
                            disabled={actionLoading === user.id}
                        >
                            <i className="bi bi-arrow-up-circle"></i>
                        </button>
                        <ul className="dropdown-menu">
                            <li>
                                <button
                                    className="dropdown-item"
                                    onClick={() => handleRoleChange(user.id, 'student', user.full_name)}
                                    disabled={user.role === 'student'}
                                >
                                    <i className="bi bi-person me-1"></i>
                                    Make Student
                                </button>
                            </li>
                            <li>
                                <button
                                    className="dropdown-item"
                                    onClick={() => handleRoleChange(user.id, 'staff', user.full_name)}
                                    disabled={user.role === 'staff'}
                                >
                                    <i className="bi bi-person-badge me-1"></i>
                                    Promote to Staff
                                </button>
                            </li>
                            <li>
                                <button
                                    className="dropdown-item"
                                    onClick={() => handleRoleChange(user.id, 'admin', user.full_name)}
                                    disabled={user.role === 'admin'}
                                >
                                    <i className="bi bi-star me-1"></i>
                                    Promote to Admin
                                </button>
                            </li>
                        </ul>
                    </div>
                    {/* Toggle Active */}
                    <button
                        className={`btn btn-outline-${user.is_active ? 'warning' : 'success'}`}
                        title={user.is_active ? 'Deactivate' : 'Activate'}
                        onClick={() => handleToggleActive(user.id)}
                        disabled={actionLoading === user.id}
                    >
                        <i className={`bi bi-${user.is_active ? 'pause-circle' : 'play-circle'}`}></i>
                    </button>
                    {/* Delete */}
                    <button
                        className="btn btn-outline-danger"
                        title="Delete User"
                        onClick={() => handleDeleteUser(user.id, user.full_name)}
                        disabled={actionLoading === user.id}
                    >
                        {actionLoading === user.id ? (
                            <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                            <i className="bi bi-trash"></i>
                        )}
                    </button>
                </div>
            </td>
        </tr>
    );

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border" role="status" style={{ color: burgundy.primary }}>
                    <span className="visually-hidden">{t('common.loading')}</span>
                </div>
            </div>
        );
    }

    const filteredAdmins = filterUsers(adminUsers);
    const filteredStaff = filterUsers(staffUsers);
    const filteredStudents = filterUsers(studentUsers);

    return (
        <div>
            <h1 className="mb-4" style={{ color: burgundy.primary }}>
                <i className="bi bi-people me-2"></i>
                User Management
            </h1>

            {message.text && (
                <div className={`alert alert-${message.type} alert-dismissible`}>
                    {message.text}
                    <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
                </div>
            )}

            {/* Search */}
            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search all users..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <span className="input-group-text" style={{ backgroundColor: burgundy.primary, color: 'white' }}>
                                    <i className="bi bi-search"></i>
                                </span>
                            </div>
                        </div>
                        <div className="col-md-6 text-end">
                            <span className="badge me-2" style={{ backgroundColor: burgundy.dark }}>
                                {adminUsers.length} Admins
                            </span>
                            <span className="badge me-2" style={{ backgroundColor: burgundy.primary }}>
                                {staffUsers.length} Staff
                            </span>
                            <span className="badge bg-secondary">
                                {studentUsers.length} Students
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Admins Section */}
            <div className="card shadow-sm mb-4">
                <div className="card-header text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: burgundy.dark }}>
                    <h5 className="mb-0">
                        <i className="bi bi-shield-lock me-2"></i>
                        Administrators
                    </h5>
                    <span className="badge bg-light text-dark">{filteredAdmins.length}</span>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAdmins.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center text-muted py-4">
                                        No administrators found
                                    </td>
                                </tr>
                            ) : (
                                filteredAdmins.map(renderUserRow)
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Staff Section */}
            <div className="card shadow-sm mb-4">
                <div className="card-header text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: burgundy.primary }}>
                    <h5 className="mb-0">
                        <i className="bi bi-person-badge me-2"></i>
                        Staff
                    </h5>
                    <span className="badge bg-light text-dark">{filteredStaff.length}</span>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStaff.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center text-muted py-4">
                                        No staff members found
                                    </td>
                                </tr>
                            ) : (
                                filteredStaff.map(renderUserRow)
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Students Section */}
            <div className="card shadow-sm">
                <div className="card-header text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: burgundy.light }}>
                    <h5 className="mb-0">
                        <i className="bi bi-mortarboard me-2"></i>
                        Students
                    </h5>
                    <span className="badge bg-light text-dark">{filteredStudents.length}</span>
                </div>
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center text-muted py-4">
                                        No students found
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map(renderUserRow)
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminUsers;
